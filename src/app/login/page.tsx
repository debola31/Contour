'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Image from 'next/image';
import { getAssetPath } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOperatorLogin, setShowOperatorLogin] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useStore((state) => state.login);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(email, password);
    if (user) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32">
              <Image
                src={getAssetPath('/contour-logo.svg')}
                alt="Contour Logo"
                width={128}
                height={128}
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">CONTOUR</h1>
          <p className="text-neutral-gray text-lg">Enterprise Resource Planning</p>
        </div>

        {!showOperatorLogin ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6">Professional Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-gray mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-neutral-gray/30 rounded-lg text-white placeholder-neutral-gray/50 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                  placeholder="your.email@contour.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-gray mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-neutral-gray/30 rounded-lg text-white placeholder-neutral-gray/50 focus:outline-none focus:ring-2 focus:ring-steel-blue"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full gradient-button text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-gray/20">
              <button
                onClick={() => setShowOperatorLogin(true)}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 border border-neutral-gray/30"
              >
                Operator Login →
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-neutral-gray">
              <p>Demo Credentials:</p>
              <p className="mt-2">Owner: john.smith@contour.com</p>
              <p>Salesperson: emma.brown@contour.com</p>
              <p className="text-xs mt-2">(Any password works in demo mode)</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6">Operator Login</h2>
            <div className="text-center">
              <div className="bg-white p-6 rounded-xl mb-6">
                <p className="text-deep-indigo text-sm mb-4">Scan your QR code to log in</p>
                <div className="text-6xl">📷</div>
              </div>
              <p className="text-neutral-gray text-sm mb-6">
                Position your QR code in front of the scanner
              </p>
              <button
                onClick={() => setShowOperatorLogin(false)}
                className="text-steel-blue hover:text-steel-blue-light transition-colors"
              >
                ← Back to Professional Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
