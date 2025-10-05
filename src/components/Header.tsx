'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function Header({ title }: { title: string }) {
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-[#111439]/50 backdrop-blur-sm border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="text-right hover:bg-white/5 px-4 py-2 rounded-lg transition-colors"
          >
            <div className="text-white font-medium">
              {currentUser?.firstName} {currentUser?.lastName}
            </div>
            <div className="text-[#B0B3B8] text-sm capitalize">
              {currentUser?.role}
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#111439] border border-white/10 rounded-xl shadow-xl z-20">
                <div className="p-3 border-b border-white/10">
                  <div className="text-white font-medium">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </div>
                  <div className="text-[#B0B3B8] text-xs capitalize">
                    {currentUser?.role}
                  </div>
                  {currentUser?.email && (
                    <div className="text-[#B0B3B8] text-xs mt-1">
                      {currentUser.email}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to profile/settings page (placeholder)
                    }}
                    className="w-full text-left px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-sm"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to preferences page (placeholder)
                    }}
                    className="w-full text-left px-3 py-2 text-white/70 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-sm"
                  >
                    Preferences
                  </button>
                </div>
                <div className="p-2 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
