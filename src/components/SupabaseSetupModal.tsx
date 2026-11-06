import React, { useState } from 'react';
import {
  Database,
  X,
  Check,
  Copy,
  AlertTriangle,
  RefreshCw,
  Key,
  Globe,
  Shield,
  Layers,
  Terminal,
} from 'lucide-react';
import {
  getSupabaseConfig,
  getSupabaseAnonKey,
  setRuntimeSupabaseCredentials,
  testSupabaseConnection,
} from '../lib/supabaseClient.ts';
import { SUPABASE_COMPLETE_SQL_SCHEMA } from '../lib/databaseSchemaSql.ts';
import { dataService } from '../lib/dataService.ts';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentConfig = getSupabaseConfig();
  const currentKey = getSupabaseAnonKey();

  const [urlInput, setUrlInput] = useState(currentConfig.url);
  const [keyInput, setKeyInput] = useState(currentKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'instructions' | 'sql' | 'credentials'>('instructions');

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    setRuntimeSupabaseCredentials(urlInput, keyInput);
    const res = await dataService.checkConnection();
    setTestResult({
      connected: res,
      message: dataService.connectionStatusMessage,
    });
    setTesting(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_COMPLETE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Supabase PostgreSQL Integration</h3>
              <p className="text-xs text-indigo-200">
                REGISTER TO EVENT (RTE) Central Database & Auth Configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div
          className={`px-6 py-3 flex items-center justify-between text-xs font-semibold border-b ${
            dataService.isConnectedToSupabase
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                dataService.isConnectedToSupabase
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <span>
              {dataService.isConnectedToSupabase
                ? 'Status: Connected to Live Supabase'
                : 'Status: Supabase Not Connected (Operating in Interactive Sandbox Mode)'}
            </span>
          </div>
          <button
            onClick={async () => {
              setTesting(true);
              await dataService.checkConnection();
              setTesting(false);
            }}
            className="flex items-center gap-1 underline hover:opacity-80"
          >
            <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} /> Re-check
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'instructions'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Setup Instructions & Admin Bootstrap
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Complete PostgreSQL SQL Schema (RLS)
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Live Credentials Tester
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'instructions' && (
            <div className="space-y-5 text-sm">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <h4 className="font-bold text-indigo-950 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" /> Connecting your Supabase Project
                </h4>
                <ol className="mt-2 text-xs text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    Create a free project at{' '}
                    <span className="font-mono font-semibold text-indigo-700">supabase.com</span>.
                  </li>
                  <li>
                    In Supabase, navigate to <strong>Project Settings → API</strong>.
                  </li>
                  <li>
                    Copy your <strong>Project URL</strong> and <strong>anon (public)</strong> API key.
                  </li>
                  <li>
                    Set them as environment variables:
                    <div className="mt-1 p-2 bg-slate-900 text-indigo-300 rounded-lg font-mono text-[11px]">
                      VITE_SUPABASE_URL="https://your-project.supabase.co"<br />
                      VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsIn..."
                    </div>
                    <em>(Or test them directly in the "Live Credentials Tester" tab above)</em>
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-600" /> Run Database SQL Schema
                </h4>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Go to <strong>Supabase Studio → SQL Editor</strong>, paste our schema from the{' '}
                  <button
                    onClick={() => setActiveTab('sql')}
                    className="text-indigo-600 font-bold underline"
                  >
                    SQL Schema tab
                  </button>
                  , and click <strong>Run</strong>. This creates all 9 tables, indexes, seeds initial events & forums, and activates Row Level Security.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                <h4 className="font-bold text-purple-950 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" /> How to Securely Bootstrap the Main Admin
                </h4>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Per strict security requirements, admin roles are verified through the trusted database{' '}
                  <code className="text-purple-700 font-semibold font-mono">admin_roles</code> table. No user can self-assign admin privileges from the frontend.
                </p>
                <div className="mt-2.5 p-3 bg-slate-900 text-purple-200 rounded-xl font-mono text-[11px] space-y-1">
                  <p className="text-slate-400">-- 1. Sign up via RTE Student Registration or Admin screen</p>
                  <p className="text-slate-400">-- 2. Execute in Supabase SQL Editor:</p>
                  <p className="text-emerald-400 font-semibold">
                    INSERT INTO public.admin_roles (user_id, email, role)
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    VALUES ('YOUR_USER_UUID_FROM_AUTH_USERS', 'admin@registertoevent.org', 'main_admin');
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">PostgreSQL Schema & RLS</h4>
                  <p className="text-xs text-slate-500">
                    9 Tables, Indexes, Seed Data & Row-Level Security Rules
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Full SQL Schema
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 text-slate-200 rounded-2xl text-[11px] font-mono leading-relaxed max-h-96 overflow-y-auto border border-slate-800">
                {SUPABASE_COMPLETE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'credentials' && (
            <form onSubmit={handleTestAndSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Anon / Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Only use your public/anon key here. Never input the secret service_role key.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    testResult.connected
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    setKeyInput('');
                    setRuntimeSupabaseCredentials('', '');
                    dataService.checkConnection();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Clear credentials
                </button>
                <button
                  type="submit"
                  disabled={testing}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {testing ? 'Verifying...' : 'Save & Test Live Connection'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Security: Client-side validation + Row Level Security (RLS)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
