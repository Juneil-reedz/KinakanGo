require('dotenv').config();
const app  = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('MySQL connected');
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
