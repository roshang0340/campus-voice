import { Link, Outlet, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { LogOut, User as UserIcon, MessageSquare, BarChart3, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Campus Voice</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-neutral-900">{user.name}</span>
                <span className="text-xs text-neutral-500 capitalize">{user.role} {user.department ? `(${user.department})` : ''}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-neutral-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-neutral-500">
          &copy; {new Date().getFullYear()} Campus Voice. Secure & Anonymous.
        </div>
      </footer>
    </div>
  );
}

import { Navigate } from 'react-router-dom';
