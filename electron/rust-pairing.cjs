const crypto = require("node:crypto");

function parsePairing(message) {
  const queue = [message];
  for (let index = 0; index < queue.length && index < 50; index++) {
    let value = queue[index];
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        continue;
      }
    }
    if (!value || typeof value !== "object") continue;
    if (value.type === "server" || value.type === "entity" || value.entityId)
      return value;
    if (Array.isArray(value)) queue.push(...value);
    else
      for (const key of ["appData", "body", "data", "notification", "value"])
        if (value[key]) queue.push(value[key]);
  }
  return null;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    redirect: "error",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok)
    throw Object.assign(Error("Сервис сопряжения недоступен"), {
      status: response.status,
    });
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function createPairing({ service, signIn, report = () => {} }) {
  let listener = null;
  let busy = false;
  function setPairingStatus(value) {
    service.live.pairStatus = value;
    if (value !== "error") service.live.pairError = null;
    report(value);
    service.save();
  }
  async function listen() {
    if (!service.data.fcm?.credentials?.gcm)
      throw Error("Сначала войди в Steam или импортируй файл Rust+");
    listener?.destroy();
    const Client = require("@liamcottle/push-receiver/src/client");
    const { androidId, securityToken } = service.data.fcm.credentials.gcm;
    const seen = new Set(service.data.fcm.persistentIds || []);
    listener = new Client(androidId, securityToken, [...seen]);
    listener.on("ON_DATA_RECEIVED", (message) => {
      try {
        if (message.persistentId && seen.has(message.persistentId)) return;
        if (message.persistentId) {
          seen.add(message.persistentId);
          service.data.fcm.persistentIds = [...seen].slice(-500);
        }
        const body = parsePairing(message);
        if (!body) {
          service.save();
          return;
        }
        if (body.type === "server") {
          service.actions.saveServer(body);
          setPairingStatus("paired");
          service.addEvent(
            "system",
            "Сервер добавлен",
            String(body.name || body.ip),
            true,
          );
        } else {
          const server = service.data.servers.find(
            (item) => item.ip === body.ip && item.port === Number(body.port),
          );
          if (server)
            service.actions
              .addDevice({
                serverId: server.id,
                entityId: body.entityId || body.id,
                type: Number(body.entityType) || 1,
                name: body.name,
              })
              .catch(() => {});
        }
      } catch {
        setPairingStatus("error");
      }
    });
    listener.on("connect", () => setPairingStatus("listening"));
    listener.on("disconnect", () => {
      service.live.pairError = "Связь с Google прервалась. Подключаемся снова.";
      setPairingStatus("error");
    });
    listener.on("error", () => {
      service.live.pairError = "Не удалось подключиться к уведомлениям Google";
      setPairingStatus("error");
    });
    const currentListener = listener;
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        currentListener.destroy();
        cleanup();
        reject(Error("Google не ответил на подключение"));
      }, 25000);
      function cleanup() {
        clearTimeout(timeout);
        currentListener.removeListener("connect", connected);
      }
      function connected() {
        cleanup();
        resolve();
      }
      currentListener.once("connect", connected);
      currentListener.connect().catch((error) => {
        cleanup();
        reject(error);
      });
    });
  }
  async function start() {
    if (busy) {
      if (service.live.pairStatus === "steam") {
        signIn.start().catch(() => {});
        return;
      }
      throw Error("Подключение уже выполняется");
    }
    busy = true;
    let stage = "steam";
    try {
      setPairingStatus("steam");
      const auth = await signIn.start();
      report("steam-returned");
      stage = "google";
      setPairingStatus("registering");
      const axios = require("axios");
      axios.defaults.timeout = 25000;
      const AndroidFCM = require("@liamcottle/push-receiver/src/android/fcm");
      const config = require("./rust-push-config.cjs").getRustPushConfig();
      const credentials = await AndroidFCM.register(
        config.apiKey,
        config.projectId,
        config.gcmSenderId,
        config.gmsAppId,
        config.androidPackageName,
        config.androidPackageCert,
      );
      stage = "expo";
      report(stage);
      const expo = await postJson(
        "https://exp.host/--/api/v2/push/getExpoPushToken",
        {
          type: "fcm",
          deviceId: crypto.randomUUID(),
          development: false,
          appId: "com.facepunch.rust.companion",
          deviceToken: credentials.fcm.token,
          projectId: "49451aca-a822-41e6-ad59-955718d0ff9c",
        },
      );
      if (!expo.data?.expoPushToken)
        throw Error("Expo не выдал токен уведомлений");
      stage = "facepunch";
      report(stage);
      const registration = await postJson(
        "https://companion-rust.facepunch.com/api/push/register",
        {
          AuthToken: auth.Token,
          DeviceId: "RustRelay",
          PushKind: 3,
          PushToken: expo.data.expoPushToken,
        },
      );
      service.data.fcm = {
        credentials,
        auth: { ...auth, Token: registration.Token || auth.Token },
        persistentIds: [],
      };
      service.save();
      stage = "listening";
      await listen();
    } catch (error) {
      if (error.message === "Вход отменён") {
        setPairingStatus("idle");
        return;
      }
      const messages = {
        steam: "Не удалось завершить вход. Попробуй ещё раз.",
        google:
          "Не удалось зарегистрировать уведомления Google. Попробуй ещё раз.",
        expo: "Не удалось зарегистрировать уведомления Expo. Попробуй ещё раз.",
        facepunch: "Rust+ не принял подключение. Войди через Steam ещё раз.",
        listening:
          "Не удалось подключиться к уведомлениям Google. Нажми «Ждать сопряжение».",
      };
      const status = Number(error.status || error.response?.status);
      const code =
        Number.isInteger(status) && status >= 100 && status <= 599
          ? String(status)
          : "";
      service.live.pairError =
        messages[stage] + (code ? " (HTTP " + code + ")" : "");
      report(stage + "-failed", code);
      setPairingStatus("error");
      throw Error(service.live.pairError);
    } finally {
      busy = false;
    }
  }
  return {
    start,
    listen,
    cancel: () => signIn.cancel(),
    close: () => {
      signIn.close();
      listener?.destroy();
    },
  };
}

module.exports = {
  createPairing,
  parsePairing,
};
