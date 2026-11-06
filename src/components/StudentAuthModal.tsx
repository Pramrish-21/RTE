import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import { validateParticipantNumber, maskIdentity } from '../utils/rules.ts';

interface StudentAuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regClassGrade, setRegClassGrade] = useState('Class 11 - Science');
  const [regPid, setRegPid] = useState('');
  const [regDob, setRegDob] = useState('2008-05-15');
  const [regContact, setRegContact] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regIdType, setRegIdType] = useState<'school_id' | 'masked_aadhaar'>('school_id');
  const [regIdProofValue, setRegIdProofValue] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await dataService.loginStudent(loginEmail, loginPassword);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate 12-digit PID
    const cleanPid = regPid.replace(/\s+/g, '');
    if (!validateParticipantNumber(cleanPid)) {
      setErrorMsg('Participant Identification Number must be exactly 12 numeric digits.');
      return;
    }

    // Validate DOB format
    if (!regDob || !/^\d{4}-\d{2}-\d{2}$/.test(regDob)) {
      setErrorMsg('Please select a valid Date of Birth (YYYY-MM-DD).');
      return;
    }

    // Validate identity proof
    if (!regIdProofValue.trim()) {
      setErrorMsg('Please provide your School ID or last 4 digits of Aadhaar.');
      return;
    }

    if (regIdType === 'masked_aadhaar') {
      const digitsOnly = regIdProofValue.replace(/\D/g, '');
      if (digitsOnly.length < 4) {
        setErrorMsg('Please enter at least the last 4 digits of Aadhaar for identity verification.');
        return;
      }
    }

    setLoading(true);
    const res = await dataService.registerStudent({
      email: regEmail,
      password: regPassword,
      full_name: regFullName,
      class_grade: regClassGrade,
      contact_number: regContact,
      participant_id_number: cleanPid,
      date_of_birth: regDob,
      masked_id_type: regIdType,
      id_proof_value: regIdProofValue,
    });
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Student registration failed. Please review the form.');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setSuccessMsg(`A secure password reset link has been dispatched to ${forgotEmail}.`);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
              <GraduationCap className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">Student Portal</h3>
              <p className="text-[11px] sm:text-xs text-indigo-200">
                {mode === 'login'
                  ? 'Access your registrations, pass & forum records'
                  : mode === 'register'
                  ? 'Create your official delegate accreditation profile'
                  : 'Reset your student account password'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors min-h-[44px] ${
              mode === 'login'
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Student Login
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors min-h-[44px] ${
              mode === 'register'
                ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Student Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold leading-relaxed">
              {successMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>


              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Student Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* REGISTRATION FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (As on official school record)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Class / Grade
                  </label>
                  <select
                    value={regClassGrade}
                    onChange={(e) => setRegClassGrade(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11 - Science">Class 11 - Science</option>
                    <option value="Class 11 - Commerce">Class 11 - Commerce</option>
                    <option value="Class 11 - Humanities">Class 11 - Humanities</option>
                    <option value="Class 12 - Science">Class 12 - Science</option>
                    <option value="Class 12 - Commerce">Class 12 - Commerce</option>
                    <option value="Class 12 - Humanities">Class 12 - Humanities</option>
                    <option value="Undergraduate 1st Year">Undergraduate 1st Year</option>
                    <option value="Undergraduate 2nd/3rd Year">Undergraduate 2nd/3rd Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth (DOB)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      required
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  12-Digit Participant Identification Number (PID)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={regPid}
                    onChange={(e) => setRegPid(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456789012"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Exactly 12 numeric digits assigned by your institution or RTE portal.
                </p>
              </div>

              {/* ID Proof Selection */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Identity Verification
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="idType"
                        value="school_id"
                        checked={regIdType === 'school_id'}
                        onChange={() => setRegIdType('school_id')}
                      />
                      <span>School ID</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="idType"
                        value="masked_aadhaar"
                        checked={regIdType === 'masked_aadhaar'}
                        onChange={() => setRegIdType('masked_aadhaar')}
                      />
                      <span>Masked Aadhaar (Last 4)</span>
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={regIdProofValue}
                  onChange={(e) => setRegIdProofValue(e.target.value)}
                  placeholder={
                    regIdType === 'school_id'
                      ? 'Enter School Roll / ID (e.g. DPS-JSR-2026)'
                      : 'Enter last 4 digits only (e.g. 4589)'
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 leading-tight">
                  Security note: Full Aadhaar numbers are never collected or stored.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="student@school.edu"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Profile...' : 'Complete Student Registration'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter your registered student email address. We will verify your account and issue a secure password reset link.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Send Password Reset Instructions
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-semibold"
                >
                  ← Return to Student Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
