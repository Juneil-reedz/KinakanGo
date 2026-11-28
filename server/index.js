require('dotenv').config();
// Prefer IPv4: on some hosts the IPv6 route to outside services (email, push)
// hangs on the first connection after the server starts
require('dns').setDefaultResultOrder('ipv4first');
const app  = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    const client = await pool.connect();
    client.release();
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
