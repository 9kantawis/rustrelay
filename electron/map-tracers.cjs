const Jimp = require("jimp");

// The bot only needs stroked lines from GraphicsMagick. Render those directly.
module.exports = function mapTracers(file) {
  const lines = [];
  let color = "#ffffff";
  let width = 2;
  return {
    stroke(value, thickness = 2) {
      color = value;
      width = thickness;
      return this;
    },
    drawLine(x1, y1, x2, y2) {
      lines.push({ x1, y1, x2, y2, color, width });
      return this;
    },
    write(target, callback) {
      Jimp.read(file)
        .then(async (image) => {
          for (const line of lines) {
            const dx = line.x2 - line.x1,
              dy = line.y2 - line.y1;
            const steps = Math.min(
              20000,
              Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))),
            );
            if (!Number.isFinite(steps)) continue;
            const rgba = Jimp.cssColorToHex(line.color);
            const radius = Math.min(8, Math.max(0, Math.floor(line.width / 2)));
            for (let step = 0; step <= steps; step++) {
              const x = Math.round(line.x1 + (dx * step) / (steps || 1)),
                y = Math.round(line.y1 + (dy * step) / (steps || 1));
              for (let px = x - radius; px <= x + radius; px++)
                for (let py = y - radius; py <= y + radius; py++) {
                  if (
                    px >= 0 &&
                    py >= 0 &&
                    px < image.bitmap.width &&
                    py < image.bitmap.height
                  )
                    image.setPixelColor(rgba, px, py);
                }
            }
          }
          await image.writeAsync(target);
        })
        .then(() => callback(null), callback);
    },
  };
};
