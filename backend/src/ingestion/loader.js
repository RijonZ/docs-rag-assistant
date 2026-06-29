import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import matter from 'gray-matter';

export function loadMarkdownFiles(dirPath) {
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (['.md', '.mdx'].includes(extname(entry).toLowerCase())) {
        const raw = readFileSync(fullPath, 'utf-8');
        const { data: frontmatter, content } = matter(raw);
        files.push({
          path: relative(dirPath, fullPath).replace(/\\/g, '/'),
          content,
          frontmatter,
        });
      }
    }
  }

  walk(dirPath);
  return files;
}
