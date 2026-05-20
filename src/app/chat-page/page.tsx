'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatPageClient from './components/ChatPageClient';
import { useAuth } from '@/contexts/auth-context';

export default function ChatPage() {
  const { user, loading, checkIpLogin } = useAuth();
  const router = useRouter();
  const [ipChecked, setIpChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading && !user) {
        // Check if user is remembered by IP
        const hasIpLogin = await checkIpLogin();
        if (hasIpLogin) {
          // Redirect to login with email pre-filled
          router.push('/sign-up-login-screen?remembered=true');
        } else {
          router.push('/sign-up-login-screen');
        }
      }
      setIpChecked(true);
    };

    checkAuth();
  }, [user, loading, router, checkIpLogin]);

  if (loading || !ipChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ChatPageClient />;
}
