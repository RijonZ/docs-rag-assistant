import { pool } from './client.js';

export async function setupFilesTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS file_index (
        id          SERIAL PRIMARY KEY,
        path        TEXT NOT NULL,
        name        TEXT NOT NULL,
        extension   TEXT,
        size_bytes  BIGINT,
        modified_at TIMESTAMPTZ,
        directory   TEXT NOT NULL,
        content     TEXT,
        indexed_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(path)
      )
    `);

    // Add content column to existing tables that don't have it yet
    await client.query(`
      ALTER TABLE file_index ADD COLUMN IF NOT EXISTS content TEXT
    `);

    // GIN index over name + directory + content for full-text search
    await client.query(`
      CREATE INDEX IF NOT EXISTS file_index_search_idx
      ON file_index USING gin(
        to_tsvector('simple',
          name || ' ' ||
          replace(replace(directory, '\\', ' '), '/', ' ') || ' ' ||
          coalesce(content, '')
        )
      )
    `);

    // Fast prefix match on name
    await client.query(`
      CREATE INDEX IF NOT EXISTS file_index_name_lower_idx
      ON file_index (lower(name))
    `);

    console.log('file_index table ready');
  } finally {
    client.release();
  }
}
