// Reusable card / panel surface for dark theme
export default function Card({ children, className = "", padding = "p-5", ...props }) {
  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900 ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}
