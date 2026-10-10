const BaseRustPlus = require("@liamcottle/rustplus.js");
const { RustTransport } = require("./rust-transport.cjs");

class CompanionTransport extends BaseRustPlus {
  connect() {
    this.disconnect();
    const transport = new RustTransport({
      ip: this.server,
      port: this.port,
      playerId: this.playerId,
      playerToken: this.playerToken,
      proxy: true,
    });
    this.transport = transport;
    for (const name of [
      "connecting",
      "connected",
      "disconnected",
      "error",
      "message",
    ]) {
      transport.on(name, (...args) => this.emit(name, ...args));
    }
    transport.connect();
  }
  disconnect() {
    const wasConnected = Boolean(this.transport);
    this.transport?.removeAllListeners();
    this.transport?.disconnect();
    this.transport = null;
    if (wasConnected) this.emit("disconnected");
  }
  async sendRequestAsync(body, timeout) {
    const response = await this.transport.sendRequestAsync(body, timeout);
    if (response.error) throw response.error;
    return response;
  }
  sendRequest(body, callback) {
    this.sendRequestAsync(body)
      .then((response) => callback?.({ response }))
      .catch((error) => callback?.({ response: { error } }));
  }
}
module.exports = CompanionTransport;
