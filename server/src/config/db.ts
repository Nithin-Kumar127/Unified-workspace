// server/src/config/db.ts
import dns from 'node:dns';
import pkg from 'pg';
import dotenv from 'dotenv';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const { Pool } = pkg;
const dbUrl = process.env.DATABASE_URL || '';

// Detect local environment versus production cloud deployment
const isLocalDb = 
  dbUrl.includes('@postgres:') || 
  dbUrl.includes('localhost') || 
  dbUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: dbUrl,
  // Disable SSL for local Docker Postgres; set rejectUnauthorized to false for Supabase Cloud
  ssl: isLocalDb 
    ? false 
    : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export default pool;