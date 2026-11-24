// Uploaded pictures arrive as data URLs (or, rarely, links). Only real PNG, JPEG,
// WebP or GIF pictures are accepted, so nobody can store a web page or a script
// as their "photo" and have the API serve it.
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB decoded

const SIGNATURES = {
  'image/png':  (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/jpeg': (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) => b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP',
  'image/gif':  (b) => b.length > 6 && b.toString('latin1', 0, 4) === 'GIF8',
};

// Returns an error message, or null when the value is fine (empty counts as fine:
// callers decide whether a picture is required).
function imageError(value, label = 'Picture', maxBytes = MAX_BYTES) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return `${label} must be a picture`;
  if (/^https:\/\/[^\s"'<>]+$/i.test(value) && value.length <= 2000) return null;
  const m = /^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i.exec(value);
  if (!m) return `${label} must be a PNG, JPG, WebP or GIF picture`;
  const mime = m[1].toLowerCase().replace('jpg', 'jpeg');
  const bytes = Buffer.from(m[2], 'base64');
  if (bytes.length > maxBytes) return `${label} is too big (max ${Math.round(maxBytes / 1024 / 1024)} MB)`;
  if (!SIGNATURES[mime](bytes)) return `${label} is not a valid ${mime.split('/')[1].toUpperCase()} picture`;
  return null;
}

// The first error among several { label: value } pairs, or null
function firstImageError(fields) {
  for (const [label, value] of Object.entries(fields)) {
    const err = imageError(value, label);
    if (err) return err;
  }
  return null;
}

// Edit forms send back the picture they were shown, which is a link to our own
// /api/images/... route. Saving that would point the picture at itself, so it
// means "unchanged".
const isOwnImageLink = (v) => typeof v === 'string' && /\/api\/images\/(restaurants|menu-items|users)\/\d+/.test(v);
const unlessOwn = (v) => (isOwnImageLink(v) ? undefined : v);

module.exports = { imageError, firstImageError, unlessOwn, MAX_BYTES };
