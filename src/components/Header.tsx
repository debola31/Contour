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
    <header className="bg-[#111439]/50 backdrop-blur-sm border-b border-white/10 px-6 py-4 relative z-50">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <div className="flex items-center gap-4 relative" data-tour="user-info">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 text-white font-medium bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors border border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-[#4682B4] flex items-center justify-center text-sm font-semibold">
              {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
            </div>
            <span>{currentUser?.firstName} {currentUser?.lastName}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#111439] border border-white/10 rounded-xl shadow-2xl z-[9999] backdrop-blur-md">
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
