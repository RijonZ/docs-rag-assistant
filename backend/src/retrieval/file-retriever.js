import { pool } from '../db/client.js';

export async function searchFiles(query, limit = 12) {
  const cleanQuery = query.replace(/[^\w\sA-Za-z]/g, ' ').trim();

  const [ftsResult, likeResult] = await Promise.all([
    pool.query(
      `SELECT path, name, extension, size_bytes, modified_at, directory,
              ts_rank(
                to_tsvector('simple', name || ' ' || replace(replace(directory, '\\', ' '), '/', ' ') || ' ' || coalesce(content, '')),
                plainto_tsquery('simple', $1)
              ) AS score,
              ts_headline(
                'simple',
                coalesce(content, name),
                plainto_tsquery('simple', $1),
                'MaxWords=20, MinWords=5, StartSel=[[, StopSel=]]'
              ) AS snippet
       FROM file_index
       WHERE to_tsvector('simple', name || ' ' || replace(replace(directory, '\\', ' '), '/', ' ') || ' ' || coalesce(content, ''))
             @@ plainto_tsquery('simple', $1)
       ORDER BY score DESC LIMIT $2`,
      [cleanQuery, limit]
    ),
    pool.query(
      `SELECT path, name, extension, size_bytes, modified_at, directory, 0.3 AS score, NULL AS snippet
       FROM file_index WHERE lower(name) LIKE $1 LIMIT $2`,
      [`%${cleanQuery.toLowerCase().split(/\s+/).join('%')}%`, limit]
    ),
  ]);

  const seen = new Map();
  for (const row of [...ftsResult.rows, ...likeResult.rows]) {
    const existing = seen.get(row.path);
    if (!existing || row.score > existing.score) seen.set(row.path, row);
  }
  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
