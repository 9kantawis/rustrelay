async function sendDiscord(webhook, event, send = fetch) {
  if (!/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(webhook))
    throw Error("Неверный адрес Discord webhook");
  const response = await send(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "RustRelay",
      content: `${event.title}\n${event.detail}`.slice(0, 1900),
      allowed_mentions: { parse: [] },
    }),
    signal: AbortSignal.timeout(10000),
    redirect: "error",
  });
  if (!response.ok)
    throw Error(`Discord не принял уведомление (${response.status})`);
}
module.exports = { sendDiscord };
