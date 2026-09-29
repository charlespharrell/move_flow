import Button from "./Button";

// Reusable empty / loading / error states for dark UI

export function EmptyState({ title = "No results", description, actionLabel, onAction, icon }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
        {icon || (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-400">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" aria-hidden="true" />
        {label}
      </div>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-950/40 text-red-400 border border-red-900/50">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-zinc-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-400">{description}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
