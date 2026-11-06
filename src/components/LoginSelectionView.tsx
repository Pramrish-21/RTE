import React from 'react';
import {
  GraduationCap,
  Shield,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  UserPlus,
  CheckCircle2,
  Lock,
  Database,
} from 'lucide-react';

interface LoginSelectionViewProps {
  onSelectStudentLogin: () => void;
  onSelectAdminLogin: () => void;
  onSelectSignup: () => void;
  onSelectVerify: () => void;
  onSelectBrowseForums: () => void;
  onOpenSupabaseModal: () => void;
}

export const LoginSelectionView: React.FC<LoginSelectionViewProps> = ({
  onSelectStudentLogin,
  onSelectAdminLogin,
  onSelectSignup,
  onSelectVerify,
  onSelectBrowseForums,
  onOpenSupabaseModal,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
      {/* Hero Welcome Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Jamshedpur 2026 Summit • Official Access Portal</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          REGISTER TO EVENT <span className="text-indigo-600">(RTE)</span>
        </h1>
        <p className="text-sm sm:text-base text-indigo-900 font-bold tracking-wide uppercase">
          Discover. Register. Participate.
        </p>
        <div className="pt-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">
            Welcome to RTE
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto leading-relaxed">
            Please choose your portal login type below to access accredited event participation or administrative controls.
          </p>
        </div>
      </div>

      {/* Two Login Type Choice Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest text-center">
          Choose your login type:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* 1. STUDENT LOGIN CARD */}
          <div className="relative group bg-white rounded-3xl border-2 border-indigo-100 hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Delegate Portal
                </span>
              </div>

              <div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                  1. Student Login
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  For participating student delegates, team members, and competitive applicants across all academic tracks.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Access enrolled Forum registrations & records</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Download official formal A4 Invitation PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Track payment clearance & submit UPI / UTR refs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Update student profile credentials & security</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 space-y-2.5">
              <button
                onClick={onSelectStudentLogin}
                className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all min-h-[48px]"
              >
                <span>Continue to Student Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onSelectSignup}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Student Delegate? Create an Account</span>
              </button>
            </div>
          </div>

          {/* 2. ADMIN LOGIN CARD */}
          <div className="relative group bg-white rounded-3xl border-2 border-purple-100 hover:border-purple-600 shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-purple-300 flex items-center justify-center shadow-lg shadow-purple-900/25 group-hover:scale-105 transition-transform">
                  <Shield className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Secretariat Only
                </span>
              </div>

              <div>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                  2. Admin Login
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Restricted executive console for authorized event directors, evaluators, and organizing secretariat officials.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Real-time attendee telemetry & forum capacities</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Strict DOB eligibility rule cutoff enforcement</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Manual UTR payment verification & reconciliation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Forum invitation template customization & dispatch</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 space-y-2.5">
              <button
                onClick={onSelectAdminLogin}
                className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-purple-950 text-white font-bold text-sm shadow-md shadow-slate-900/25 flex items-center justify-center gap-2 transition-all min-h-[48px]"
              >
                <span>Continue to Admin Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center py-2 text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Authorized administrative credentials required</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Quick Access & Verification Footer */}
      <div className="max-w-4xl mx-auto pt-4 border-t border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onSelectVerify}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-xs text-left transition-all group flex items-start gap-3"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">
                Verify Credential / Pass
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Scan QR code or search unique Reg ID (JSR-2026-XXXXX)
              </p>
            </div>
          </button>

          <button
            onClick={onSelectBrowseForums}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-xs text-left transition-all group flex items-start gap-3"
          >
            <Layers className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-900 group-hover:text-indigo-900">
                Browse Event Forums
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Explore robotics, hackathons, debates & cultural tracks
              </p>
            </div>
          </button>

          <button
            onClick={onOpenSupabaseModal}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 shadow-xs text-left transition-all group flex items-start gap-3"
          >
            <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-900 group-hover:text-amber-900">
                Database & RLS Configuration
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Connect Supabase project & view PostgreSQL SQL schema
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
