# Docs RAG Assistant

A customer support chatbot that answers questions from real documentation — with citations showing exactly which doc pages the answer came from, and honest "I don't know" responses when the answer isn't in the docs.

**Stack:** React + Vite + Tailwind · Node.js + Express · PostgreSQL + pgvector · OpenAI

---

## How it works

1. **Ingest** — Markdown docs are loaded, split into overlapping chunks, embedded with `text-embedding-3-small`, and stored in PostgreSQL with pgvector.
2. **Retrieve** — When a user asks a question, the query is embedded and the top 5 most similar chunks are fetched via cosine similarity search.
3. **Generate** — The chunks + question are sent to `gpt-4o-mini` with a strict system prompt: answer from the docs only, or say you don't know.
4. **Cite** — The response includes the source files for each retrieved chunk, shown as pills under the answer.

---

## Project structure

```
docs-rag-assistant/
├── docker-compose.yml        # PostgreSQL + pgvector
├── docs-sample/              # Sample docs (fictional Pulse API) — ready to ingest
├── backend/
│   ├── src/
│   │   ├── ingestion/        # loader, chunker, embedder
│   │   ├── retrieval/        # vector similarity search
│   │   ├── routes/           # /api/chat  /api/ingest
│   │   └── db/               # pg pool + schema setup
│   └── scripts/
│       └── ingest-docs.js    # CLI ingestion script
└── frontend/
    └── src/
        └── components/       # ChatWindow, MessageBubble, CitationsPanel, InputBar
```

---

## Setup

### Prerequisites

- Node.js 18+
- Docker Desktop

### 1. Clone and configure

```bash
git clone <repo-url>
cd docs-rag-assistant
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

### 2. Start the database

```bash
docker-compose up -d
```

This starts PostgreSQL 16 with the pgvector extension on port 5432.

### 3. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Ingest the sample docs

```bash
cd backend
npm run ingest -- ../docs-sample
```

This will:
- Create the `documents` table (if it doesn't exist)
- Load all `.md` files from `docs-sample/`
- Chunk, embed, and store them

You should see output like:

```
Found 4 files
Created 18 chunks
Generating embeddings...
  Embedded 18/18 chunks
Storing in database...
Done! Ingested 18 chunks from 4 files.
```

### 5. Start the backend

```bash
cd backend
npm run dev
# Backend running on http://localhost:3001
```

### 6. Start the frontend

```bash
cd frontend
npm run dev
# Local: http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) and start asking questions.

---

## Try these questions

The sample docs cover a fictional analytics SDK called "Pulse":

- *How do I install the SDK?*
- *What does the `flush` method do?*
- *How do I track which user performed an action?*
- *What happens if I call init multiple times?*
- *How do I make events stop appearing in my dashboard?* ← tests "I don't know" behavior

---

## Using real docs

To point the assistant at a real documentation set, clone or download the docs as markdown and run the ingestion script:

```bash
# Example: Vite docs
git clone --depth=1 https://github.com/vitejs/vite /tmp/vite
cd backend
npm run ingest -- /tmp/vite/docs
```

Any directory of `.md` or `.mdx` files works. Run with `--append` to add without clearing existing documents:

```bash
npm run ingest -- /path/to/more-docs --append
```

---

## Key design decisions

| Decision | Why |
|----------|-----|
| pgvector over a dedicated vector DB | One less service; hybrid keyword + vector search available in the same DB |
| `gpt-4o-mini` | Fast and cheap; upgrade to `gpt-4o` for harder questions |
| `temperature: 0.1` | Near-deterministic answers reduce hallucination |
| Chunk size ~800 chars | Small enough to be specific, large enough to have context |
| "I don't know" in system prompt | Explicitly instructs the model to refuse rather than guess |
