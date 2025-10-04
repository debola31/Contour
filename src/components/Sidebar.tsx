'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAssetPath } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const menuItems = [
  { name: 'Home', path: '/dashboard', icon: '◆', roles: ['owner', 'salesperson', 'operator'] },
  { name: 'Insights', path: '/dashboard/insights', icon: '▣', roles: ['owner', 'salesperson'] },
  { name: 'Inventory', path: '/dashboard/inventory', icon: '▢', roles: ['owner', 'salesperson'] },
  { name: 'Customers', path: '/dashboard/customers', icon: '◉', roles: ['owner', 'salesperson'] },
  { name: 'Work Orders', path: '/dashboard/work-orders', icon: '▤', roles: ['owner', 'salesperson'] },
  { name: 'Operators', path: '/dashboard/operators', icon: '◈', roles: ['owner', 'salesperson'] },
  { name: 'Invoices', path: '/dashboard/invoices', icon: '▥', roles: ['owner', 'salesperson'] },
  { name: 'Shipping', path: '/dashboard/shipping', icon: '▦', roles: ['owner', 'salesperson'] },
  { name: 'Transactions', path: '/dashboard/transactions', icon: '▧', roles: ['owner', 'salesperson'] },
  { name: 'Admin', path: '/dashboard/admin', icon: '◎', roles: ['owner'] },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const visibleMenuItems = menuItems.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-[#111439] h-screen flex flex-col border-r border-white/10`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0">
              <Image
                src={getAssetPath('/contour-logo.svg')}
                alt="Contour"
                width={40}
                height={40}
              />
            </div>
            {!isCollapsed && (
              <span className="text-white font-bold text-lg">CONTOUR</span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#4682B4] text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="text-white/60 text-sm">
              <div className="font-medium text-white">{currentUser?.firstName} {currentUser?.lastName}</div>
              <div className="text-xs capitalize">{currentUser?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center text-2xl hover:opacity-80 transition-opacity"
            title="Logout"
          >
            ◀
          </button>
        )}
      </div>
    </div>
  );
}
