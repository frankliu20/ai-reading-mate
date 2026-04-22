'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Sparkles, Settings } from 'lucide-react';

const tabs = [
  { href: '/', label: '首页', icon: Home },
  { href: '/shelf', label: '书架', icon: BookOpen },
  { href: '/recommend', label: 'AI 推荐', icon: Sparkles },
  { href: '/settings', label: '设置', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur md:static md:border-t-0 md:border-b">
      <div className="mx-auto max-w-3xl flex md:justify-start md:gap-8 md:px-6 md:py-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 md:flex-none flex md:flex-row flex-col items-center gap-1 md:gap-2 py-2.5 md:py-0 text-xs md:text-sm transition-colors ${
                active
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Icon size={20} className="md:size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
