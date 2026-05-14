'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>();

  const password = watch('password', '');

  const passwordStrength = (pw: string): { level: number; label: string; color: string } => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: 'ضعيفة', color: 'bg-red-500' };
    if (score === 2) return { level: 2, label: 'مقبولة', color: 'bg-yellow-500' };
    if (score === 3) return { level: 3, label: 'جيدة', color: 'bg-blue-400' };
    return { level: 4, label: 'قوية', color: 'bg-green-500' };
  };

  const strength = passwordStrength(password);

  // Backend integration point: replace with real registration API call
  const onSubmit = async (_data: SignupFormValues) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setIsLoading(false);
    setSuccess(true);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Full name */}
        <div>
          <label htmlFor="signup-name" className="block text-sm font-semibold text-foreground mb-1.5 text-right">
            الاسم الكامل
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="أمارا أوسي"
            className="input-field w-full px-4 py-2.5 rounded-xl text-sm text-right"
            {...register('fullName', {
              required: 'الاسم الكامل مطلوب',
              minLength: { value: 2, message: 'الاسم يجب أن يكون حرفين على الأقل' },
            })}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-red-400 text-right">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="signup-email" className="block text-sm font-semibold text-foreground mb-1.5 text-right">
            البريد الإلكتروني
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="block text-sm font-semibold text-foreground mb-1.5 text-right">
            كلمة المرور
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8 أحرف على الأقل"
              className="input-field w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-left"
              dir="ltr"
              {...register('password', {
                required: 'كلمة المرور مطلوبة',
                minLength: { value: 8, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' },
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
          {/* Strength meter */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={`strength-bar-${i}`}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= strength.level ? strength.color : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-right">
                القوة: <span className="font-semibold text-foreground">{strength.label}</span>
              </p>
            </div>
          )}
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-400 text-right">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="signup-confirm" className="block text-sm font-semibold text-foreground mb-1.5 text-right">
            تأكيد كلمة المرور
          </label>
          <div className="relative">
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="أعد إدخال كلمة المرور"
              className="input-field w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-left"
              dir="ltr"
              {...register('confirmPassword', {
                required: 'يرجى تأكيد كلمة المرور',
                validate: (val) => val === password || 'كلمتا المرور غير متطابقتين',
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-400 text-right">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2.5 flex-row-reverse">
          <input
            id="signup-terms"
            type="checkbox"
            className="w-4 h-4 mt-0.5 rounded border-border bg-input accent-primary shrink-0"
            {...register('terms', { required: 'يجب قبول الشروط للمتابعة' })}
          />
          <label htmlFor="signup-terms" className="text-sm text-muted-foreground leading-relaxed text-right">
            أوافق على{' '}
            <a href="#" className="text-gold font-medium nav-link-hover">شروط الخدمة</a>
            {' '}و{' '}
            <a href="#" className="text-gold font-medium nav-link-hover">سياسة الخصوصية</a>
          </label>
        </div>
        {errors.terms && (
          <p className="-mt-3 text-xs text-red-400 text-right">{errors.terms.message}</p>
        )}

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