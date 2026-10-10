const GRID_SIZE = 146.25;

function worldPoint(x, y, map, worldSize) {
  const width = map.width - map.oceanMargin * 2;
  const height = map.height - map.oceanMargin * 2;
  const extent = worldSize > 0 ? worldSize : width;
  return {
    x: (map.oceanMargin + (x / extent) * width) / map.width,
    y: 1 - (map.oceanMargin + (y / extent) * height) / map.height,
  };
}
function worldPosition(x, y, map, worldSize) {
  const point = worldPoint(x, y, map, worldSize);
  return {
    left: `${Number((point.x * 100).toFixed(8))}%`,
    top: `${Number((point.y * 100).toFixed(8))}%`,
  };
}
function gridLetter(column) {
  let label = "";
  for (let value = column + 1; value > 0; value = Math.floor((value - 1) / 26))
    label = String.fromCharCode(65 + ((value - 1) % 26)) + label;
  return label;
}
function gridExtent(worldSize) {
  const remainder = worldSize % GRID_SIZE;
  return remainder < 120
    ? worldSize - remainder
    : worldSize + GRID_SIZE - remainder;
}
function gridLabel(x, y, worldSize) {
  const extent = gridExtent(worldSize);
  if (x < 0 || y < 0 || x >= extent || y >= extent) return "";
  return (
    gridLetter(Math.floor(x / GRID_SIZE)) +
    (Math.round(extent / GRID_SIZE) - 1 - Math.floor(y / GRID_SIZE))
  );
}
function clampView(view, viewport, image) {
  const scale = Math.min(image.maxScale || 8, Math.max(1, view.scale));
  const limitX = Math.max(0, (image.width * scale - viewport.width) / 2);
  const limitY = Math.max(0, (image.height * scale - viewport.height) / 2);
  return {
    scale,
    x: Math.max(-limitX, Math.min(limitX, view.x)),
    y: Math.max(-limitY, Math.min(limitY, view.y)),
  };
}
function zoomView(view, nextScale, point, viewport, image) {
  const scale = Math.min(image.maxScale || 8, Math.max(1, nextScale));
  const ratio = scale / view.scale;
  return clampView(
    {
      scale,
      x: point.x - (point.x - view.x) * ratio,
      y: point.y - (point.y - view.y) * ratio,
    },
    viewport,
    image,
  );
}
module.exports = {
  GRID_SIZE,
  worldPoint,
  worldPosition,
  gridLetter,
  gridExtent,
  gridLabel,
  clampView,
  zoomView,
};
