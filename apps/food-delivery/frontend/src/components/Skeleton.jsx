export function CardGridSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/3] rounded-2xl bg-kv-charcoal/10" />
          <div className="mt-3 h-4 w-2/3 rounded bg-kv-charcoal/10" />
          <div className="mt-2 h-3 w-1/3 rounded bg-kv-charcoal/10" />
        </div>
      ))}
    </div>
  );
}

export function LineSkeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-kv-charcoal/10 ${className}`} />;
}
