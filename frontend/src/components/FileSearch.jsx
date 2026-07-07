import { useState } from 'react';
import FileCard from './FileCard';

export default function FileSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function search(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/files/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setError('Could not reach the backend. Make sure it is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">

        <form onSubmit={search} className="flex gap-3 mb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Describe what you are looking for... e.g. "my CV" or "Excel budget 2024"'
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-5 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {!results && !loading && !error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🗂</div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">Search your files</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Describe the file you are looking for in plain language. Make sure you have run the indexing script first.
            </p>
            <div className="mt-6 bg-gray-100 rounded-xl px-5 py-4 text-left max-w-md mx-auto">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Run indexing first</p>
              <code className="text-xs text-gray-700 font-mono">
                cd backend<br />
                node scripts/index-files.js
              </code>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex gap-1">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-3">Searching...</p>
          </div>
        )}

        {results && !loading && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {results.length === 0
                ? 'No files found. Try different keywords or run the indexing script.'
                : `${results.length} file${results.length !== 1 ? 's' : ''} found`}
            </p>
            <div className="space-y-3">
              {results.map((file, i) => (
                <FileCard key={i} file={file} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
