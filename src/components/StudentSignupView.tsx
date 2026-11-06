import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import { validateParticipantNumber, maskIdentity } from '../utils/rules.ts';

interface StudentSignupViewProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
  onNavigateHome: () => void;
}

export const StudentSignupView: React.FC<StudentSignupViewProps> = ({
  onSuccess,
  onNavigateLogin,
  onNavigateHome,
}) => {
  const [fullName, setFullName] = useState('');
  const [classGrade, setClassGrade] = useState('Class 11 - Science');
  const [pidNumber, setPidNumber] = useState('');
  const [dob, setDob] = useState('2008-07-19');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [idType, setIdType] = useState<'school_id' | 'masked_aadhaar'>('school_id');
  const [idProofValue, setIdProofValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate 12-digit PID
    const cleanPid = pidNumber.replace(/\s+/g, '');
    if (!validateParticipantNumber(cleanPid)) {
      setErrorMsg('Participant Identification Number must be exactly 12 numeric digits.');
      return;
    }

    // Validate DOB format
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setErrorMsg('Please select a valid Date of Birth (YYYY-MM-DD).');
      return;
    }

    // Validate identity proof
    if (!idProofValue.trim()) {
      setErrorMsg('Please provide your School ID or last 4 digits of Aadhaar.');
      return;
    }

    if (idType === 'masked_aadhaar') {
      const digitsOnly = idProofValue.replace(/\D/g, '');
      if (digitsOnly.length < 4) {
        setErrorMsg('Please enter at least the last 4 digits of Aadhaar for identity verification.');
        return;
      }
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    const res = await dataService.registerStudent({
      email,
      password,
      full_name: fullName,
      class_grade: classGrade,
      contact_number: contactNumber,
      participant_id_number: cleanPid,
      date_of_birth: dob,
      masked_id_type: idType,
      id_proof_value: idProofValue,
    });
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Failed to register student account.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-6">
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
        <div className="px-6 py-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Delegate Accreditation Profile</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Create Student Account</h1>
          <p className="text-xs text-indigo-200">
            REGISTER TO EVENT (RTE) • Official Delegate Profile Enrollment for Jamshedpur 2026.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Registration Error</p>
                <p className="mt-0.5 text-rose-800">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name (As on ID)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Class / Grade
                </label>
                <input
                  type="text"
                  required
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  placeholder="e.g. Class 11 - Science"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  12-Digit Participant ID (PID)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={pidNumber}
                    onChange={(e) => setPidNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456789012"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Must be exactly 12 numeric digits.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* ID Proof Selection */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Identity Verification
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="signupIdType"
                      value="school_id"
                      checked={idType === 'school_id'}
                      onChange={() => setIdType('school_id')}
                    />
                    <span>School ID</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="signupIdType"
                      value="masked_aadhaar"
                      checked={idType === 'masked_aadhaar'}
                      onChange={() => setIdType('masked_aadhaar')}
                    />
                    <span>Masked Aadhaar</span>
                  </label>
                </div>
              </div>

              <input
                type="text"
                required
                value={idProofValue}
                onChange={(e) => setIdProofValue(e.target.value)}
                placeholder={
                  idType === 'school_id'
                    ? 'Enter School / College ID number'
                    : 'Enter Aadhaar last 4 digits (e.g. 9012)'
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@school.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 min-h-[46px]"
            >
              {loading ? (
                <span>Registering Student Account in Supabase...</span>
              ) : (
                <>
                  <span>Complete Student Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to login */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an accredited delegate account?{' '}
              <button
                onClick={onNavigateLogin}
                className="text-indigo-600 font-bold hover:underline"
              >
                Sign In to Student Portal →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
