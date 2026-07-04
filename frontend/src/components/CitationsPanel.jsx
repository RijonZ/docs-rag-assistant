export default function CitationsPanel({ citations }) {
  if (!citations?.length) return null;

  return (
    <div className="mt-2 pl-1">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5">Sources</p>
      <div className="flex flex-wrap gap-2">
        {citations.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-3 py-1 text-xs text-gray-600"
            title={c.sourceFile}
          >
            <svg
              className="w-3 h-3 text-indigo-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="font-medium truncate max-w-[180px]">{c.title || c.sourceFile}</span>
            {c.similarity != null && (
              <span className="text-gray-400 flex-shrink-0">{c.similarity}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
