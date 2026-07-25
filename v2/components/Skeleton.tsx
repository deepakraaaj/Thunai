/** Content-shaped loading skeleton — never a blank screen. */
export default function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="w-full space-y-3" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4"
          style={{ width: `${90 - i * 12}%` }}
        />
      ))}
    </div>
  );
}
