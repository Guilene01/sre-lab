const { Pool } = require("pg");

// pg reads PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD from the environment
// automatically -- those come from the ecommerce-db-credentials Secret,
// which scripts/setup.sh populates from Terraform's RDS outputs.
// RDS's default parameter group enforces SSL (rds.force_ssl=1); rejectUnauthorized
// is off since we don't bundle the RDS CA bundle into the image for this lab.
const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

async function checkConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

module.exports = { pool, checkConnection };
