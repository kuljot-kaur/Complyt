'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return <div className="min-h-screen bg-surface flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin mb-4">
        <span className="material-symbols-outlined text-4xl text-primary">hourglass_empty</span>
      </div>
      <p className="text-sm text-secondary">Loading...</p>
    </div>
  </div>;
}
