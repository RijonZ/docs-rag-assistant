import { resolve } from 'path';
import { loadMarkdownFiles } from '../src/ingestion/loader.js';
import { chunkDocument } from '../src/ingestion/chunker.js';
import { embedChunks } from '../src/ingestion/embedder.js';
import { pool } from '../src/db/client.js';
import { setupDatabase } from '../src/db/setup.js';

const docsPath = process.argv[2];
const shouldClear = !process.argv.includes('--append');

if (!docsPath) {
  console.error('Usage: node scripts/ingest-docs.js <path-to-docs> [--append]');
  console.error('  --append  Add to existing documents instead of replacing them');
  process.exit(1);
}

const absolutePath = resolve(process.cwd(), docsPath);

async function ingest() {
  await setupDatabase();

  console.log(`\nLoading docs from: ${absolutePath}`);
  const files = loadMarkdownFiles(absolutePath);
  if (files.length === 0) {
    console.error('No markdown files found.');
    process.exit(1);
  }
  console.log(`Found ${files.length} files`);

  const allChunks = files.flatMap(f => chunkDocument(f));
  console.log(`Created ${allChunks.length} chunks\n`);

  console.log('Generating embeddings...');
  const embeddings = await embedChunks(allChunks);

  console.log('\nStoring in database...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (shouldClear) {
      await client.query('DELETE FROM documents');
      console.log('Cleared existing documents');
    }
    for (let i = 0; i < allChunks.length; i++) {
      const c = allChunks[i];
      await client.query(
        `INSERT INTO documents (source_file, title, chunk_index, content, embedding, metadata)
         VALUES ($1, $2, $3, $4, $5::vector, $6)`,
        [c.sourceFile, c.title, c.chunkIndex, c.content, `[${embeddings[i].join(',')}]`, JSON.stringify(c.metadata)]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`\nDone! Ingested ${allChunks.length} chunks from ${files.length} files.`);
}

ingest().catch(err => { console.error(err); process.exit(1); });
