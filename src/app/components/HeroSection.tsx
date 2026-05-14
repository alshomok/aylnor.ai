'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, BookOpen, Code2, Brain } from 'lucide-react';

const TYPEWRITER_PHRASES = [
  'حل المعادلات المعقدة.',
  'كتابة كود Python نظيف.',
  'التفوق في امتحانك القادم.',
  'تصحيح تطبيق React.',
  'فهم التعلم الآلي.',
  'صياغة مخطط رسالتك.',
];

export default function HeroSection() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const current = TYPEWRITER_PHRASES[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIndex < current.length) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      }, 55);
    } else if (!deleting && charIndex === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
      }, 28);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % TYPEWRITER_PHRASES.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, phraseIndex]);

  const stats = [
    { label: 'موضوع أكاديمي', value: '+200' },
    { label: 'لغة برمجة مدعومة', value: '+40' },
    { label: 'ظروف للبوت', value: '3' },
  ];

  return (
    <section className="relative pt-28 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-10 overflow-hidden">
      {/* Background orbs */}
      <div
        className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--royal-blue), transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute top-40 right-1/4 w-64 h-64 rounded-full opacity-8 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--gold), transparent 70%)', filter: 'blur(50px)' }}
      />

      <div className="max-w-screen-xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 badge-gold px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-8">
          <Sparkles size={12} />
          مساعد أكاديمي مدعوم بالذكاء الاصطناعي
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
          <span className="hero-text-gradient">اطلب من aylnor</span>
          <br />
          <span className="text-gold min-h-[1.2em] inline-block">
            {displayed}
            <span className="animate-pulse text-gold-light">|</span>
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          aylnor.ai هو رفيقك الأكاديمي الذكي — مصمم للطلاب والمطورين الذين يحتاجون إجابات سريعة ودقيقة وواعية بالسياق. بدّل بين أوضاع السريع والمتأمل والبرمجة لتناسب سير عملك.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16">
          <Link
            href="/sign-up-login-screen"
            className="btn-gold inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-base font-bold w-full sm:w-auto justify-center"
          >
            <ArrowLeft size={18} />
            ابدأ مجاناً
          </Link>
          <Link
            href="/chat-page"
            className="btn-primary inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-base font-semibold w-full sm:w-auto justify-center"
          >
            <Sparkles size={16} />
            جرب المحادثة
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-12 sm:mb-16">
          {stats.map((stat) => (
            <div key={`stat-${stat.label}`} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-gold tabular-nums">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Chat preview mockup */}
        <div className="max-w-2xl mx-auto glass-card rounded-2xl overflow-hidden glow-blue">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-row-reverse">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
            <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
            <span className="mr-3 text-xs text-muted-foreground font-medium">aylnor.ai — محادثة</span>
            <div className="mr-auto flex gap-2">
              {[
                { icon: BookOpen, label: 'سريع', active: false },
                { icon: Brain, label: 'متأمل', active: true },
                { icon: Code2, label: 'برمجة', active: false },
              ].map((mode) => (
                <span
                  key={`mode-preview-${mode.label}`}
                  className={`text-2xs px-2 py-0.5 rounded-full font-semibold border ${
                    mode.active
                      ? 'badge-blue' :'text-muted-foreground border-border'
                  }`}
                >
                  {mode.label}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-3 text-right">
            <div className="flex justify-start">
              <div className="chat-bubble-user text-sm px-4 py-2.5 max-w-xs">
                اشرح الانحدار التدريجي بعبارات بسيطة
              </div>
            </div>
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-7 h-7 rounded-full bg-royal-blue flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={12} className="text-gold" />
              </div>
              <div className="chat-bubble-bot text-sm px-4 py-3 max-w-sm text-right">
                <p className="leading-relaxed">
                  فكر في الانحدار التدريجي كقطعة تتدحرج أسفل تل — القطعة تتحرك دائماً نحو أدنى نقطة. في التعلم الآلي، نحاول تقليل دالة الخسارة بضبط الأوزان في اتجاه أكبر انخفاض.
                </p>
                <div className="mt-2 text-2xs text-muted-foreground flex items-center gap-1 flex-row-reverse">
                  <BookOpen size={10} />
                  وضع متأمل
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}