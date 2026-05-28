'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
}

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState('');
  const { signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>();

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setAuthError('');

    const { error, session } = await signUp(data.email, data.password, data.fullName);

    if (error) {
      setAuthError(error.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    } else if (session) {
      // Auto-login successful - redirect to chat page immediately
      window.location.href = '/chat-page';
    } else {
      // Email confirmation required - show success message
      setIsLoading(false);
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
          <Check size={28} className="text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">تم إنشاء الحساب!</h3>
        <p className="text-sm text-muted-foreground mb-6">
          مرحباً بك في aylnor.ai. حسابك جاهز — سجّل الدخول لتبدأ التعلم.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="btn-gold px-8 py-2.5 rounded-xl text-sm font-bold"
        >
          تسجيل الدخول الآن
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-right">
        <h1 className="text-2xl font-bold text-foreground mb-1">إنشاء حسابك</h1>
        <p className="text-sm text-muted-foreground">
          مجاني للأبد. لا حاجة لبطاقة ائتمان.
        </p>
      </div>

      {authError && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 mb-6 flex-row-reverse">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400 text-right">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Full name */}
        <div>
          <label
            htmlFor="signup-name"
            className="block text-sm font-semibold text-foreground mb-1.5 text-right"
          >
            الاسم الكامل
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="أمارا أوسي"
            className="input-field w-full px-4 py-2.5 rounded-xl text-sm text-right"
            {...register('fullName')}
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-semibold text-foreground mb-1.5 text-right"
          >
            البريد الإلكتروني
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            className="input-field w-full px-4 py-2.5 rounded-xl text-sm text-left"
            dir="ltr"
            {...register('email')}
          />
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-semibold text-foreground mb-1.5 text-right"
          >
            كلمة المرور
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••"
            className="input-field w-full px-4 py-2.5 rounded-xl text-sm text-left"
            dir="ltr"
            {...register('password')}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-gold w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ minHeight: '44px' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              جارٍ إنشاء الحساب…
            </>
          ) : (
            'إنشاء حساب مجاني'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        لديك حساب بالفعل؟{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-gold font-semibold nav-link-hover"
        >
          تسجيل الدخول
        </button>
      </p>
    </div>
  );
}
