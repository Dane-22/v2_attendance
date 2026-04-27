'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BranchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    
    // Verify this is a branch user
    try {
      const user = JSON.parse(userStr);
      const isBranchUser = /^branch-[a-z]+$/i.test(user.username) || (user.branch_code && user.branch_code !== '');
      if (!isBranchUser) {
        router.push('/dashboard');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  return <>{children}</>;
}
