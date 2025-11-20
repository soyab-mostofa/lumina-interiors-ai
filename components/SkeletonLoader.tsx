import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200 animate-pulse rounded ${className}`} role="status" aria-label="Loading..."></div>
);

export const AnalysisSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
    <SkeletonBox className="h-6 w-32" />
    <div className="space-y-2">
      <SkeletonBox className="h-4 w-full" />
      <SkeletonBox className="h-4 w-5/6" />
      <SkeletonBox className="h-4 w-4/6" />
    </div>
    <SkeletonBox className="h-6 w-40 mt-4" />
    <div className="space-y-2">
      <SkeletonBox className="h-4 w-full" />
      <SkeletonBox className="h-4 w-3/4" />
    </div>
  </div>
);

export const StyleCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border-2 border-slate-200 overflow-hidden">
    <SkeletonBox className="h-28 w-full" />
    <div className="p-4 bg-white">
      <SkeletonBox className="h-4 w-full" />
    </div>
  </div>
);

export const ImageSkeleton: React.FC<{ className?: string }> = ({ className = 'h-64' }) => (
  <div className={`bg-slate-200 animate-pulse rounded-2xl ${className} flex items-center justify-center`}>
    <div className="text-slate-400 text-center">
      <div className="w-16 h-16 mx-auto mb-2 bg-slate-300 rounded-full"></div>
      <p className="text-sm">Loading image...</p>
    </div>
  </div>
);
