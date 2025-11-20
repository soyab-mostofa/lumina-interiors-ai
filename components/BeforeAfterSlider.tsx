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
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-xl border-2 border-slate-200 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
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
          className="absolute top-0 left-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold text-white z-10 shadow-sm">
          After
        </div>

        {/* Before Image (Clipped Foreground) */}
        <div
          className="absolute top-0 left-0 h-full overflow-hidden border-r-[3px] border-white shadow-[2px_0_8px_rgba(0,0,0,0.1)]"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Original Room"
            className="absolute top-0 left-0 w-full max-w-none h-full object-cover"
            style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
            draggable={false}
          />
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 z-10 shadow-sm">
            Before
          </div>
        </div>

        {/* Slider Handle Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-grab active:cursor-grabbing z-20 shadow-lg"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Handle Circle */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 border-2 border-slate-200 transition-all ${
            isDragging ? 'scale-110 shadow-xl border-slate-300' : 'hover:scale-105 hover:shadow-xl'
          }`}>
            <ChevronsLeftRight size={20} strokeWidth={2.5} />
          </div>

          {/* Pulsing hint indicator (shows on hover when not dragging) */}
          {!isDragging && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-400/20 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <div className="text-sm text-slate-600 flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full">
          <ChevronsLeftRight size={16} className="text-slate-400" />
          <span className="font-medium">Drag to compare before & after</span>
        </div>
      </div>
    </div>
  );
};