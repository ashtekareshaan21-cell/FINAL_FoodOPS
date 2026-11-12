import React from 'react';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';
import FoodOpsBackground from './visual/FoodOpsBackground';

interface PublicPageShellProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function PublicPageShell({
  eyebrow,
  title,
  subtitle,
  icon,
  children,
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 flex flex-col relative">
      <FoodOpsBackground variant="dashboard" />
      <Navbar />
      <main
        id="main-content"
        className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10"
      >
        <div className="space-y-4 border-b border-slate-200 pb-8">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-widest text-[#047857]">
              {eyebrow}
            </p>
          )}
          <div className="flex items-start gap-3.5">
            {icon && (
              <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-[#047857] flex items-center justify-center">
                {icon}
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        <div className="space-y-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
