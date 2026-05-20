'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X } from 'lucide-react';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'المميزات', href: '#features' },
    { label: 'عن المطور', href: '#creator' },
    { label: 'التوثيق', href: '#' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-navy/90 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-up-login-screen"
            className="text-sm font-medium text-muted-foreground nav-link-hover px-4 py-2"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/sign-up-login-screen"
            className="btn-gold text-sm font-semibold px-5 py-2 rounded-lg"
          >
            ابدأ الآن
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks?.map((link) => (
            <a
              key={`nav-${link?.label}`}
              href={link?.href}
              className="text-sm font-medium text-muted-foreground nav-link-hover"
            >
              {link?.label}
            </a>
          ))}
        </nav>

        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-bold text-xl tracking-tight text-foreground">
            aylnor<span className="text-gold">.ai</span>
          </span>
          <AppLogo size={36} />
        </Link>

        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="تبديل القائمة"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-navy/95 backdrop-blur-md border-b border-border px-6 py-4 flex flex-col gap-4">
          {navLinks?.map((link) => (
            <a
              key={`mobile-nav-${link?.label}`}
              href={link?.href}
              className="text-sm font-medium text-muted-foreground nav-link-hover text-right"
              onClick={() => setMobileOpen(false)}
            >
              {link?.label}
            </a>
          ))}
          <Link
            href="/sign-up-login-screen"
            className="btn-gold text-sm font-semibold px-5 py-2.5 rounded-lg text-center"
            onClick={() => setMobileOpen(false)}
          >
            ابدأ الآن
          </Link>
        </div>
      )}
    </header>
  );
}
