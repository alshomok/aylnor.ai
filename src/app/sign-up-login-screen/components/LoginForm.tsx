'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError('');

    const { error } = await signIn(data.email, data.password);

    if (error) {
      setAuthError(error.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    } else {
      // Redirect to chat page on successful login
      window.location.href = '/chat-page';
    }
  };

  return (
    <div>
      <div className="mb-8 text-right">
        <h1 className="text-2xl font-bold text-foreground mb-1">مرحباً بعودتك</h1>
        <p className="text-sm text-muted-foreground">سجّل الدخول إلى حساب aylnor.ai الخاص بك</p>
      </div>

      {authError && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 mb-6 flex-row-reverse">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400 text-right">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-semibold text-foreground mb-1.5 text-right"
          >
            البريد الإلكتروني
          </label>
          <input
            id="login-email"
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
            htmlFor="login-password"
            className="block text-sm font-semibold text-foreground mb-1.5 text-right"
          >
            كلمة المرور
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            className="input-field w-full px-4 py-2.5 rounded-xl text-sm text-left"
            dir="ltr"
            {...register('password')}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ minHeight: '44px' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              جارٍ تسجيل الدخول…
            </>
          ) : (
            'تسجيل الدخول'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        ليس لديك حساب؟{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-gold font-semibold nav-link-hover"
        >
          أنشئ حساباً مجاناً
        </button>
      </p>
    </div>
  );
}
