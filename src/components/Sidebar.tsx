'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { getAssetPath } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const menuItems = [
  { name: 'Home', path: '/dashboard', icon: '⌂', roles: ['owner', 'salesperson', 'operator'] },
  { name: 'Station Work', path: '/dashboard/station', icon: '🔧', roles: ['operator'] },
  { name: 'Insights', path: '/dashboard/insights', icon: '☷', roles: ['owner', 'salesperson'] },
  { name: 'Inventory', path: '/dashboard/inventory', icon: '⊞', roles: ['owner', 'salesperson'] },
  { name: 'Customers', path: '/dashboard/customers', icon: '⚇', roles: ['owner', 'salesperson'] },
  { name: 'Work Orders', path: '/dashboard/work-orders', icon: '☰', roles: ['owner', 'salesperson'] },
  { name: 'Operators', path: '/dashboard/operators', icon: '⚙', roles: ['owner', 'salesperson'] },
  { name: 'Invoices', path: '/dashboard/invoices', icon: '⚖', roles: ['owner', 'salesperson'] },
  { name: 'Shipping', path: '/dashboard/shipping', icon: '⛟', roles: ['owner', 'salesperson'] },
  { name: 'Transactions', path: '/dashboard/transactions', icon: '☲', roles: ['owner', 'salesperson'] },
  { name: 'Personnel', path: '/dashboard/personnel', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>', roles: ['owner'] },
  { name: 'Templates', path: '/dashboard/templates', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>', roles: ['owner'] },
  { name: 'Admin', path: '/dashboard/admin', icon: '⚒', roles: ['owner'] },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const currentUser = useStore((state) => state.currentUser);

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
                  <span className="text-xl flex items-center justify-center w-6">
                    {item.icon.startsWith('<svg') ? (
                      <span className="w-6 h-6" dangerouslySetInnerHTML={{ __html: item.icon }} />
                    ) : (
                      item.icon
                    )}
                  </span>
                  {!isCollapsed && <span className="font-medium leading-none">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

    </div>
  );
}
