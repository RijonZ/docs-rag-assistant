import { pool } from '../db/client.js';
import { embedQuery } from '../ingestion/embedder.js';
import { config } from '../config.js';

export async function retrieve(query) {
  const embedding = await embedQuery(query);
  const vectorStr = `[${embedding.join(',')}]`;

  const result = await pool.query(
    `SELECT id, source_file, title, content, metadata,
            1 - (embedding <=> $1::vector) AS similarity
     FROM documents
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vectorStr, config.topK]
  );

  return result.rows;
}
