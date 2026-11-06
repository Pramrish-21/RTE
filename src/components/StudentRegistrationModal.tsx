import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileDown,
  CreditCard,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
} from 'lucide-react';
import type { Forum, Registration, Profile } from '../types/index.ts';
import { dataService } from '../lib/dataService.ts';
import { validateParticipantNumber } from '../utils/rules.ts';
import { downloadInvitationPdf } from '../utils/pdfGenerator.ts';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  selectedForum: Forum | null;
  currentUser: Profile | null;
  onClose: () => void;
  onSuccess: (reg: Registration) => void;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  selectedForum,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [activeForumId, setActiveForumId] = useState<string>('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [classGrade, setClassGrade] = useState('Class 11 - Science');
  const [pidNumber, setPidNumber] = useState('');
  const [dob, setDob] = useState('2008-07-19');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [idType, setIdType] = useState<'school_id' | 'masked_aadhaar'>('school_id');
  const [idProofValue, setIdProofValue] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedRegistration, setCompletedRegistration] = useState<Registration | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const list = dataService.getForums();
    setForums(list);
    if (selectedForum) {
      setActiveForumId(selectedForum.id);
    } else if (list.length > 0 && !activeForumId) {
      setActiveForumId(list[0].id);
    }
  }, [selectedForum, isOpen]);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setClassGrade(currentUser.class_grade || 'Class 11 - Science');
      setPidNumber(currentUser.participant_id_number || '');
      setDob(currentUser.date_of_birth || '2008-07-19');
      setContactNumber(currentUser.contact_number || '');
      setEmail(currentUser.email || '');
      setIdType(currentUser.masked_id_type || 'school_id');
      setIdProofValue(currentUser.masked_id_value || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const currentForum = forums.find((f) => f.id === activeForumId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!activeForumId) {
      setErrorMsg('Please select a Forum for participation.');
      return;
    }

    const cleanPid = pidNumber.replace(/\s+/g, '');
    if (!validateParticipantNumber(cleanPid)) {
      setErrorMsg('Participant Identification Number must be exactly 12 numeric digits.');
      return;
    }

    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setErrorMsg('Please enter a valid Date of Birth (YYYY-MM-DD).');
      return;
    }

    if (!idProofValue.trim()) {
      setErrorMsg('Please provide your School ID or last 4 digits of Aadhaar.');
      return;
    }

    setLoading(true);

    const result = await dataService.submitRegistration({
      forum_id: activeForumId,
      full_name: fullName,
      class_grade: classGrade,
      contact_number: contactNumber,
      email,
      date_of_birth: dob,
      participant_id_number: cleanPid,
      masked_id_type: idType,
      id_proof_value: idProofValue,
      payment_reference: currentForum?.is_paid ? paymentRef : undefined,
    });

    setLoading(false);

    if (!result.success) {
      // If rejected by DOB check or duplicate check, show error clearly
      setErrorMsg(result.error || 'Registration could not be completed.');
      return;
    }

    if (result.registration) {
      setCompletedRegistration(result.registration);
      // Trigger celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // Safe fallback
      }
      onSuccess(result.registration);
    }
  };

  const handleDownloadPdf = async () => {
    if (!completedRegistration || !currentForum) return;
    setDownloadingPdf(true);
    try {
      const eventInfo = dataService.getEventInfo();
      const template = dataService.getTemplateForForum(currentForum.id);
      await downloadInvitationPdf({
        registration: completedRegistration,
        forum: currentForum,
        eventInfo,
        template,
      });
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {completedRegistration ? 'Registration Confirmed!' : 'Event Forum Registration'}
              </h3>
              <p className="text-xs text-indigo-200">
                REGISTER TO EVENT (RTE) • Jamshedpur 2026 Summit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* SUCCESS VIEW */}
          {completedRegistration ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-slate-900">
                  Congratulations, {completedRegistration.full_name}!
                </h4>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  Your registration for{' '}
                  <strong className="text-indigo-900">{completedRegistration.forum_name}</strong>{' '}
                  has been verified and enrolled.
                </p>
              </div>

              {/* Unique Registration ID Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 max-w-md mx-auto">
                <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Official Registration ID
                </p>
                <p className="text-2xl font-mono font-extrabold text-slate-900 mt-1 tracking-wider">
                  {completedRegistration.registration_number}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Quote this unique ID for all official communications and accreditation desk entry.
                </p>
              </div>

              {/* Forum-specific PDF Invitation Download CTA */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-lg mx-auto text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <FileDown className="w-4 h-4 text-indigo-600" /> Forum-Specific Invitation PDF
                    </h5>
                    <p className="text-xs text-slate-500">
                      Official A4 document with your verification QR code and forum terms.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  {downloadingPdf ? 'Generating Official PDF...' : 'Download Invitation PDF Now'}
                </button>
              </div>

              {currentForum?.is_paid && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 max-w-lg mx-auto text-left text-xs text-purple-900 space-y-1">
                  <p className="font-bold">Payment Information:</p>
                  <p>
                    Registration Fee: <strong>INR {currentForum.registration_fee.toFixed(2)}</strong>
                  </p>
                  <p>
                    Status:{' '}
                    <span className="font-semibold capitalize">
                      {completedRegistration.payment_status.replace('_', ' ')}
                    </span>
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Admin verifies payments manually against UPI transaction records. You can check updates in your Student Dashboard.
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Proceed to Student Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mandatory Rejection Banner if ineligible */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-semibold leading-relaxed flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-950">Registration Denied:</p>
                    <p className="mt-0.5 text-rose-800">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Forum Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Event Forum / Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {forums.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      disabled={f.status === 'closed'}
                      onClick={() => setActiveForumId(f.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        activeForumId === f.id
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      } ${f.status === 'closed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          {f.category}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            f.is_paid
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {f.is_paid ? `INR ${f.registration_fee}` : 'FREE'}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                        {f.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {f.event_dates}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Forum Highlight Box */}
              {currentForum && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{currentForum.name}</span>
                    <span className="text-indigo-600 font-semibold">{currentForum.venue}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {currentForum.description}
                  </p>
                </div>
              )}

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name (As on Certificate)
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth (DOB Eligibility Checked)
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
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Subject to Forum & Master DOB eligibility verification.
                  </p>
                </div>

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
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Must be exactly 12 numeric digits.
                  </p>
                </div>
              </div>

              {/* ID Proof Verification */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Identity Verification
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="modalIdType"
                        value="school_id"
                        checked={idType === 'school_id'}
                        onChange={() => setIdType('school_id')}
                      />
                      <span>School ID</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="modalIdType"
                        value="masked_aadhaar"
                        checked={idType === 'masked_aadhaar'}
                        onChange={() => setIdType('masked_aadhaar')}
                      />
                      <span>Masked Aadhaar (Last 4)</span>
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
                      ? 'Enter School Student ID (e.g. DPS-JSR-2026-99)'
                      : 'Enter last 4 digits only (e.g. 9012)'
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  Strictly masked. Never provide a full 12-digit Aadhaar number.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Number
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
                      placeholder="student@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Reference if Paid Forum */}
              {currentForum?.is_paid && (
                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-950">
                      Forum Fee: INR {currentForum.registration_fee.toFixed(2)}
                    </span>
                    <span className="font-mono text-purple-700 text-[11px] font-bold">
                      UPI: {currentForum.upi_id || 'rte.organizer@upi'}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-900 leading-relaxed">
                    {currentForum.payment_instructions ||
                      'Please complete the UPI transfer and submit the 12-digit transaction UTR reference below.'}
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-950 mb-1">
                      UPI UTR / Transaction Reference Number
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. UPI/429184910284/HDFC"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono bg-white"
                    />
                    <p className="text-[10px] text-purple-700 mt-0.5">
                      You can also submit or update this reference later in "My Registrations".
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Validating Eligibility...' : 'Confirm & Register'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
