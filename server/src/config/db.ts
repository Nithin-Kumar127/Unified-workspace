// server/src/config/db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a new PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Successfully connected to PostgreSQL Database');
    if (client) release();
  }
});

export default pool;