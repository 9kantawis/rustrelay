function createStateUpdates() {
  let previousMap, previousHeatmap;
  let routes = new Map();
  return (state) => {
    const update = { ...state };
    if (state.map === previousMap) delete update.map;
    if (state.heatmap === previousHeatmap) delete update.heatmap;
    previousMap = state.map;
    previousHeatmap = state.heatmap;
    const next = new Map();
    const upsert = [];
    for (const route of state.routes) {
      const key = [route.points.length, route.ended, route.distance].join(":");
      next.set(route.id, key);
      if (routes.get(route.id) !== key) upsert.push(route);
    }
    const removed = [...routes.keys()].filter((id) => !next.has(id));
    routes = next;
    delete update.routes;
    if (upsert.length || removed.length)
      update.routeChanges = { upsert, removed };
    return update;
  };
}
function mergeState(current, update) {
  const { routeChanges, ...fields } = update;
  const result = { ...current, ...fields };
  if (routeChanges) {
    const replacements = new Map(
      routeChanges.upsert.map((route) => [route.id, route]),
    );
    const removed = new Set(routeChanges.removed);
    result.routes = current.routes
      .filter((route) => !removed.has(route.id))
      .map((route) => {
        const changed = replacements.get(route.id);
        replacements.delete(route.id);
        return changed || route;
      })
      .concat([...replacements.values()]);
  }
  return result;
}
module.exports = { createStateUpdates, mergeState };
