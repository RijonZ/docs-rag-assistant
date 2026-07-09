import { readdirSync, lstatSync, readFileSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { setupFilesTable } from '../src/db/setup-files.js';
import { pool } from '../src/db/client.js';

const SKIP_NAMES = new Set([
  'windows', 'winsxs', 'system32', 'syswow64',
  'program files', 'program files (x86)', 'programdata',
  '$recycle.bin', 'system volume information', 'recovery',
  'node_modules', '.git', 'dist', 'build', '.next', 'temp', 'tmp', 'cache',
]);

const SKIP_APPDATA = new Set(['local', 'locallow']);

const TEXT_EXTS = new Set([
  '.txt', '.md', '.log', '.csv', '.json', '.xml', '.yaml', '.yml',
  '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.go',
  '.html', '.css', '.sh', '.bat', '.ps1', '.ini', '.cfg', '.toml',
]);

function sanitize(str) {
  return str.replace(/\0/g, '').replace(/[\x01-\x08\x0b\x0c\x0e-\x1f]/g, ' ');
}

async function readContent(filePath, ext, sizeByes) {
  try {
    if (ext === '.pdf') {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const buf = readFileSync(filePath);
      const data = await pdfParse(buf);
      return sanitize(data.text).slice(0, 100_000);
    }
    if (ext === '.docx') {
      const { default: mammoth } = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return sanitize(result.value).slice(0, 100_000);
    }
    if (ext === '.xlsx' || ext === '.xls') {
      const { default: xlsxLib } = await import('xlsx');
      const wb = xlsxLib.readFile(filePath);
      const text = wb.SheetNames
        .map(n => xlsxLib.utils.sheet_to_csv(wb.Sheets[n]))
        .join('\n');
      return sanitize(text).slice(0, 100_000);
    }
    if (TEXT_EXTS.has(ext) && sizeByes <= 2 * 1024 * 1024) {
      const raw = readFileSync(filePath, 'utf8');
      return sanitize(raw).slice(0, 100_000);
    }
  } catch {
    // unreadable file — skip content silently
  }
  return null;
}

function shouldSkip(fullPath, name) {
  const lower = name.toLowerCase();
  if (lower.startsWith('$') || lower.startsWith('.')) return true;
  if (SKIP_NAMES.has(lower)) return true;
  if (basename(dirname(fullPath)).toLowerCase() === 'appdata' && SKIP_APPDATA.has(lower)) return true;
  return false;
}

function collectFiles(roots) {
  const files = [];
  const queue = [...roots];
  let scanned = 0;
  while (queue.length > 0) {
    const dir = queue.shift();
    let entries;
    try { entries = readdirSync(dir); } catch { continue; }
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      let stat;
      try { stat = lstatSync(fullPath); } catch { continue; }
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) {
        if (!shouldSkip(fullPath, entry)) queue.push(fullPath);
      } else if (stat.isFile() && stat.size <= 500 * 1024 * 1024) {
        files.push({
          path: fullPath,
          name: basename(fullPath),
          extension: extname(fullPath).toLowerCase() || null,
          size_bytes: stat.size,
          modified_at: stat.mtime.toISOString(),
          directory: dirname(fullPath),
        });
        scanned++;
        if (scanned % 5000 === 0) process.stdout.write(`\r  Scanned ${scanned.toLocaleString()} files...`);
      }
    }
  }
  return files;
}

async function indexFiles(roots) {
  await setupFilesTable();
  console.log('\nScanning file system...');
  const files = collectFiles(roots);
  process.stdout.write(`\r  Found ${files.length.toLocaleString()} files        \n\n`);
  if (files.length === 0) { console.error('No files found.'); process.exit(1); }

  const batchSize = 200;
  const client = await pool.connect();
  try {
    let inserted = 0;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const enriched = await Promise.all(
        batch.map(async f => ({
          ...f,
          content: await readContent(f.path, f.extension, f.size_bytes),
        }))
      );
      const values = [];
      const params = [];
      let p = 1;
      for (const f of enriched) {
        values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
        params.push(f.path, f.name, f.extension, f.size_bytes, f.modified_at, f.directory, f.content);
      }
      await client.query(
        `INSERT INTO file_index (path, name, extension, size_bytes, modified_at, directory, content)
         VALUES ${values.join(',')}
         ON CONFLICT (path) DO UPDATE SET
           name = EXCLUDED.name, extension = EXCLUDED.extension,
           size_bytes = EXCLUDED.size_bytes, modified_at = EXCLUDED.modified_at,
           directory = EXCLUDED.directory, content = EXCLUDED.content, indexed_at = NOW()`,
        params
      );
      inserted += batch.length;
      process.stdout.write(`\r  Indexed ${inserted.toLocaleString()} / ${files.length.toLocaleString()}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
  console.log(`\n\nDone! Indexed ${files.length.toLocaleString()} files.`);
}

const roots = process.argv.slice(2);
if (roots.length === 0) {
  const home = process.env.USERPROFILE || process.env.HOME;
  if (!home) { console.error('Pass a path: node scripts/index-files.js "C:\\Users\\YourName"'); process.exit(1); }
  roots.push(home);
  console.log(`Defaulting to ${home}`);
}

indexFiles(roots).catch(err => { console.error(err); process.exit(1); });
