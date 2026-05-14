'use client';
import React, { useState } from 'react';

import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, Copy, Check, AlertCircle } from 'lucide-react';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const DEMO_CREDENTIALS = {
  email: 'student@aylnor.ai',
  password: 'AylnorDemo2026!',
};

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({ defaultValues: { rememberMe: false } });

  const handleCopy = (field: 'email' | 'password') => {
    const value = field === 'email' ? DEMO_CREDENTIALS.email : DEMO_CREDENTIALS.password;
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fillDemoCredentials = () => {
    setValue('email', DEMO_CREDENTIALS.email);
    setValue('password', DEMO_CREDENTIALS.password);
    setAuthError('');
  };

  // Backend integration point: replace with real auth API call
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setAuthError('');
    await new Promise((r) => setTimeout(r, 1200));
    if (
      data.email === DEMO_CREDENTIALS.email &&
      data.password === DEMO_CREDENTIALS.password
    ) {
      window.location.href = '/chat-page';
    } else {
      setAuthError('بيانات الدخول غير صحيحة — استخدم الحساب التجريبي أدناه لتسجيل الدخول');
    }
    setIsLoading(false);
  };

  return (
    <div>
      <div className="mb-8 text-right">
        <h1 className="text-2xl font-bold text-foreground mb-1">مرحباً بعودتك</h1>
        <p className="text-sm text-muted-foreground">
          سجّل الدخول إلى حساب aylnor.ai الخاص بك
        </p>
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
          <label htmlFor="login-email" className="block text-sm font-semibold text-foreground mb-1.5 text-right">
            البريد الإلكتروني
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            className="input-field w-full px-4 py-2.5 rounded-xl text-sm text-left"
            dir="ltr"
            {...register('email', {
              required: 'البريد الإلكتروني مطلوب',
              pattern: { value: /\S+@\S+\.\S+/, message: 'أدخل بريداً إلكترونياً صحيحاً' },
            })}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-400 text-right">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5 flex-row-reverse">
            <label htmlFor="login-password" className="text-sm font-semibold text-foreground">
              كلمة المرور
            </label>
            <button
              type="button"
              className="text-xs text-gold nav-link-hover font-medium"
            >
              نسيت كلمة المرور؟
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••"
              className="input-field w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-left"
              dir="ltr"
              {...register('password', {
                required: 'كلمة المرور مطلوبة',
                minLength: { value: 6, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400 text-right">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2.5 flex-row-reverse">
          <input
            id="login-remember"
            type="checkbox"
            className="w-4 h-4 rounded border-border bg-input accent-primary"
            {...register('rememberMe')}
          />
          <label htmlFor="login-remember" className="text-sm text-muted-foreground">
            تذكرني لمدة 30 يوماً
          </label>
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

      {/* Demo credentials */}
      <div className="mt-8 glass-card rounded-xl p-4 border border-gold/20">
        <div className="flex items-center justify-between mb-3 flex-row-reverse">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            الحساب التجريبي
          </p>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="text-xs text-gold font-semibold hover:text-gold-light transition-colors"
          >
            ملء تلقائي
          </button>
        </div>
        <div className="space-y-2">
          {(
            [
              { field: 'email', label: 'البريد', value: DEMO_CREDENTIALS.email },
              { field: 'password', label: 'كلمة المرور', value: DEMO_CREDENTIALS.password },
            ] as { field: 'email' | 'password'; label: string; value: string }[]
          ).map((item) => (
            <div key={`demo-${item.field}`} className="flex items-center justify-between gap-3 flex-row-reverse">
              <div className="text-right">
                <span className="text-2xs text-muted-foreground">{item.label}: </span>
                <span className="text-xs font-mono text-foreground">{item.value}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.field)}
                className="text-muted-foreground hover:text-gold transition-colors"
                aria-label={`نسخ ${item.label}`}
              >
                {copiedField === item.field ? (
                  <Check size={13} className="text-green-400" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}