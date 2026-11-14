import React from 'react';
import { Skeleton, StorySkeleton, ProductCardSkeleton } from '../components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-sheet px-4 py-6 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      {/* Category Stories Row Skeleton */}
      <div className="flex items-center gap-4 overflow-hidden border-b border-ink-100 pb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <StorySkeleton key={i} />
        ))}
      </div>

      {/* Hero Banner Skeleton */}
      <div className="relative aspect-[21/9] min-h-[220px] sm:min-h-[340px] w-full overflow-hidden rounded-3xl border border-ink-200/60 bg-ink-100 shadow-card">
        <Skeleton className="h-full w-full rounded-3xl" />
        <div className="absolute inset-0 p-6 sm:p-12 flex flex-col justify-end space-y-3">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-2/3 max-w-lg rounded-xl" />
          <Skeleton className="h-4 w-1/2 max-w-md rounded-md" />
          <div className="pt-2 flex gap-3">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </div>
      </div>

      {/* Product Cards Grid Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
