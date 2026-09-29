export function Input({ className = "", ...props }) {
  return (
    <input
      className={`h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// Search input with icon slot
export function SearchInput({ value, onChange, placeholder = "Search…", className = "" }) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
