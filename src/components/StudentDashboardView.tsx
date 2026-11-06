import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  FileDown,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ExternalLink,
  PlusCircle,
  Eye,
  Settings,
  Lock,
  User,
  GraduationCap,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  Search,
  X,
} from 'lucide-react';
import type {
  Profile,
  Registration,
  Forum,
  EventMasterInfo,
  Announcement,
} from '../types/index.ts';
import { dataService } from '../lib/dataService.ts';
import { downloadInvitationPdf } from '../utils/pdfGenerator.ts';
import { StudentRegistrationModal } from './StudentRegistrationModal.tsx';
import { PdfPreviewModal } from './PdfPreviewModal.tsx';

interface StudentDashboardViewProps {
  currentUser: Profile;
  onOpenRegisterModal: (forum?: Forum) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  currentUser,
  onOpenRegisterModal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'forums' | 'profile'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Payment reference submission state
  const [activePaymentReg, setActivePaymentReg] = useState<Registration | null>(null);
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // PDF Preview state
  const [previewReg, setPreviewReg] = useState<Registration | null>(null);

  // Profile update state
  const [profFullName, setProfFullName] = useState(currentUser.full_name);
  const [profClassGrade, setProfClassGrade] = useState(currentUser.class_grade);
  const [profContact, setProfContact] = useState(currentUser.contact_number);
  const [profSavedMsg, setProfSavedMsg] = useState<string | null>(null);

  // Password reset state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const eventInfo = dataService.getEventInfo();
  const forums = dataService.getForums();
  const myRegistrations = dataService.getUserRegistrations(currentUser.id);
  const announcements = dataService.getAnnouncements().filter((a) => a.is_published);

  // Filter available forums
  const filteredForums = forums.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleDownloadPdf = async (reg: Registration) => {
    const forum = dataService.getForumById(reg.forum_id);
    if (!forum) return;
    const template = dataService.getTemplateForForum(forum.id);
    await downloadInvitationPdf({
      registration: reg,
      forum,
      eventInfo,
      template,
    });
  };

