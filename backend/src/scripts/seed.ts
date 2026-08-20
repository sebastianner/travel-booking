import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = readFileSync(join(__dirname, '../seed/seed.sql'), 'utf8');

  await pool.query(sql);
  console.log('seed applied');

  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
