import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { Navbar } from '@/components/navigation/Navbar';
import { MobileTabBar } from '@/components/navigation/MobileTabBar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PantryPilot | Smart Household Food Waste Reducer',
  description:
    'Track pantry items, monitor expiry dates, and cut household food waste effortlessly.',
  applicationName: 'PantryPilot',
  authors: [{ name: 'PantryPilot Team' }],
  keywords: ['pantry tracker', 'food waste reduction', 'expiry date monitor', 'smart kitchen'],
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 flex flex-col">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1 pb-20 md:pb-12 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <MobileTabBar />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
