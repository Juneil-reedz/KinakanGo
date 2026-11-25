const pool = require('../config/db');

// Restaurant names must be unique. "Kape Tawi", "kape-tawi" and "KAPE TAWI" all
// count as the same name, the same way messages find a restaurant by name.
const norm = (v) => `regexp_replace(lower(${v}), '[^a-z0-9]', '', 'g')`;

async function restaurantNameTaken(name, { exceptId = null, db = pool } = {}) {
  const clean = String(name || '').trim();
  if (!clean) return false;
  const { rows } = await db.query(
    `SELECT 1 FROM restaurants WHERE ${norm('name')} = ${norm('$1')} AND ($2::int IS NULL OR id <> $2) LIMIT 1`,
    [clean, exceptId]
  );
  return rows.length > 0;
}

const nameTakenMessage = (name) => `A restaurant named "${String(name).trim()}" already exists. Please choose a different name.`;

module.exports = { restaurantNameTaken, nameTakenMessage };
