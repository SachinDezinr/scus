'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import Logo from '@/components/logo';

export default function LoginPage() {
  const { user, login, register, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    fetch('/api/auth/seed-admin', { method: 'POST' }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    const result = mode === 'login' ? await login(email, password) : await register(email, password, name);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(mode === 'login' ? 'Authentication successful' : 'Account created successfully');
      router.replace('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c10]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-2 rounded-xl bg-[#14161f] border border-[#202330] mb-3">
            <Logo size={36} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Smart Student Utility System</h1>
          <p className="text-xs text-muted-foreground mt-1">Campus Operations & Resource Management</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-xl p-6 border border-[#232634] shadow-xl">
          {/* Switcher */}
          <div className="flex p-1 rounded-lg bg-[#171822] border border-[#232634] mb-5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mode === 'login' ? 'bg-[#252838] text-white shadow-xs' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mode === 'register' ? 'bg-[#252838] text-white shadow-xs' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#14161f] border border-[#232634] text-xs text-white placeholder:text-muted-foreground/40 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">Campus Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@university.edu"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#14161f] border border-[#232634] text-xs text-white placeholder:text-muted-foreground/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#14161f] border border-[#232634] text-xs text-white placeholder:text-muted-foreground/40 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Authenticate' : 'Complete Registration'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#1c1f2b] flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Institutional access token required</span>
          </div>
        </div>
      </div>
    </div>
  );
}