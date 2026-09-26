import React from 'react';
import { SUPPORTED_TIMEZONES } from '../utils/timezones';
import { Globe, Clock, Sparkles } from 'lucide-react';
import { DateTime } from 'luxon';

export default function Header({ selectedTimezone, onTimezoneChange, onReset }) {
  const currentLocalTime = DateTime.now().setZone(selectedTimezone).toFormat('hh:mm a ZZZZ');

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-3">
        {/* Brand Logo */}
        <button
          onClick={onReset}
          className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            CY
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-lg leading-tight">
              Codeyoung
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                Trial Class
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">1-on-1 Coding & Math Mentorship</p>
          </div>
        </button>

        {/* Global Timezone Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium text-slate-700">{currentLocalTime}</span>
          </div>

          <div className="relative flex items-center">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedTimezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="pl-9 pr-8 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors cursor-pointer appearance-none"
              title="Select your local timezone"
            >
              {SUPPORTED_TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
