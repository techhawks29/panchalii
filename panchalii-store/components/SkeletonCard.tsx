export default function SkeletonCard() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[3/4]" />
      <div className="mt-3 space-y-2">
        <div className="skeleton h-2.5 w-16" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3.5 w-1/3" />
      </div>
    </div>
  );
}
