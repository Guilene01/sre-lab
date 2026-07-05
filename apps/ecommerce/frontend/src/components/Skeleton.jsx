export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-norr-stone/60" />
          <div className="mt-3 h-3 w-3/4 bg-norr-stone/60" />
          <div className="mt-2 h-3 w-1/4 bg-norr-stone/60" />
        </div>
      ))}
    </div>
  );
}

export function LineSkeleton({ className = "" }) {
  return <div className={`animate-pulse bg-norr-stone/60 ${className}`} />;
}
