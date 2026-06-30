import OpenAI from 'openai';
import { config } from '../config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function embedChunks(chunks) {
  const texts = chunks.map(c => c.content);
  const batchSize = 100;
  const embeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: config.embeddingModel,
      input: batch,
    });
    embeddings.push(...response.data.map(d => d.embedding));
    console.log(`  Embedded ${Math.min(i + batchSize, texts.length)}/${texts.length} chunks`);
  }

  return embeddings;
}

export async function embedQuery(query) {
  const response = await openai.embeddings.create({
    model: config.embeddingModel,
    input: query,
  });
  return response.data[0].embedding;
}
