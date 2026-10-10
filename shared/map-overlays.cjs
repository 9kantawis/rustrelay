// Marching squares keeps density zones and height lines sharp at every zoom level.
function contourPath(values, side, threshold, smooth = true) {
  if (values.length !== side * side || side < 2) return "";
  const points = new Map(),
    links = new Map();
  const sample = (x, y) =>
    x < 0 || y < 0 || x >= side || y >= side
      ? threshold - 1
      : values[y * side + x];
  const cases = [
    [],
    [[3, 0]],
    [[0, 1]],
    [[3, 1]],
    [[1, 2]],
    [
      [3, 2],
      [0, 1],
    ],
    [[0, 2]],
    [[3, 2]],
    [[2, 3]],
    [[0, 2]],
    [
      [0, 3],
      [1, 2],
    ],
    [[1, 2]],
    [[1, 3]],
    [[0, 1]],
    [[0, 3]],
    [],
  ];
  for (let y = -1; y < side; y++)
    for (let x = -1; x < side; x++) {
      const v = [
        sample(x, y),
        sample(x + 1, y),
        sample(x + 1, y + 1),
        sample(x, y + 1),
      ];
      const mask = v.reduce(
        (bits, value, index) => bits | (value >= threshold ? 1 << index : 0),
        0,
      );
      if (!mask || mask === 15) continue;
      const corners = [
        [x, y],
        [x + 1, y],
        [x + 1, y + 1],
        [x, y + 1],
      ];
      const edges = [
        [0, 1],
        [1, 2],
        [3, 2],
        [0, 3],
      ];
      const ids = [
        "h:" + x + ":" + y,
        "v:" + (x + 1) + ":" + y,
        "h:" + x + ":" + (y + 1),
        "v:" + x + ":" + y,
      ];
      for (const pair of cases[mask]) {
        for (const edge of pair) {
          const id = ids[edge];
          if (!points.has(id)) {
            const [a, b] = edges[edge],
              ratio = (threshold - v[a]) / (v[b] - v[a]);
            points.set(id, [
              corners[a][0] + (corners[b][0] - corners[a][0]) * ratio + 0.5,
              corners[a][1] + (corners[b][1] - corners[a][1]) * ratio + 0.5,
            ]);
          }
        }
        const [a, b] = pair.map((edge) => ids[edge]);
        if (!links.has(a)) links.set(a, []);
        if (!links.has(b)) links.set(b, []);
        links.get(a).push(b);
        links.get(b).push(a);
      }
    }
  const visited = new Set();
  const paths = [];
  const format = (p) => p.map((v) => v.toFixed(2)).join(" ");
  for (const first of links.keys()) {
    if (visited.has(first)) continue;
    const line = [];
    let previous = null,
      current = first;
    while (current && !visited.has(current)) {
      visited.add(current);
      line.push(points.get(current));
      const next = links.get(current)?.find((id) => id !== previous);
      previous = current;
      current = next;
    }
    if (line.length < 4) continue;
    const simplified = simplifyLine(line, 0.4);
    if (simplified.length < 3) continue;
    if (smooth) {
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let d = "M" + format(mid(simplified.at(-1), simplified[0]));
      for (let i = 0; i < simplified.length; i++)
        d +=
          "Q" +
          format(simplified[i]) +
          " " +
          format(mid(simplified[i], simplified[(i + 1) % simplified.length]));
      paths.push(d + "Z");
    } else paths.push("M" + simplified.map(format).join("L") + "Z");
  }
  return paths.join("");
}
function simplifyLine(points, tolerance) {
  if (points.length < 3) return points.slice();
  const keep = new Set([0, points.length - 1]),
    stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop(),
      a = points[start],
      b = points[end];
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      length = dx * dx + dy * dy;
    let farthest = -1,
      distance = tolerance * tolerance;
    for (let i = start + 1; i < end; i++) {
      const p = points[i],
        t = length
          ? Math.max(
              0,
              Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length),
            )
          : 0;
      const d = (p[0] - a[0] - t * dx) ** 2 + (p[1] - a[1] - t * dy) ** 2;
      if (d > distance) {
        distance = d;
        farthest = i;
      }
    }
    if (farthest >= 0) {
      keep.add(farthest);
      stack.push([start, farthest], [farthest, end]);
    }
  }
  return [...keep].sort((a, b) => a - b).map((i) => points[i]);
}
function readElevation(bytes, side, x, y) {
  if (bytes.length !== side * side * 2 || x < 0 || y < 0 || x > 1 || y > 1)
    return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sx = x * (side - 1),
    sy = y * (side - 1),
    x0 = Math.floor(sx),
    y0 = Math.floor(sy),
    x1 = Math.min(side - 1, x0 + 1),
    y1 = Math.min(side - 1, y0 + 1),
    tx = sx - x0,
    ty = sy - y0;
  const get = (x, y) => view.getInt16((y * side + x) * 2, true) / 10;
  return (
    (get(x0, y0) * (1 - tx) + get(x1, y0) * tx) * (1 - ty) +
    (get(x0, y1) * (1 - tx) + get(x1, y1) * tx) * ty
  );
}
module.exports = { contourPath, readElevation, simplifyLine };
