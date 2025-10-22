'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Receipt,
  Calendar,
  BarChart3,
  Megaphone,
  Settings,
  LogOut,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser, logout } = useStore();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { user: currentUser } = await api.getMe();
        setUser(currentUser);
      } catch {
        router.push('/');
      }
    };

    if (!user) {
      loadUser();
    }
  }, [user, setUser, router]);

  const handleLogout = () => {
    api.clearToken();
    logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', href: '/dashboard/leads', icon: Users },
    { name: 'Quotes', href: '/dashboard/quotes', icon: FileText },
    { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
    { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[#0B0E0F] text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#00A8A8]">Seamless</h1>
          <p className="text-sm text-gray-400 mt-1">{user.organization?.name}</p>
        </div>

        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mb-1"
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#00A8A8] flex items-center justify-center">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 mt-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
