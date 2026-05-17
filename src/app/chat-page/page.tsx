'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatPageClient from './components/ChatPageClient';
import { useAuth } from '@/contexts/auth-context';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-up-login-screen');
    }
  }, [user, loading, router]);

  if (loading) {
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
