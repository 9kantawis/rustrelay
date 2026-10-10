const path = require("node:path");
const FACEPUNCH = "https://companion-rust.facepunch.com";

function readAuth(message) {
  if (typeof message !== "string" || message.length > 16384) return null;
  try {
    const auth = JSON.parse(message);
    if (
      !/^\d{17}$/.test(String(auth?.SteamId || "")) ||
      typeof auth.Token !== "string" ||
      !auth.Token ||
      auth.Token.length > 4096
    )
      return null;
    return { SteamId: String(auth.SteamId), Token: auth.Token };
  } catch {
    return null;
  }
}

function allowedPage(address) {
  try {
    const url = new URL(address);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      ["facepunch.com", "steamcommunity.com", "steampowered.com"].some(
        (host) => url.hostname === host || url.hostname.endsWith("." + host),
      )
    );
  } catch {
    return false;
  }
}

function createSteamSignIn({ window, onChange, report = () => {} }) {
  const { WebContentsView, ipcMain } = require("electron");
  let active = null;
  function start() {
    if (active) {
      window.show();
      active.view.webContents.focus();
      return active.promise;
    }
    let resolve, reject;
    const promise = new Promise((done, failed) => {
      resolve = done;
      reject = failed;
    });
    const view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, "steam-preload.cjs"),
        partition: "persist:rust-sign-in",
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    });
    const contents = view.webContents;
    const session = {
      view,
      promise,
      loadingTimer: null,
      timeout: null,
      state: {
        host: "companion-rust.facepunch.com",
        loading: true,
        error: null,
        canGoBack: false,
      },
    };
    active = session;
    function update(changes) {
      if (active !== session) return;
      Object.assign(session.state, changes);
      onChange({ ...session.state });
    }
    function layout() {
      if (window.isDestroyed()) return;
      const [width, height] = window.getContentSize();
      view.setBounds({
        x: 20,
        y: 94,
        width: Math.max(1, width - 40),
        height: Math.max(1, height - 114),
      });
    }
    function finish(error, auth) {
      if (active !== session) return;
      active = null;
      clearTimeout(session.timeout);
      clearTimeout(session.loadingTimer);
      ipcMain.removeListener("rust-sign-in", handoff);
      contents.session.removeListener("will-download", preventDownload);
      window.removeListener("resize", layout);
      if (!window.isDestroyed()) {
        window.contentView.removeChildView(view);
        window.webContents.focus();
      }
      if (!contents.isDestroyed())
        contents.close({ waitForBeforeUnload: false });
      onChange(null);
      if (error) reject(error);
      else resolve(auth);
    }
    function handoff(event, message) {
      if (event.sender !== contents || event.senderFrame !== contents.mainFrame)
        return;
      let official = false;
      try {
        official = new URL(event.senderFrame.url).origin === FACEPUNCH;
      } catch {}
      if (!official) return;
      const auth = readAuth(message);
      if (auth) finish(null, auth);
    }
    function failed() {
      if (active !== session) return;
      clearTimeout(session.loadingTimer);
      contents.stop();
      view.setVisible(false);
      report("sign-in-load-failed");
      update({
        loading: false,
        error:
          "Не удалось открыть страницу входа. Проверь подключение и нажми «Обновить».",
      });
    }
    session.cancel = () => finish(Error("Вход отменён"));
    session.retry = () => {
      view.setVisible(true);
      update({ error: null });
      if (allowedPage(contents.getURL())) contents.reload();
      else contents.loadURL(FACEPUNCH + "/login").catch(() => {});
    };
    contents.setUserAgent(
      contents
        .getUserAgent()
        .replace(/\sElectron\/\S+/g, "")
        .replace(/\sRustRelay\/\S+/g, ""),
    );
    contents.session.setPermissionRequestHandler(
      (_webContents, _permission, callback) => callback(false),
    );
    function preventDownload(event) {
      event.preventDefault();
    }
    contents.session.on("will-download", preventDownload);
    contents.setWindowOpenHandler(({ url }) => {
      if (allowedPage(url)) contents.loadURL(url).catch(() => {});
      return { action: "deny" };
    });
    for (const name of [
      "will-navigate",
      "will-redirect",
      "will-frame-navigate",
    ]) {
      contents.on(name, (event, address) => {
        const url = typeof address === "string" ? address : event.url;
        if (event.isMainFrame === false) return;
        if (!allowedPage(url)) event.preventDefault();
      });
    }
    contents.once("did-finish-load", () => {
      if (active === session) contents.focus();
    });
    contents.on("did-start-loading", () => {
      clearTimeout(session.loadingTimer);
      session.loadingTimer = setTimeout(failed, 45000);
      update({ loading: true, error: null });
    });
    contents.on("did-stop-loading", () => {
      clearTimeout(session.loadingTimer);
      update({ loading: false });
    });
    contents.on("did-navigate", (_event, address) => {
      let host = "";
      try {
        host = new URL(address).hostname;
      } catch {}
      update({ host, canGoBack: contents.navigationHistory.canGoBack() });
      report(host.endsWith("facepunch.com") ? "facepunch-page" : "steam-page");
    });
    contents.on(
      "did-fail-load",
      (_event, code, _description, _address, mainFrame) => {
        if (mainFrame && code !== -3) failed();
      },
    );
    contents.on("render-process-gone", () =>
      finish(Error("Страница входа закрылась")),
    );
    contents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown" && input.key === "Escape") {
        event.preventDefault();
        session.cancel();
      }
    });
    ipcMain.on("rust-sign-in", handoff);
    window.on("resize", layout);
    window.contentView.addChildView(view);
    view.setBackgroundColor("#141414");
    layout();
    window.show();
    onChange({ ...session.state });
    session.timeout = setTimeout(
      () => finish(Error("Время входа истекло")),
      15 * 60 * 1000,
    );
    contents.loadURL(FACEPUNCH + "/login").catch(() => {});
    return promise;
  }
  return {
    start,
    cancel: () => active?.cancel(),
    async logout() {
      active?.cancel();
      const browserSession = require("electron").session.fromPartition(
        "persist:rust-sign-in",
      );
      await browserSession.clearStorageData();
      await browserSession.clearAuthCache();
      await browserSession.clearCache();
    },
    retry: () => active?.retry(),
    back: () => {
      const contents = active?.view.webContents;
      if (contents?.navigationHistory.canGoBack())
        contents.navigationHistory.goBack();
    },
    close: () => active?.cancel(),
  };
}
module.exports = { createSteamSignIn, readAuth, allowedPage };
