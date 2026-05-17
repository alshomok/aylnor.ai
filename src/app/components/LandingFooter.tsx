import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border py-10 sm:py-12 px-4 sm:px-6 lg:px-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground text-center md:text-right">
            © 2026 aylnor.ai — بُني بواسطة Aylnor Vasquez
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground flex-wrap justify-center">
            <Link href="#" className="nav-link-hover">
              الخصوصية
            </Link>
            <Link href="#" className="nav-link-hover">
              الشروط
            </Link>
            <Link href="#" className="nav-link-hover">
              التواصل
            </Link>
            <Link href="/sign-up-login-screen" className="nav-link-hover">
              تسجيل الدخول
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-base text-foreground">
              aylnor<span className="text-gold">.ai</span>
            </span>
            <AppLogo size={30} />
          </div>
        </div>
      </div>
    </footer>
  );
}
