'use client';

import { useStore } from '@/store/useStore';

export default function Header({ title }: { title: string }) {
  const currentUser = useStore((state) => state.currentUser);

  return (
    <header className="bg-[#111439]/50 backdrop-blur-sm border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-white font-medium">
              {currentUser?.firstName} {currentUser?.lastName}
            </div>
            <div className="text-[#B0B3B8] text-sm capitalize">
              {currentUser?.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
