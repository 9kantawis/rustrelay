const protobuf = require("protobufjs");
const rules = require("./map-data/spawn-rules.json");
const worldType = protobuf
  .parse(
    `syntax = "proto2";
message Vector { optional float x = 1; optional float y = 2; optional float z = 3; }
message Layer { optional string name = 1; optional bytes data = 2; }
message Prefab { optional string category = 1; optional uint32 id = 2; optional Vector position = 3; }
message World { optional uint32 size = 1; repeated Layer maps = 2; repeated Prefab prefabs = 3; }
`,
  )
  .root.lookupType("World");
const MAX_BYTES = 512 * 1024 * 1024;

function decodeBlock(input, size) {
  if (size < 0 || size > 16 * 1024 * 1024)
    throw Error("Invalid map block size");
  const output = Buffer.allocUnsafe(size);
  let source = 0,
    target = 0;
  function length(initial) {
    let result = initial;
    if (initial === 15) {
      let extra;
      do {
        if (source >= input.length) throw Error("Truncated map block");
        extra = input[source++];
        result += extra;
      } while (extra === 255);
    }
    return result;
  }
  while (source < input.length) {
    const token = input[source++];
    const literal = length(token >>> 4);
    if (source + literal > input.length || target + literal > size)
      throw Error("Invalid map literals");
    input.copy(output, target, source, source + literal);
    source += literal;
    target += literal;
    if (source === input.length) break;
    if (source + 2 > input.length) throw Error("Truncated map offset");
    const offset = input.readUInt16LE(source);
    source += 2;
    const match = length(token & 15) + 4;
    if (offset === 0 || offset > target || target + match > size)
      throw Error("Invalid map match");
    for (let index = 0; index < match; index++)
      output[target + index] = output[target + index - offset];
    target += match;
  }
  if (target !== size) throw Error("Incomplete map block");
  return output;
}
function decodeWorld(file) {
  if (file.length < 12 || file.length > MAX_BYTES)
    throw Error("Invalid world file");
  const version = file.readUInt32LE();
  if (version < 9 || version > 11) throw Error("Unsupported world version");
  let offset = version >= 10 ? 12 : 4;
  const blocks = [];
  let total = 0;
  function readLength() {
    let value = 0,
      factor = 1;
    for (let index = 0; index < 5 && offset < file.length; index++) {
      const byte = file[offset++];
      value += (byte & 127) * factor;
      if (!(byte & 128)) return value;
      factor *= 128;
    }
    throw Error("Invalid world chunk header");
  }
  while (offset < file.length) {
    const flags = readLength();
    const size = readLength();
    const stored = flags & 1 ? readLength() : size;
    total += size;
    if (
      flags >> 2 ||
      size > 16 * 1024 * 1024 ||
      stored > size ||
      total > MAX_BYTES ||
      offset + stored > file.length ||
      blocks.length >= 4096
    )
      throw Error("Invalid world chunk");
    const bytes = file.subarray(offset, offset + stored);
    blocks.push(flags & 1 ? decodeBlock(bytes, size) : bytes);
    offset += stored;
  }
  const world = worldType.decode(Buffer.concat(blocks, total));
  if (world.size < 500 || world.size > 10000) throw Error("Invalid world size");
  return world;
}
function makeHeatmaps(world, resolution = 768) {
  const layers = Object.fromEntries(
    world.maps.map((layer) => [layer.name, Buffer.from(layer.data)]),
  );
  const topology = layers.topology;
  if (!topology || !layers.biome || !layers.splat)
    throw Error("Missing terrain layers");
  const side = Math.sqrt(topology.length / 4);
  const pixels = side * side;
  const biomes = layers.biome.length / pixels;
  const splats = layers.splat.length / pixels;
  if (
    !Number.isInteger(side) ||
    !Number.isInteger(biomes) ||
    biomes > 5 ||
    biomes < 4 ||
    splats !== 8
  )
    throw Error("Invalid terrain layers");
  const fields = {};
  for (const rule of rules.rules) {
    const values = Buffer.alloc(resolution * resolution);
    for (let row = 0; row < resolution; row++) {
      const y = (row + 0.5) / resolution;
      const z = Math.min(side - 1, Math.floor(y * side));
      const sy = y * (side - 1),
        y0 = Math.floor(sy),
        y1 = Math.min(side - 1, y0 + 1),
        ty = sy - y0;
      for (let column = 0; column < resolution; column++) {
        const x = (column + 0.5) / resolution;
        const cell = z * side + Math.min(side - 1, Math.floor(x * side));
        const topo = topology.readUInt32LE(cell * 4);
        if (rule.topology_any !== 0xffffffff && !(topo & rule.topology_any))
          continue;
        if (
          rule.topology_all !== 0xffffffff &&
          (topo & rule.topology_all) >>> 0 !== rule.topology_all
        )
          continue;
        if (topo & rule.topology_not) continue;
        let biome = 0,
          weight = -1;
        for (let channel = 0; channel < biomes; channel++) {
          const current = layers.biome[channel * pixels + cell];
          if (current >= weight) {
            biome = channel;
            weight = current;
          }
        }
        if (rule.biome_mask !== -1 && !(rule.biome_mask & (1 << biome)))
          continue;
        let factor = 1;
        if (rule.splat_mask !== -1) {
          factor = 0;
          const sx = x * (side - 1),
            x0 = Math.floor(sx),
            x1 = Math.min(side - 1, x0 + 1),
            tx = sx - x0;
          for (let channel = 0; channel < 8; channel++) {
            if (!(rule.splat_mask & (1 << channel))) continue;
            const base = channel * pixels;
            const a = layers.splat[base + y0 * side + x0],
              b = layers.splat[base + y0 * side + x1];
            const c = layers.splat[base + y1 * side + x0],
              d = layers.splat[base + y1 * side + x1];
            factor +=
              ((a * (1 - tx) + b * tx) * (1 - ty) +
                (c * (1 - tx) + d * tx) * ty) /
              255;
          }
          factor = Math.min(1, factor);
        }
        if (factor > rule.filter_cutoff)
          values[(resolution - row - 1) * resolution + column] = Math.floor(
            factor * 255,
          );
      }
    }
    fields[rule.asset_path] = values;
  }
  const categories = {};
  for (const [name, paths] of Object.entries(rules.categories)) {
    const result = Buffer.alloc(resolution * resolution);
    for (const rulePath of paths) {
      const values = fields[rulePath];
      if (!values) continue;
      for (let index = 0; index < result.length; index++)
        result[index] = Math.max(result[index], values[index]);
    }
    categories[name] = result.toString("base64");
  }
  return {
    resolution,
    worldSize: world.size,
    categories,
    elevation: makeElevation(world),
  };
}
function makeElevation(world, resolution = 512) {
  const layer =
    world.maps.find((map) => map.name === "height") ||
    world.maps.find((map) => map.name === "terrain");
  if (!layer) return undefined;
  const source = Buffer.from(layer.data);
  const side = Math.sqrt(source.length / 2);
  if (!Number.isInteger(side) || side < 2) throw Error("Invalid height layer");
  const values = Buffer.alloc(resolution * resolution * 2);
  let min = Infinity,
    max = -Infinity;
  const height = (x, y) =>
    (source.readInt16LE((y * side + x) * 2) / 32766) * 1000 - 500;
  for (let row = 0; row < resolution; row++) {
    const sy = (row / (resolution - 1)) * (side - 1),
      y0 = Math.floor(sy),
      y1 = Math.min(side - 1, y0 + 1),
      ty = sy - y0;
    for (let column = 0; column < resolution; column++) {
      const sx = (column / (resolution - 1)) * (side - 1),
        x0 = Math.floor(sx),
        x1 = Math.min(side - 1, x0 + 1),
        tx = sx - x0;
      const meters =
        (height(x0, y0) * (1 - tx) + height(x1, y0) * tx) * (1 - ty) +
        (height(x0, y1) * (1 - tx) + height(x1, y1) * tx) * ty;
      const value = Math.round(meters * 10);
      values.writeInt16LE(
        value,
        ((resolution - row - 1) * resolution + column) * 2,
      );
      min = Math.min(min, meters);
      max = Math.max(max, meters);
    }
  }
  return {
    resolution,
    values: values.toString("base64"),
    min: Math.floor(min),
    max: Math.ceil(max),
  };
}
module.exports = { decodeBlock, decodeWorld, makeHeatmaps, makeElevation };
