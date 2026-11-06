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
  Home,
  GraduationCap,
  Shield,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import type { Profile, InAppNotification } from '../types/index.ts';
import type { AppView } from '../App.tsx';
import { dataService } from '../lib/dataService.ts';

interface NavbarProps {
  currentUser: Profile | null;
  onOpenStudentLogin: () => void;
  onOpenAdminLogin: () => void;
  onOpenSupabaseModal: () => void;
  onNavigate: (view: AppView) => void;
  onLogout?: () => void;
  currentView: AppView;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenStudentLogin,
  onOpenAdminLogin,
  onOpenSupabaseModal,
  onNavigate,
  onLogout,
  currentView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const isConnected = dataService.isConnectedToSupabase;
  const notifications = dataService.getNotifications(currentUser?.id);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else {
      await dataService.logout();
      onNavigate('selection');
    }
    setMobileMenuOpen(false);
  };

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-18">
            {/* Brand Logo & Tagline */}
            <button
              onClick={() => handleNavClick('selection')}
              className="flex items-center gap-2 sm:gap-3 text-left focus:outline-none group min-h-[44px]"
              aria-label="REGISTER TO EVENT Home"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-900 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
                <span className="font-extrabold text-xs sm:text-sm tracking-wider">RTE</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                    REGISTER TO EVENT
                  </span>
                  <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-md shrink-0">
                    Jamshedpur 2026
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-indigo-600 font-medium tracking-wide hidden sm:block truncate">
                  Discover. Register. Participate.
                </p>
              </div>
            </button>

            {/* Center Navigation Links - Desktop Only */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => handleNavClick('selection')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'selection'
                    ? 'bg-slate-100 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Login Selection
              </button>
              <button
                onClick={() => handleNavClick('forums')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'forums'
                    ? 'bg-slate-100 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Browse Forums
              </button>
              <button
                onClick={() => handleNavClick('student')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'student' || currentView === 'login_student' || currentView === 'signup'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Student Portal
              </button>
              <button
                onClick={() => handleNavClick('admin')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'admin' || currentView === 'login_admin'
                    ? 'bg-purple-50 text-purple-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Admin Dashboard
              </button>
              <button
                onClick={() => handleNavClick('verify')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'verify'
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Verify Pass
              </button>
            </nav>

            {/* Right Controls: Database status, notifications, auth buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Supabase Status Pill */}
              <button
                onClick={onOpenSupabaseModal}
                title="Click to view Supabase Connection & SQL Schema"
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border transition-colors min-h-[36px] ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                aria-label="Database Status"
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {isConnected ? 'Supabase Live' : 'Supabase Config'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
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
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center pointer-events-none">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 sm:p-4 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-indigo-600" /> Notifications
                      </h4>
                      <span className="text-[10px] sm:text-xs text-slate-500">
                        {notifications.length} updates
                      </span>
                    </div>
                    <div className="mt-2.5 max-h-64 sm:max-h-72 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div className="font-semibold text-slate-900 flex items-center justify-between">
                              <span className="truncate pr-2">{n.title}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {new Date(n.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop User Status & Auth Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                {currentUser ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        handleNavClick(currentUser.role === 'student' ? 'student' : 'admin')
                      }
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-left min-h-[40px]"
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                          currentUser.role === 'student' ? 'bg-indigo-600' : 'bg-purple-700'
                        }`}
                      >
                        {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="text-xs">
                        <p className="font-semibold text-slate-900 leading-tight truncate max-w-[100px]">
                          {currentUser.full_name}
                        </p>
                        <p className="text-[10px] text-slate-500 capitalize">
                          {currentUser.role === 'main_admin' ? 'Main Admin' : currentUser.role}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={handleLogout}
                      title="Sign out"
                      className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      aria-label="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onOpenStudentLogin}
                      className="px-3 py-1.5 min-h-[38px] text-xs font-bold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      Student Login
                    </button>
                    <button
                      onClick={onOpenAdminLogin}
                      className="px-3 py-1.5 min-h-[38px] text-xs font-bold rounded-xl text-white bg-slate-900 hover:bg-purple-900 transition-colors"
                    >
                      Admin
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Full Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            {/* User Profile Card on mobile */}
            {currentUser ? (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                      currentUser.role === 'student' ? 'bg-indigo-600' : 'bg-purple-700'
                    }`}
                  >
                    {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {currentUser.full_name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {currentUser.role === 'main_admin' ? 'Main Admin' : currentUser.role} •{' '}
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-[11px] shrink-0"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenStudentLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs text-center"
                >
                  Student Login
                </button>
                <button
                  onClick={() => {
                    onOpenAdminLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs text-center"
                >
                  Admin Portal
                </button>
              </div>
            )}

            {/* Navigation links */}
            <div className="space-y-1">
              <button
                onClick={() => handleNavClick('selection')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold min-h-[44px] ${
                  currentView === 'selection'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Login Selection (Home)</span>
              </button>

              <button
                onClick={() => handleNavClick('forums')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold min-h-[44px] ${
                  currentView === 'forums'
                    ? 'bg-slate-100 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Browse Forums Catalog</span>
              </button>

              <button
                onClick={() => handleNavClick('student')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold min-h-[44px] ${
                  currentView === 'student' || currentView === 'login_student' || currentView === 'signup'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Student Portal & Passes</span>
              </button>

              <button
                onClick={() => handleNavClick('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold min-h-[44px] ${
                  currentView === 'admin' || currentView === 'login_admin'
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin Dashboard & Telemetry</span>
              </button>

              <button
                onClick={() => handleNavClick('verify')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold min-h-[44px] ${
                  currentView === 'verify'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verify Gate Pass QR</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  onOpenSupabaseModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold min-h-[44px]"
              >
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Supabase Schema & Settings</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isConnected ? 'Connected' : 'Sandbox'}
                </span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Floating Bottom Navigation Bar for rapid thumb access */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg"
      >
        <button
          onClick={() => handleNavClick('selection')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl min-w-[56px] min-h-[48px] ${
            currentView === 'selection' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Portal</span>
        </button>

        <button
          onClick={() => handleNavClick('forums')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl min-w-[56px] min-h-[48px] ${
            currentView === 'forums' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Forums</span>
        </button>

        <button
          onClick={() => handleNavClick('student')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl min-w-[56px] min-h-[48px] ${
            currentView === 'student' || currentView === 'login_student' || currentView === 'signup'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Student</span>
        </button>

        <button
          onClick={() => handleNavClick('admin')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl min-w-[56px] min-h-[48px] ${
            currentView === 'admin' || currentView === 'login_admin'
              ? 'text-purple-700 font-bold'
              : 'text-slate-500'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Admin</span>
        </button>

        <button
          onClick={() => handleNavClick('verify')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl min-w-[56px] min-h-[48px] ${
            currentView === 'verify' ? 'text-emerald-700 font-bold' : 'text-slate-500'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Verify</span>
        </button>
      </nav>
    </>
  );
};
