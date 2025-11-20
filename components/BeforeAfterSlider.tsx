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
        className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden rounded-3xl shadow-2xl cursor-ew-resize ring-4 ring-white"
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
        <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase z-10 border border-white/20">
          After
        </div>

        {/* Before Image (Clipped Foreground) */}
        <div
          className="absolute top-0 left-0 h-full overflow-hidden border-r border-white/50"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Original Room"
            className="absolute top-0 left-0 w-full max-w-none h-full object-cover"
            style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
          />
          <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase z-10 border border-white/50 shadow-sm">
            Before
          </div>
        </div>

        {/* Slider Handle Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
          style={{ left: `${sliderPosition}%` }}
        >
           {/* Handle Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-[0_0_20px_rgba(0,0,0,0.25)] flex items-center justify-center text-indigo-600 hover:scale-110 hover:text-indigo-700 transition-all border-4 border-white/20">
             <ChevronsLeftRight size={22} />
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-center">
        <p className="bg-white/50 backdrop-blur px-4 py-1 rounded-full text-xs font-semibold text-slate-500 animate-pulse">
          Drag slider to compare
        </p>
      </div>
    </div>
  );
};