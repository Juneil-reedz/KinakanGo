// Cuts the background out of a food photo so the dish "floats" in the app,
// with no plate, table or studio backdrop around it.
//
// Uses U^2-Net (u2netp, Apache-2.0, 4.5 MB) through onnxruntime-web's WebAssembly
// build, so nothing native has to compile on the host. The result is a WebP
// with transparency, cropped to the dish and kept small for the database.
const path  = require('path');
const sharp = require('sharp');

const MODEL = path.join(__dirname, '../../models/u2netp.onnx');
const SIZE  = 320;                 // u2netp input size
const MAX   = 720;                 // longest side of the saved cut-out
const MEAN  = [0.485, 0.456, 0.406];
const STD   = [0.229, 0.224, 0.225];

let sessionPromise = null;
async function session() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = require('onnxruntime-web');
      ort.env.wasm.numThreads = 1;
      return ort.InferenceSession.create(MODEL, { executionProviders: ['wasm'] });
    })().catch(err => { sessionPromise = null; throw err; });
  }
  return sessionPromise;
}

function parseDataUrl(src) {
  const m = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/s.exec(src || '');
  return m ? Buffer.from(m[2], 'base64') : null;
}

// True when the picture already has see-through areas (already cut out)
async function hasTransparency(img) {
  const { channels, isOpaque } = await img.clone().stats();
  return channels.length === 4 && !isOpaque;
}

// Returns a data URL of the cut-out, or null when the image can't or needn't be cut.
async function cutOutFood(dataUrl) {
  const input = parseDataUrl(dataUrl);
  if (!input) return null;
  const base = sharp(input, { failOn: 'none' }).rotate();
  if (await hasTransparency(base)) return null;

  const { data: rgb, info } = await base.clone()
    .resize(MAX, MAX, { fit: 'inside', withoutEnlargement: true })
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  // Model input: 320x320 RGB, normalised, channels first
  const small = await sharp(rgb, { raw: { width: w, height: h, channels: 3 } })
    .resize(SIZE, SIZE, { fit: 'fill' }).raw().toBuffer();
  const plane = SIZE * SIZE;
  const tensor = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) tensor[c * plane + i] = (small[i * 3 + c] / 255 - MEAN[c]) / STD[c];
  }
  const ort = require('onnxruntime-web');
  const sess = await session();
  const out = await sess.run({ [sess.inputNames[0]]: new ort.Tensor('float32', tensor, [1, 3, SIZE, SIZE]) });
  const pred = out[sess.outputNames[0]].data;

  // Stretch the mask to 0..255
  let lo = Infinity, hi = -Infinity;
  for (const v of pred) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const mask = Buffer.alloc(plane);
  for (let i = 0; i < plane; i++) mask[i] = Math.round(((pred[i] - lo) / (hi - lo || 1)) * 255);

  // Nothing found (blank mask) or the whole frame kept: leave the photo as it is
  let kept = 0;
  for (const v of mask) if (v > 128) kept++;
  if (kept < plane * 0.03 || kept > plane * 0.97) return null;

  const alpha = await sharp(mask, { raw: { width: SIZE, height: SIZE, channels: 1 } })
    .resize(w, h, { fit: 'fill', kernel: 'lanczos3' }).extractChannel(0).raw().toBuffer();
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = rgb[i * 3]; rgba[i * 4 + 1] = rgb[i * 3 + 1]; rgba[i * 4 + 2] = rgb[i * 3 + 2];
    rgba[i * 4 + 3] = alpha[i] < 12 ? 0 : alpha[i];
  }
  // Crop to the dish with a little breathing room, then save as WebP
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (rgba[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const pad = Math.round(Math.max(cw, ch) * 0.04);
  const webp = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: x0, top: y0, width: cw, height: ch })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 82, alphaQuality: 90 }).toBuffer();
  return `data:image/webp;base64,${webp.toString('base64')}`;
}

module.exports = { cutOutFood };
