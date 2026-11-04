const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function insideRoundRect(px, py, x, y, w, h, r) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = Math.max(x + r, Math.min(px, x + w - r));
  const cy = Math.max(y + r, Math.min(py, y + h - r));
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

function makeAndroidIcon(size, mode) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const scale = size / 512;
  const pad = mode === 'foreground' ? 96 : 36;
  const innerScale = (512 - pad * 2) / 512;

  const rects = [
    {x: 76, y: 108, w: 168, h: 84, r: 16, c: [37, 99, 235]},
    {x: 268, y: 108, w: 168, h: 84, r: 16, c: [59, 130, 246]},
    {x: 76, y: 214, w: 96, h: 84, r: 16, c: [59, 130, 246]},
    {x: 196, y: 214, w: 144, h: 84, r: 16, c: [245, 158, 11]},
    {x: 364, y: 214, w: 72, h: 84, r: 16, c: [37, 99, 235]},
    {x: 76, y: 320, w: 168, h: 84, r: 16, c: [37, 99, 235]},
    {x: 268, y: 320, w: 168, h: 84, r: 16, c: [59, 130, 246]},
  ];

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    const uy = y / scale;
    for (let x = 0; x < size; x++) {
      const ux = x / scale;
      const off = rowStart + 1 + x * 4;

      if (mode === 'round') {
        const dx = ux - 256;
        const dy = uy - 256;
        if (dx * dx + dy * dy > 248 * 248) continue;
      } else if (mode === 'square') {
        if (!insideRoundRect(ux, uy, 8, 8, 496, 496, 96)) continue;
      }

      const tx = (ux - pad) / innerScale;
      const ty = (uy - pad) / innerScale;

      let hitColor = null;
      for (const rc of rects) {
        if (insideRoundRect(tx, ty, rc.x, rc.y, rc.w, rc.h, rc.r)) {
          hitColor = rc.c;
          break;
        }
      }

      if (mode === 'foreground' && !hitColor) continue;

      const color = hitColor || [15, 23, 42];
      raw[off] = color[0];
      raw[off + 1] = color[1];
      raw[off + 2] = color[2];
      raw[off + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = zlib.deflateSync(raw, {level: 9});
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const densities = [
  {dir: 'mipmap-mdpi', launcher: 48, fg: 108},
  {dir: 'mipmap-hdpi', launcher: 72, fg: 162},
  {dir: 'mipmap-xhdpi', launcher: 96, fg: 216},
  {dir: 'mipmap-xxhdpi', launcher: 144, fg: 324},
  {dir: 'mipmap-xxxhdpi', launcher: 192, fg: 432},
];

for (const d of densities) {
  const base = `android/app/src/main/res/${d.dir}`;
  fs.mkdirSync(base, {recursive: true});
  fs.writeFileSync(`${base}/ic_launcher.png`, makeAndroidIcon(d.launcher, 'square'));
  fs.writeFileSync(`${base}/ic_launcher_round.png`, makeAndroidIcon(d.launcher, 'round'));
  fs.writeFileSync(`${base}/ic_launcher_foreground.png`, makeAndroidIcon(d.fg, 'foreground'));
}

const bgXmlPath = 'android/app/src/main/res/values/ic_launcher_background.xml';
fs.mkdirSync('android/app/src/main/res/values', {recursive: true});
fs.writeFileSync(
  bgXmlPath,
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0F172A</color>\n</resources>\n'
);
console.log('Custom BannaSanj Android launcher icons generated.');
