'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function TopNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/upload', label: 'Upload' },
    { href: '/history', label: 'History' },
    { href: '/settings', label: 'Settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/upload') {
      return pathname === '/upload' || pathname.startsWith('/processing') || pathname.startsWith('/results');
    }

    if (href === '/history') {
      return pathname === '/history' || pathname.startsWith('/document');
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    const currentlyDark = document.documentElement.classList.contains('dark');
    setIsDark(currentlyDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-xl shadow-sm flex justify-between items-center w-full px-8 py-4">
      <div className="flex items-center gap-12">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-headline italic font-semibold text-primary">Complyt AI</span>
        </Link>

        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-1 font-medium transition-colors duration-300 text-sm ${
                isActive(item.href)
                  ? 'text-primary border-b-0.5 border-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary dark:hover:text-primary'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex relative">
          <input
            type="text"
            placeholder="Search records..."
            className="bg-surface-container-low border-none focus:ring-1 focus:ring-primary rounded-xl px-4 py-2 text-sm w-64 transition-all"
          />
          <span className="material-symbols-outlined absolute right-3 top-2 text-outline text-lg opacity-70">search</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="text-stone-500 dark:text-stone-400 hover:text-primary transition-colors duration-300"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>

          <button className="text-stone-500 dark:text-stone-400 hover:text-primary transition-colors duration-300">
            <span className="material-symbols-outlined">notifications</span>
          </button>

          <div className="relative group">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2">
              <img
                src="https://via.placeholder.com/36"
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover border border-outline-variant"
              />
              <span className="text-sm font-medium text-on-surface hidden md:inline">Profile</span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg p-2">
                <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-surface-container rounded-md transition-colors">
                  View Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container rounded-md transition-colors text-error"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
