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
        className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 cursor-ew-resize"
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
        />
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs font-medium text-white z-10">
          After
        </div>

        {/* Before Image (Clipped Foreground) */}
        <div
          className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Original Room"
            className="absolute top-0 left-0 w-full max-w-none h-full object-cover"
            style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium text-slate-900 z-10">
            Before
          </div>
        </div>

        {/* Slider Handle Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 shadow-sm"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Handle Circle */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 border border-slate-200 ${
            isDragging ? 'scale-110' : ''
          }`}>
            <ChevronsLeftRight size={18} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ChevronsLeftRight size={12} className="text-slate-400" />
          <span>Drag to compare</span>
        </div>
      </div>
    </div>
  );
};