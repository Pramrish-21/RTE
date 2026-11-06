import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HomeView } from './components/HomeView.tsx';
import { LoginSelectionView } from './components/LoginSelectionView.tsx';
import { StudentLoginView } from './components/StudentLoginView.tsx';
import { AdminLoginView } from './components/AdminLoginView.tsx';
import { StudentSignupView } from './components/StudentSignupView.tsx';
import { ForgotPasswordView } from './components/ForgotPasswordView.tsx';
import { ResetPasswordView } from './components/ResetPasswordView.tsx';
import { StudentDashboardView } from './components/StudentDashboardView.tsx';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { PublicVerificationView } from './components/PublicVerificationView.tsx';
import { StudentRegistrationModal } from './components/StudentRegistrationModal.tsx';
import { SupabaseSetupModal } from './components/SupabaseSetupModal.tsx';
import { dataService } from './lib/dataService.ts';
import type { Profile, Forum, Registration } from './types/index.ts';
import { Database, ShieldAlert } from 'lucide-react';

export type AppView =
  | 'selection'
  | 'login_student'
  | 'login_admin'
  | 'signup'
  | 'forgot_password'
  | 'reset_password'
  | 'student'
  | 'admin'
  | 'verify'
  | 'forums';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(() => dataService.getCurrentUser());
  const [currentView, setCurrentView] = useState<AppView>('selection');
  const [verifyRegId, setVerifyRegId] = useState<string | undefined>(undefined);

  // Modals
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
      const hash = window.location.hash;
      const regId = search.get('regId');

      if (regId) {
        setVerifyRegId(regId);
        setCurrentView('verify');
        return;
      }

      // Check for Supabase Auth recovery token in URL hash (#access_token=...&type=recovery)
      if (path === '/reset-password' || hash.includes('type=recovery') || hash.includes('access_token=')) {
        setCurrentView('reset_password');
        return;
      }

      if (path === '/login/student') {
        setCurrentView('login_student');
      } else if (path === '/login/admin') {
        setCurrentView('login_admin');
      } else if (path === '/signup' || path === '/register' || path === '/register/student') {
        setCurrentView('signup');
      } else if (path === '/forgot-password') {
        setCurrentView('forgot_password');
      } else if (path === '/forums') {
        setCurrentView('forums');
      } else if (path === '/verify') {
        setCurrentView('verify');
      } else if (path === '/student/dashboard' || path.startsWith('/student')) {
        const user = dataService.getCurrentUser();
        if (user && user.role === 'student') {
          setCurrentView('student');
        } else {
          // Redirect unauthenticated to student login
          window.history.replaceState({}, '', '/login/student');
          setCurrentView('login_student');
        }
      } else if (path === '/admin/dashboard' || path.startsWith('/admin')) {
        // Enforce verified admin permission
        const user = dataService.getCurrentUser();
        if (user && ['admin', 'main_admin'].includes(user.role)) {
          setCurrentView('admin');
        } else {
          setUnauthorizedAdminNotice(
            'Access to /admin/dashboard was denied. You must authenticate with an authorized administrative account.'
          );
          window.history.replaceState({}, '', '/login/admin');
          setCurrentView('login_admin');
        }
      } else {
        // Default landing page is ALWAYS the Login Selection Page
        setCurrentView('selection');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (view: AppView) => {
    setUnauthorizedAdminNotice(null);
    let targetPath = '/';
    const user = dataService.getCurrentUser();

    switch (view) {
      case 'selection':
        targetPath = '/';
        break;
      case 'login_student':
        targetPath = '/login/student';
        break;
      case 'login_admin':
        targetPath = '/login/admin';
        break;
      case 'signup':
        targetPath = '/signup';
        break;
      case 'forgot_password':
        targetPath = '/forgot-password';
        break;
      case 'reset_password':
        targetPath = '/reset-password';
        break;
      case 'student':
        if (!user || user.role !== 'student') {
          targetPath = '/login/student';
          view = 'login_student';
        } else {
          targetPath = '/student/dashboard';
        }
        break;
      case 'admin':
        if (!user || !['admin', 'main_admin'].includes(user.role)) {
          setUnauthorizedAdminNotice('Authorized administrative credentials required.');
          targetPath = '/login/admin';
          view = 'login_admin';
        } else {
          targetPath = '/admin/dashboard';
        }
        break;
      case 'verify':
        targetPath = '/verify';
        break;
      case 'forums':
        targetPath = '/forums';
        break;
    }

    window.history.pushState({}, '', targetPath);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRegisterModal = (forum?: Forum) => {
    setRegisterModalForum(forum || null);
    setRegisterModalOpen(true);
  };

  const handleStudentAuthSuccess = () => {
    const user = dataService.getCurrentUser();
    setCurrentUser(user);
    navigateTo('student');
  };

  const handleAdminAuthSuccess = () => {
    const user = dataService.getCurrentUser();
    setCurrentUser(user);
    navigateTo('admin');
  };

  const handleLogout = async () => {
    await dataService.logout();
    setCurrentUser(null);
    navigateTo('selection');
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
        onOpenStudentLogin={() => navigateTo('login_student')}
        onOpenAdminLogin={() => navigateTo('login_admin')}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        onNavigate={navigateTo}
        onLogout={handleLogout}
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
      <main className="flex-1 pb-20 md:pb-0">
        {/* 1. DEFAULT LANDING PAGE: Login Selection */}
        {currentView === 'selection' && (
          <LoginSelectionView
            onSelectStudentLogin={() => navigateTo('login_student')}
            onSelectAdminLogin={() => navigateTo('login_admin')}
            onSelectSignup={() => navigateTo('signup')}
            onSelectVerify={() => navigateTo('verify')}
            onSelectBrowseForums={() => navigateTo('forums')}
            onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          />
        )}

        {/* 2. STUDENT LOGIN */}
        {currentView === 'login_student' && (
          <StudentLoginView
            onSuccess={handleStudentAuthSuccess}
            onNavigateSignup={() => navigateTo('signup')}
            onNavigateForgotPassword={() => navigateTo('forgot_password')}
            onNavigateHome={() => navigateTo('selection')}
          />
        )}

        {/* 3. ADMIN LOGIN */}
        {currentView === 'login_admin' && (
          <AdminLoginView
            onSuccess={handleAdminAuthSuccess}
            onNavigateForgotPassword={() => navigateTo('forgot_password')}
            onNavigateHome={() => navigateTo('selection')}
            onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          />
        )}

        {/* 4. STUDENT SIGNUP */}
        {currentView === 'signup' && (
          <StudentSignupView
            onSuccess={handleStudentAuthSuccess}
            onNavigateLogin={() => navigateTo('login_student')}
            onNavigateHome={() => navigateTo('selection')}
          />
        )}

        {/* 5. FORGOT PASSWORD */}
        {currentView === 'forgot_password' && (
          <ForgotPasswordView
            onNavigateStudentLogin={() => navigateTo('login_student')}
            onNavigateAdminLogin={() => navigateTo('login_admin')}
            onNavigateHome={() => navigateTo('selection')}
            onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          />
        )}

        {/* 6. SET NEW PASSWORD */}
        {currentView === 'reset_password' && (
          <ResetPasswordView
            onNavigateStudentLogin={() => navigateTo('login_student')}
            onNavigateAdminLogin={() => navigateTo('login_admin')}
            onNavigateHome={() => navigateTo('selection')}
          />
        )}

        {/* 7. STUDENT DASHBOARD (PROTECTED) */}
        {currentView === 'student' && (
          currentUser && currentUser.role === 'student' ? (
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
                onClick={() => navigateTo('login_student')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Sign In to Student Portal
              </button>
            </div>
          )
        )}

        {/* 8. ADMIN DASHBOARD (PROTECTED) */}
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
                onClick={() => navigateTo('login_admin')}
                className="px-6 py-2.5 bg-slate-900 hover:bg-purple-900 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Admin Sign-In
              </button>
            </div>
          )
        )}

        {/* 9. PUBLIC FORUMS CATALOG */}
        {currentView === 'forums' && (
          <HomeView
            onOpenRegisterModal={handleOpenRegisterModal}
            onOpenStudentLogin={() => navigateTo('login_student')}
            onOpenAdminLogin={() => navigateTo('login_admin')}
            onNavigateVerify={() => navigateTo('verify')}
          />
        )}

        {/* 10. PUBLIC VERIFICATION */}
        {currentView === 'verify' && (
          <PublicVerificationView
            initialRegId={verifyRegId}
            onNavigateHome={() => navigateTo('selection')}
          />
        )}
      </main>

      {/* Global Modals */}
      <StudentRegistrationModal
        isOpen={registerModalOpen}
        selectedForum={registerModalForum}
        currentUser={currentUser}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={(_newReg) => {
          // Modal stays open to show ticket & download pass
        }}
      />

      <SupabaseSetupModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
}
