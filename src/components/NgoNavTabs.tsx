'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NgoNavTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Surplus Marketplace',
      href: '/ngo',
      icon: '🛒',
      exact: true,
      description: 'Discover & claim surplus food',
    },
    {
      name: 'Live Rescue Command & Monitor',
      href: '/ngo/active',
      icon: '🛰️',
      exact: false,
      badge: 'Live',
      description: 'Concurrent tracking & stage dispatch',
    },
    {
      name: 'Volunteers & Fleet Allotment',
      href: '/ngo/volunteers',
      icon: '👥',
      exact: false,
      description: 'Roster, batch & random assignment',
    },
    {
      name: 'Organic Recovery 2.0',
      href: '/ngo/recovery',
      icon: '♻️',
      exact: false,
      badge: 'Biogas',
      description: 'Pune biomethanation & clean energy',
    },
    {
      name: 'Rescue History',
      href: '/ngo/history',
      icon: '📜',
      exact: false,
      description: 'Completed cycles & audit trails',
    },
  ];

  return (
    <div className="mb-8 border-b border-border/70 pb-2">
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                  : 'bg-surface/80 hover:bg-surface text-muted-text hover:text-foreground border-border hover:border-border-hover'
              }`}
            >
              <span className="text-base group-hover:scale-110 transition-transform">
                {tab.icon}
              </span>
              <span>{tab.name}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                  isActive
                    ? 'bg-accent text-slate-900'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
