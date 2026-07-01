import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { setupDatabase } from './db/setup.js';
import chatRouter from './routes/chat.js';
import ingestRouter from './routes/ingest.js';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/chat', chatRouter);
app.use('/api/ingest', ingestRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  await setupDatabase();
  app.listen(config.port, () =>
    console.log(`Backend running on http://localhost:${config.port}`)
  );
}

start().catch(err => { console.error(err); process.exit(1); });
