const crypto = require("node:crypto");
const { createRustClient, validateServer } = require("./rust-client.cjs");
const { RustTransport } = require("./rust-transport.cjs");
const engine = require("../shared/rust-calculations.cjs");

function createService({
  store,
  data,
  publish,
  notify,
  heatmaps = async () => ({ status: "unavailable", heatmap: null }),
}) {
  let pollTimer;
  let teamTimer;
  let teamSession = null;
  let routeSaveTimer;
  const { createRouteRecorder } = require("./map-routes.cjs");
  const recorder = createRouteRecorder(data);
  let companion;
  let refreshingSession = null;
  const live = {
    info: null,
    time: null,
    map: null,
    heatmap: null,
    heatmapStatus: "idle",
    team: [],
    mapNotes: [],
    chat: [],
    pairStatus: data.fcm?.auth?.SteamId ? "signed-in" : "idle",
    pairError: null,
    signIn: null,
  };
  const client = createRustClient({
    transportFactory: (server) => new RustTransport(server),
    emit: () => publish(snapshot()),
    broadcast: handleBroadcast,
  });

  function snapshot() {
    return {
      ...store.publicSnapshot(data),
      ...live,
      companion: companion?.state() || null,
      connection: { ...client.state },
    };
  }
  function flushRoutes() {
    clearTimeout(routeSaveTimer);
    routeSaveTimer = null;
    store.save(data);
  }
  function scheduleRouteSave() {
    if (routeSaveTimer) return;
    routeSaveTimer = setTimeout(() => {
      try {
        flushRoutes();
      } catch {
        client.state.error = "Не удалось сохранить маршрут";
        publish(snapshot());
      }
    }, 15000);
    routeSaveTimer.unref();
  }
  function save() {
    flushRoutes();
    publish(snapshot());
  }
  function addEvent(kind, title, detail = "", alert = false) {
    const event = {
      id: crypto.randomUUID(),
      kind,
      title,
      detail,
      time: Date.now(),
    };
    data.events.unshift(event);
    data.events = data.events.slice(0, 500);
    save();
    if (alert) notify(event, data, snapshot());
  }
  function clearLive() {
    Object.assign(live, {
      info: null,
      time: null,
      map: null,
      heatmap: null,
      heatmapStatus: "idle",
      team: [],
      mapNotes: [],
      teamLeader: null,
      chat: [],
    });
  }
  function disconnect() {
    if (recorder.finish() || routeSaveTimer) flushRoutes();
    clearInterval(pollTimer);
    clearInterval(teamTimer);
    clearLive();
    client.disconnect();
    companion?.sync().catch(() => {});
  }
  function compareTeam(members) {
    for (const member of members) {
      const previous = live.team.find(
        (item) => item.steamId === member.steamId,
      );
      if (previous && previous.isOnline !== member.isOnline)
        addEvent(
          "team",
          `${member.name} ${member.isOnline ? "в сети" : "вышел"}`,
          "",
          true,
        );
      if (previous?.isAlive && !member.isAlive)
        addEvent(
          "danger",
          `${member.name} погиб`,
          "Позиция доступна на карте",
          true,
        );
    }
    live.team = members;
    const server = data.servers.find(
      (item) => item.id === client.state.serverId,
    );
    if (server && live.info && recorder.record(server, live.info, members))
      scheduleRouteSave();
  }
  function handleBroadcast(message) {
    try {
      if (message.teamChanged?.teamInfo) {
        compareTeam(message.teamChanged.teamInfo.members || []);
        live.mapNotes = [
          ...(message.teamChanged.teamInfo.mapNotes || []),
          ...(message.teamChanged.teamInfo.leaderMapNotes || []),
        ];
      }
      if (message.teamMessage?.message) {
        const incoming = message.teamMessage.message;
        if (
          !live.chat.some(
            (row) =>
              row.time === incoming.time &&
              row.message === incoming.message &&
              row.steamId === incoming.steamId,
          )
        )
          live.chat = [...live.chat, incoming].slice(-200);
        if (companion) companion.broadcast(message);
        else if (data.settings.bot)
          answerCommand(incoming.message).catch(() => {});
      }
      if (message.entityChanged) {
        const { entityId, payload } = message.entityChanged;
        const device = data.devices.find(
          (item) =>
            item.entityId === entityId &&
            item.serverId === client.state.serverId,
        );
        if (device) {
          const triggered =
            device.type === 2 && payload.value && !device.payload?.value;
          device.payload = payload;
          device.updated = Date.now();
          if (triggered)
            addEvent("danger", "Сработала сигнализация", device.name, true);
          save();
        }
      }
      publish(snapshot());
    } catch {
      client.state.error = "Не удалось обработать обновление сервера";
      publish(snapshot());
    }
  }
  async function loadHeatmap() {
    const session = client.session;
    if (!live.info || live.heatmapStatus === "loading") return;
    live.heatmapStatus = "loading";
    publish(snapshot());
    let result;
    try {
      result = await heatmaps(live.info);
    } catch {
      result = { status: "error", heatmap: null };
    }
    if (session !== client.session) return;
    live.heatmap = result.heatmap;
    live.heatmapStatus = result.status;
    publish(snapshot());
  }
  async function refreshTeam() {
    const session = client.session;
    if (
      client.state.status !== "connected" ||
      refreshingSession === session ||
      teamSession === session
    )
      return;
    teamSession = session;
    try {
      const response = await client.request({ getTeamInfo: {} }, session);
      if (session !== client.session) return;
      compareTeam(response.teamInfo?.members || []);
      live.teamLeader = response.teamInfo?.leaderSteamId;
      live.mapNotes = [
        ...(response.teamInfo?.mapNotes || []),
        ...(response.teamInfo?.leaderMapNotes || []),
      ];
      publish(snapshot());
    } catch {
    } finally {
      if (teamSession === session) teamSession = null;
    }
  }
  async function refresh(initial = false) {
    const session = client.session;
    if (refreshingSession === session || client.state.status !== "connected")
      return;
    refreshingSession = session;
    const request = (body) => client.request(body, session);
    try {
      const info = await request({ getInfo: {} });
      live.info = info.info;
      const time = await request({ getTime: {} });
      live.time = time.time;
      const team = await request({ getTeamInfo: {} });
      live.teamLeader = team.teamInfo?.leaderSteamId;
      live.mapNotes = [
        ...(team.teamInfo?.mapNotes || []),
        ...(team.teamInfo?.leaderMapNotes || []),
      ];
      compareTeam(team.teamInfo?.members || []);
      if (initial || !live.map) {
        const response = await request({ getMap: {} });
        live.map = response.map
          ? {
              ...response.map,
              jpgImage: `data:image/jpeg;base64,${response.map.jpgImage}`,
            }
          : null;
      }
      if (initial) void loadHeatmap().catch(() => {});
      const chat = await request({ getTeamChat: {} });
      live.chat = chat.teamChat?.messages || [];
      for (const device of data.devices.filter(
        (item) => item.serverId === client.state.serverId,
      )) {
        try {
          const response = await request({
            entityId: device.entityId,
            getEntityInfo: {},
          });
          device.type = response.entityInfo.type;
          device.payload = response.entityInfo.payload;
          device.updated = Date.now();
          device.error = null;
        } catch {
          if (session !== client.session) return;
          device.error = "Нет ответа от устройства";
        }
      }
      await companion?.sync().catch(() => {});
      client.state.lastSync = Date.now();
      client.state.error = null;
      save();
    } catch {
      if (session === client.session && client.state.status === "connected")
        client.state.error =
          "Обновление не получено. Показаны последние данные.";
    } finally {
      if (refreshingSession === session) refreshingSession = null;
      publish(snapshot());
    }
  }
  let lastCommand = 0;
  async function answerCommand(text) {
    if (
      typeof text !== "string" ||
      !text.startsWith("!") ||
      Date.now() - lastCommand < 5000
    )
      return;
    const [command, item, quantity = "1"] = text.trim().split(/\s+/);
    let reply;
    if (command === "!pop" && live.info)
      reply = `Игроки: ${live.info.players}/${live.info.maxPlayers}`;
    if (command === "!wipe" && live.info)
      reply = `Вайп: ${new Date(live.info.wipeTime * 1000).toLocaleDateString("ru-RU")}`;
    if (command === "!craft")
      reply = Object.entries(
        engine.craft(item, Number(quantity), true).resources,
      )
        .map(([name, count]) => `${engine.names[name] || name}: ${count}`)
        .join(", ");
    if (command === "!recycle")
      reply = Object.entries(engine.recycle({ [item]: Number(quantity) }))
        .map(([name, count]) => `${engine.names[name] || name}: ${count}`)
        .join(", ");
    if (command === "!decay")
      reply = `Около ${Math.round(engine.decay(item, Number(quantity)) / 60)} минут при стандартном распаде`;
    if (command === "!upkeep")
      reply = data.devices
        .filter(
          (device) =>
            device.serverId === client.state.serverId && device.type === 3,
        )
        .map(
          (device) =>
            `${device.name}: ${device.payload?.protectionExpiry ? Math.max(0, Math.round((device.payload.protectionExpiry * 1000 - Date.now()) / 3600000)) + " ч" : "нет данных"}`,
        )
        .join("; ");
    if (reply) {
      lastCommand = Date.now();
      await client.request({
        sendTeamMessage: { message: `[Relay] ${reply}`.slice(0, 128) },
      });
    }
  }
  function signOutAccount() {
    disconnect();
    data.tracking = false;
    data.fcm = null;
    data.accountSignedOut = true;
    live.pairStatus = "idle";
    live.pairError = null;
    save();
  }
  const actions = {
    state: snapshot,
    async connect(id) {
      if (data.accountSignedOut)
        throw Error("Войди в Steam, чтобы подключить сохранённый сервер");
      const server = data.servers.find((item) => item.id === id);
      if (!server) throw Error("Сервер не найден");
      disconnect();
      live.info = await client.connect(server);
      addEvent("system", "Сервер подключён", server.name);
      const session = client.session;
      await refresh(true);
      if (session !== client.session) return snapshot();
      pollTimer = setInterval(() => refresh(), 20000);
      teamTimer = setInterval(() => refreshTeam(), 5000);
      return snapshot();
    },
    disconnect,
    refresh,
    saveServer(input) {
      const server = validateServer(input);
      const previous = data.servers.find(
        (item) =>
          item.ip === server.ip &&
          item.port === server.port &&
          item.playerId === server.playerId,
      );
      if (previous) server.id = previous.id;
      data.servers = [
        ...data.servers.filter((item) => item.id !== server.id),
        server,
      ];
      save();
      return server.id;
    },
    deleteServer(id) {
      if (client.state.serverId === id) disconnect();
      data.servers = data.servers.filter((item) => item.id !== id);
      data.devices = data.devices.filter((item) => item.serverId !== id);
      save();
    },
    async addDevice(input) {
      if (!data.servers.some((server) => server.id === input.serverId))
        throw Error("Сначала выбери сервер");
      const entityId = Number(input.entityId);
      if (!Number.isInteger(entityId) || entityId < 1 || entityId > 4294967295)
        throw Error("Укажи числовой ID устройства");
      if (
        data.devices.some(
          (device) =>
            device.entityId === entityId && device.serverId === input.serverId,
        )
      )
        throw Error("Устройство уже добавлено");
      data.devices.push({
        id: crypto.randomUUID(),
        entityId,
        serverId: input.serverId,
        type: Number(input.type) || 1,
        name: String(input.name || "Устройство").slice(0, 80),
      });
      save();
      await refresh();
    },
    async removeDevice(id) {
      data.devices = data.devices.filter((device) => device.id !== id);
      save();
      await companion?.sync();
    },
    async toggleDevice({ id, value }) {
      const device = data.devices.find((item) => item.id === id);
      if (
        !device ||
        device.serverId !== client.state.serverId ||
        device.type !== 1 ||
        client.state.status !== "connected"
      )
        throw Error("Переключатель недоступен");
      await client.request({
        entityId: device.entityId,
        setEntityValue: { value: Boolean(value) },
      });
      device.payload = { ...device.payload, value: Boolean(value) };
      save();
    },
    async chat(text) {
      if (typeof text !== "string" || !text.trim() || text.length > 128)
        throw Error("Сообщение должно содержать от 1 до 128 символов");
      const session = client.session;
      await client.request(
        { sendTeamMessage: { message: text.trim() } },
        session,
      );
      const response = await client.request({ getTeamChat: {} }, session);
      live.chat = response.teamChat?.messages || live.chat;
      publish(snapshot());
    },
    settings(input) {
      if (input.webhook !== undefined) {
        const webhook = String(input.webhook).trim();
        if (
          webhook &&
          !/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(webhook)
        )
          throw Error(
            "Укажи Discord webhook вида https://discord.com/api/webhooks/...",
          );
        data.secrets.webhook = webhook;
      }
      for (const key of [
        "motion",
        "glass",
        "notifications",
        "overlayNotifications",
        "autoStart",
        "closeToTray",
        "showRoutes",
        "bot",
        "discord",
      ])
        if (typeof input[key] === "boolean") data.settings[key] = input[key];
      if (["ru", "en", "zh"].includes(input.language))
        data.settings.language = input.language;
      if (
        input.notificationKinds &&
        typeof input.notificationKinds === "object"
      )
        for (const kind of ["danger", "team", "timer", "system"])
          if (typeof input.notificationKinds[kind] === "boolean")
            data.settings.notificationKinds[kind] =
              input.notificationKinds[kind];
      save();
    },
    addTimer(input) {
      const seconds = engine.decay(
        input.grade,
        Number(input.hp),
        Number(input.rate || 1),
      );
      data.timers.push({
        id: crypto.randomUUID(),
        name: String(input.name || "Гниение").slice(0, 80),
        grid: String(input.grid || "").slice(0, 8),
        grade: input.grade,
        ends: Date.now() + seconds * 1000,
        notified: false,
      });
      save();
    },
    deleteTimer(id) {
      data.timers = data.timers.filter((timer) => timer.id !== id);
      save();
    },
    addPin(input) {
      if (
        !Number.isFinite(input.x) ||
        !Number.isFinite(input.y) ||
        input.x < 0 ||
        input.x > 1 ||
        input.y < 0 ||
        input.y > 1
      )
        throw Error("Неверные координаты");
      data.pins.push({
        id: crypto.randomUUID(),
        serverId: client.state.serverId,
        name: String(input.name || "Метка").slice(0, 60),
        kind: ["base", "favorite", "pin"].includes(input.kind)
          ? input.kind
          : "pin",
        x: input.x,
        y: input.y,
      });
      save();
    },
    deleteRoute(id) {
      recorder.remove(id);
      save();
    },
    deletePin(id) {
      data.pins = data.pins.filter((pin) => pin.id !== id);
      save();
    },
    heatmap: loadHeatmap,
    deleteEvent(id) {
      data.events = data.events.filter((event) => event.id !== id);
      save();
    },
    clearEvents() {
      data.events = [];
      save();
    },
  };
  const timerInterval = setInterval(() => {
    for (const timer of data.timers) {
      if (!timer.notified && timer.ends <= Date.now()) {
        timer.notified = true;
        try {
          addEvent(
            "timer",
            "Таймер гниения завершён",
            `${timer.name} ${timer.grid}`,
            true,
          );
        } catch {
          /* Keep the app running if Windows storage becomes unavailable. */
        }
      }
    }
  }, 1000);
  timerInterval.unref();
  return {
    actions,
    request: (body) => client.request(body),
    attachCompanion(value) {
      companion = value;
      Object.assign(actions, value.actions);
      value.start();
    },
    snapshot,
    signOutAccount,
    data,
    live,
    save,
    addEvent,
    close() {
      clearInterval(timerInterval);
      void companion?.close().catch(() => {});
      disconnect();
    },
  };
}

module.exports = { createService };
