'use client';

import { AuthProvider } from '../utils/auth';
import { ThemeProvider } from './ThemeProvider';

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
