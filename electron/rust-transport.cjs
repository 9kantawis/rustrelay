const { EventEmitter } = require("node:events");
const path = require("node:path");
const protobuf = require("protobufjs");
const WebSocket = require("ws");

let protocol;
function loadProtocol() {
  protocol ??= protobuf
    .load(
      path.join(
        path.dirname(require.resolve("@liamcottle/rustplus.js")),
        "rustplus.proto",
      ),
    )
    .then((root) => {
      // Servers omit zero-valued scalars, including offline players' spawnTime.
      // The older schema marks them required. Requests keep their wire schema.
      const visited = new Set();
      function acceptScalarDefaults(type) {
        if (visited.has(type)) return;
        visited.add(type);
        for (const field of [...type.fieldsArray]) {
          field.resolve();
          if (field.resolvedType instanceof protobuf.Type) {
            acceptScalarDefaults(field.resolvedType);
          } else if (field.required) {
            type.remove(field);
            type.add(
              protobuf.Field.fromJSON(field.name, {
                ...field.toJSON(),
                rule: "optional",
              }),
            );
          }
        }
      }
      acceptScalarDefaults(root.lookupType("rustplus.AppMessage"));
      return {
        request: root.lookupType("rustplus.AppRequest"),
        message: root.lookupType("rustplus.AppMessage"),
      };
    });
  return protocol;
}

function transportError(code) {
  return Object.assign(new Error(code), { code });
}

class RustTransport extends EventEmitter {
  constructor(
    server,
    {
      socketFactory = (url, options) => new WebSocket(url, options),
      protocolLoader = loadProtocol,
      handshakeTimeout = 4500,
    } = {},
  ) {
    super();
    this.server = server;
    this.socketFactory = socketFactory;
    this.protocolLoader = protocolLoader;
    this.handshakeTimeout = handshakeTimeout;
    this.socket = null;
    this.session = 0;
    this.sequence = 0;
    this.pending = new Map();
  }

  connect() {
    this.disconnect();
    const session = this.session;
    Promise.resolve()
      .then(() => this.protocolLoader())
      .then((types) => {
        if (session !== this.session) return;
        this.types = types;
        this.emit("connecting");
        if (session === this.session)
          this.openSocket(this.server.proxy, session);
      })
      .catch(() => {
        if (session === this.session)
          this.emit("error", transportError("PROTOCOL_SCHEMA"));
      });
  }

  openSocket(proxy, session) {
    const { ip, port } = this.server;
    const address = proxy
      ? `wss://companion-rust.facepunch.com/game/${ip}/${port}`
      : `ws://${ip}:${port}`;
    let socket;
    try {
      socket = this.socketFactory(address, {
        handshakeTimeout: this.handshakeTimeout,
      });
    } catch (error) {
      this.emit("error", error);
      return;
    }
    this.socket = socket;
    let opened = false;
    const current = () => session === this.session && socket === this.socket;
    const failed = (error) => {
      if (!current()) return;
      if (proxy && !opened) {
        this.closeSocket();
        // Pairing already gives us the server's Rust+ address. A failed proxy
        // handshake should not prevent the desktop app from using it directly.
        this.openSocket(false, session);
      } else {
        this.emit("error", error);
      }
    };
    socket.once("open", () => {
      if (!current()) return;
      opened = true;
      this.emit("connected");
    });
    socket.on("error", failed);
    socket.on("close", () => {
      if (!current()) return;
      if (proxy && !opened) {
        failed(transportError("CONNECTION_CLOSED"));
        return;
      }
      this.socket = null;
      this.rejectPending(transportError("CONNECTION_CLOSED"));
      this.emit("disconnected");
    });
    socket.on("message", (bytes) => {
      if (!current()) return;
      let message;
      try {
        message = this.types.message.decode(bytes);
      } catch {
        this.emit("error", transportError("PROTOCOL_DECODE"));
        return;
      }
      const response = message.response;
      const pending = response && this.pending.get(response.seq);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(response.seq);
        pending.resolve(response);
      }
      this.emit("message", message);
    });
  }

  closeSocket() {
    const socket = this.socket;
    this.socket = null;
    if (!socket) return;
    socket.removeAllListeners();
    socket.on("error", () => {});
    socket.terminate();
  }

  rejectPending(error) {
    for (const request of this.pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    this.pending.clear();
  }

  disconnect() {
    this.session += 1;
    this.closeSocket();
    this.rejectPending(transportError("CONNECTION_CLOSED"));
  }

  sendRequestAsync(body, timeout = 12000) {
    if (this.socket?.readyState !== WebSocket.OPEN)
      return Promise.reject(transportError("CONNECTION_CLOSED"));
    const seq = (this.sequence = (this.sequence + 1) >>> 0 || 1);
    return new Promise((resolve, reject) => {
      const fail = (error) => {
        const request = this.pending.get(seq);
        if (!request) return;
        clearTimeout(request.timer);
        this.pending.delete(seq);
        reject(error);
      };
      const timer = setTimeout(
        () => fail(transportError("REQUEST_TIMEOUT")),
        timeout,
      );
      this.pending.set(seq, { resolve, reject, timer });
      try {
        const request = this.types.request.fromObject({
          ...body,
          seq,
          playerId: this.server.playerId,
          playerToken: this.server.playerToken,
        });
        this.socket.send(
          this.types.request.encode(request).finish(),
          (error) => {
            if (error) fail(error);
          },
        );
      } catch (error) {
        fail(error);
      }
    });
  }
}

module.exports = { RustTransport, loadProtocol };
