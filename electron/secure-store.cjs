const fs = require("node:fs");
const path = require("node:path");

function defaultData(language = "en") {
  return {
    version: 1,
    servers: [],
    devices: [],
    timers: [],
    pins: [],
    routes: [],
    tracking: false,
    accountSignedOut: false,
    events: [],
    census: [],
    settings: {
      language,
      notifications: true,
      overlayNotifications: true,
      notificationKinds: {
        danger: true,
        team: true,
        timer: true,
        system: true,
      },
      autoStart: false,
      closeToTray: true,
      showRoutes: true,
      motion: true,
      glass: true,
      bot: false,
      discord: false,
    },
    secrets: {},
    fcm: null,
  };
}

function mergeSavedData(parsed, defaultLanguage = "en") {
  const defaults = defaultData(defaultLanguage);
  return {
    ...defaults,
    ...parsed,
    settings: {
      ...defaults.settings,
      ...parsed.settings,
      notificationKinds: Object.fromEntries(
        Object.entries(defaults.settings.notificationKinds).map(
          ([kind, enabled]) => [
            kind,
            typeof parsed.settings?.notificationKinds?.[kind] === "boolean"
              ? parsed.settings.notificationKinds[kind]
              : enabled,
          ],
        ),
      ),
    },
    secrets: parsed.secrets || {},
  };
}

function publicSnapshot(state) {
  return {
    servers: state.servers.map(({ id, name, ip, port, playerId }) => ({
      id,
      name,
      ip,
      port,
      playerId,
    })),
    devices: state.devices,
    timers: state.timers,
    pins: state.pins,
    events: state.events.filter((event) => event.kind !== "world"),
    census: state.census,
    routes: state.routes || [],
    requiresSignIn: Boolean(state.accountSignedOut),
    account: state.fcm?.auth?.SteamId
      ? { steamId: String(state.fcm.auth.SteamId) }
      : null,
    settings: {
      ...state.settings,
      notificationKinds: { ...state.settings.notificationKinds },
      hasWebhook: Boolean(state.secrets.webhook),
    },
    hasPairing: Boolean(state.fcm),
  };
}

function createStore({ file, encrypt, decrypt, defaultLanguage = "en" }) {
  let readFailed = false;
  return {
    load() {
      if (!fs.existsSync(file)) return defaultData(defaultLanguage);
      try {
        const parsed = JSON.parse(decrypt(fs.readFileSync(file)));
        if (parsed.version !== 1) throw Error("Unknown schema");
        for (const key of [
          "servers",
          "devices",
          "timers",
          "pins",
          "events",
          "census",
        ]) {
          if (!Array.isArray(parsed[key])) throw Error("Invalid collection");
        }
        if (!parsed.settings || !parsed.secrets) throw Error("Missing fields");
        return mergeSavedData(parsed, defaultLanguage);
      } catch {
        readFailed = true;
        throw Error(
          "Не удалось прочитать хранилище. Исходный файл сохранён; запись отключена.",
        );
      }
    },
    save(state) {
      if (readFailed)
        throw Error(
          "Хранилище повреждено. Запись отключена, чтобы сохранить исходный файл.",
        );
      const encrypted = encrypt(JSON.stringify(state));
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file + ".tmp", encrypted);
      fs.renameSync(file + ".tmp", file);
    },
    publicSnapshot,
    exportPublic(state) {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        ...publicSnapshot(state),
      };
    },
  };
}

module.exports = {
  createStore,
  defaultData,
  mergeSavedData,
  publicSnapshot,
};