  const handleSubmitPaymentRef = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentReg || !paymentUtr.trim()) return;

    setPaymentSubmitting(true);
    const res = dataService.submitPaymentReference(
      activePaymentReg.id,
      paymentUtr,
      paymentNotes
    );
    setPaymentSubmitting(false);

    if (res.success) {
      setPaymentSuccessMsg('Payment reference submitted successfully for Admin verification!');
      setTimeout(() => {
        setPaymentSuccessMsg(null);
        setActivePaymentReg(null);
        setPaymentUtr('');
        setPaymentNotes('');
      }, 2000);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    currentUser.full_name = profFullName;
    currentUser.class_grade = profClassGrade;
    currentUser.contact_number = profContact;
    dataService.setCurrentUser({ ...currentUser });
    setProfSavedMsg('Profile settings saved successfully.');
    setTimeout(() => setProfSavedMsg(null), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg('New password must be at least 6 characters long.');
      return;
    }
    setPasswordMsg('Password changed successfully.');
    setOldPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordMsg(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. WELCOME SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Delegate Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.full_name}!
            </h1>
            <p className="text-sm text-indigo-200 max-w-xl">
              Discover open forums, manage your participation records, download official formal A4 invitation PDFs, and track payment clearances for Jamshedpur 2026.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onOpenRegisterModal()}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-105 min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register for Forum</span>
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-xs transition-colors flex items-center justify-center min-h-[44px]"
            >
              My Passes ({myRegistrations.length})
            </button>
          </div>
        </div>

        {/* Ambient subtle decorative rings */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar touch-pan-x">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Overview & Events
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'registrations'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>My Registrations</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-extrabold">
            {myRegistrations.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('forums')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
            activeTab === 'forums'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Available Forums ({forums.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shrink-0 ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Profile & Security
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Upcoming Event Hero Box */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">
                Upcoming Flagship Event
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {eventInfo.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  {eventInfo.event_dates}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  {eventInfo.venue}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {eventInfo.timezone}
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed pt-1">
                {eventInfo.description}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => onOpenRegisterModal()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors text-center"
              >
                Register For A Forum
              </button>
              <button
                onClick={() => setActiveTab('forums')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors text-center"
              >
                Explore All Tracks
              </button>
            </div>
          </div>

          {/* Announcements Banner */}
          {announcements.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> Official Summit Announcements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {announcements.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          a.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : a.priority === 'important'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {a.priority}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.published_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 leading-snug">
                      {a.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                      {a.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Registrations Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Your Enrolled Registrations & Invitation Passes
                </h3>
                <p className="text-xs text-slate-500">
                  Forum-wise accredited passes. Click Download PDF for your official admission document.
                </p>
              </div>
              {myRegistrations.length > 0 && (
                <button
                  onClick={() => setActiveTab('registrations')}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  View All ({myRegistrations.length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {myRegistrations.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No active forum registrations yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Select from robotics, hackathons, debates, or cultural forums to secure your official delegate credential.
                </p>
                <button
                  onClick={() => onOpenRegisterModal()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Register Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRegistrations.map((reg) => {
                  const forum = dataService.getForumById(reg.forum_id);
                  return (
                    <div
                      key={reg.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 relative hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {reg.registration_number}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 mt-1">
                            {reg.forum_name}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            reg.status === 'confirmed' || reg.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Venue:</span>
                          <span className="font-semibold">{forum?.venue || 'Jamshedpur'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dates:</span>
                          <span className="font-semibold">{forum?.event_dates || '03-06 Dec 2026'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payment:</span>
                          <span className="font-semibold capitalize">
                            {reg.payment_status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleDownloadPdf(reg)}
                          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Download Invitation PDF</span>
                        </button>
                        <button
                          onClick={() => setPreviewReg(reg)}
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700"
                          title="Preview PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY REGISTRATIONS TABLE */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">My Registrations</h2>
              <p className="text-xs text-slate-500">
                Official participant records, unique registration IDs, and forum-specific PDF invitations.
              </p>
            </div>
            <button
              onClick={() => onOpenRegisterModal()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm self-start"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Register for another Forum
            </button>
          </div>

          {paymentSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
              {paymentSuccessMsg}
            </div>
          )}

          {myRegistrations.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Registrations Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore available forums and complete your registration to receive your official forum invitation PDF.
              </p>
              <button
                onClick={() => onOpenRegisterModal()}
                className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Explore & Register
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* MOBILE CARD VIEW (< md screens) */}
              <div className="block md:hidden space-y-4">
                {myRegistrations.map((reg) => {
                  const forum = dataService.getForumById(reg.forum_id);
                  return (
                    <div
                      key={reg.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {reg.registration_number}
                          </span>
                          <h3 className="font-extrabold text-sm text-slate-900 mt-1.5 leading-snug">
                            {reg.forum_name}
                          </h3>
                          <p className="text-[11px] text-indigo-600 font-semibold">{forum?.category}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            reg.status === 'confirmed' || reg.status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Dates:</span>
                          <span className="font-semibold text-slate-800">{forum?.event_dates || '03-06 Dec 2026'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Venue:</span>
                          <span className="font-semibold text-slate-800">{forum?.venue || 'Jamshedpur'}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                          <span className="text-slate-500">Payment:</span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                              reg.payment_status === 'verified' || reg.payment_status === 'free'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {reg.payment_status.replace('_', ' ')}
                          </span>
                        </div>
                        {reg.payment_reference && (
                          <div className="text-[11px] font-mono text-slate-500 pt-0.5">
                            Ref: {reg.payment_reference}
                          </div>
                        )}
                        {forum?.is_paid && reg.payment_status !== 'verified' && (
                          <button
                            onClick={() => setActivePaymentReg(reg)}
                            className="mt-1 text-xs text-purple-700 font-bold hover:underline flex items-center gap-1 min-h-[36px]"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Submit / Update UTR Reference →
                          </button>
                        )}
                      </div>

                      {/* Action buttons (min 44px touch targets) */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleDownloadPdf(reg)}
                          className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs min-h-[44px]"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Download PDF</span>
                        </button>
                        <button
                          onClick={() => setPreviewReg(reg)}
                          className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                          <span>View Preview</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (>= md screens) */}
              <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4">Reg ID</th>
                        <th className="py-3.5 px-4">Forum Category</th>
                        <th className="py-3.5 px-4">Dates & Venue</th>
                        <th className="py-3.5 px-4">Reg Status</th>
                        <th className="py-3.5 px-4">Payment Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {myRegistrations.map((reg) => {
                        const forum = dataService.getForumById(reg.forum_id);
                        return (
                          <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              {reg.registration_number}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">{reg.forum_name}</p>
                              <p className="text-[10px] text-indigo-600">{forum?.category}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="text-slate-800">{forum?.event_dates || '03-06 Dec 2026'}</p>
                              <p className="text-[10px] text-slate-400">{forum?.venue || 'Jamshedpur'}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  reg.status === 'confirmed' || reg.status === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {reg.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    reg.payment_status === 'verified' || reg.payment_status === 'free'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}
                                >
                                  {reg.payment_status.replace('_', ' ')}
                                </span>
                                {reg.payment_reference && (
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    Ref: {reg.payment_reference}
                                  </p>
                                )}
                                {forum?.is_paid && reg.payment_status !== 'verified' && (
                                  <button
                                    onClick={() => setActivePaymentReg(reg)}
                                    className="text-[10px] text-purple-700 font-bold hover:underline block"
                                  >
                                    Submit UTR Ref
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleDownloadPdf(reg)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs"
                                >
                                  <FileDown className="w-3.5 h-3.5" /> PDF
                                </button>
                                <button
                                  onClick={() => setPreviewReg(reg)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                                  title="View PDF preview"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Payment submission modal */}
          {activePaymentReg && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-600" /> Submit Payment UTR Reference
                  </h3>
                  <button
                    onClick={() => setActivePaymentReg(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-900 space-y-1">
                  <p>
                    Forum: <strong>{activePaymentReg.forum_name}</strong>
                  </p>
                  <p>
                    Reg ID: <span className="font-mono">{activePaymentReg.registration_number}</span>
                  </p>
                </div>

                <form onSubmit={handleSubmitPaymentRef} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      12-Digit Bank / UPI UTR Transaction Reference Number
                    </label>
                    <input
                      type="text"
                      required
                      value={paymentUtr}
                      onChange={(e) => setPaymentUtr(e.target.value)}
                      placeholder="e.g. UPI/429184910284/HDFC"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Optional Notes (Bank name, remitter name)
                    </label>
                    <textarea
                      rows={2}
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="e.g. Paid from HDFC account ending 4821"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
                  >
                    {paymentSubmitting ? 'Submitting...' : 'Submit Reference for Verification'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AVAILABLE FORUMS BROWSER */}
      {activeTab === 'forums' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Available Event Forums</h2>
              <p className="text-xs text-slate-500">
                Explore specialized tracks at Jamshedpur 2026. Each forum provides an independent schedule and custom invitation PDF.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search forums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForums.map((forum) => {
              const isRegistered = myRegistrations.some((r) => r.forum_id === forum.id);
              return (
                <div
                  key={forum.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col group"
                >
                  {/* Banner Image */}
                  <div className="h-40 w-full relative overflow-hidden bg-slate-900">
                    <img
                      src={forum.banner_url}
                      alt={forum.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-900">
                        {forum.category}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          forum.is_paid
                            ? 'bg-purple-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {forum.is_paid ? `INR ${forum.registration_fee}` : 'FREE'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-extrabold text-sm text-white leading-tight">
                        {forum.name}
                      </h3>
                      <p className="text-[11px] text-indigo-200 italic mt-0.5">{forum.tagline}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {forum.description}
                    </p>

                    <div className="space-y-1.5 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{forum.event_dates}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{forum.venue}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                        <span>Capacity: {forum.max_capacity}</span>
                        <span className="font-semibold text-indigo-700">
                          {forum.registered_count} Registered
                        </span>
                      </div>
                    </div>

                    {isRegistered ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Already Registered
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenRegisterModal(forum)}
                        disabled={forum.status === 'closed'}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {forum.status === 'closed' ? 'Registrations Closed' : 'Register for this Forum'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: PROFILE SETTINGS & SECURITY */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile details */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Student Profile Settings</h3>
                <p className="text-xs text-slate-500">Update your participant record</p>
              </div>
            </div>

            {profSavedMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold rounded-xl">
                {profSavedMsg}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profFullName}
                  onChange={(e) => setProfFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Class / Grade</label>
                <input
                  type="text"
                  required
                  value={profClassGrade}
                  onChange={(e) => setProfClassGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={profContact}
                  onChange={(e) => setProfContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 space-y-1 text-slate-500">
                <p>
                  <strong>PID (12-Digit):</strong> {currentUser.participant_id_number}
                </p>
                <p>
                  <strong>DOB:</strong> {currentUser.date_of_birth}
                </p>
                <p>
                  <strong>Verification ID:</strong> {currentUser.masked_id_value} (
                  {currentUser.masked_id_type === 'school_id' ? 'School ID' : 'Masked Aadhaar'})
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
              >
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Password change */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Security & Password</h3>
                <p className="text-xs text-slate-500">Update your account credentials</p>
              </div>
            </div>

            {passwordMsg && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-semibold rounded-xl">
                {passwordMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-purple-900 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                Change Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PDF PREVIEW MODAL */}
      {previewReg && (
        <PdfPreviewModal
          isOpen={Boolean(previewReg)}
          registration={previewReg}
          forum={dataService.getForumById(previewReg.forum_id)!}
          eventInfo={eventInfo}
          template={dataService.getTemplateForForum(previewReg.forum_id)}
          onClose={() => setPreviewReg(null)}
        />
      )}
    </div>
  );
};
