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
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold text-indigo-600">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="w-full h-full bg-white/30 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
