'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Image from 'next/image';
import { getAssetPath } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const personnel = useStore((state) => state.personnel);
  const login = useStore((state) => state.login);
  const loginOperator = useStore((state) => state.loginOperator);

  const handleAdminLogin = () => {
    // Get all non-operator personnel (owners and salespeople)
    const admins = personnel.filter(p => p.role === 'owner' || p.role === 'salesperson');

    if (admins.length === 0) return;

    // Pick a random admin
    const randomAdmin = admins[Math.floor(Math.random() * admins.length)];

    // Login with their email
    const user = login(randomAdmin.email, 'password'); // Password doesn't matter in demo

    if (user) {
      router.push('/dashboard');
    }
  };

  const handleOperatorLogin = () => {
    // Get all operators
    const operators = personnel.filter(p => p.role === 'operator');

    if (operators.length === 0) return;

    // Pick a random operator
    const randomOperator = operators[Math.floor(Math.random() * operators.length)];

    // Login with their QR code
    const user = loginOperator(randomOperator.qrCode, 'default-station');

    if (user) {
      router.push('/dashboard');
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

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Quick Login</h2>

          <div className="space-y-4">
            <button
              onClick={handleAdminLogin}
              className="w-full gradient-button text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 hover:shadow-lg text-lg"
            >
              Login as Admin
            </button>

            <button
              onClick={handleOperatorLogin}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 border border-neutral-gray/30 text-lg"
            >
              Login as Operator
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-neutral-gray">
            <p>Click a button to login as a random user</p>
            <p className="mt-2 text-xs">Admin: Owner or Salesperson</p>
            <p className="text-xs">Operator: Production Floor Worker</p>
          </div>
        </div>
      </div>
    </div>
  );
}
