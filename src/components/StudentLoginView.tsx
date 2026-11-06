import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';

interface StudentLoginViewProps {
  onSuccess: () => void;
  onNavigateSignup: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateHome: () => void;
}

export const StudentLoginView: React.FC<StudentLoginViewProps> = ({
  onSuccess,
  onNavigateSignup,
  onNavigateForgotPassword,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your registered email address and password.');
      return;
    }

    setLoading(true);
    const res = await dataService.loginStudent(email, password);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please verify your credentials.');
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

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Delegate Access</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Student Login</h1>
          <p className="text-xs text-indigo-200">
            Sign in with your registered email to manage event registrations and download invitation passes.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Login Failed</p>
                <p className="mt-0.5 text-rose-800">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@school.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
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
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-semibold"
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
                <span>Verifying Student Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Student Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Don't have a registered delegate profile yet?
            </p>
            <button
              onClick={onNavigateSignup}
              className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[42px]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New Student Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
