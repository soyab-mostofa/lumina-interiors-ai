"use client";

import { createTheme } from "@mui/material/styles";

// Custom color palette matching the original design
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6366f1", // Indigo-600
      light: "#818cf8", // Indigo-400
      dark: "#4f46e5", // Indigo-700
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#a855f7", // Purple-500
      light: "#c084fc", // Purple-400
      dark: "#9333ea", // Purple-600
      contrastText: "#ffffff",
    },
    success: {
      main: "#10b981", // Emerald-500
      light: "#34d399", // Emerald-400
      dark: "#059669", // Emerald-600
    },
    warning: {
      main: "#f59e0b", // Amber-500
      light: "#fbbf24", // Amber-400
      dark: "#d97706", // Amber-600
    },
    error: {
      main: "#ef4444", // Red-500
      light: "#f87171", // Red-400
      dark: "#dc2626", // Red-600
    },
    background: {
      default: "#f8fafc", // Slate-50
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a", // Slate-900
      secondary: "#64748b", // Slate-500
    },
    grey: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },
  typography: {
    fontFamily: "var(--font-sans), Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif",
    h1: {
      fontSize: "3rem",
      fontWeight: 800,
      letterSpacing: "-0.025em",
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2.25rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.875rem",
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.75,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 0 0 1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "0 0 0 1px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    "0 0 0 1px rgba(0, 0, 0, 0.05), 0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 0 0 1px rgba(0, 0, 0, 0.05)",
    "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 0 50px rgba(99, 102, 241, 0.15)",
    "0 0 50px rgba(168, 85, 247, 0.15)",
    "0 10px 40px rgba(99, 102, 241, 0.2)",
    "0 10px 40px rgba(168, 85, 247, 0.2)",
    "0 20px 60px rgba(99, 102, 241, 0.25)",
    "0 20px 60px rgba(168, 85, 247, 0.25)",
    "0 25px 80px rgba(99, 102, 241, 0.3)",
    "0 25px 80px rgba(168, 85, 247, 0.3)",
    "0 0 0 4px rgba(99, 102, 241, 0.1)",
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 24px",
          fontSize: "0.875rem",
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          },
        },
        contained: {
          "&:hover": {
            transform: "translateY(-1px)",
            transition: "all 0.2s",
          },
        },
        sizeLarge: {
          padding: "14px 32px",
          fontSize: "1rem",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        },
        elevation2: {
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        },
        elevation3: {
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
