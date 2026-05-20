import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-10">
      <div className="max-w-screen-xl mx-auto">
        <div
          className="relative rounded-3xl overflow-hidden p-8 sm:p-12 md:p-16 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(13,59,170,0.6) 0%, rgba(27,79,216,0.4) 50%, rgba(212,160,23,0.15) 100%)',
            border: '1px solid rgba(212,160,23,0.25)',
          }}
        >
          {/* Decorative orb */}
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(212,160,23,0.15), transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(27,79,216,0.2), transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 badge-gold px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6">
              <Sparkles size={11} />
              مجاني للبدء
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              هل أنت مستعد للدراسة بذكاء أكبر؟
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8 sm:mb-10">
              انضم إلى آلاف الطلاب والمطورين الذين يستخدمون aylnor.ai يومياً للتعلم بشكل أسرع،
              وتصحيح الأخطاء بسرعة أكبر، والفهم بعمق أكثر.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up-login-screen"
                className="btn-gold inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-base font-bold w-full sm:w-auto justify-center"
              >
                <ArrowLeft size={18} />
                إنشاء حساب مجاني
              </Link>
              <Link
                href="/chat-page"
                className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-base font-semibold text-foreground border border-border hover:border-gold/40 transition-colors w-full sm:w-auto justify-center"
              >
                جرب بدون تسجيل
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
