import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'sell2sr1.com | Sell Your RV, Trailer, Tractor & Equipment to SR1',
  description: 'Fast, fair cash offers on RVs, trailers, tractors, heavy equipment, and powersports from SR1 Companies. 6 Maine & NH locations with free on-site pickup.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b1120] text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
