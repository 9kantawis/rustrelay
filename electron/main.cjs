const {
  app,
  BrowserWindow,
  ipcMain,
  safeStorage,
  dialog,
  shell,
  Notification,
  Tray,
  Menu,
  nativeImage,
  screen,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { createStore, defaultData } = require("./secure-store.cjs");
const { createService } = require("./relay-service.cjs");
const { createCompanion } = require("./companion-engine.cjs");
const { createHeatmapLoader } = require("./map-heatmaps.cjs");
const { createPairing } = require("./rust-pairing.cjs");
const { createSteamSignIn } = require("./steam-sign-in.cjs");

const { sendDiscord } = require("./discord-notifications.cjs");

app.setName("RustRelay");
const testProfile = process.argv.find((argument) =>
  argument.startsWith("--profile="),
);
if (testProfile)
  app.setPath("userData", path.resolve(testProfile.slice("--profile=".length)));
const ownsInstance = app.requestSingleInstanceLock();
if (!ownsInstance) app.quit();
app.setAppUserModelId("local.rustrelay.desktop");
app.on("second-instance", showMainWindow);
const appIcon = path.join(__dirname, "assets", "app.ico");
let window;
let service;
let pairing;
let tray;
let quitting = false;

function preferredLanguage() {
  if (process.argv.includes("--qa")) return "ru";
  const locale = app.getLocale().toLowerCase();
  if (locale.startsWith("ru")) return "ru";
  if (locale.startsWith("zh")) return "zh";
  return "en";
}
const trayText = {
  ru: {
    show: "Открыть RustRelay",
    notifications: "Уведомления Windows",
    overlay: "Поверх других окон",
    autoStart: "Запускать с Windows",
    closeToTray: "Сворачивать в трей",
    exit: "Выйти",
  },
  en: {
    show: "Open RustRelay",
    notifications: "Windows notifications",
    overlay: "Show above other windows",
    autoStart: "Start with Windows",
    closeToTray: "Close to tray",
    exit: "Quit",
  },
  zh: {
    show: "打开 RustRelay",
    notifications: "Windows 通知",
    overlay: "显示在其他窗口上方",
    autoStart: "随 Windows 启动",
    closeToTray: "关闭到托盘",
    exit: "退出",
  },
};

function updateSystemSettings() {
  if (!service || process.argv.includes("--qa")) return;
  app.setLoginItemSettings({
    openAtLogin: Boolean(service.data.settings.autoStart),
    path: process.execPath,
  });
}

function showMainWindow() {
  if (!window || window.isDestroyed()) return;
  window.show();
  if (window.isMinimized()) window.restore();
  window.focus();
}

function updateTray() {
  if (!service) return;
  if (!tray) {
    const icon = nativeImage.createFromPath(
      path.join(__dirname, "assets", "tray.png"),
    );
    if (icon.isEmpty()) throw Error("Не удалось загрузить иконку трея");
    tray = new Tray(icon);
    tray.setToolTip("RustRelay");
    tray.on("click", showMainWindow);
    tray.on("double-click", showMainWindow);
  }
  const settings = service.data.settings;
  const copy = trayText[settings.language] || trayText.ru;
  const toggle = (key) =>
    service.actions.settings({ [key]: !service.data.settings[key] });
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: copy.show, click: showMainWindow },
      { type: "separator" },
      {
        label: copy.notifications,
        type: "checkbox",
        checked: settings.notifications,
        click: () => toggle("notifications"),
      },
      {
        label: copy.overlay,
        type: "checkbox",
        checked: settings.overlayNotifications,
        click: () => toggle("overlayNotifications"),
      },
      {
        label: copy.autoStart,
        type: "checkbox",
        checked: settings.autoStart,
        click: () => toggle("autoStart"),
      },
      {
        label: copy.closeToTray,
        type: "checkbox",
        checked: settings.closeToTray,
        click: () => toggle("closeToTray"),
      },
      { type: "separator" },
      {
        label: copy.exit,
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]),
  );
}

