'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../utils/auth';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-steel-950">
      <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
