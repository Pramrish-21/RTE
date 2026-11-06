import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Database,
  Sparkles,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';

interface ForgotPasswordViewProps {
  onNavigateStudentLogin: () => void;
  onNavigateAdminLogin: () => void;
  onNavigateHome: () => void;
  onOpenSupabaseModal: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onNavigateStudentLogin,
  onNavigateAdminLogin,
  onNavigateHome,
  onOpenSupabaseModal,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsRateLimit(false);

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    const res = await dataService.resetPasswordForEmail(email);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(
        res.message ||
          `A secure password recovery email has been dispatched to ${email}. Please check your inbox and click the reset link to choose your new password.`
      );
    } else {
      setErrorMsg(res.error || 'Failed to dispatch password recovery email.');
      if (res.error?.toLowerCase().includes('rate limit')) {
        setIsRateLimit(true);
      }
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
            <span>Supabase Auth Recovery</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Forgot Password</h1>
          <p className="text-xs text-indigo-200">
            Enter your registered student or administrator email address to receive an official recovery link.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Success Message */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="flex items-start gap-2 font-bold text-sm text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Recovery Email Dispatched!</span>
              </div>
              <p className="leading-relaxed text-emerald-800">{successMsg}</p>
              <div className="p-3 bg-white/80 rounded-xl text-[11px] font-mono text-emerald-900 border border-emerald-200/60">
                <strong>Configured Redirect URL:</strong> {window.location.origin}/reset-password
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
              <div className="flex items-start gap-2 font-bold text-rose-950">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>Recovery Dispatch Failed</span>
              </div>
              <p className="leading-relaxed text-rose-800">{errorMsg}</p>

              {/* Supabase SMTP Configuration Explainer */}
              {isRateLimit && (
                <div className="mt-2 p-3 bg-white rounded-xl border border-rose-200 text-[11px] text-slate-700 space-y-1.5">
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    How to lift Supabase email limits:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Open your Supabase Project Dashboard.</li>
                    <li>Navigate to <strong>Project Settings → Authentication</strong>.</li>
                    <li>Scroll down to <strong>SMTP Settings</strong> and enable Custom SMTP (e.g. Resend, SendGrid, or Gmail).</li>
                    <li>Ensure <strong>Site URL / Redirect URLs</strong> contains <code className="font-mono text-purple-700">{window.location.origin}/*</code>.</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@school.edu or admin@registertoevent.org"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We will send a real Supabase Auth password reset link with callback to: <br />
                  <code className="text-indigo-600 font-mono text-[10px]">
                    {window.location.origin}/reset-password
                  </code>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 min-h-[46px]"
              >
                {loading ? (
                  <span>Dispatching Supabase Reset Email...</span>
                ) : (
                  <>
                    <span>Send Password Reset Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Navigation Links */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <button
              onClick={onNavigateStudentLogin}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
            >
              ← Back to Student Login
            </button>
            <button
              onClick={onNavigateAdminLogin}
              className="text-purple-600 hover:text-purple-800 font-bold hover:underline"
            >
              Back to Admin Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
