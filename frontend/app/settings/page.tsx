'use client';

import { TopNavbar } from '@/components/TopNavbar';

export default function SettingsPage() {
  return (
    <>
      <TopNavbar />

      <main className="max-w-4xl mx-auto px-8 py-12">
        <header className="mb-12">
          <h1 className="text-5xl font-headline tracking-tight font-medium mb-2">Settings</h1>
          <p className="text-secondary italic font-body">Manage your account and preferences</p>
        </header>

        <div className="card">
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-secondary/30 mb-4">build</span>
            <h2 className="text-2xl font-headline mb-2">Settings Coming Soon</h2>
            <p className="text-secondary">Settings page will be available in the next release</p>
          </div>
        </div>
      </main>
    </>
  );
}
