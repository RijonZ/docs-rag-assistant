import { Router } from 'express';
import OpenAI from 'openai';
import { retrieve } from '../retrieval/retriever.js';
import { config } from '../config.js';

const router = Router();
const openai = new OpenAI({ apiKey: config.openaiApiKey });

const SYSTEM_PROMPT = `You are a helpful documentation assistant. Answer questions based ONLY on the provided documentation context.

Rules:
- Use only the information in the provided documentation excerpts.
- If the answer is not found in the context, respond with exactly: "I couldn't find that in the documentation. Try rephrasing your question or checking the full docs."
- Be concise and accurate. Do not fabricate information.
- Do not use knowledge outside of the provided documentation.`;

router.post('/', async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const chunks = await retrieve(message);

    if (chunks.length === 0) {
      return res.json({
        answer: "I couldn't find that in the documentation. Try rephrasing your question or checking the full docs.",
        citations: [],
      });
    }

    const context = chunks
      .map((c, i) => `[Source ${i + 1} — ${c.source_file}]\n${c.content}`)
      .join('\n\n---\n\n');

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6),
      {
        role: 'user',
        content: `Documentation context:\n\n${context}\n\n---\n\nQuestion: ${message}`,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: config.chatModel,
      messages,
      temperature: 0.1,
      max_tokens: 1024,
    });

    const answer = completion.choices[0].message.content;

    // Deduplicate citations by source file
    const seen = new Set();
    const citations = chunks
      .filter(c => {
        if (seen.has(c.source_file)) return false;
        seen.add(c.source_file);
        return true;
      })
      .map(c => ({
        sourceFile: c.source_file,
        title: c.title || c.source_file,
        similarity: Math.round(c.similarity * 100),
      }));

    res.json({ answer, citations });
  } catch (err) {
    next(err);
  }
});

export default router;
