const crypto = require("node:crypto");

function mapIdentity(info) {
  return [
    info.mapSize,
    info.seed || 0,
    info.map || "",
    info.wipeTime || 0,
  ].join(":");
}
function createRouteRecorder(data) {
  if (!Array.isArray(data.routes)) data.routes = [];
  let active = null;
  function finish() {
    if (!active) return false;
    active.ended =
      active.lastSeen || active.points.at(-1)?.time || active.started;
    active = null;
    return true;
  }
  function record(server, info, members, now = Date.now()) {
    const player = members.find(
      (member) => String(member.steamId) === String(server.playerId),
    );
    if (!player?.isOnline || !player.isAlive) return finish();
    const { x, y } = player;
    if (
      ![x, y, info.mapSize].every(Number.isFinite) ||
      x < 0 ||
      y < 0 ||
      x > info.mapSize ||
      y > info.mapSize
    )
      return false;
    const mapKey = mapIdentity(info);
    const last = active?.points.at(-1);
    const distance = last ? Math.hypot(x - last.x, y - last.y) : 0;
    const gap = last ? (now - (active.lastSeen || last.time)) / 1000 : 0;
    // Start a new line after a disconnect, respawn or teleport instead of drawing across the map.
    if (
      active &&
      (active.serverId !== server.id ||
        active.mapKey !== mapKey ||
        gap > 60 ||
        gap < 0 ||
        distance > Math.max(400, gap * 100) ||
        active.points.length >= 6000)
    )
      finish();
    if (!active) {
      active = {
        id: crypto.randomUUID(),
        serverId: server.id,
        serverName: server.name,
        playerId: String(server.playerId),
        mapKey,
        started: now,
        ended: null,
        distance: 0,
        points: [],
      };
      data.routes.push(active);
      if (data.routes.length > 200)
        data.routes.splice(0, data.routes.length - 200);
    }
    const previous = active.points.at(-1);
    if (previous && Math.hypot(x - previous.x, y - previous.y) < 3) {
      active.lastSeen = now;
      return false;
    }
    if (previous) active.distance += Math.hypot(x - previous.x, y - previous.y);
    active.points.push({ x, y, time: now });
    active.lastSeen = now;
    return true;
  }
  return {
    record,
    finish,
    remove(id) {
      if (active?.id === id) active = null;
      data.routes = data.routes.filter((route) => route.id !== id);
    },
  };
}
module.exports = { createRouteRecorder, mapIdentity };
