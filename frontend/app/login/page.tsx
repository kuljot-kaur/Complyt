'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Call authentication API
      console.log('Login attempt:', formData);

      // Simulate login success
      localStorage.setItem('auth_token', 'dummy_token_' + Date.now());
      if (formData.rememberMe) {
        localStorage.setItem('remembered_email', formData.email);
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-surface font-body text-on-surface flex items-center justify-center p-6 ruled-line-bg">
      {/* Background Decoration */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-48 w-[600px] h-[600px] bg-tertiary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Auth Container */}
      <div className="w-full max-w-md">
        {/* Brand Section */}
        <div className="text-center mb-10">
          <h1 className="font-headline text-4xl italic font-semibold text-primary tracking-tight mb-2">Complyt AI</h1>
          <p className="font-headline text-lg text-secondary tracking-wide italic">Autonomous Document Compliance Platform</p>
        </div>

        {/* Glassmorphism Auth Card */}
        <div className="relative bg-surface-container-lowest/80 backdrop-blur-xl rounded-xl whisper-shadow paper-fold p-10 border-[0.5px] border-outline-variant">
          {/* Corner Fold Visual */}
          <div className="absolute top-0 right-0 w-8 h-8 bg-surface-container-low" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}></div>

          <div className="space-y-8">
            {/* Header */}
            <div>
              <h2 className="font-headline text-3xl text-on-surface font-medium leading-none mb-1">Sign In</h2>
              <span className="font-label text-sm text-secondary uppercase tracking-widest opacity-70">Journal Entry 001</span>
            </div>

            {/* Error Message */}
            {error && <div className="p-4 bg-error/10 border-l-4 border-error rounded text-error text-sm">{error}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="relative group">
                <label className="font-label text-xs font-bold text-secondary-container mb-1 block" htmlFor="email">
                  USER IDENTIFIER
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@enterprise.com"
                  required
                  className="input-field"
                />
                <span className="absolute right-0 bottom-3 text-secondary/40 font-headline italic text-sm">Required</span>
              </div>

              {/* Password Field */}
              <div className="relative group">
                <label className="font-label text-xs font-bold text-secondary-container mb-1 block" htmlFor="password">
                  SECURE KEY
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-3 text-secondary/40 cursor-pointer hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-body font-bold text-sm tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin">
                        <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                      </div>
                      Authenticating...
                    </>
                  ) : (
                    'Authenticate'
                  )}
                </button>

                <div className="flex items-center justify-between">
                  <Link href="/forgot-password" className="font-headline italic text-secondary hover:text-primary transition-colors text-sm">
                    Forgot secret key?
                  </Link>
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-4 h-4 rounded-sm border-outline-variant text-primary focus:ring-primary/20"
                    />
                    <label className="font-label text-xs text-secondary" htmlFor="remember">
                      Keep active
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
