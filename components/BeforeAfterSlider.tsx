import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove]);

  return (
    <div className="relative w-full group select-none">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 -z-10"></div>

      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-3xl shadow-strong cursor-ew-resize ring-1 ring-white/50 hover:ring-2 hover:ring-indigo-400/50 transition-all duration-300"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
      >
        {/* After Image (Background) */}
        <img
          src={afterImage}
          alt="Redesigned Room"
          className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-5 right-5 bg-indigo-500/10 backdrop-blur-[10px] border border-indigo-500/20 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase z-10 shadow-[0_2px_20px_rgba(0,0,0,0.05)] text-white animate-slide-in-right transition-all hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:shadow-glow">
          <span className="relative z-10">After</span>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-80"></div>
        </div>

        {/* Before Image (Clipped Foreground) */}
        <div
          className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white/80 shadow-[4px_0_20px_rgba(0,0,0,0.1)]"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Original Room"
            className="absolute top-0 left-0 w-full max-w-none h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
          />
          <div className="absolute top-5 left-5 bg-white/85 backdrop-blur-[16px] saturate-[180%] border border-white/80 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase z-10 shadow-[0_2px_20px_rgba(0,0,0,0.05)] text-slate-900 animate-slide-up">
            <span className="relative z-10">Before</span>
          </div>
        </div>

        {/* Slider Handle Line with Glow */}
        <div
          className="absolute top-0 bottom-0 w-1 cursor-ew-resize z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 blur-sm opacity-80"></div>
          {/* Solid line */}
          <div className="absolute inset-0 bg-white shadow-lg"></div>

          {/* Handle Circle with enhanced interaction */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-gradient-to-br from-white to-slate-50 rounded-full shadow-glow-lg flex items-center justify-center text-indigo-600 transition-all duration-300 border-4 border-white ${
            isDragging ? 'scale-110 shadow-glow-lg' : 'hover:scale-110 hover:shadow-glow'
          }`}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
            <ChevronsLeftRight size={24} className={`relative z-10 transition-all ${isDragging ? 'scale-110' : ''}`} />
          </div>
        </div>

        {/* Interactive hint overlay (shows on first hover) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none"></div>
      </div>

      <div className="mt-5 flex justify-center">
        <div className="bg-white/85 backdrop-blur-[16px] saturate-[180%] border border-white/80 px-5 py-2 rounded-full text-xs font-semibold text-slate-600 flex items-center gap-2 animate-pulse-slow shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
          <ChevronsLeftRight size={14} className="text-indigo-500" />
          <span>Drag slider to compare</span>
        </div>
      </div>
    </div>
  );
};