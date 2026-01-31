import { cn } from '@/lib/utils';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'circle' | 'button';
  width?: string;
  height?: string;
  className?: string;
}

const variantClasses: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'h-4 w-full rounded',
  card: 'h-32 w-full rounded-xl',
  circle: 'h-10 w-10 rounded-full',
  button: 'h-10 w-24 rounded-lg',
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-skeleton-pulse bg-gray-200',
        variantClasses[variant],
        className
      )}
      style={{
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      }}
      aria-hidden="true"
    />
  );
}
