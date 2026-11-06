import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Layers,
  CreditCard,
  FileText,
  Bell,
  Settings,
  Shield,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin,
  Check,
  Sparkles,
} from 'lucide-react';
import type {
  Profile,
  Registration,
  Forum,
  EventMasterInfo,
  DobEligibilityRule,
  ForumInvitationTemplate,
  PaymentRecord,
  Announcement,
} from '../types/index.ts';
import { dataService } from '../lib/dataService.ts';
import { INELIGIBLE_DOB_MESSAGE, validateDobEligibility } from '../utils/rules.ts';
import { downloadInvitationPdf } from '../utils/pdfGenerator.ts';
import { PdfPreviewModal } from './PdfPreviewModal.tsx';

interface AdminDashboardViewProps {
  currentUser: Profile;
  onOpenSupabaseModal: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  onOpenSupabaseModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'participants'
    | 'forums'
    | 'events'
    | 'dob_rules'
    | 'pdf_templates'
    | 'payments'
    | 'announcements'
    | 'settings'
  >('overview');

  // Search & filter states for participants
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantForumFilter, setParticipantForumFilter] = useState('all');
  const [participantStatusFilter, setParticipantStatusFilter] = useState('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null);

  // Forum editor state
  const [editingForum, setEditingForum] = useState<Forum | null>(null);
  const [isCreatingForum, setIsCreatingForum] = useState(false);
  const [forumForm, setForumForm] = useState<Partial<Forum>>({
    name: '',
    tagline: '',
    description: '',
    category: 'STEM & Robotics',
    event_dates: '03 Dec 2026 – 04 Dec 2026',
    venue: 'Auditorium Complex, Jamshedpur',
    is_paid: false,
    registration_fee: 0,
    upi_id: '',
    status: 'open',
    max_capacity: 300,
  });

  // Event master editor state
  const [eventForm, setEventForm] = useState<EventMasterInfo>(dataService.getEventInfo());
  const [eventSavedMsg, setEventSavedMsg] = useState(false);

  // DOB rules editor state
  const [selectedForumForRule, setSelectedForumForRule] = useState<string>('global');
  const [newBlockedDob, setNewBlockedDob] = useState('');
  const [newRangeStart, setNewRangeStart] = useState('');
  const [newRangeEnd, setNewRangeEnd] = useState('');
  const [testDobInput, setTestDobInput] = useState('2007-04-14');
  const [testDobResult, setTestDobResult] = useState<{ isEligible: boolean; message?: string } | null>(null);

  // PDF Template editor state
  const [selectedTemplateForumId, setSelectedTemplateForumId] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<ForumInvitationTemplate | null>(null);
  const [previewTemplateForum, setPreviewTemplateForum] = useState<Forum | null>(null);

  // Payment verification notes
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Announcement editor
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('normal');

  // Authorized admins list state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminList, setAdminList] = useState<string[]>([
    'admin@registertoevent.org',
    'secretariat@registertoevent.org',
    'pramrish299@gmail.com',
  ]);

  // Data fetching
  const eventInfo = dataService.getEventInfo();
  const forums = dataService.getForums();
  const registrations = dataService.getRegistrations();
  const payments = dataService.getPayments();
  const dobRules = dataService.getDobRules();
  const templates = dataService.getTemplates();
  const announcements = dataService.getAnnouncements();

  // Statistics
  const totalRegistrations = registrations.length;
  const uniqueStudents = new Set(registrations.map((r) => r.email)).size;
  const pendingPayments = payments.filter((p) => p.status === 'pending_verification').length;
  const verifiedPaymentsCount = payments.filter((p) => p.status === 'verified').length;
  const totalRevenue = payments
    .filter((p) => p.status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Filtered participants list
  const filteredRegistrations = registrations.filter((r) => {
    const q = participantSearch.toLowerCase();
    const matchesSearch =
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.registration_number.toLowerCase().includes(q) ||
      r.contact_number.includes(q) ||
      r.participant_id_number.includes(q);

    const matchesForum =
      participantForumFilter === 'all' || r.forum_id === participantForumFilter;
    const matchesStatus =
      participantStatusFilter === 'all' || r.status === participantStatusFilter;

    return matchesSearch && matchesForum && matchesStatus;
  });

  // Export handlers
  const handleExportCsv = (forumId?: string) => {
    const csvData = dataService.exportParticipantsCsv(forumId);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RTE_Participants_${forumId || 'All'}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(registrations, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RTE_Registrations_Full_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Forum Save
  const handleSaveForum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumForm.name) return;
    dataService.saveForum({
      ...forumForm,
      id: editingForum?.id,
      name: forumForm.name,
      category: forumForm.category as Forum['category'],
    });
    setEditingForum(null);
    setIsCreatingForum(false);
  };

  // DOB Rule Save
  const currentSelectedRule =
    selectedForumForRule === 'global'
      ? dataService.getRuleForForum(null) || {
          id: 'rule-global',
          forum_id: null,
          min_dob: '2004-01-01',
          max_dob: '2012-12-31',
          blocked_dobs: [],
          blocked_ranges: [],
          is_enabled: true,
          description: 'Global Default Rule',
          created_at: new Date().toISOString(),
        }
      : dataService.getRuleForForum(selectedForumForRule) || {
          id: `rule-${selectedForumForRule}`,
          forum_id: selectedForumForRule,
          min_dob: '2004-01-01',
          max_dob: '2012-12-31',
          blocked_dobs: [],
          blocked_ranges: [],
          is_enabled: true,
          description: 'Forum Specific Rule',
          created_at: new Date().toISOString(),
        };

  const handleAddBlockedDob = () => {
    if (!newBlockedDob || !/^\d{4}-\d{2}-\d{2}$/.test(newBlockedDob)) return;
    const updated = {
      ...currentSelectedRule,
      blocked_dobs: [...(currentSelectedRule.blocked_dobs || []), newBlockedDob],
    };
    dataService.saveDobRule(updated);
    setNewBlockedDob('');
  };

  const handleRemoveBlockedDob = (d: string) => {
    const updated = {
      ...currentSelectedRule,
      blocked_dobs: (currentSelectedRule.blocked_dobs || []).filter((x) => x !== d),
    };
    dataService.saveDobRule(updated);
  };

  const handleAddRange = () => {
    if (!newRangeStart || !newRangeEnd) return;
    const updated = {
      ...currentSelectedRule,
      blocked_ranges: [
        ...(currentSelectedRule.blocked_ranges || []),
        { start: newRangeStart, end: newRangeEnd, reason: 'Configured cutoff interval' },
      ],
    };
    dataService.saveDobRule(updated);
    setNewRangeStart('');
    setNewRangeEnd('');
  };

  const handleRemoveRange = (idx: number) => {
    const updated = {
      ...currentSelectedRule,
      blocked_ranges: (currentSelectedRule.blocked_ranges || []).filter((_, i) => i !== idx),
    };
    dataService.saveDobRule(updated);
  };

  const handleTestDob = () => {
    const res = validateDobEligibility(testDobInput, currentSelectedRule);
    setTestDobResult(res);
  };

  // Payment verification
  const handleVerifyPayment = (paymentId: string, status: 'verified' | 'rejected') => {
    dataService.verifyPayment(paymentId, status, verificationNotes);
    setVerifyingPaymentId(null);
    setVerificationNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-900/50">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>RTE Central Administrative Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-purple-200">
            Jamshedpur 2026 Summit • Real-time participant telemetry, Forum controls, DOB rule enforcement, and PDF dispatch.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => handleExportCsv()}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            <Download className="w-4 h-4" /> Export All Attendees (CSV)
          </button>
          <button
            onClick={onOpenSupabaseModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-xs flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Layers className="w-4 h-4 text-emerald-400" /> Database & RLS
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar touch-pan-x text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview & Telemetry', icon: TrendingUp },
          { id: 'participants', label: `Participants (${totalRegistrations})`, icon: Users },
          { id: 'forums', label: `Forums (${forums.length})`, icon: Layers },
          { id: 'events', label: 'Event Master Info', icon: Calendar },
          { id: 'dob_rules', label: 'DOB Eligibility System', icon: Shield },
          { id: 'pdf_templates', label: 'PDF Invitation Templates', icon: FileText },
          { id: 'payments', label: `Payments (${pendingPayments} Pending)`, icon: CreditCard },
          { id: 'announcements', label: 'Announcements', icon: Bell },
          { id: 'settings', label: 'Settings & Admins', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 min-h-[40px] ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Registrations
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {totalRegistrations}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> Live records
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Unique Delegates
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-1">
                {uniqueStudents}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Accredited students</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Active Forums
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-1">
                {forums.length}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">Independent tracks</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pending Payments
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                {pendingPayments}
              </p>
              <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                Needs manual review
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Verified Revenue
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {verifiedPaymentsCount} verified
              </span>
            </div>
          </div>

          {/* Forum-wise Attendance Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Forum-wise Capacity & Attendee Telemetry
                </h3>
                <p className="text-xs text-slate-500">
                  Track participant distribution and capacity utilization per category.
                </p>
              </div>
              <button
                onClick={() => handleExportCsv()}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export Data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forums.map((f) => {
                const count = registrations.filter((r) => r.forum_id === f.id).length;
                const pct = Math.min(100, Math.round((count / (f.max_capacity || 1)) * 100));
                return (
                  <div key={f.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          {f.category}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{f.name}</h4>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        {count} / {f.max_capacity}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{pct}% Booked</span>
                      <button
                        onClick={() => {
                          setParticipantForumFilter(f.id);
                          setActiveTab('participants');
                        }}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        View {count} delegates →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Registrations Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Recent Attendee Registrations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Reg ID</th>
                    <th className="py-2.5 px-3">Participant</th>
                    <th className="py-2.5 px-3">Forum</th>
                    <th className="py-2.5 px-3">DOB</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                        {r.registration_number}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.full_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.forum_name}</td>
                      <td className="py-2.5 px-3 font-mono">{r.date_of_birth}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(r.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS MANAGEMENT */}
      {activeTab === 'participants' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Participant Management</h2>
              <p className="text-xs text-slate-500">
                Search, filter by Forum or status, inspect masked identity proofs, and download official records.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCsv(participantForumFilter === 'all' ? undefined : participantForumFilter)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Export Filtered CSV
              </button>
              <button
                onClick={handleExportJson}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                JSON
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, email, phone, PID, or Reg ID..."
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-600">Forum:</label>
              <select
                value={participantForumFilter}
                onChange={(e) => setParticipantForumFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Forums</option>
                {forums.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-600">Status:</label>
              <select
                value={participantStatusFilter}
                onChange={(e) => setParticipantStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="verified">Verified</option>
                <option value="pending_payment">Pending Payment</option>
              </select>
            </div>
          </div>

          {/* Participants Display */}
          <div className="space-y-4">
            {/* MOBILE CARD VIEW (< md screens) */}
            <div className="block md:hidden space-y-3">
              {filteredRegistrations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  No participants match your filter criteria.
                </div>
              ) : (
                filteredRegistrations.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {r.registration_number}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                          {r.full_name}
                        </h3>
                        <p className="text-[11px] text-slate-500">{r.email}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          r.payment_status === 'verified' || r.payment_status === 'free'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {r.payment_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Forum:</span>
                        <span className="font-semibold text-slate-800">{r.forum_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Class/Grade:</span>
                        <span className="font-semibold text-slate-800">{r.class_grade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">DOB:</span>
                        <span className="font-mono font-semibold text-slate-800">{r.date_of_birth}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">PID (12-Digit):</span>
                        <span className="font-mono text-slate-800">{r.participant_id_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ID Proof:</span>
                        <span className="font-mono text-slate-700">{r.masked_id_value}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setSelectedParticipant(r)}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => {
                          const forum = dataService.getForumById(r.forum_id);
                          if (forum) {
                            downloadInvitationPdf({
                              registration: r,
                              forum,
                              eventInfo,
                              template: dataService.getTemplateForForum(forum.id),
                            });
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 min-h-[44px] shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP TABLE VIEW (>= md screens) */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Reg ID</th>
                      <th className="py-3 px-4">Delegate Name</th>
                      <th className="py-3 px-4">Class/Grade</th>
                      <th className="py-3 px-4">Forum</th>
                      <th className="py-3 px-4">DOB</th>
                      <th className="py-3 px-4">PID & ID Proof</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No participants match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {r.registration_number}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{r.full_name}</p>
                            <p className="text-[10px] text-slate-400">{r.email}</p>
                          </td>
                          <td className="py-3 px-4">{r.class_grade}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{r.forum_name}</td>
                          <td className="py-3 px-4 font-mono">{r.date_of_birth}</td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <p className="text-slate-900">{r.participant_id_number}</p>
                            <p className="text-slate-400 text-[10px]">{r.masked_id_value}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                r.payment_status === 'verified' || r.payment_status === 'free'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {r.payment_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedParticipant(r)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px]"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Participant Detail Modal */}
          {selectedParticipant && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Participant Accreditation Record
                    </h3>
                    <p className="font-mono text-xs text-indigo-700 font-bold">
                      {selectedParticipant.registration_number}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedParticipant(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 font-bold">FULL NAME:</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedParticipant.full_name}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 font-bold">CLASS / GRADE:</span>
                    <p className="font-semibold text-slate-900">{selectedParticipant.class_grade}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 font-bold">DATE OF BIRTH:</span>
                    <p className="font-mono font-semibold text-slate-900">{selectedParticipant.date_of_birth}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 font-bold">PARTICIPANT ID (PID):</span>
                    <p className="font-mono font-semibold text-slate-900">{selectedParticipant.participant_id_number}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 font-bold">EMAIL:</span>
                    <p className="text-slate-900">{selectedParticipant.email}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 font-bold">CONTACT:</span>
                    <p className="text-slate-900">{selectedParticipant.contact_number}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 font-bold">IDENTITY PROOF (MASKED):</span>
                    <p className="font-mono font-bold text-slate-900">
                      {selectedParticipant.masked_id_type === 'school_id' ? 'School ID' : 'Masked Aadhaar (Last 4)'}:{' '}
                      {selectedParticipant.masked_id_value}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      const forum = dataService.getForumById(selectedParticipant.forum_id);
                      if (forum) {
                        downloadInvitationPdf({
                          registration: selectedParticipant,
                          forum,
                          eventInfo,
                          template: dataService.getTemplateForForum(forum.id),
                        });
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Invitation PDF
                  </button>
                  <button
                    onClick={() => setSelectedParticipant(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FORUM MANAGEMENT */}
      {activeTab === 'forums' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Forum Management</h2>
              <p className="text-xs text-slate-500">
                A Forum represents an individual event category. Manage independent dates, fees, venues, and status.
              </p>
            </div>
            <button
              onClick={() => {
                setIsCreatingForum(true);
                setEditingForum(null);
                setForumForm({
                  name: '',
                  tagline: '',
                  description: '',
                  category: 'STEM & Robotics',
                  event_dates: '03 Dec 2026 – 04 Dec 2026',
                  venue: 'Jamshedpur',
                  is_paid: false,
                  registration_fee: 0,
                  status: 'open',
                  max_capacity: 300,
                });
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm self-start"
            >
              <Plus className="w-4 h-4" /> Create New Forum
            </button>
          </div>

          {/* Form Modal (Create or Edit Forum) */}
          {(isCreatingForum || editingForum) && (
            <div className="p-6 bg-white rounded-3xl border border-indigo-200 shadow-md space-y-4">
              <h3 className="font-bold text-base text-slate-900">
                {editingForum ? `Edit Forum: ${editingForum.name}` : 'Create New Event Forum'}
              </h3>
              <form onSubmit={handleSaveForum} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Forum Name</label>
                    <input
                      type="text"
                      required
                      value={forumForm.name}
                      onChange={(e) => setForumForm({ ...forumForm, name: e.target.value })}
                      placeholder="e.g. National Cyber Olympiad"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={forumForm.category}
                      onChange={(e) =>
                        setForumForm({ ...forumForm, category: e.target.value as Forum['category'] })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="STEM & Robotics">STEM & Robotics</option>
                      <option value="Literature & Debate">Literature & Debate</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Arts & Culture">Arts & Culture</option>
                      <option value="Business & Quiz">Business & Quiz</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={forumForm.tagline || ''}
                    onChange={(e) => setForumForm({ ...forumForm, tagline: e.target.value })}
                    placeholder="e.g. Code. Hack. Conquer."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={forumForm.description || ''}
                    onChange={(e) => setForumForm({ ...forumForm, description: e.target.value })}
                    placeholder="Full track overview and rules..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Event Dates</label>
                    <input
                      type="text"
                      value={forumForm.event_dates}
                      onChange={(e) => setForumForm({ ...forumForm, event_dates: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Venue Hall</label>
                    <input
                      type="text"
                      value={forumForm.venue}
                      onChange={(e) => setForumForm({ ...forumForm, venue: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Max Capacity</label>
                    <input
                      type="number"
                      value={forumForm.max_capacity}
                      onChange={(e) =>
                        setForumForm({ ...forumForm, max_capacity: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                {/* Paid vs Free */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={forumForm.is_paid}
                      onChange={(e) => setForumForm({ ...forumForm, is_paid: e.target.checked })}
                    />
                    <span>Requires Registration Fee</span>
                  </label>

                  {forumForm.is_paid && (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        placeholder="Fee in INR"
                        value={forumForm.registration_fee}
                        onChange={(e) =>
                          setForumForm({ ...forumForm, registration_fee: Number(e.target.value) })
                        }
                        className="w-28 px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="UPI ID (e.g. rte@bank)"
                        value={forumForm.upi_id || ''}
                        onChange={(e) => setForumForm({ ...forumForm, upi_id: e.target.value })}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-bold text-slate-700">Status:</span>
                    <select
                      value={forumForm.status}
                      onChange={(e) =>
                        setForumForm({ ...forumForm, status: e.target.value as Forum['status'] })
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="upcoming">Upcoming</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingForum(false);
                      setEditingForum(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                  >
                    Save Forum
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Forum Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forums.map((f) => (
              <div
                key={f.id}
                className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      {f.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        f.status === 'open'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-1">{f.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{f.description}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Schedule:</span>
                    <span className="font-semibold">{f.event_dates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Venue:</span>
                    <span className="font-semibold">{f.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee:</span>
                    <span className="font-semibold">
                      {f.is_paid ? `INR ${f.registration_fee}` : 'Free'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingForum(f);
                      setForumForm({ ...f });
                      setIsCreatingForum(false);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${f.name}?`)) {
                        const res = dataService.deleteForum(f.id);
                        if (!res.success) alert(res.error);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EVENT MASTER MANAGEMENT */}
      {activeTab === 'events' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Flagship Event Details</h2>
            <p className="text-xs text-slate-500">
              Manage master event dates, venue location, timezone, and secretariat details.
            </p>
          </div>

          {eventSavedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold rounded-xl">
              Master event information updated successfully!
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              dataService.updateEventInfo(eventForm);
              setEventSavedMsg(true);
              setTimeout(() => setEventSavedMsg(false), 3000);
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 mb-1">Event Master Title</label>
              <input
                type="text"
                required
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Event Dates (03 Dec 2026 – 06 Dec 2026)
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.event_dates}
                  onChange={(e) => setEventForm({ ...eventForm, event_dates: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Venue Location (Jamshedpur, Jharkhand, India)
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Timezone</label>
                <input
                  type="text"
                  value={eventForm.timezone}
                  onChange={(e) => setEventForm({ ...eventForm, timezone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Organizer Secretariat</label>
                <input
                  type="text"
                  value={eventForm.organizer_name}
                  onChange={(e) => setEventForm({ ...eventForm, organizer_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Event Description</label>
              <textarea
                rows={3}
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={eventForm.contact_email}
                  onChange={(e) => setEventForm({ ...eventForm, contact_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={eventForm.contact_phone}
                  onChange={(e) => setEventForm({ ...eventForm, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
            >
              Update Event Details
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: DOB ELIGIBILITY SYSTEM */}
      {activeTab === 'dob_rules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">DOB Eligibility Management</h2>
              <p className="text-xs text-slate-500">
                Configure minimum/maximum DOB, blocked dates of birth, and date ranges per Forum.
              </p>
            </div>
            {/* Forum selector for rule editing */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Target Forum:</label>
              <select
                value={selectedForumForRule}
                onChange={(e) => setSelectedForumForRule(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="global">Global (All Forums Default)</option>
                {forums.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Active Rule Configurations */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Rule Parameters for:{' '}
                    <span className="text-indigo-600">
                      {selectedForumForRule === 'global'
                        ? 'Global Default'
                        : forums.find((f) => f.id === selectedForumForRule)?.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Students failing any active condition are immediately denied registration.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSelectedRule.is_enabled}
                    onChange={(e) => {
                      dataService.saveDobRule({
                        ...currentSelectedRule,
                        is_enabled: e.target.checked,
                      });
                    }}
                  />
                  <span>Rule Enabled</span>
                </label>
              </div>

              {/* Min & Max DOB Boundaries */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Minimum DOB (Earliest allowed)
                  </label>
                  <input
                    type="date"
                    value={currentSelectedRule.min_dob || ''}
                    onChange={(e) => {
                      dataService.saveDobRule({
                        ...currentSelectedRule,
                        min_dob: e.target.value || undefined,
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Maximum DOB (Latest allowed)
                  </label>
                  <input
                    type="date"
                    value={currentSelectedRule.max_dob || ''}
                    onChange={(e) => {
                      dataService.saveDobRule({
                        ...currentSelectedRule,
                        max_dob: e.target.value || undefined,
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Specific Blocked DOBs */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  Specifically Blocked Dates of Birth
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newBlockedDob}
                    onChange={(e) => setNewBlockedDob(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlockedDob}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-purple-900"
                  >
                    Add Blocked DOB
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentSelectedRule.blocked_dobs?.length === 0 ? (
                    <span className="text-[11px] text-slate-400">No individual dates blocked.</span>
                  ) : (
                    currentSelectedRule.blocked_dobs?.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-mono"
                      >
                        <span>{d}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDob(d)}
                          className="hover:text-rose-950 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Blocked Date Ranges */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  Blocked Date Ranges (Cohort exclusion)
                </label>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={newRangeStart}
                    onChange={(e) => setNewRangeStart(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono"
                  />
                  <span className="text-slate-500">to</span>
                  <input
                    type="date"
                    value={newRangeEnd}
                    onChange={(e) => setNewRangeEnd(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddRange}
                    className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Add Range
                  </button>
                </div>

                <div className="space-y-1 pt-1">
                  {currentSelectedRule.blocked_ranges?.length === 0 ? (
                    <span className="text-[11px] text-slate-400">No date ranges blocked.</span>
                  ) : (
                    currentSelectedRule.blocked_ranges?.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                      >
                        <span>
                          {r.start} → {r.end}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRange(i)}
                          className="text-rose-600 font-bold text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Live DOB Verification Simulator */}
            <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-md space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Live Backend Eligibility Simulator
                </div>
                <h3 className="font-extrabold text-base">Test Any Date of Birth Against Rules</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Verify the exact mandated server-side rejection response before students register.
                </p>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Input Date of Birth to Test (YYYY-MM-DD):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={testDobInput}
                      onChange={(e) => setTestDobInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 text-white border border-slate-700 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={handleTestDob}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
                    >
                      Run Eligibility Check
                    </button>
                  </div>
                </div>

                {/* Simulator Result */}
                {testDobResult && (
                  <div
                    className={`mt-4 p-4 rounded-2xl text-xs leading-relaxed border ${
                      testDobResult.isEligible
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-2 mb-1">
                      {testDobResult.isEligible ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>ELIGIBLE FOR REGISTRATION</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span>REJECTED & PREVENTED FROM SAVING</span>
                        </>
                      )}
                    </div>
                    {!testDobResult.isEligible && (
                      <p className="font-semibold text-rose-100 mt-1 italic">
                        "{testDobResult.message}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Exact requirement disclaimer */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300">Mandated Rejection Protocol:</span>
                <p>
                  Exact required message: <br />
                  <code className="text-rose-400">"{INELIGIBLE_DOB_MESSAGE}"</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PDF INVITATION TEMPLATES */}
      {activeTab === 'pdf_templates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Forum-Specific Invitation PDF Templates
              </h2>
              <p className="text-xs text-slate-500">
                Every Forum has an independent PDF template with customized wording, logo text, T&Cs, and signatories.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forums.map((forum) => {
              const tpl = dataService.getTemplateForForum(forum.id);
              return (
                <div
                  key={forum.id}
                  className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      {forum.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{forum.name}</h3>
                    <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-600 space-y-1">
                      <p>
                        <strong>Salutation:</strong> {tpl.formal_salutation}
                      </p>
                      <p className="line-clamp-2">
                        <strong>Invitation:</strong> {tpl.invitation_text}
                      </p>
                      <p>
                        <strong>Signatory:</strong> {tpl.signatory_name} ({tpl.signatory_designation})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewTemplateForum(forum)}
                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PDF Preview Modal for template */}
          {previewTemplateForum && (
            <PdfPreviewModal
              isOpen={Boolean(previewTemplateForum)}
              registration={{
                id: 'sample-reg',
                registration_number: 'JSR-2026-PREV1',
                forum_id: previewTemplateForum.id,
                forum_name: previewTemplateForum.name,
                user_id: 'sample-user',
                full_name: 'Sample Student Delegate',
                class_grade: 'Class 12 - Senior',
                contact_number: '+91 98765 43210',
                email: 'delegate@sample.edu',
                date_of_birth: '2008-04-10',
                participant_id_number: '123456789012',
                masked_id_type: 'school_id',
                masked_id_value: 'SCH-SAMPLE-2026',
                status: 'confirmed',
                payment_status: previewTemplateForum.is_paid ? 'verified' : 'free',
                payment_reference: 'UPI/PREVIEW/998877',
                qr_verification_url: 'https://registertoevent.org/verify?regId=JSR-2026-PREV1',
                created_at: new Date().toISOString(),
              }}
              forum={previewTemplateForum}
              eventInfo={eventInfo}
              template={dataService.getTemplateForForum(previewTemplateForum.id)}
              onClose={() => setPreviewTemplateForum(null)}
            />
          )}
        </div>
      )}

      {/* TAB 7: PAYMENTS MANAGEMENT */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Payment Verification Management</h2>
              <p className="text-xs text-slate-500">
                Strict manual verification protocol. Never automatically mark payments as paid.
              </p>
            </div>
            <button
              onClick={() => {
                const csv = dataService.exportPaymentsCsv();
                const blob = new Blob([csv], { type: 'text/csv' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `RTE_Payments_Ledger_${Date.now()}.csv`;
                a.click();
              }}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export Payments CSV
            </button>
          </div>

          {/* Payments Display */}
          <div className="space-y-4">
            {/* MOBILE CARD VIEW (< md screens) */}
            <div className="block md:hidden space-y-3">
              {payments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                  No payments recorded yet.
                </div>
              ) : (
                payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                          {p.registration_number}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                          {p.user_name}
                        </h3>
                        <p className="text-[11px] text-slate-500">{p.user_email}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          p.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Forum:</span>
                        <span className="font-semibold text-slate-800">{p.forum_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount Due:</span>
                        <span className="font-bold text-slate-900">INR {Number(p.amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">UTR Reference:</span>
                        <span className="font-mono font-bold text-purple-700">{p.transaction_ref}</span>
                      </div>
                      {p.verified_by && (
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Verified by:</span>
                          <span>{p.verified_by}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons on mobile */}
                    {p.status === 'pending_verification' ? (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleVerifyPayment(p.id, 'verified')}
                          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs min-h-[44px]"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Verify Payment</span>
                        </button>
                        <button
                          onClick={() => handleVerifyPayment(p.id, 'rejected')}
                          className="py-2.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 text-right pt-1">
                        Status verified by Secretariat
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP TABLE VIEW (>= md screens) */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Reg ID</th>
                      <th className="py-3 px-4">Delegate Name</th>
                      <th className="py-3 px-4">Forum Category</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">UTR Reference</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No payments recorded yet.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                            {p.registration_number}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{p.user_name}</p>
                            <p className="text-[10px] text-slate-400">{p.user_email}</p>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{p.forum_name}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            INR {Number(p.amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono text-purple-700">{p.transaction_ref}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                p.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {p.status === 'pending_verification' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleVerifyPayment(p.id, 'verified')}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                                >
                                  Verify Payment
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(p.id, 'rejected')}
                                  className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px]"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Verified by {p.verified_by || 'Admin'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Announcement */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Publish Announcement</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!annTitle || !annContent) return;
                dataService.saveAnnouncement({
                  title: annTitle,
                  content: annContent,
                  priority: annPriority,
                  is_published: true,
                });
                setAnnTitle('');
                setAnnContent('');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Schedule Update for 03 Dec"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value as typeof annPriority)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Content</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Detailed announcement copy..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
              >
                Publish to Student Dashboards
              </button>
            </form>
          </div>

          {/* Announcements List */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-base text-slate-900">Active Announcements</h3>
            {announcements.map((a) => (
              <div
                key={a.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                      a.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : a.priority === 'important'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {a.priority}
                  </span>
                  <button
                    onClick={() => dataService.deleteAnnouncement(a.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                  >
                    Delete
                  </button>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{a.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: SETTINGS & AUTHORIZED ADMINS */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" /> Authorized Administrator Accounts
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              In accordance with security requirements, only verified email accounts configured in{' '}
              <code className="text-purple-700 font-bold">admin_roles</code> can access administrative tools.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Grant Admin Privilege:</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="new.admin@registertoevent.org"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAdminEmail && !adminList.includes(newAdminEmail)) {
                      setAdminList([...adminList, newAdminEmail]);
                      setNewAdminEmail('');
                    }
                  }}
                  className="px-4 py-2 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800"
                >
                  Authorize
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-800 text-[11px]">Authorized Admins List:</span>
              {adminList.map((em) => (
                <div
                  key={em}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <span className="font-mono text-slate-900">{em}</span>
                  <span className="text-[10px] text-purple-700 font-bold uppercase">Authorized</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Database & RLS Security Status
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Row Level Security (RLS) is configured to protect all sensitive tables. Students can only view their own registrations and cannot alter payment status.
            </p>

            <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
              <p>
                <strong>Engine:</strong> Supabase PostgreSQL
              </p>
              <p>
                <strong>Security:</strong> RLS Enabled on 9 tables
              </p>
              <p>
                <strong>Admin Verification:</strong> Server-authoritative via admin_roles
              </p>
            </div>

            <button
              onClick={onOpenSupabaseModal}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
            >
              Open Supabase SQL Schema & Connection Wizard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
