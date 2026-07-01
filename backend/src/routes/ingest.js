import { Router } from 'express';
import { resolve } from 'path';
import { loadMarkdownFiles } from '../ingestion/loader.js';
import { chunkDocument } from '../ingestion/chunker.js';
import { embedChunks } from '../ingestion/embedder.js';
import { pool } from '../db/client.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { docsPath, clear = true } = req.body;
    if (!docsPath) return res.status(400).json({ error: 'docsPath is required' });

    const absolutePath = resolve(docsPath);
    const files = loadMarkdownFiles(absolutePath);

    if (files.length === 0) {
      return res.status(400).json({ error: 'No markdown files found at that path' });
    }

    const allChunks = files.flatMap(f => chunkDocument(f));
    const embeddings = await embedChunks(allChunks);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (clear) await client.query('DELETE FROM documents');
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
    }

    res.json({ files: files.length, chunks: allChunks.length });
  } catch (err) {
    next(err);
  }
});

export default router;
