import { useState } from 'react';

const EXT_ICONS = {
  '.pdf': '📄', '.doc': '📝', '.docx': '📝',
  '.xls': '📊', '.xlsx': '📊', '.csv': '📊',
  '.ppt': '📋', '.pptx': '📋',
  '.txt': '📃', '.md': '📃', '.log': '📃',
  '.jpg': '🖼', '.jpeg': '🖼', '.png': '🖼', '.gif': '🖼', '.webp': '🖼', '.svg': '🖼',
  '.mp4': '🎬', '.mov': '🎬', '.avi': '🎬',
  '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵',
  '.zip': '🗜', '.rar': '🗜', '.7z': '🗜',
  '.js': '💻', '.ts': '💻', '.jsx': '💻', '.tsx': '💻',
  '.py': '🐍', '.java': '☕', '.cs': '💻', '.go': '💻',
  '.json': '📋', '.xml': '📋', '.yaml': '📋', '.yml': '📋',
  '.exe': '⚙️', '.dll': '⚙️',
};

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Render snippet: wrap [[word]] in <mark> for highlight
function Snippet({ text }) {
  if (!text) return null;
  const parts = text.split(/(\[\[.*?\]\])/g);
  return (
    <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-3">
      {parts.map((part, i) =>
        part.startsWith('[[') && part.endsWith(']]')
          ? <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5 font-medium not-italic">{part.slice(2, -2)}</mark>
          : <span key={i}>{part}</span>
      )}
    </p>
  );
}

export default function FileCard({ file }) {
  const [copied, setCopied] = useState(false);
  const icon = EXT_ICONS[file.extension?.toLowerCase()] || '📁';
  const size = formatSize(file.size_bytes);
  const date = formatDate(file.modified_at);

  function copyPath() {
    navigator.clipboard.writeText(file.path).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate text-sm">{file.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 break-all leading-snug" title={file.path}>
            {file.path}
          </p>

          {/* Content snippet with highlighted match */}
          {file.snippet && <Snippet text={file.snippet} />}

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            {size && <span>{size}</span>}
            {size && date && <span>·</span>}
            {date && <span>{date}</span>}
          </div>
        </div>

        <button
          onClick={copyPath}
          className="flex-shrink-0 text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors whitespace-nowrap"
          title="Copy full path"
        >
          {copied ? '✓ Copied' : 'Copy path'}
        </button>
      </div>
    </div>
  );
}
