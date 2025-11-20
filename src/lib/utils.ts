import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a File object to a Base64 string.
 * Optimized to prevent "Rpc failed" or Payload Too Large errors.
 * Max dimension: 768px. Quality: 0.6.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const MAX_WIDTH = 768;
        const MAX_HEIGHT = 768;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        resolve(dataUrl.split(",")[1]!);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Helper to downscale any base64 image string.
 * Critical for preventing payload size errors with generated images.
 * Target: 512px max dimension, 0.5 quality.
 */
export const compressBase64 = async (base64Data: string): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      // Handle potential missing prefix
      const src = base64Data.startsWith("data:")
        ? base64Data
        : `data:image/jpeg;base64,${base64Data}`;
      img.src = src;

      img.onload = () => {
        const MAX_DIM = 512;
        let w = img.width;
        let h = img.height;

        // Scale down if needed
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h *= MAX_DIM / w;
            w = MAX_DIM;
          } else {
            w *= MAX_DIM / h;
            h = MAX_DIM;
          }
        } else {
          // If already small, just return original to save processing
          // stripping prefix if it was added for loading
          resolve(base64Data.replace(/^data:image\/\w+;base64,/, ""));
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          // Aggressive compression for chat context (it only needs to see general layout/colors)
          const data = canvas.toDataURL("image/jpeg", 0.5);
          resolve(data.split(",")[1]!);
        } else {
          resolve(base64Data.replace(/^data:image\/\w+;base64,/, ""));
        }
      };

      img.onerror = () => {
        console.warn(
          "Image compression failed to load image, using original."
        );
        resolve(base64Data.replace(/^data:image\/\w+;base64,/, ""));
      };
    } catch (e) {
      console.warn("Image compression error:", e);
      resolve(base64Data.replace(/^data:image\/\w+;base64,/, ""));
    }
  });
};
