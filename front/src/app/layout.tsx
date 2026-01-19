'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { PublicEnvScript } from "next-runtime-env";
import { ToastContainer } from 'react-toastify';
import { ConnectionContextProvider } from '@/app/payment/connection.context';
import { NotificationContextProvider } from '@/app/payment/notification.context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`w-full h-full scroll-smooth ${inter.variable}`}>
      <body
        className={`${inter.className} antialiased w-full h-full`}
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