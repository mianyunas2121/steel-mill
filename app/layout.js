import '../styles/globals.css';
import { DM_Sans, Libre_Baskerville } from 'next/font/google';
import { AuthProvider } from '../utils/auth';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata = {
  title: 'SMMS - Steel Mill Management System',
  description: 'Complete steel mill inventory, billing & customer management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${libreBaskerville.variable}`}>
      <body className={dmSans.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
