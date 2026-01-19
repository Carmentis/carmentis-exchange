'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PublicEnvScript } from "next-runtime-env";
import { ToastContainer } from 'react-toastify';
import { ConnectionContextProvider } from '@/app/payment/connection.context';
import { NotificationContextProvider } from '@/app/payment/notification.context';


// Create a modern, sober, square theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
      light: '#2a2a2a',
      dark: '#000000',
    },
    secondary: {
      main: '#f5f5f5',
      light: '#ffffff',
      dark: '#e0e0e0',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
    background: {
      default: '#ffffff',
      paper: '#fafafa',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      letterSpacing: '0',
    },
    body2: {
      letterSpacing: '0',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0',
    },
  },
  shape: {
    borderRadius: 0, // Square corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          border: '1px solid #000000',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          backgroundColor: '#000000',
          color: '#ffffff',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#2a2a2a',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: '#e0e0e0',
          color: '#000000',
          backgroundColor: '#ffffff',
          '&:hover': {
            borderColor: '#000000',
            backgroundColor: '#fafafa',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '1px solid #e0e0e0',
          boxShadow: 'none',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#000000',
          boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: '#fafafa',
          border: '1px solid #e0e0e0',
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          fontWeight: 500,
          fontSize: '12px',
        },
        outlined: {
          borderColor: '#e0e0e0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            '& fieldset': {
              borderColor: '#e0e0e0',
            },
            '&:hover fieldset': {
              borderColor: '#000000',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#000000',
              borderWidth: '1px',
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '1px solid',
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          padding: '24px 0',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontSize: '13px',
          fontWeight: 500,
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: '#e0e0e0',
          '&.Mui-active': {
            color: '#000000',
          },
          '&.Mui-completed': {
            color: '#000000',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#e0e0e0',
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: '#000000',
          '&.Mui-checked': {
            color: '#000000',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          marginRight: 0,
        },
      },
    },
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full h-full scroll-smooth">
      <body
        className={`font-sans antialiased w-full h-full`}
      >
        <PublicEnvScript />
          <ConnectionContextProvider>
            <NotificationContextProvider>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                className="glass-no-border"
              />
              {children}
            </NotificationContextProvider>
          </ConnectionContextProvider>
      </body>
    </html>
  );
}