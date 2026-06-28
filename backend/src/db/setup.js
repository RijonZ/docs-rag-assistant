import { pool } from './client.js';
import { config } from '../config.js';

export async function setupDatabase() {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id          SERIAL PRIMARY KEY,
        source_file TEXT NOT NULL,
        title       TEXT,
        chunk_index INTEGER NOT NULL,
        content     TEXT NOT NULL,
        embedding   vector(${config.embeddingDimension}),
        metadata    JSONB DEFAULT '{}',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Database ready');
  } finally {
    client.release();
  }
}

// Allow running directly: node src/db/setup.js
const isMain = process.argv[1]?.endsWith('setup.js');
if (isMain) {
  setupDatabase().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
