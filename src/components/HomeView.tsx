import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileDown,
  Sparkles,
  Users,
  Search,
  CheckCircle2,
  Award,
  Zap,
} from 'lucide-react';
import type { Forum, EventMasterInfo, Announcement } from '../types/index.ts';
import { dataService } from '../lib/dataService.ts';

interface HomeViewProps {
  onOpenRegisterModal: (forum?: Forum) => void;
  onOpenStudentLogin: () => void;
  onOpenAdminLogin: () => void;
  onNavigateVerify: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenRegisterModal,
  onOpenStudentLogin,
  onOpenAdminLogin,
  onNavigateVerify,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const eventInfo = dataService.getEventInfo();
  const forums = dataService.getForums();
  const announcements = dataService.getAnnouncements().filter((a) => a.is_published);

  const categories = [
    'all',
    'STEM & Robotics',
    'Literature & Debate',
    'Computer Science',
    'Arts & Culture',
    'Business & Quiz',
  ];

  const filteredForums = forums.filter((f) => {
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 pt-12 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200 text-indigo-800 text-xs font-bold tracking-wide shadow-xs animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>DISCOVER. REGISTER. PARTICIPATE.</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              REGISTER TO EVENT{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900">
                (RTE)
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              The premier national event registration platform for high-school and collegiate innovators, debaters, coders, and artists. Select your Forum, verify your eligibility, and receive your official invitation pass.
            </p>

            {/* Key Event Details Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-lg shadow-indigo-500/5 max-w-2xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>03 Dec 2026 – 06 Dec 2026</span>
              </div>
              <div className="w-px h-5 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Jamshedpur, Jharkhand, India</span>
              </div>
              <div className="w-px h-5 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2 text-purple-700 font-bold">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Asia/Kolkata (IST)</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={() => onOpenRegisterModal()}
                className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-transform hover:scale-105"
              >
                <span>Register for Event</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenStudentLogin}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs transition-colors"
              >
                Student Login
              </button>
            </div>
          </div>
        </div>

        {/* Subtle decorative background gradient circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-200/40 via-purple-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* ANNOUNCEMENTS TICKER */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-950 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                Notice
              </span>
              <p className="text-xs font-semibold text-indigo-100">
                <strong>{announcements[0].title}:</strong> {announcements[0].content}
              </p>
            </div>
            <button
              onClick={onOpenStudentLogin}
              className="text-xs text-indigo-200 hover:text-white underline font-semibold shrink-0"
            >
              View in Dashboard →
            </button>
          </div>
        </section>
      )}

      {/* FEATURED FORUMS (EVENT CATEGORIES) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Specialized Competition Tracks
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Explore Available Forums
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Each Forum is an independent participation category with its own venue, schedule, DOB rules, and official formal A4 PDF invitation.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by topic or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Forum Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForums.map((forum) => (
            <div
              key={forum.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Forum Banner */}
              <div className="h-44 w-full relative overflow-hidden bg-slate-900">
                <img
                  src={forum.banner_url}
                  alt={forum.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-xs text-slate-900">
                    {forum.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      forum.is_paid
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {forum.is_paid ? `INR ${forum.registration_fee}` : 'FREE'}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                    {forum.name}
                  </h3>
                  <p className="text-[11px] text-indigo-200 italic mt-0.5">{forum.tagline}</p>
                </div>
              </div>

              {/* Forum Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {forum.description}
                </p>

                <div className="space-y-1.5 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{forum.event_dates}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{forum.venue}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px]">
                    <span className="text-slate-500">Max Capacity: {forum.max_capacity}</span>
                    <span className="font-semibold text-indigo-700">
                      {forum.registered_count} Registered
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenRegisterModal(forum)}
                  disabled={forum.status === 'closed'}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {forum.status === 'closed' ? 'Registrations Closed' : 'Register for this Forum'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY REGISTER TO EVENT (RTE) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white space-y-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Platform Standards
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Designed for Rigorous, Trustworthy Delegate Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              REGISTER TO EVENT (RTE) eliminates bureaucratic friction while maintaining strict eligibility safeguards and high-fidelity verification.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h4 className="font-bold text-sm text-white">DOB Eligibility Protection</h4>
              <p className="text-slate-400 leading-relaxed">
                Rules enforced strictly before saving registrations. Ineligible entries are stopped immediately.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <FileDown className="w-6 h-6 text-indigo-400" />
              <h4 className="font-bold text-sm text-white">Independent Forum PDFs</h4>
              <p className="text-slate-400 leading-relaxed">
                Every forum generates its own formal A4 letter of invitation complete with verification QR code.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <Award className="w-6 h-6 text-purple-400" />
              <h4 className="font-bold text-sm text-white">Manual Payment Audit</h4>
              <p className="text-slate-400 leading-relaxed">
                Payments undergo genuine manual reconciliation by the treasury team. Zero synthetic approvals.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <Zap className="w-6 h-6 text-amber-400" />
              <h4 className="font-bold text-sm text-white">Row Level Security (RLS)</h4>
              <p className="text-slate-400 leading-relaxed">
                Built on Supabase PostgreSQL with strict policies protecting participant and administrative data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 pt-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-extrabold text-xs">
              RTE
            </div>
            <div>
              <p className="font-bold text-slate-800">REGISTER TO EVENT (RTE)</p>
              <p className="text-[11px] text-slate-500">Discover. Register. Participate.</p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-0.5 text-[11px]">
            <p>
              Official Summit: <strong>03–06 Dec 2026</strong> • Jamshedpur, Jharkhand, India
            </p>
            <p>
              Secretariat Helpdesk:{' '}
              <a href="mailto:secretariat@registertoevent.org" className="underline hover:text-indigo-600">
                secretariat@registertoevent.org
              </a>{' '}
              • +91 657 243 1900
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
