'use client';

import { createTheme } from '@mui/material/styles';
import { Plus_Jakarta_Sans } from 'next/font/google';

export const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4', // M3 Purple
      light: '#EADDFF',
      dark: '#21005D',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71',
      light: '#E8DEF8',
      dark: '#1D192B',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#B3261E',
      light: '#F9DEDC',
      dark: '#410E0B',
    },
    background: {
      default: '#FFFBFE',
      paper: '#FFFBFE',
    },
    text: {
      primary: '#1C1B1F',
      secondary: '#49454F',
    },
  },
  typography: {
    fontFamily: plusJakartaSans.style.fontFamily,
    h1: {
      fontSize: '57px',
      lineHeight: '64px',
      letterSpacing: '-0.25px',
      fontWeight: 400,
    },
    h2: {
      fontSize: '45px',
      lineHeight: '52px',
      fontWeight: 400,
    },
    h3: {
      fontSize: '36px',
      lineHeight: '44px',
      fontWeight: 400,
    },
    h4: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 400,
    },
    h5: {
      fontSize: '28px',
      lineHeight: '36px',
      fontWeight: 400,
    },
    h6: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 400,
    },
    body1: {
      fontSize: '16px',
      lineHeight: '24px',
      letterSpacing: '0.5px',
    },
    body2: {
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '0.25px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12, // More rounded for M3 feel
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px', // Pill shape for buttons
          padding: '10px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)', // Elevation 1
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default gradient in dark mode if we switch
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
});

export default theme;
