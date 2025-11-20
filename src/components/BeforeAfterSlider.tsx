"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronsLeftRight } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
}) => {
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

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove]);

  return (
    <div className="group relative w-full select-none">
      <div
        ref={containerRef}
        className="relative aspect-[4/3] w-full cursor-ew-resize overflow-hidden rounded-3xl shadow-2xl ring-4 ring-white md:aspect-[16/9]"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches[0]) handleMove(e.touches[0].clientX);
        }}
      >
        {/* After Image (Background) */}
        <img
          src={afterImage}
          alt="Redesigned Room"
          className="absolute left-0 top-0 h-full w-full object-cover"
        />
        <div className="absolute right-6 top-6 z-10 rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
          After
        </div>

        {/* Before Image (Clipped Foreground) */}
        <div
          className="absolute left-0 top-0 h-full overflow-hidden border-r border-white/50"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Original Room"
            className="absolute left-0 top-0 h-full w-full max-w-none object-cover"
            style={{
              width: containerRef.current
                ? containerRef.current.offsetWidth
                : "100%",
            }}
          />
          <div className="absolute left-6 top-6 z-10 rounded-full border border-white/50 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-900 shadow-sm backdrop-blur-md">
            Before
          </div>
        </div>

        {/* Slider Handle Line */}
        <div
          className="absolute bottom-0 top-0 z-20 w-0.5 cursor-ew-resize bg-white/80 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Handle Circle */}
          <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white/20 bg-white text-indigo-600 shadow-[0_0_20px_rgba(0,0,0,0.25)] transition-all hover:scale-110 hover:text-indigo-700">
            <ChevronsLeftRight size={22} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <p className="animate-pulse rounded-full bg-white/50 px-4 py-1 text-xs font-semibold text-slate-500 backdrop-blur">
          Drag slider to compare
        </p>
      </div>
    </div>
  );
};
