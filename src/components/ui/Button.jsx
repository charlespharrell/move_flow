const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500 border-transparent",
  secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border-zinc-700 focus-visible:ring-zinc-500",
  ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white border-transparent focus-visible:ring-zinc-500",
  outline: "bg-transparent text-zinc-200 border-zinc-700 hover:bg-zinc-800 focus-visible:ring-zinc-500",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
};

// Reusable button primitive
export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
