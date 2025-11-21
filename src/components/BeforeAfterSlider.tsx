"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box, Typography, alpha } from "@mui/material";
import { CompareArrows as CompareArrowsIcon } from "@mui/icons-material";

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
    <Box sx={{ width: "100%", position: "relative", userSelect: "none" }}>
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: { xs: "4/3", md: "16/9" },
          cursor: "ew-resize",
          overflow: "hidden",
          borderRadius: 6,
          boxShadow: (theme) => theme.shadows[10],
          border: 4,
          borderColor: "common.white",
        }}
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
        <Box
          component="img"
          src={afterImage}
          alt="Redesigned Room"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 24,
            right: 24,
            zIndex: 10,
            borderRadius: "50px",
            border: 1,
            borderColor: alpha("#fff", 0.2),
            bgcolor: alpha("#000", 0.4),
            px: 2,
            py: 0.75,
            backdropFilter: "blur(8px)",
          }}
        >
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "common.white",
            }}
          >
            After
          </Typography>
        </Box>

        {/* Before Image (Clipped Foreground) */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            overflow: "hidden",
            borderRight: 1,
            borderColor: alpha("#fff", 0.5),
            width: `${sliderPosition}%`,
          }}
        >
          <Box
            component="img"
            src={beforeImage}
            alt="Original Room"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              maxWidth: "none",
              objectFit: "cover",
              width: containerRef.current
                ? `${containerRef.current.offsetWidth}px`
                : "100%",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: 24,
              left: 24,
              zIndex: 10,
              borderRadius: "50px",
              border: 1,
              borderColor: alpha("#fff", 0.5),
              bgcolor: alpha("#fff", 0.8),
              px: 2,
              py: 0.75,
              boxShadow: 1,
              backdropFilter: "blur(8px)",
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "grey.900",
              }}
            >
              Before
            </Typography>
          </Box>
        </Box>

        {/* Slider Handle Line */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            zIndex: 20,
            width: "2px",
            cursor: "ew-resize",
            bgcolor: alpha("#fff", 0.8),
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            left: `${sliderPosition}%`,
          }}
        >
          {/* Handle Circle */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: 4,
              borderColor: alpha("#fff", 0.2),
              bgcolor: "common.white",
              color: "primary.main",
              boxShadow: "0 0 20px rgba(0,0,0,0.25)",
              transition: "all 0.2s",
              "&:hover": {
                transform: "translate(-50%, -50%) scale(1.1)",
                color: "primary.dark",
              },
            }}
          >
            <CompareArrowsIcon />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: "text.secondary",
            bgcolor: (theme) => alpha(theme.palette.common.white, 0.5),
            px: 2,
            py: 0.5,
            borderRadius: "50px",
            backdropFilter: "blur(4px)",
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.5 },
            },
          }}
        >
          Drag slider to compare
        </Typography>
      </Box>
    </Box>
  );
};

