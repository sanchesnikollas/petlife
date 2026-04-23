export default function Skeleton({ width, height, rounded = 'xl', className = '' }) {
  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  }[rounded] || 'rounded-xl';

  return (
    <div
      className={`bg-gray-200 animate-pulse ${roundedClass} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton width={44} height={44} rounded="xl" />
        <div className="flex-1 space-y-2">
          <Skeleton height={14} width="60%" rounded="md" />
          <Skeleton height={10} width="40%" rounded="md" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height={10} width="100%" rounded="md" />
        <Skeleton height={10} width="80%" rounded="md" />
      </div>
    </div>
  );
}

export function SkeletonStatusGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton width={32} height={32} rounded="lg" />
            <Skeleton height={10} width="50%" rounded="md" />
          </div>
          <Skeleton height={16} width="70%" rounded="md" />
          <Skeleton height={10} width="40%" rounded="md" className="mt-1" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-alt rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <Skeleton width={40} height={40} rounded="xl" />
          <div className="flex-1 space-y-2">
            <Skeleton height={14} width="50%" rounded="md" />
            <Skeleton height={10} width="70%" rounded="md" />
          </div>
        </div>
      ))}
    </div>
  );
}
