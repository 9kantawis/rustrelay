const { contextBridge, ipcRenderer } = require("electron");
if (
  process.isMainFrame &&
  location.origin === "https://companion-rust.facepunch.com"
) {
  contextBridge.exposeInMainWorld("ReactNativeWebView", {
    postMessage(message) {
      if (typeof message === "string" && message.length <= 16384)
        ipcRenderer.send("rust-sign-in", message);
    },
  });
}
