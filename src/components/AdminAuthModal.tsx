import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  HelpCircle,
  Key,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenSupabaseSetup?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenSupabaseSetup,
}) => {
  const [adminEmail, setAdminEmail] = useState('admin@registertoevent.org');
  const [adminPassword, setAdminPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  if (!isOpen) return null;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await dataService.loginAdmin(adminEmail, adminPassword);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(
        res.error ||
          'Access Denied: Verification failed. This account is not listed in the trusted admin_roles directory.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold leading-tight">Admin Portal Authorization</h3>
              <p className="text-[11px] sm:text-xs text-purple-200">
                Restricted Executive Access • RTE Secretariat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Warning Notice */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 flex items-start gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p>
            Public admin self-registration is strictly disabled. Administrative accounts require authorization in the Supabase{' '}
            <code className="text-purple-800 font-bold">admin_roles</code> table.
          </p>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {showForgotNotice && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 leading-relaxed">
              For security compliance, administrative credential recovery requires approval from the Main Administrator. Please contact the Secretariat IT Directorate.
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@registertoevent.org"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(!showForgotNotice)}
                  className="text-[11px] text-purple-600 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>

            {/* Default credentials banner */}
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-[11px] text-purple-900">
              <span className="font-bold">Authorized Admin Sign-In:</span>{' '}
              <code>admin@registertoevent.org</code> / <code>Admin@123</code>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Verifying Admin Role in Database...' : 'Authenticate & Enter Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick link to Supabase bootstrap instructions */}
          {onOpenSupabaseSetup && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSupabaseSetup();
                }}
                className="text-xs text-slate-500 hover:text-purple-700 flex items-center justify-center gap-1.5 mx-auto"
              >
                <Key className="w-3.5 h-3.5" />
                <span>How to grant admin role via Supabase SQL</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
