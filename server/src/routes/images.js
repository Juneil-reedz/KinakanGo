const router = require('express').Router();
const pool   = require('../config/db');

// Serves images that are stored as base64 data URLs in the database as real,
// browser-cacheable binary responses, so JSON APIs can return a short URL
// instead of embedding hundreds of KB of base64 per row.
const SOURCES = {
  restaurants:  'SELECT image_url FROM restaurants WHERE id = $1',
  'menu-items': 'SELECT image_url FROM menu_items  WHERE id = $1',
  users:        'SELECT avatar_url AS image_url FROM users WHERE id = $1',
};

router.get('/:kind/:id', async (req, res) => {
  const sql = SOURCES[req.params.kind];
  const id  = parseInt(req.params.id);
  if (!sql || !id) return res.status(404).end();

  try {
    const { rows } = await pool.query(sql, [id]);
    const src = rows[0]?.image_url;
    if (!src) return res.status(404).end();

    // Allow the GitHub Pages frontend (a different origin) to embed the image
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');

    const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(src);
    if (!match) return res.redirect(src);

    const [, mime = 'application/octet-stream', isBase64, data] = match;
    const body = isBase64 ? Buffer.from(data, 'base64') : Buffer.from(decodeURIComponent(data));
    // URLs carry ?v=<updated_at>, so a changed image gets a new URL
    res.set('Cache-Control', 'public, max-age=604800, immutable');
    res.type(mime).send(body);
  } catch (err) {
    console.error('image error:', err);
    res.status(500).end();
  }
});

// Builds a SQL expression that yields the image URL as-is when it's a normal
// link, or a placeholder pointing at this route when it's an inline data URL.
// Run the query result through `resolveImageUrls` to make placeholders absolute.
const IMG_PREFIX = '@img/';
function imageUrlSql(table, kind, column = 'image_url') {
  return `CASE WHEN ${table}.${column} LIKE 'data:%'
            THEN '${IMG_PREFIX}${kind}/' || ${table}.id || '?v=' || EXTRACT(EPOCH FROM ${table}.updated_at)::bigint
            ELSE ${table}.${column} END`;
}

function resolveImageUrls(req, row, fields) {
  const base = `${req.protocol}://${req.get('host')}/api/images/`;
  for (const f of fields) {
    if (typeof row[f] === 'string' && row[f].startsWith(IMG_PREFIX)) {
      row[f] = base + row[f].slice(IMG_PREFIX.length);
    }
  }
  return row;
}

module.exports = router;
module.exports.imageUrlSql = imageUrlSql;
module.exports.resolveImageUrls = resolveImageUrls;
