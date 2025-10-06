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

  const handleOwnerLogin = () => {
    const owners = personnel.filter(p => p.role === 'owner');
    if (owners.length === 0) return;
    const randomOwner = owners[Math.floor(Math.random() * owners.length)];
    const user = login(randomOwner.email, 'password');
    if (user) router.push('/dashboard');
  };

  const handleAdminLogin = () => {
    const admins = personnel.filter(p => p.role === 'salesperson');
    if (admins.length === 0) return;
    const randomAdmin = admins[Math.floor(Math.random() * admins.length)];
    const user = login(randomAdmin.email, 'password');
    if (user) router.push('/dashboard');
  };

  const handleOperatorLogin = () => {
    const operators = personnel.filter(p => p.role === 'operator');
    if (operators.length === 0) return;
    const randomOperator = operators[Math.floor(Math.random() * operators.length)];
    const user = loginOperator(randomOperator.qrCode, 'default-station');
    if (user) router.push('/dashboard');
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl px-8 py-6 shadow-lg inline-block">
              <Image
                src={getAssetPath('/ctm-logo.png')}
                alt="CTM Logo"
                width={320}
                height={100}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <p className="text-white/80 text-lg font-light">Manufacturing Management System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">Quick Login</h2>

          <div className="space-y-4">
            <button
              onClick={handleOwnerLogin}
              className="w-full gradient-button text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 hover:shadow-lg text-lg"
            >
              Login as Owner
            </button>

            <button
              onClick={handleAdminLogin}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 border border-neutral-gray/30 text-lg"
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
            <p className="mt-2 text-xs">Owner: Company Owner</p>
            <p className="text-xs">Admin: Salesperson</p>
            <p className="text-xs">Operator: Production Floor Worker</p>
          </div>
        </div>
      </div>
    </div>
  );
}
