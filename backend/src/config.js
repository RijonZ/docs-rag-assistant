import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rag_assistant',
  openaiApiKey: process.env.OPENAI_API_KEY,
  embeddingModel: 'text-embedding-3-small',
  embeddingDimension: 1536,
  chatModel: 'gpt-4o-mini',
  topK: 5,
  chunkSize: 800,
  chunkOverlap: 100,
};
