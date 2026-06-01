'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/auth-context';

const ChatPageClient = dynamic(() => import('./components/ChatPageClient'), { ssr: false });

function ChatContent() {
  const { user, loading, checkIpLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ipChecked, setIpChecked] = useState(false);

  // Extract chatId from searchParams at page level
  const chatId = searchParams.get('id') || '';

  // Log chatId changes
  useEffect(() => {
    console.debug('Page chatId changed:', chatId);
  }, [chatId]);

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

  console.debug('Rendering ChatPageClient with chatId:', chatId);
  return <ChatPageClient chatId={chatId} />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-amber-500">جاري تحميل المحادثة...</div>}>
      <ChatContent />
    </Suspense>
  );
}
