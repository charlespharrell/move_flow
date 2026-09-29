export default function PageHeader({ title, description, action, eyebrow }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{eyebrow}</p>}
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-zinc-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
