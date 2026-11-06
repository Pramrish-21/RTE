import React, { useState, useEffect } from 'react';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import { getSupabaseClient } from '../lib/supabaseClient.ts';

interface ResetPasswordViewProps {
  onNavigateStudentLogin: () => void;
  onNavigateAdminLogin: () => void;
  onNavigateHome: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  onNavigateStudentLogin,
  onNavigateAdminLogin,
  onNavigateHome,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidRecoverySession, setHasValidRecoverySession] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const client = getSupabaseClient();

    if (!client) {
      if (isMounted) {
        setCheckingSession(false);
        setErrorMsg('Supabase client is not configured. Connect your Supabase project in the setup panel.');
      }
      return;
    }

    // Check if recovery token is present in the URL hash or query params
    const hash = window.location.hash;
    const search = window.location.search;
    const isRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token=');
    const hasCode = search.includes('code=');

    // Subscribe to auth state changes to detect PASSWORD_RECOVERY
    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (session && isRecoveryHash)) {
        setHasValidRecoverySession(true);
        setSessionDetail(session?.user?.email ? `Session verified for: ${session.user.email}` : 'Recovery session active');
        setCheckingSession(false);
      }
    });

    // Also check current active session directly
    client.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (data.session) {
        setHasValidRecoverySession(true);
        setSessionDetail(data.session.user?.email ? `Session verified for: ${data.session.user.email}` : 'Recovery session active');
      } else if (!isRecoveryHash && !hasCode) {
        // No recovery tokens found in URL
        setErrorMsg(
          'No active password recovery session detected. If you arrived here directly, please request a password reset link from the Forgot Password page.'
        );
      }
      setCheckingSession(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    const res = await dataService.updateUserPassword(newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Your password has been successfully updated in Supabase Auth! You can now log in with your new credentials.');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrorMsg(res.error || 'Failed to update password. Your recovery link may have expired.');
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

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Official Credential Reset</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Set New Password</h1>
          <p className="text-xs text-indigo-200">
            Choose a strong new password for your REGISTER TO EVENT account.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {checkingSession ? (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                Verifying recovery tokens with Supabase Auth...
              </p>
            </div>
          ) : (
            <>
              {sessionDetail && !successMsg && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{sessionDetail}</span>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-3">
                  <div className="flex items-start gap-2 font-bold text-sm text-emerald-950">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Password Successfully Updated!</span>
                  </div>
                  <p className="leading-relaxed text-emerald-800">{successMsg}</p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={onNavigateStudentLogin}
                      className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-center shadow-xs"
                    >
                      Go to Student Login →
                    </button>
                    <button
                      onClick={onNavigateAdminLogin}
                      className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-purple-900 text-white font-bold rounded-xl text-center shadow-xs"
                    >
                      Go to Admin Login →
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                  <div className="flex items-start gap-2 font-bold text-rose-950">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Password Reset Error</span>
                  </div>
                  <p className="leading-relaxed text-rose-800">{errorMsg}</p>
                  <div className="pt-2">
                    <a
                      href="/forgot-password"
                      className="inline-flex items-center gap-1 font-bold text-rose-800 underline hover:text-rose-950"
                    >
                      Request a fresh password recovery link →
                    </a>
                  </div>
                </div>
              )}

              {/* Reset Form */}
              {!successMsg && hasValidRecoverySession && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      New Password (Minimum 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        autoFocus
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 min-h-[46px]"
                  >
                    {loading ? (
                      <span>Updating Password in Supabase Auth...</span>
                    ) : (
                      <>
                        <span>Save New Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Links */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={onNavigateStudentLogin}
              className="text-indigo-600 hover:underline font-semibold"
            >
              ← Student Login
            </button>
            <button
              onClick={onNavigateAdminLogin}
              className="text-purple-600 hover:underline font-semibold"
            >
              Admin Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
