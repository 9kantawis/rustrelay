const crypto = require("node:crypto");

function plainMessage(message) {
  // Protobuf's JSON mode turns enums into names; the UI uses their wire numbers.
  if (message.$type)
    return message.$type.toObject(message, {
      longs: String,
      enums: Number,
      bytes: String,
      defaults: true,
    });
  return JSON.parse(JSON.stringify(message));
}

function validateServer(input) {
  const ip = String(input.ip || "").trim();
  const port = Number(input.port);
  const playerId = String(input.playerId || "").trim();
  const playerToken = Number(input.playerToken);
  if (!/^[a-zA-Z0-9.-]{1,253}$/.test(ip))
    throw Error("Укажи IP или имя сервера без протокола");
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("Порт должен быть от 1 до 65535");
  if (!/^\d{17}$/.test(playerId))
    throw Error("Steam ID должен содержать 17 цифр");
  if (
    input.playerToken === "" ||
    input.playerToken == null ||
    !Number.isInteger(playerToken) ||
    playerToken < -2147483648 ||
    playerToken > 2147483647
  )
    throw Error("Нужен числовой токен сопряжения Rust+");
  return {
    id: input.id || crypto.randomUUID(),
    name: String(input.name || ip).slice(0, 80),
    ip,
    port,
    playerId,
    playerToken,
    proxy: input.proxy !== false,
  };
}

function connectionError(error) {
  if (
    ["access_denied", "invalid_player_token", "invalid_token"].includes(
      error?.code,
    )
  )
    return "Сервер отклонил сопряжение. Нажми «Подключить Rust+» в игре ещё раз.";
  if (error?.code === "SERVER_REJECTED")
    return "Сервер отклонил запрос. Попробуй подключиться ещё раз.";
  if (
    ["PROTOCOL_DECODE", "PROTOCOL_SCHEMA", "INVALID_RESPONSE"].includes(
      error?.code,
    )
  )
    return "Не удалось прочитать ответ Rust+. Попробуй подключиться ещё раз.";
  if (
    ["REQUEST_TIMEOUT", "CONNECTION_TIMEOUT", "ETIMEDOUT"].includes(error?.code)
  )
    return "Сервер Rust+ не отвечает. Попробуй подключиться позже.";
  if (
    [
      "ECONNREFUSED",
      "EHOSTUNREACH",
      "ENETUNREACH",
      "ENOTFOUND",
      "EAI_AGAIN",
    ].includes(error?.code)
  )
    return "Сервер Rust+ недоступен. Проверь подключение к интернету.";
  return "Не удалось подключиться к Rust+. Попробуй ещё раз.";
}

function closeTransport(previous) {
  if (!previous) return;

  previous.removeAllListeners();
  previous.on("error", () => {});

  // Also close transports that finish initializing after cancellation.
  previous.once("connecting", () =>
    queueMicrotask(() => previous.disconnect()),
  );
  previous.once("connected", () => previous.disconnect());
  previous.disconnect();
}
function createRustClient({
  transportFactory,
  emit = () => {},
  broadcast = () => {},
  interval = 400,
  timeout = 12000,
}) {
  let transport = null;
  let generation = 0;
  let queue = Promise.resolve();
  let cancelConnection = null;
  const state = {
    status: "disconnected",
    serverId: null,
    error: null,
    lastSync: null,
  };

  function notify() {
    emit({ ...state });
  }
  function disconnect() {
    generation += 1;
    cancelConnection?.();
    cancelConnection = null;
    const previous = transport;
    transport = null;
    closeTransport(previous);

    queue = Promise.resolve();
    Object.assign(state, {
      status: "disconnected",
      serverId: null,
      error: null,
      lastSync: null,
    });
    notify();
  }

  function request(body, expectedGeneration = generation) {
    const expectedTransport = transport;
    const task = queue.then(async () => {
      if (interval)
        await new Promise((resolve) => setTimeout(resolve, interval));
      if (!expectedTransport || expectedGeneration !== generation)
        throw Error("Подключение изменилось");
      const response = await expectedTransport.sendRequestAsync(body, timeout);
      if (expectedGeneration !== generation)
        throw Error("Подключение изменилось");
      if (response.error) {
        const code = [
          "access_denied",
          "invalid_player_token",
          "invalid_token",
        ].includes(response.error.error)
          ? response.error.error
          : "SERVER_REJECTED";
        throw Object.assign(Error(connectionError({ code })), { code });
      }
      return plainMessage(response);
    });
    queue = task.catch(() => {});
    return task;
  }

  async function connect(input) {
    const server = validateServer(input);
    disconnect();
    const session = generation;
    transport = transportFactory(server);
    Object.assign(state, { status: "connecting", serverId: server.id });
    notify();
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, response) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cancelConnection = null;
        if (error) reject(error);
        else resolve(response);
      };
      const fail = (error) => {
        if (session !== generation) return;
        const failedTransport = transport;
        transport = null;
        generation += 1;
        closeTransport(failedTransport);

        Object.assign(state, {
          status: "error",
          error: connectionError(error),
        });
        notify();
        finish(Error(state.error));
      };
      const timer = setTimeout(
        () => fail({ code: "CONNECTION_TIMEOUT" }),
        timeout,
      );
      cancelConnection = () => finish(Error("Подключение изменилось"));
      transport.on("error", fail);
      transport.on("disconnected", () => {
        if (session !== generation) return;
        generation += 1;
        transport = null;
        Object.assign(state, {
          status: "disconnected",
          error: "Соединение закрыто. Можно подключиться снова.",
        });
        notify();
        finish(Error(state.error));
      });
      transport.on("message", (message) => {
        if (session === generation && message.broadcast)
          broadcast(plainMessage(message.broadcast));
      });
      transport.once("connected", async () => {
        try {
          const response = await request({ getInfo: {} });
          if (!response.info)
            throw Object.assign(Error("Missing server info"), {
              code: "INVALID_RESPONSE",
            });
          if (session !== generation) return;
          Object.assign(state, {
            status: "connected",
            error: null,
            lastSync: Date.now(),
          });
          notify();
          finish(null, response.info);
        } catch (error) {
          fail(error);
        }
      });
      try {
        transport.connect();
      } catch (error) {
        fail(error);
      }
    });
  }

  return {
    state,
    get session() {
      return generation;
    },
    connect,
    disconnect,
    request,
    refresh: () => request({ getInfo: {} }),
  };
}

module.exports = { createRustClient, validateServer };
