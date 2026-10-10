const fs = require("node:fs");
const path = require("node:path");
const { AsyncLocalStorage } = require("node:async_hooks");

const root = "./vendor/rustplusplus";
const runtime = require(root + "/runtime.cjs");
const Client = require(root + "/index.ts");
const Config = require(root + "/config");
const DESKTOP = "desktop";
const localTools = new Set([
  "alarm",
  "alias",
  "blacklist",
  "cctv",
  "craft",
  "decay",
  "despawn",
  "item",
  "leader",
  "recycle",
  "research",
  "stack",
  "storagemonitor",
  "switch",
  "upkeep",
  "uptime",
]);

function createCompanion({ service, directory }) {
  const secrets = service.data.secrets;
  secrets.companion ??= { instances: {}, credentials: {} };
  const saved = secrets.companion;
  saved.instances ??= {};
  saved.credentials ??= {};
  let client;
  let desktop;
  let closed = false;
  let commandQueue = Promise.resolve();
  const replies = new AsyncLocalStorage();
  const log = [];
  fs.mkdirSync(path.join(directory, "maps"), { recursive: true });
  runtime.configure({
    directory,
    read: (collection, id) =>
      saved[collection][id]
        ? structuredClone(saved[collection][id])
        : undefined,
    write: (collection, id, value) => {
      saved[collection][id] = structuredClone(value);
      service.save();
    },
    keys: (collection) => Object.keys(saved[collection]),
    log(title, message, level) {
      if (level !== "error" && level !== "warn" && level !== "warning") return;
      // Upstream credential commands can include secrets in their log arguments.
      // Keep only the translated category, never arbitrary upstream log payloads.
      log.unshift({
        time: Date.now(),
        level,
        title: String(title).slice(0, 120),
      });
      if (log.length > 40) log.pop();
    },
  });
  Config.discord.username = "RustRelay";
  Config.general.language =
    service.data.settings.language === "zh"
      ? "en"
      : service.data.settings.language;
  const DiscordBot = require(root + "/src/structures/DiscordBot");
  const RustPlus = require(root + "/src/structures/RustPlus");
  const Info = require(root + "/src/structures/Info");
  const Time = require(root + "/src/structures/Time");
  const Team = require(root + "/src/structures/Team");
  const GameMap = require(root + "/src/structures/Map");
  const Chat = require(root + "/src/handlers/inGameCommandHandler");
  class LocalCompanion extends DiscordBot {
    loadDiscordEvents() {}
    loadDiscordCommands() {
      for (const name of localTools) {
        const tool = require(root + "/src/commands/" + name);
        this.commands.set(name, tool);
      }
    }
  }
  client = new LocalCompanion({ intents: [] });
  Client.client = client;
  client.uptimeBot = new Date();
  client.instances = structuredClone(saved.instances);
  require(root + "/src/util/CreateInstanceFile")(client, { id: DESKTOP });
  require(root + "/src/util/CreateCredentialsFile")(client, { id: DESKTOP });
  client.loadGuildIntl(DESKTOP);

  const messages = require(root + "/src/discordTools/discordMessages");
  const originalSendMessage = messages.sendMessage;
  messages.sendMessage = (guildId, ...args) =>
    guildId === DESKTOP
      ? Promise.resolve(undefined)
      : originalSendMessage(guildId, ...args);
  for (const name of [
    "sendSmartSwitchMessage",
    "sendSmartAlarmMessage",
    "sendStorageMonitorMessage",
    "sendSmartSwitchGroupMessage",
  ]) {
    const original = messages[name];
    messages[name] = (guildId, ...args) =>
      guildId === DESKTOP
        ? Promise.resolve(undefined)
        : original(guildId, ...args);
  }
  for (const [name, title] of Object.entries({
    sendDecayingNotificationMessage: "База начала гнить",
    sendStorageMonitorDisconnectNotificationMessage:
      "Монитор хранилища отключён",
    sendStorageMonitorNotFoundMessage: "Хранилище недоступно",
    sendSmartSwitchNotFoundMessage: "Переключатель недоступен",
    sendSmartAlarmNotFoundMessage: "Сигнализация недоступна",
  })) {
    const original = messages[name];
    messages[name] = async (guildId, serverId, entityId) => {
      if (guildId !== DESKTOP) return original(guildId, serverId, entityId);
      const device = service.data.devices.find(
        (item) => item.entityId === Number(entityId),
      );
      service.addEvent("danger", title, device?.name || "", true);
    };
  }
  function state() {
    const instance = client.getInstance(DESKTOP);
    return {
      general: instance.generalSettings,
      aliases: instance.aliases,
      blacklist: instance.blacklist,
      server: desktop
        ? publicServer(instance.serverList[desktop.serverId])
        : null,
      log,
      commands: commandCatalog(),
      tools: client.commands.map((command) =>
        command.getData(client, DESKTOP).toJSON(),
      ),
    };
  }
  function publicServer(server) {
    if (!server) return null;
    return {
      notes: server.notes,
      markers: server.markers,
      switchGroups: server.switchGroups,
      switches: server.switches,
    };
  }
  function commandCatalog() {
    const dictionary = client.enMessages;
    const ChatSource = fs.readFileSync(
      require.resolve(root + "/src/handlers/inGameCommandHandler"),
      "utf8",
    );
    return Object.entries(dictionary)
      .filter(
        ([key]) =>
          /^commandSyntax/.test(key) &&
          ![
            "commandSyntaxSend",
            "commandSyntaxTTS",
            "commandSyntaxPlayer",
            "commandSyntaxPlayers",
          ].includes(key) &&
          ChatSource.includes("'" + key + "'"),
      )
      .map(([key, value]) => ({
        name: value,
        description:
          require("../shared/command-help.json")[value]?.description || "",
        example:
          require("../shared/command-help.json")[value]?.example || value,
      }));
  }
  function serverRecord(server, previous = {}) {
    return {
      ...previous,
      title: server.name,
      serverIp: server.ip,
      appPort: server.port,
      steamId: server.playerId,
      playerToken: server.playerToken,
      description: "",
      img: "",
      url: "",
      notes: previous.notes || {},
      switches: previous.switches || {},
      alarms: previous.alarms || {},
      storageMonitors: previous.storageMonitors || {},
      markers: previous.markers || {},
      switchGroups: previous.switchGroups || {},
      messageId: null,
      battlemetricsId: previous.battlemetricsId || null,
      connect: null,
      timeTillDay: previous.timeTillDay || null,
      timeTillNight: previous.timeTillNight || null,
    };
  }
  function stopDesktop() {
    if (!desktop) return;
    desktop.isOperational = false;
    for (const timer of Object.values(desktop.timers)) timer.timer?.stop();
    clearInterval(desktop.tokensReplenishTaskId);
    clearTimeout(desktop.inGameChatTimeout);
    for (const timer of Object.values(desktop.currentSwitchTimeouts))
      clearTimeout(timer);
    desktop.leaderRustPlusInstance?.disconnect();
    delete client.rustplusInstances[DESKTOP];
    desktop = null;
  }
  async function sync() {
    if (closed) return;
    const live = service.live;
    const server = service.data.servers.find(
      (s) => s.id === service.snapshot().connection.serverId,
    );
    if (!server || !live.info || !live.map || !live.time) {
      stopDesktop();
      return;
    }
    const instance = client.getInstance(DESKTOP);
    const serverId = `${server.ip}-${server.port}`;
    instance.serverList[serverId] = serverRecord(
      server,
      instance.serverList[serverId],
    );
    instance.serverListLite[serverId] ??= {};
    instance.activeServer = serverId;
    const language =
      service.data.settings.language === "zh"
        ? "en"
        : service.data.settings.language;
    if (instance.generalSettings.language !== language) {
      instance.generalSettings.language = language;
      client.setInstance(DESKTOP, instance);
      client.loadGuildIntl(DESKTOP);
    }
    instance.generalSettings.trademark = "Relay";
    for (const group of ["switches", "alarms", "storageMonitors"]) {
      for (const id of Object.keys(instance.serverList[serverId][group])) {
        if (
          !service.data.devices.some(
            (device) =>
              device.serverId === server.id && String(device.entityId) === id,
          )
        ) {
          delete instance.serverList[serverId][group][id];
          if (desktop) delete desktop.storageMonitors[id];
        }
      }
    }
    for (const group of Object.values(
      instance.serverList[serverId].switchGroups,
    ))
      group.switches = group.switches.filter(
        (id) => instance.serverList[serverId].switches[id],
      );
    if (!desktop || desktop.serverId !== serverId) {
      stopDesktop();
      desktop = new RustPlus(
        DESKTOP,
        server.ip,
        server.port,
        server.playerId,
        server.playerToken,
      );
      desktop.generalSettings = instance.generalSettings;
      desktop.notificationSettings = instance.notificationSettings;
      desktop.logger = { log: (...args) => runtime.log(...args) };
      desktop.sendRequestAsync = async (body) => {
        const device = service.data.devices.find(
          (item) =>
            item.serverId === server.id &&
            item.entityId === Number(body.entityId),
        );
        if (
          body.getEntityInfo &&
          device?.payload &&
          !device.error &&
          Date.now() - device.updated < 30000
        )
          return { entityInfo: { type: device.type, payload: device.payload } };
        const response = await service.request(body);
        if (body.setEntityValue && device) {
          device.payload = {
            ...device.payload,
            value: body.setEntityValue.value,
          };
          device.updated = Date.now();
          service.save();
        }
        return response;
      };
      desktop.sendInGameMessage = (text, tag) => {
        if (tag === "TIMER") {
          service.addEvent("timer", String(text), "", true);
          if (!service.data.settings.bot) return;
        }
        const context = replies.getStore();
        if (context?.active) {
          context.messages.push(String(text));
          return;
        }
        return RustPlus.prototype.sendInGameMessage.call(desktop, text);
      };
      desktop.uptimeServer = new Date();
      desktop.info = new Info(live.info);
      desktop.map = new GameMap(
        {
          ...live.map,
          jpgImage: Buffer.from(live.map.jpgImage.split(",")[1], "base64"),
        },
        desktop,
      );
      const initializing = desktop;
      await initializing.map.ready;
      if (
        closed ||
        desktop !== initializing ||
        service.snapshot().connection.serverId !== server.id
      )
        return;
      desktop.time = new Time(live.time, desktop, client);
      desktop.team = new Team(
        {
          members: live.team,
          leaderSteamId: live.teamLeader || server.playerId,
        },
        desktop,
      );
      desktop.isOperational = true;
      desktop.isFirstPoll = false;
      desktop.loadMarkers();
      desktop.tokensReplenishTaskId = setInterval(
        () => desktop?.replenishTokens(),
        1000,
      );
      desktop.tokensReplenishTaskId.unref();
      client.rustplusInstances[DESKTOP] = desktop;
      client.activeRustplusInstances[DESKTOP] = true;
    } else {
      const team = {
        members: live.team,
        leaderSteamId: live.teamLeader || server.playerId,
      };
      await require(root + "/src/handlers/teamHandler").handler(
        desktop,
        client,
        team,
      );
      desktop.team.updateTeam(team);
      await require(root + "/src/handlers/smartSwitchHandler").handler(
        desktop,
        client,
        live.time,
      );
      require(root + "/src/handlers/timeHandler").handler(
        desktop,
        client,
        live.time,
      );
      desktop.time.updateTime(live.time);
      desktop.info.updateInfo(live.info);
    }
    for (const device of service.data.devices.filter(
      (d) => d.serverId === server.id,
    )) {
      const group =
        device.type === 1
          ? "switches"
          : device.type === 2
            ? "alarms"
            : "storageMonitors";
      const previous =
        instance.serverList[serverId][group][device.entityId] || {};
      instance.serverList[serverId][group][device.entityId] = {
        ...previous,
        name: device.name,
        active: Boolean(device.payload?.value),
        reachable: !device.error,
        id: device.entityId,
        command: previous.command || `device${device.entityId}`,
        autoDayNightOnOff: previous.autoDayNightOnOff || 0,
        proximity: previous.proximity || 30,
        x: previous.x || 0,
        y: previous.y || 0,
        location: previous.location || "",
        messageId: null,
        everyone: false,
        inGame: true,
        decaying: previous.decaying ?? device.payload?.protectionExpiry === 0,
        image:
          previous.image ||
          (device.type === 1
            ? "smart_switch.png"
            : device.type === 2
              ? "smart_alarm.png"
              : "storage_monitor.png"),
      };
      if (device.type === 3 && device.payload)
        desktop.storageMonitors[device.entityId] ??= {
          items: device.payload.items,
          expiry: device.payload.protectionExpiry,
          capacity: device.payload.capacity,
          hasProtection: device.payload.hasProtection,
        };
    }
    desktop.storageMonitorIntervalCounter = 29;
    await require(root + "/src/handlers/storageMonitorHandler").handler(
      desktop,
      client,
    );
    saved.instances[DESKTOP] = structuredClone(instance);
  }
  function execute(text, caller) {
    if (typeof text !== "string" || text.length > 500 || !text.trim())
      throw Error("Введи команду");
    if (
      !text.trim().startsWith(desktop?.generalSettings.prefix || "!") &&
      caller
    )
      return Promise.resolve([]);
    const task = async () => {
      if (!desktop?.isOperational) throw Error("Сначала подключи сервер");
      const context = { active: true, messages: [] };
      const prefix = desktop.generalSettings.prefix;
      const command = text.trim().startsWith(prefix)
        ? text.trim()
        : prefix + text.trim();
      try {
        const handled = await replies.run(context, () =>
          Chat.inGameCommandHandler(desktop, client, {
            broadcast: {
              teamMessage: {
                message: {
                  message: command,
                  steamId: caller || desktop.playerId,
                  name: "RustRelay",
                },
              },
            },
          }),
        );
        if (!handled) throw Error("Команда не найдена. Выбери её из списка.");
        return context.messages.length
          ? context.messages
          : ["Команда выполнена"];
      } finally {
        context.active = false;
        service.save();
      }
    };
    const result = commandQueue.then(task);
    commandQueue = result.catch(() => {});
    return result;
  }
  async function runTool(input = {}) {
    const command = client.commands.get(input.name);
    if (!command) throw Error("Команда не найдена");
    const values = input.values || {};
    if (JSON.stringify(values).length > 8000)
      throw Error("Слишком большой запрос");
    let result;
    let resolveReply;
    const replyReceived = new Promise((resolve) => {
      resolveReply = resolve;
    });
    const capture = async (content) => {
      result = serializeReply(content);
      resolveReply();
      return { id: "local", edit: capture };
    };
    const options = {
      getSubcommand: () => input.subcommand || null,
      getSubcommandGroup: () => input.group || null,
      getString: (key) =>
        values[key] === undefined || values[key] === ""
          ? null
          : String(values[key]),
      getInteger: (key) =>
        values[key] === undefined || values[key] === ""
          ? null
          : Number(values[key]),
      getNumber: (key) =>
        values[key] === undefined || values[key] === ""
          ? null
          : Number(values[key]),
      getBoolean: (key) =>
        typeof values[key] === "boolean" ? values[key] : null,
    };
    const guild = { id: DESKTOP, name: "RustRelay" };
    const interaction = {
      guildId: DESKTOP,
      guild,
      channelId: null,
      commandName: input.name,
      user: { id: "local", username: "RustRelay" },
      member: {
        guild,
        user: { id: "local" },
        permissions: { has: () => true },
        roles: { cache: { has: () => true } },
      },
      options,
      deferReply: async () => {},
      reply: capture,
      editReply: capture,
      update: capture,
      followUp: capture,
    };
    const before = client.logInteraction;
    client.logInteraction = (interaction, ...args) => {
      if (interaction.guildId !== DESKTOP)
        before.call(client, interaction, ...args);
    };
    let timeout;
    try {
      await command.execute(client, interaction);
      if (!result)
        await Promise.race([
          replyReceived,
          new Promise((_, reject) => {
            timeout = setTimeout(
              () => reject(Error("Команда не вернула ответ")),
              15000,
            );
          }),
        ]);
      service.save();
      return result;
    } finally {
      clearTimeout(timeout);
      client.logInteraction = before;
    }
  }
  function serializeReply(content) {
    if (typeof content === "string") return { text: content, embeds: [] };
    return {
      text: content?.content || "",
      embeds: (content?.embeds || []).map((embed) => {
        const value =
          typeof embed.toJSON === "function" ? embed.toJSON() : embed;
        return {
          title: value.title || "",
          description: value.description || "",
          fields: value.fields || [],
        };
      }),
    };
  }

  const actions = {
    command: execute,
    deviceAutomation(input = {}) {
      if (!desktop?.isOperational) throw Error("Сначала подключи сервер");
      const instance = client.getInstance(DESKTOP);
      const server = instance.serverList[desktop.serverId];
      const device = server.switches[String(input.entityId)];
      if (!device) throw Error("Переключатель недоступен");
      if (input.command !== undefined) {
        const command = String(input.command).trim().replace(/^!/, "");
        if (!/^[a-zA-Z0-9_-]{1,32}$/.test(command))
          throw Error("Команда: латиница, цифры, до 32 символов");
        if (
          Object.entries(server.switches).some(
            ([id, value]) =>
              id !== String(input.entityId) && value.command === command,
          ) ||
          Object.values(server.switchGroups).some(
            (group) => group.command === command,
          )
        )
          throw Error("Команда уже используется");
        device.command = command;
      }
      if (input.mode !== undefined) {
        const mode = Number(input.mode);
        if (![0, 1, 2, 3, 4, 7, 8].includes(mode))
          throw Error("Выбери режим автоматизации");
        device.autoDayNightOnOff = mode;
      }
      client.setInstance(DESKTOP, instance);
    },
    saveSwitchGroup(input = {}) {
      if (!desktop?.isOperational) throw Error("Сначала подключи сервер");
      const instance = client.getInstance(DESKTOP);
      const server = instance.serverList[desktop.serverId];
      const command = String(input.command || "")
        .trim()
        .replace(/^!/, "");
      const name = String(input.name || "").trim();
      if (!name || name.length > 60 || !/^[a-zA-Z0-9_-]{1,32}$/.test(command))
        throw Error("Укажи название и команду группы");
      if (
        Object.values(server.switches).some(
          (device) => device.command === command,
        ) ||
        Object.entries(server.switchGroups).some(
          ([id, group]) => id !== input.id && group.command === command,
        )
      )
        throw Error("Команда уже используется");
      const switches = [...new Set((input.switches || []).map(String))];
      if (!switches.length || switches.some((id) => !server.switches[id]))
        throw Error("Выбери переключатели группы");
      const id =
        input.id && server.switchGroups[input.id]
          ? input.id
          : require("node:crypto").randomUUID();
      server.switchGroups[id] = {
        name,
        command,
        switches,
        image: "smart_switch.png",
        messageId: null,
      };
      client.setInstance(DESKTOP, instance);
      return id;
    },
    deleteSwitchGroup(id) {
      if (!desktop) throw Error("Сначала подключи сервер");
      const instance = client.getInstance(DESKTOP);
      delete instance.serverList[desktop.serverId].switchGroups[id];
      client.setInstance(DESKTOP, instance);
    },
    toggleSwitchGroup(input = {}) {
      if (!desktop?.isOperational) throw Error("Сначала подключи сервер");
      const group =
        client.getInstance(DESKTOP).serverList[desktop.serverId].switchGroups[
          input.id
        ];
      if (!group) throw Error("Группа не найдена");
      return execute(group.command + (input.value ? " on" : " off"));
    },
    companionTool(input) {
      const result = commandQueue.then(() => runTool(input));
      commandQueue = result.catch(() => {});
      return result;
    },
    companionSettings(input = {}) {
      const instance = client.getInstance(DESKTOP);
      const template = client.readGeneralSettingsTemplate();
      for (const [key, value] of Object.entries(input.general || {}))
        if (
          Object.hasOwn(template, key) &&
          typeof value === typeof template[key]
        ) {
          if (typeof value === "string" && value.length > 100)
            throw Error("Слишком длинное значение");
          if (key === "language" && !["ru", "en"].includes(value)) continue;
          instance.generalSettings[key] = value;
        }
      client.loadGuildIntl(DESKTOP);
      if (desktop) {
        desktop.generalSettings = instance.generalSettings;
        desktop.notificationSettings = instance.notificationSettings;
      }
    },
  };
  return {
    state,
    actions,
    sync,
    execute,
    client,
    broadcast(message) {
      if (
        desktop &&
        service.data.settings.bot &&
        message.teamMessage?.message &&
        !client
          .getInstance(DESKTOP)
          .blacklist.steamIds.includes(
            String(message.teamMessage.message.steamId),
          )
      )
        void execute(
          message.teamMessage.message.message,
          message.teamMessage.message.steamId,
        )
          .then((messages) => {
            for (const text of messages) desktop?.sendInGameMessage(text);
          })
          .catch(() => {});
    },
    async close() {
      closed = true;
      stopDesktop();
      await client.destroy();
    },
    start() {
      // Commands run on the existing Rust+ connection.
    },
  };
}
module.exports = { createCompanion };
