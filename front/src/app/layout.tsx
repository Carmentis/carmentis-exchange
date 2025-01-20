import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { useExchangeConfig } from '@/app/api';
import { ConnectionContextProvider } from '@/app/connection.context';
import { ToastContainer } from 'react-toastify';
import { NotificationContextProvider } from '@/app/notification.context';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Carmentis | Exchange',
};



export default function RootLayout({
									   children,
								   }: Readonly<{
	children: React.ReactNode;
}>) {
	useExchangeConfig();

	return (
		<html lang="en" className={'w-full h-full'}>
		<body
			className={`${geistSans.variable} ${geistMono.variable} antialiased w-full h-full`}
		>
		<ToastContainer />
        <ConnectionContextProvider>
			<NotificationContextProvider>
				{children}
			</NotificationContextProvider>
        </ConnectionContextProvider>
		</body>
		</html>
	);
}
