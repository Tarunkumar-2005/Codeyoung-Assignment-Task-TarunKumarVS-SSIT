import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { checkHealth } from './services/api';
import { DateTime } from 'luxon';

function Dashboard() {
  const [healthStatus, setHealthStatus] = useState({ loading: true, data: null, error: null });
  const [userTimezone, setUserTimezone] = useState(DateTime.local().zoneName);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await checkHealth();
        setHealthStatus({ loading: false, data: response.data, error: null });
      } catch (err) {
        setHealthStatus({ loading: false, data: null, error: err.message || 'Could not connect to backend' });
      }
    };
    fetchHealth();
  }, []);

  const nowLocal = DateTime.now().setZone(userTimezone).toFormat('cccc, LLL dd, yyyy · hh:mm:ss a ZZZZ');
  const nowIst = DateTime.now().setZone('Asia/Kolkata').toFormat('cccc, LLL dd, yyyy · hh:mm:ss a ZZZZ');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-blue-900/10 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm mb-3">
              ⚡ Codeyoung Full Stack System
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Trial-Class Appointment Booking System
            </h1>
            <p className="text-blue-100 text-sm md:text-base mt-2 max-w-2xl">
              Precision timezone coordination & mentor allocation engine connecting US/UK parents with educators in India.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs space-y-1.5 min-w-[240px]">
            <div className="font-semibold text-blue-200 uppercase tracking-wider">System Clock</div>
            <div className="text-white font-mono">{nowLocal}</div>
            <div className="text-blue-200/80 font-mono text-[11px]">IST: {nowIst}</div>
          </div>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Backend Connectivity Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Backend API</span>
            {healthStatus.loading ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Checking...
              </span>
            ) : healthStatus.error ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                Offline
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Online (Port 5000)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">
            {healthStatus.loading
              ? 'Attempting ping to /api/health...'
              : healthStatus.error
              ? `Error: ${healthStatus.error}`
              : `Service: ${healthStatus.data?.service} (DB: ${healthStatus.data?.database})`}
          </p>
        </div>

        {/* Timezone Engine */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Timezone Engine</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Luxon IANA
            </span>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Active Parent Zone:</label>
            <select
              value={userTimezone}
              onChange={(e) => setUserTimezone(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="America/New_York">America/New_York (US Eastern)</option>
              <option value="America/Chicago">America/Chicago (US Central)</option>
              <option value="America/Denver">America/Denver (US Mountain)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (US Pacific)</option>
              <option value="Europe/London">Europe/London (UK GMT/BST)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (India IST)</option>
            </select>
          </div>
        </div>

        {/* Mentor Capacity Engine */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mentors Fleet</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              10 Mentors
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Enforces strict max 2 demos/day per mentor in <span className="font-semibold text-slate-800">Asia/Kolkata</span>.
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-100/80 rounded-2xl p-6 border border-slate-200 text-slate-700 text-sm flex items-start gap-4">
        <div className="text-2xl">💡</div>
        <div>
          <h3 className="font-semibold text-slate-900">Project Scaffolding Complete</h3>
          <p className="mt-1 text-slate-600 leading-relaxed">
            Layered Express architecture, Mongoose schemas, Luxon timezone service, and React/Tailwind frontend layers are linked and ready.
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-900 text-lg">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                CY
              </span>
              Codeyoung Booking
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-mono">
                React + Express + Mongo
              </span>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
          Codeyoung Trial-Class Booking System · Full Stack Engineering Assessment
        </footer>
      </div>
    </Router>
  );
}

export default App;
