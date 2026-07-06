import { Router } from 'express';
import { searchFiles } from '../retrieval/file-retriever.js';

const router = Router();

router.post('/search', async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) return res.status(400).json({ error: 'query is required' });

    const results = await searchFiles(query, 12);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

export default router;
