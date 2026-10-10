const { contextBridge, ipcRenderer } = require("electron");
const allowed = new Set([
  "state",
  "connect",
  "disconnect",
  "saveServer",
  "deleteServer",
  "addDevice",
  "removeDevice",
  "toggleDevice",
  "refresh",
  "chat",
  "settings",
  "pair",
  "cancelPair",
  "signInBack",
  "signInRetry",
  "listen",
  "logout",
  "openSteamProfile",
  "deleteRoute",
  "addTimer",
  "deleteTimer",
  "addPin",
  "deletePin",
  "export",
  "open",
  "window",
  "webhookTest",
  "clearEvents",
  "deleteEvent",
  "heatmap",
  "command",
  "deviceAutomation",
  "saveSwitchGroup",
  "deleteSwitchGroup",
  "toggleSwitchGroup",
  "companionSettings",
  "companionTool",
]);
contextBridge.exposeInMainWorld("relay", {
  invoke: (action, payload) => {
    if (!allowed.has(action)) return Promise.reject(Error("Unknown action"));
    return ipcRenderer.invoke("relay", action, payload);
  },
  subscribe: (fn) => {
    const listener = (_, state) => fn(state);
    ipcRenderer.on("state", listener);
    return () => ipcRenderer.removeListener("state", listener);
  },
});
