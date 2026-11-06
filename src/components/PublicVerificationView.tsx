import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  Calendar,
  MapPin,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import type { Registration, Forum } from '../types/index.ts';

interface PublicVerificationViewProps {
  initialRegId?: string;
  onNavigateHome: () => void;
}

export const PublicVerificationView: React.FC<PublicVerificationViewProps> = ({
  initialRegId,
  onNavigateHome,
}) => {
  const [searchId, setSearchId] = useState(initialRegId || 'JSR-2026-A8F2K');
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [forum, setForum] = useState<Forum | null>(null);
  const [searched, setSearched] = useState(false);

  const performLookup = (idToSearch: string) => {
    setSearched(true);
    const cleanId = idToSearch.trim().toUpperCase();
    const found = dataService
      .getRegistrations()
      .find((r) => r.registration_number.toUpperCase() === cleanId);

    if (found) {
      setRegistration(found);
      const f = dataService.getForumById(found.forum_id);
      setForum(f || null);
    } else {
      setRegistration(null);
      setForum(null);
    }
  };

  useEffect(() => {
    if (initialRegId) {
      performLookup(initialRegId);
    } else {
      performLookup('JSR-2026-A8F2K');
    }
  }, [initialRegId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(searchId);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Search Bar */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Official Registration Pass Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Verify Delegate Credentials
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Scan the QR code on any official RTE PDF invitation or enter the unique registration number below.
        </p>

        <form onSubmit={handleSearch} className="max-w-md mx-auto mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. JSR-2026-XXXXX"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold uppercase"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors"
          >
            Verify
          </button>
        </form>
      </div>

      {/* Verification Card */}
      {searched && (
        <div className="animate-in fade-in zoom-in-95">
          {registration ? (
            <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
              {/* Verified Header */}
              <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100">
                      Accreditation Status
                    </span>
                    <h2 className="text-xl font-extrabold">AUTHENTIC & VERIFIED PASS</h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-emerald-100 font-mono">REG ID</span>
                  <p className="font-mono text-base font-extrabold tracking-wider">
                    {registration.registration_number}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">
                    {registration.full_name}
                  </h3>
                  <p className="text-xs text-indigo-700 font-bold mt-0.5">
                    Class / Grade: {registration.class_grade}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Forum Enrollment
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{registration.forum_name}</p>
                    <p className="text-slate-500 text-[11px]">{forum?.venue || 'Jamshedpur'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Event Schedule
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {forum?.event_dates || '03 Dec 2026 – 06 Dec 2026'}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Venue: Jamshedpur, Jharkhand, India
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Identity Verification
                    </span>
                    <p className="font-mono font-bold text-slate-900">
                      {registration.masked_id_type === 'school_id' ? 'School ID' : 'Masked Aadhaar'}:{' '}
                      {registration.masked_id_value}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      PID: {registration.participant_id_number}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Payment Clearance
                    </span>
                    <p className="font-bold text-emerald-700 capitalize text-sm">
                      {registration.payment_status.replace('_', ' ')}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Ref: {registration.payment_reference || 'Free Allocation / Reconciled'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p>
                    This participant holds an accredited pass for the REGISTER TO EVENT (RTE) 2026 Summit. Security clearance is validated.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-rose-200 shadow-xl p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pass Not Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No registered delegate record matched{' '}
                  <strong className="font-mono text-slate-900">{searchId}</strong>. Please ensure the registration number is spelled correctly.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
