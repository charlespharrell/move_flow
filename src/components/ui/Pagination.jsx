// Reusable client-side pagination
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Show compact pagination on mobile
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-zinc-400">
        Page <span className="font-medium text-zinc-100">{currentPage}</span> of {totalPages}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {/* Page numbers — hidden on very small screens when many pages */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? "page" : undefined}
              className={`min-w-8 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors ${
                currentPage === page
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <span className="sm:hidden text-sm text-zinc-400 px-2">{currentPage} / {totalPages}</span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
