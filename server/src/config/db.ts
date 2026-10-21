// server/src/config/db.ts
import dns from 'node:dns';
import pkg from 'pg';
import dotenv from 'dotenv';

// Force IPv4 DNS lookups first to avoid Docker IPv6 network lookup delays
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const { Pool } = pkg;

const dbUrl = process.env.DATABASE_URL || '';

// Dynamically check if the connection is pointing to local Docker / localhost
const isLocalDb = 
  dbUrl.includes('@postgres:') || 
  dbUrl.includes('localhost') || 
  dbUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: dbUrl,
  // Local Docker PostgreSQL does not support SSL; Supabase Cloud requires it.
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
  // PgBouncer pooler mode configuration
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export default pool;