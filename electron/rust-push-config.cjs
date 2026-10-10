const fs = require("node:fs");

// Use the client configuration shipped by the pinned Rust+ library.
// Reading this file does not execute its CLI or open a browser.
function getRustPushConfig() {
  const source = fs.readFileSync(require.resolve("@liamcottle/rustplus.js/cli/index.js"), "utf8");
  const fields = ["apiKey", "projectId", "gcmSenderId", "gmsAppId", "androidPackageName", "androidPackageCert"];
  const config = {};
  for (const field of fields) {
    const match = source.match(new RegExp("const\\s+" + field + "\\s*=\\s*[\"']([^\"']+)[\"']\\s*;"));
    if (!match) throw Error("Не найдена конфигурация уведомлений Rust+");
    config[field] = match[1];
  }
  if (config.projectId !== "rust-companion-app" || config.androidPackageName !== "com.facepunch.rust.companion")
    throw Error("Неверная конфигурация уведомлений Rust+");
  return config;
}

module.exports = { getRustPushConfig };
