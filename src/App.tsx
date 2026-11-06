import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HomeView } from './components/HomeView.tsx';
import { StudentDashboardView } from './components/StudentDashboardView.tsx';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { PublicVerificationView } from './components/PublicVerificationView.tsx';
import { StudentAuthModal } from './components/StudentAuthModal.tsx';
import { AdminAuthModal } from './components/AdminAuthModal.tsx';
import { StudentRegistrationModal } from './components/StudentRegistrationModal.tsx';
import { SupabaseSetupModal } from './components/SupabaseSetupModal.tsx';
import { dataService } from './lib/dataService.ts';
import type { Profile, Forum, Registration } from './types/index.ts';
import { AlertTriangle, Database, ArrowRight, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => dataService.getCurrentUser());
  const [currentView, setCurrentView] = useState<'home' | 'student' | 'admin' | 'verify'>('home');
  const [verifyRegId, setVerifyRegId] = useState<string | undefined>(undefined);

  // Modals
  const [studentAuthOpen, setStudentAuthOpen] = useState(false);
  const [studentAuthInitialMode, setStudentAuthInitialMode] = useState<'login' | 'register'>('login');
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [registerModalForum, setRegisterModalForum] = useState<Forum | null>(null);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [unauthorizedAdminNotice, setUnauthorizedAdminNotice] = useState<string | null>(null);

  // Subscribe to dataService updates
  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setCurrentUser(dataService.getCurrentUser());
    });
    return unsub;
  }, []);

  // Handle URL paths on mount and popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const search = new URLSearchParams(window.location.search);
      const regId = search.get('regId');

      if (regId) {
        setVerifyRegId(regId);
        setCurrentView('verify');
        return;
      }

      if (path === '/login/student') {
        setStudentAuthInitialMode('login');
        setStudentAuthOpen(true);
      } else if (path === '/register/student' || path === '/register') {
        setStudentAuthInitialMode('register');
        setStudentAuthOpen(true);
      } else if (path === '/login/admin') {
        setAdminAuthOpen(true);
      } else if (path === '/student/dashboard') {
        setCurrentView('student');
      } else if (path === '/admin/dashboard') {
        // Enforce admin permission
        const user = dataService.getCurrentUser();
        if (user && ['admin', 'main_admin'].includes(user.role)) {
          setCurrentView('admin');
        } else {
          setUnauthorizedAdminNotice(
            'Access to /admin/dashboard was denied. You must authenticate with an authorized administrative account.'
          );
          setAdminAuthOpen(true);
          setCurrentView('home');
        }
      } else if (path === '/verify') {
        setCurrentView('verify');
      } else {
        setCurrentView('home');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (view: 'home' | 'student' | 'admin' | 'verify') => {
    setUnauthorizedAdminNotice(null);
    let targetPath = '/';
    const user = dataService.getCurrentUser();

    if (view === 'student') {
      if (!user) {
        setStudentAuthInitialMode('login');
        setStudentAuthOpen(true);
        return;
      }
      targetPath = '/student/dashboard';
    } else if (view === 'admin') {
      if (!user || !['admin', 'main_admin'].includes(user.role)) {
        setAdminAuthOpen(true);
        return;
      }
      targetPath = '/admin/dashboard';
    } else if (view === 'verify') {
      targetPath = '/verify';
    }

    window.history.pushState({}, '', targetPath);
    setCurrentView(view);
  };

  const handleOpenRegisterModal = (forum?: Forum) => {
    setRegisterModalForum(forum || null);
    setRegisterModalOpen(true);
  };

  const handleStudentAuthSuccess = () => {
    setStudentAuthOpen(false);
    const user = dataService.getCurrentUser();
    setCurrentUser(user);
    navigateTo('student');
  };

  const handleAdminAuthSuccess = () => {
    setAdminAuthOpen(false);
    const user = dataService.getCurrentUser();
    setCurrentUser(user);
    navigateTo('admin');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Banner if Supabase is in Sandbox / Setup mode */}
      {!dataService.isConnectedToSupabase && (
        <aside
          aria-label="Database Configuration Notice"
          className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 text-xs font-semibold shadow-inner"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Database className="w-4 h-4 text-amber-200 shrink-0" />
              <span>
                <strong>Supabase Database:</strong> Operating in Local Interactive Sandbox. Connect your live Supabase project to activate PostgreSQL & Auth persistence.
              </span>
            </div>
            <button
              onClick={() => setSupabaseModalOpen(true)}
              className="px-3 py-1 bg-white text-amber-900 rounded-lg font-bold text-[11px] hover:bg-amber-50 shadow-xs shrink-0"
            >
              Configure Supabase & View SQL
            </button>
          </div>
        </aside>
      )}

      {/* Main Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onOpenStudentLogin={() => {
          setStudentAuthInitialMode('login');
          setStudentAuthOpen(true);
        }}
        onOpenAdminLogin={() => {
          setAdminAuthOpen(true);
        }}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        onNavigate={navigateTo}
      />

      {/* Unauthorized Admin Access Notice */}
      {unauthorizedAdminNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{unauthorizedAdminNotice}</span>
            </div>
            <button
              onClick={() => setUnauthorizedAdminNotice(null)}
              className="text-xs text-rose-700 underline font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onOpenRegisterModal={handleOpenRegisterModal}
            onOpenStudentLogin={() => {
              setStudentAuthInitialMode('login');
              setStudentAuthOpen(true);
            }}
            onOpenAdminLogin={() => {
              setAdminAuthOpen(true);
            }}
            onNavigateVerify={() => navigateTo('verify')}
          />
        )}

        {currentView === 'student' && (
          currentUser ? (
            <StudentDashboardView
              currentUser={currentUser}
              onOpenRegisterModal={handleOpenRegisterModal}
            />
          ) : (
            <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Student Portal Login Required</h2>
              <p className="text-xs text-slate-500">
                Please sign in to view your registrations and download official invitation passes.
              </p>
              <button
                onClick={() => {
                  setStudentAuthInitialMode('login');
                  setStudentAuthOpen(true);
                }}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Sign In Now
              </button>
            </div>
          )
        )}

        {currentView === 'admin' && (
          currentUser && ['admin', 'main_admin'].includes(currentUser.role) ? (
            <AdminDashboardView
              currentUser={currentUser}
              onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
            />
          ) : (
            <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
              <h2 className="text-xl font-bold text-rose-700">Administrative Access Denied</h2>
              <p className="text-xs text-slate-500">
                You must authenticate with an authorized administrative account to access this section.
              </p>
              <button
                onClick={() => setAdminAuthOpen(true)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-purple-900 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Admin Sign-In
              </button>
            </div>
          )
        )}

        {currentView === 'verify' && (
          <PublicVerificationView
            initialRegId={verifyRegId}
            onNavigateHome={() => navigateTo('home')}
          />
        )}
      </main>

      {/* Global Modals */}
      <StudentAuthModal
        isOpen={studentAuthOpen}
        initialMode={studentAuthInitialMode}
        onClose={() => setStudentAuthOpen(false)}
        onSuccess={handleStudentAuthSuccess}
      />

      <AdminAuthModal
        isOpen={adminAuthOpen}
        onClose={() => setAdminAuthOpen(false)}
        onSuccess={handleAdminAuthSuccess}
        onOpenSupabaseSetup={() => setSupabaseModalOpen(true)}
      />

      <StudentRegistrationModal
        isOpen={registerModalOpen}
        selectedForum={registerModalForum}
        currentUser={currentUser}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={(newReg) => {
          // Keep modal open on success screen so participant can download PDF or celebrate
        }}
      />

      <SupabaseSetupModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
}
