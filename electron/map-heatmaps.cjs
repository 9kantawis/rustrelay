const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { Worker } = require("node:worker_threads");
const run = promisify(execFile);

async function steamMapFolders() {
  const roots = new Set([
    path.join(
      process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
      "Steam",
    ),
    path.join(os.homedir(), "Steam"),
  ]);
  if (process.platform === "win32") {
    try {
      const { stdout } = await run(
        "reg.exe",
        ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"],
        { windowsHide: true, timeout: 3000 },
      );
      const steam = /SteamPath\s+REG_SZ\s+(.+)/i.exec(stdout)?.[1]?.trim();
      if (steam) roots.add(steam);
    } catch {
      /* Steam may be installed without a registry entry. */
    }
  }
  for (const root of [...roots]) {
    try {
      const file = path.join(root, "steamapps", "libraryfolders.vdf");
      if ((await fs.stat(file)).size > 1024 * 1024) continue;
      const libraries = await fs.readFile(file, "utf8");
      for (const match of libraries.matchAll(/"path"\s+"([^"\r\n]+)"/g))
        roots.add(match[1].replaceAll("\\\\", "\\"));
    } catch {
      /* Try the next installed library. */
    }
  }
  return [...roots].map((root) =>
    path.join(root, "steamapps", "common", "Rust", "maps"),
  );
}

function createHeatmapLoader({ cacheDirectory, folders = steamMapFolders }) {
  return async (info) => {
    const mapFolders = await folders();
    return new Promise((resolve) => {
      const worker = new Worker(path.join(__dirname, "map-worker.cjs"), {
        workerData: {
          info: { map: info.map, mapSize: info.mapSize, seed: info.seed },
          mapFolders,
          cacheDirectory,
        },
      });
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(result);
        worker.terminate();
      };
      const timeout = setTimeout(
        () => finish({ status: "error", heatmap: null }),
        30000,
      );
      worker.once("message", finish);
      worker.once("error", () => finish({ status: "error", heatmap: null }));
      worker.once("exit", () => finish({ status: "error", heatmap: null }));
    });
  };
}
module.exports = { createHeatmapLoader, steamMapFolders };
