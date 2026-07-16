import '../styles/globals.css';
import { Inter } from 'next/font/google';
import Providers from '../components/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'SMMS — Steel Mill Management System',
  description: 'Enterprise steel mill inventory, billing & operations management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