function playerIsOnline(state) {
  const currentServer = state.servers.find(
    (server) => server.id === state.connection.serverId,
  );
  if (!currentServer) return false;
  return state.team.some(
    (member) =>
      String(member.steamId) === String(currentServer.playerId) &&
      member.isOnline,
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function showOverlay(event, state) {
  if (state.settings.overlayNotifications === false || playerIsOnline(state))
    return;
  const workArea = screen.getPrimaryDisplay().workArea;
  const popup = new BrowserWindow({
    width: 380,
    height: 116,
    x: workArea.x + workArea.width - 398,
    y: workArea.y + 18,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    show: false,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  popup.setAlwaysOnTop(true, "screen-saver");
  const html = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>html{font:13px Inter,Segoe UI,sans-serif;color:#eee;background:transparent}body{margin:0;padding:8px}.notice{display:grid;grid-template-columns:5px 1fr;gap:15px;padding:20px;background:#1c1c1cf5;border:1px solid #ffffff1c;border-radius:10px;box-shadow:0 18px 50px #0009}.bar{background:#e89662;border-radius:4px}.title{font-weight:650;font-size:14px;margin:0 0 7px}.body{color:#aaa;line-height:1.45;margin:0}</style><main class="notice"><i class="bar"></i><div><p class="title">${escapeHtml(event.title)}</p><p class="body">${escapeHtml(event.detail || "RustRelay")}</p></div></main>`;
  popup.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  popup.once("ready-to-show", () => popup.showInactive());
  const timer = setTimeout(() => {
    if (!popup.isDestroyed()) popup.close();
  }, 6000);
  popup.on("closed", () => clearTimeout(timer));
}
if (ownsInstance)
  app.whenReady().then(() => {
    const defaultLanguage = preferredLanguage();
    const store = createStore({
      file: path.join(app.getPath("userData"), "vault.bin"),
      defaultLanguage,
      encrypt: (text) => {
        if (!safeStorage.isEncryptionAvailable())
          throw Error("Шифрование Windows недоступно. Данные не сохранены.");
        return safeStorage.encryptString(text);
      },
      decrypt: (bytes) => safeStorage.decryptString(bytes),
    });
    let data;
    let storageError;
    try {
      data = store.load();
    } catch (error) {
      data = defaultData(defaultLanguage);
      storageError = error.message;
    }
    window = new BrowserWindow({
      width: 1512,
      height: 980,
      minWidth: 900,
      minHeight: 640,
      frame: false,
      title: "RustRelay",
      icon: appIcon,
      backgroundColor: "#0c0e12",
      show: !process.argv.includes("--qa"),
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        backgroundThrottling: !process.argv.includes("--qa"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event) => event.preventDefault());
    window.webContents.session.setPermissionRequestHandler(
      (_contents, _permission, callback) => callback(false),
    );
    window.on("close", (event) => {
      if (!quitting && service?.data.settings.closeToTray) {
        event.preventDefault();
        window.hide();
      }
    });
    service = createService({
      heatmaps: createHeatmapLoader({
        cacheDirectory: path.join(app.getPath("userData"), "map-cache"),
      }),
      store,
      data,
      publish: (state) => {
        if (!window.isDestroyed()) window.webContents.send("state", state);
      },
      notify: (event, state, publicState) => {
        const kind = Object.hasOwn(state.settings.notificationKinds, event.kind)
          ? event.kind
          : "system";
        if (!state.settings.notificationKinds[kind]) return;
        if (state.settings.notifications && Notification.isSupported())
          new Notification({
            title: event.title,
            body: event.detail || "RustRelay",
          }).show();
        showOverlay(event, publicState);
        if (state.settings.discord && state.secrets.webhook)
          sendDiscord(state.secrets.webhook, event).catch(() =>
            service.addEvent(
              "error",
              "Discord недоступен",
              "Проверь webhook в настройках",
            ),
          );
      },
    });
    function reportPairing(stage, code = "") {
      if (stage === "steam-returned") showMainWindow();
      const logFile = path.join(app.getPath("userData"), "pairing.log");
      const lines = fs.existsSync(logFile)
        ? fs
            .readFileSync(logFile, "utf8")
            .split("\n")
            .filter(Boolean)
            .slice(-29)
        : [];
      lines.push(
        [new Date().toISOString(), stage, code].filter(Boolean).join(" "),
      );
      fs.writeFileSync(logFile, lines.join("\n") + "\n");
    }
    const signIn = createSteamSignIn({
      window,
      report: reportPairing,
      onChange(state) {
        service.live.signIn = state;
        if (!window.isDestroyed())
          window.webContents.send("state", service.snapshot());
      },
    });
    pairing = createPairing({ service, signIn, report: reportPairing });
    const saveSettings = service.actions.settings;
    service.actions.settings = (input) => {
      saveSettings(input);
      updateSystemSettings();
      updateTray();
      return service.snapshot();
    };
    updateSystemSettings();
    updateTray();
    if (service.data.fcm?.credentials?.gcm && !process.argv.includes("--qa"))
      pairing.listen().catch(() => {});
    service.attachCompanion(
      createCompanion({
        service,
        directory: path.join(app.getPath("userData"), "companion"),
      }),
    );
    const actions = {
      ...service.actions,
      state: () => {
        const state = service.snapshot();
        if (storageError) state.connection.error = storageError;
        return state;
      },
      pair: () => pairing.start(),
      cancelPair: () => pairing.cancel(),
      logout: () => pairing.logout(),
      openSteamProfile(id) {
        if (!/^\d{17}$/.test(String(id))) throw Error("Неверный Steam ID");
        return shell.openExternal("https://steamcommunity.com/profiles/" + id);
      },
      signInBack: () => signIn.back(),
      signInRetry: () => signIn.retry(),
      listen: () => pairing.listen(),
      async export() {
        const result = await dialog.showSaveDialog(window, {
          defaultPath: "RustRelay-export.json",
          filters: [{ name: "JSON", extensions: ["json"] }],
        });
        if (!result.canceled)
          fs.writeFileSync(
            result.filePath,
            JSON.stringify(store.exportPublic(service.data), null, 2),
          );
      },
      webhookTest: () =>
        sendDiscord(service.data.secrets.webhook || "", {
          title: "Проверка RustRelay",
          detail: "Уведомления подключены.",
        }),
      open(address) {
        let url;
        try {
          url = new URL(address);
        } catch {
          throw Error("Неверный адрес");
        }
        if (
          url.protocol !== "https:" ||
          ![
            "wiki.facepunch.com",
            "rust.wiki",
            "rust-data.com",
            "rust.facepunch.com",
            "github.com",
            "rustontop.com",
            "discord.com",
            "www.battlemetrics.com",
          ].includes(url.hostname)
        )
          throw Error("Адрес не разрешён");
        return shell.openExternal(url.toString());
      },
      window(action) {
        if (action === "minimize") window.minimize();
        if (action === "maximize")
          window.isMaximized() ? window.unmaximize() : window.maximize();
        if (action === "close") window.close();
      },
    };
    ipcMain.handle("relay", async (event, action, payload) => {
      if (
        event.sender !== window.webContents ||
        event.senderFrame !== window.webContents.mainFrame
      )
        throw Error("Источник команды не разрешён");
      if (typeof action !== "string" || !Object.hasOwn(actions, action))
        throw Error("Неизвестная команда");
      if (payload !== undefined && JSON.stringify(payload).length > 2000000)
        throw Error("Слишком большой запрос");
      try {
        return await actions[action](payload);
      } catch (error) {
        // External libraries may include request headers in their errors. Only our own Russian messages reach the UI.
        throw Error(
          /[А-Яа-я]/.test(error.message || "")
            ? error.message
            : "Не удалось выполнить действие. Проверь данные и подключение.",
        );
      }
    });
    if (process.argv.includes("--sign-in")) {
      window.webContents.once("did-finish-load", () => {
        pairing.start().catch(() => {});
      });
    }
    window.loadFile(path.join(__dirname, "../dist/index.html"));
  });
app.on("window-all-closed", () => {
  if (!service?.data.settings.closeToTray) app.quit();
});
app.on("before-quit", () => {
  quitting = true;
  pairing?.close();
  service?.close();
});

if (process.argv.includes("--qa"))
  globalThis.getRelayDesktopState = () => ({
    trayReady: Boolean(tray && !tray.isDestroyed()),
    hasInstanceLock: app.hasSingleInstanceLock(),
    windowCount: BrowserWindow.getAllWindows().length,
  });
