import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldAlert,
  Database,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';

interface AdminLoginViewProps {
  onSuccess: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateHome: () => void;
  onOpenSupabaseModal: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onSuccess,
  onNavigateForgotPassword,
  onNavigateHome,
  onOpenSupabaseModal,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter your authorized administrative email address and password.');
      return;
    }

    setLoading(true);
    const res = await dataService.loginAdmin(email, password);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(
        res.error ||
          'Access Denied: This account is not listed in the trusted administrative directory.'
      );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-16 space-y-6">
      {/* Back button */}
      <button
        onClick={onNavigateHome}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Login Selection</span>
      </button>

      {/* Main Admin Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Executive Directorate</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Admin Console Login</h1>
          <p className="text-xs text-purple-200">
            Secure administrative authentication for RTE Secretariat and authorized Event Directors.
          </p>
        </div>

        {/* Security Warning Notice */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p>
            Public admin self-registration is strictly disabled. Administrative accounts require authorization in the Supabase{' '}
            <code className="text-purple-800 font-bold">admin_roles</code> database table.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Access Denied</p>
                <p className="mt-0.5 text-rose-800">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Authorized Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@registertoevent.org"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-xs text-purple-600 hover:text-purple-800 hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-purple-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 min-h-[46px]"
            >
              {loading ? (
                <span>Verifying Role in Database...</span>
              ) : (
                <>
                  <span>Authenticate & Enter Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Database Info Link */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Database Configuration:</span>
            <button
              onClick={onOpenSupabaseModal}
              className="text-purple-700 font-bold hover:underline flex items-center gap-1 text-xs"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Status & RLS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
