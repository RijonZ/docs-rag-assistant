import { config } from '../config.js';

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : null;
}

function splitBySize(text, maxSize, overlap) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxSize;

    if (end < text.length) {
      // Prefer breaking at a paragraph boundary
      const paraBreak = text.lastIndexOf('\n\n', end);
      if (paraBreak > start + maxSize / 2) end = paraBreak;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

export function chunkDocument(file) {
  const { path: filePath, content, frontmatter } = file;

  const docTitle = frontmatter?.title || extractTitle(content) || filePath;

  // Split on top-level and second-level headings
  const sections = content.split(/(?=^#{1,2}\s)/m).filter(s => s.trim().length > 50);

  const chunks = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionTitle = extractTitle(section);

    if (section.length <= config.chunkSize) {
      chunks.push({
        sourceFile: filePath,
        title: docTitle,
        chunkIndex: chunkIndex++,
        content: section.trim(),
        metadata: { section: sectionTitle },
      });
    } else {
      for (const sub of splitBySize(section, config.chunkSize, config.chunkOverlap)) {
        chunks.push({
          sourceFile: filePath,
          title: docTitle,
          chunkIndex: chunkIndex++,
          content: sub,
          metadata: { section: sectionTitle },
        });
      }
    }
  }

  return chunks;
}
