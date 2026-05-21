'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { BookOpen, Code2, Brain } from 'lucide-react';

type Tab = 'login' | 'signup';

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('login');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Right brand panel (RTL: shown on right) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0D3BAA 0%, #1B4FD8 45%, #0A0F1E 100%)',
        }}
      >
        {/* Decorative orbs */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(212,160,23,0.18), transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(27,79,216,0.3), transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 flex-row-reverse">
          <AppLogo size={40} />
          <span className="font-extrabold text-2xl text-white tracking-tight">
            aylnor<span className="text-gold">.ai</span>
          </span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 text-right">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
            رفيقك الأكاديمي
            <br />
            <span className="text-gold">بالذكاء الاصطناعي.</span>
          </h2>
          <p className="text-blue-200 text-base leading-relaxed mb-10 max-w-sm mr-auto">
            اسأل أي شيء. ولّد كوداً. افهم المفاهيم. aylnor.ai يتكيف مع أسلوب تعلمك.
          </p>

          <div className="space-y-4">
            {[
              { icon: BookOpen, label: 'مساعد أكاديمي', desc: 'الواجبات، المقالات، البحث' },
              { icon: Code2, label: 'مساعد البرمجة', desc: '+20 لغة برمجة' },
              { icon: Brain, label: 'ذكاء اصطناعي متعدد الأوضاع', desc: 'سريع، مفكر، مبرمج' },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={`brand-feat-${item.label}`}
                  className="flex items-center gap-4 flex-row-reverse"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15 shrink-0">
                    <ItemIcon size={18} className="text-gold" />
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold text-sm">{item.label}</div>
                    <div className="text-blue-300 text-xs">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative z-10 text-blue-300 text-xs text-right">
          © 2026 aylnor.ai — بُني بواسطة المهندس الطلب احمد قريز
        </p>
      </div>

      {/* Left form panel (RTL: shown on left) */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 bg-background">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden flex items-center gap-2 mb-8 flex-row-reverse">
          <AppLogo size={32} />
          <span className="font-extrabold text-xl text-foreground">
            aylnor<span className="text-gold">.ai</span>
          </span>
        </Link>

        <div className="w-full max-w-md">
          {/* Tab switcher */}
          <div className="flex border-b border-border mb-8">
            {(['login', 'signup'] as Tab[]).map((tab) => (
              <button
                key={`auth-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 pb-3 text-sm font-semibold capitalize transition-all duration-150 ${
                  activeTab === tab ? 'tab-active' : 'tab-inactive'
                }`}
              >
                {tab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
              </button>
            ))}
          </div>

          {activeTab === 'login' ? (
            <LoginForm onSwitchToSignup={() => setActiveTab('signup')} />
          ) : (
            <SignupForm onSwitchToLogin={() => setActiveTab('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
