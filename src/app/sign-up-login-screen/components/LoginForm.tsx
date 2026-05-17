'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    // Direct login without validation
    window.location.href = '/chat-page';
    setIsLoading(false);
  };

  return (
    <div>
      <div className="mb-8 text-right">
        <h1 className="text-2xl font-bold text-foreground mb-1">مرحباً بعودتك</h1>
        <p className="text-sm text-muted-foreground">سجّل الدخول إلى حساب aylnor.ai الخاص بك</p>
      </div>

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
