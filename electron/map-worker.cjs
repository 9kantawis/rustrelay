const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const zlib = require("node:zlib");
const { parentPort, workerData } = require("node:worker_threads");
const { decodeWorld, makeHeatmaps } = require("./map-reader.cjs");

async function build() {
  const { info, mapFolders, cacheDirectory } = workerData;
  const mapName = String(info.map || "")
    .split(/[\\/]/)
    .pop()
    .replace(/\.map$/i, "");
  if (!mapName || !Number.isFinite(info.mapSize))
    return { status: "unavailable", heatmap: null };
  for (const folder of mapFolders) {
    let names;
    try {
      names = await fs.readdir(folder);
    } catch {
      continue;
    }
    const matches = names.filter(
      (name) =>
        name.endsWith(".map") &&
        (name === mapName + ".map" || name.startsWith(mapName + "_")),
    );
    const candidates = await Promise.all(
      matches.map(async (name) => {
        const file = path.join(folder, name);
        const stat = await fs.stat(file);
        return { file, stat };
      }),
    );
    candidates.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    for (const { file, stat } of candidates) {
      if (stat.size > 256 * 1024 * 1024 || stat.size < 12 || !stat.isFile())
        continue;
      const key = crypto
        .createHash("sha256")
        .update(`v2:${path.basename(file)}:${stat.size}:${stat.mtimeMs}`)
        .digest("hex");
      const cache =
        cacheDirectory && path.join(cacheDirectory, key + ".json.gz");
      if (cache) {
        try {
          if ((await fs.stat(cache)).size < 16 * 1024 * 1024) {
            const heatmap = JSON.parse(
              zlib.gunzipSync(await fs.readFile(cache), {
                maxOutputLength: 32 * 1024 * 1024,
              }),
            );
            if (
              heatmap.worldSize === info.mapSize &&
              heatmap.resolution === 768
            )
              return { status: "ready", heatmap };
          }
        } catch {
          /* Missing or outdated cache: read the world file again. */
        }
      }
      const world = decodeWorld(await fs.readFile(file));
      if (world.size !== info.mapSize) continue;
      const heatmap = makeHeatmaps(world);
      if (cache) {
        await fs.mkdir(cacheDirectory, { recursive: true });
        await fs.writeFile(cache, zlib.gzipSync(JSON.stringify(heatmap)));
      }
      return { status: "ready", heatmap };
    }
  }
  return { status: "unavailable", heatmap: null };
}
build()
  .then((result) => parentPort.postMessage(result))
  .catch(() => parentPort.postMessage({ status: "error", heatmap: null }));
