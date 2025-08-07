'use client';

import {PropsWithChildren} from "react";
import {Geist, Geist_Mono} from "next/font/google";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import {PublicEnvScript} from "next-runtime-env";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './auth.context';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

// Create a custom Material-UI theme with white and glass effects
const theme = createTheme({
    palette: {
        primary: {
            main: 'rgba(255, 255, 255, 0.7)', // Transparent white
            light: 'rgba(255, 255, 255, 0.9)',
            dark: 'rgba(255, 255, 255, 0.5)',
        },
        secondary: {
            main: 'rgba(240, 240, 240, 0.7)', // Light gray with transparency
            light: 'rgba(245, 245, 245, 0.9)',
            dark: 'rgba(230, 230, 230, 0.5)',
        },
        text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
        },
        background: {
            default: '#ffffff',
            paper: 'rgba(255, 255, 255, 0.8)',
        },
    },
    typography: {
        fontFamily: 'var(--font-geist-sans), sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 600,
        },
        h4: {
            fontWeight: 600,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 12, // Slightly more rounded corners
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    color: 'rgba(0, 0, 0, 0.8)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 6px 8px rgba(0, 0, 0, 0.08)',
                    },
                },
                contained: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                },
            },
        },
    },
});

export default function ControlRootLayout({children}: PropsWithChildren) {
    return (
        <html lang="en" className="w-full h-full scroll-smooth">
        <body
            className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased w-full h-full`}
        >
        <PublicEnvScript />
        <ThemeProvider theme={theme}>
            <AuthProvider>
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
            </AuthProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}