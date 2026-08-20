import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import Redis from 'ioredis';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = readFileSync(join(__dirname, '../seed/reset.sql'), 'utf8');

  await pool.query(sql);
  await pool.end();

  const redis = new Redis(process.env.REDIS_URL!);
  await redis.del('packages:listing', 'packages:listing:lock');
  await redis.quit();

  console.log('demo data reset');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
