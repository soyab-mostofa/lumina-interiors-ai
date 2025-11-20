import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  isLoading: boolean;
  estimatedDuration?: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  isLoading,
  estimatedDuration = 10000,
  label = 'Processing...',
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const interval = 50; // Update every 50ms
    const increment = (interval / estimatedDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 90%
        if (prev >= 90) {
          return Math.min(prev + increment * 0.1, 95);
        }
        if (prev >= 70) {
          return prev + increment * 0.5;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isLoading, estimatedDuration]);

  useEffect(() => {
    if (!isLoading && progress > 0) {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, progress]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-600 tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-slate-700 to-slate-600 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};
