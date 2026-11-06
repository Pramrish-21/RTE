import React, { useState } from 'react';
import {
  Calendar,
  ShieldCheck,
  User,
  LogOut,
  Bell,
  Database,
  ExternalLink,
  Menu,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { Profile, InAppNotification } from '../types/index.ts';
import { dataService } from '../lib/dataService.ts';

interface NavbarProps {
  currentUser: Profile | null;
  onOpenStudentLogin: () => void;
  onOpenAdminLogin: () => void;
  onOpenSupabaseModal: () => void;
  onNavigate: (view: 'home' | 'student' | 'admin' | 'verify') => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenStudentLogin,
  onOpenAdminLogin,
  onOpenSupabaseModal,
  onNavigate,
  currentView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const isConnected = dataService.isConnectedToSupabase;
  const notifications = dataService.getNotifications(currentUser?.id);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    dataService.logout();
    onNavigate('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Tagline */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-900 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-base tracking-wider">RTE</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  REGISTER TO EVENT
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-md">
                  Jamshedpur 2026
                </span>
              </div>
              <p className="text-xs text-indigo-600 font-medium tracking-wide hidden sm:block">
                Discover. Register. Participate.
              </p>
            </div>
          </button>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'home'
                  ? 'bg-slate-100 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Browse Forums
            </button>
            <button
              onClick={() => onNavigate('student')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'student'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Student Portal
            </button>
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'admin'
                  ? 'bg-purple-50 text-purple-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => onNavigate('verify')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === 'verify'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Verify Pass
            </button>
          </nav>

          {/* Right Controls: Database status, notifications, auth buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Supabase Status Pill */}
            <button
              onClick={onOpenSupabaseModal}
              title="Click to view Supabase Connection & SQL Schema"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {isConnected ? 'Supabase Live' : 'Supabase Config'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </button>

            {/* In-app Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  if (unreadCount > 0) {
                    dataService.markNotificationsRead(currentUser?.id);
                  }
                }}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-600" /> Notifications
                    </h4>
                    <span className="text-xs text-slate-500">
                      {notifications.length} updates
                    </span>
                  </div>
                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="font-semibold text-slate-900 flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Auth State */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onNavigate(currentUser.role === 'student' ? 'student' : 'admin')
                  }
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-left"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                      currentUser.role === 'student'
                        ? 'bg-indigo-600'
                        : 'bg-purple-700'
                    }`}
                  >
                    {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-xs">
                    <p className="font-semibold text-slate-900 leading-tight truncate max-w-[110px]">
                      {currentUser.full_name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {currentUser.role === 'main_admin'
                        ? 'Main Admin'
                        : currentUser.role}
                    </p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenStudentLogin}
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  Student Login
                </button>
                <button
                  onClick={onOpenAdminLogin}
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-slate-900 hover:bg-purple-900 transition-colors"
                >
                  Admin
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Browse Forums
            </button>
            <button
              onClick={() => {
                onNavigate('student');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Student Portal
            </button>
            <button
              onClick={() => {
                onNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-purple-700 hover:bg-purple-50"
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => {
                onNavigate('verify');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Verify Pass
            </button>
            <button
              onClick={() => {
                onOpenSupabaseModal();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center justify-between"
            >
              <span>Supabase Status & SQL Schema</span>
              <Database className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
