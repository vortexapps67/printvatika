import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-ink-200/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-ink-200/80 bg-white p-3 shadow-card overflow-hidden">
      {/* Thumbnail placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-ink-100">
        <Skeleton className="h-full w-full rounded-xl" />
        <div className="absolute top-2 left-2">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 flex flex-1 flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-2/3 rounded-md" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-ink-100">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-10 rounded-sm" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0 px-1">
      <Skeleton className="h-16 w-16 rounded-full ring-2 ring-ink-100" />
      <Skeleton className="h-2.5 w-12 rounded-full" />
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-ink-200/60 bg-white p-4 shadow-xs">
      <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <Skeleton className="h-3 w-1/3 rounded-md" />
        <Skeleton className="h-3 w-1/4 rounded-md" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
