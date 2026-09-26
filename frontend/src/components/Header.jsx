import React from 'react';
import { getAvailableTimezoneOptions } from '../utils/timezones';
import { Globe, Clock, Sparkles } from 'lucide-react';
import { DateTime } from 'luxon';

export default function Header({ selectedTimezone, onTimezoneChange, onReset }) {
  const dtNow = DateTime.now().setZone(selectedTimezone);
  const currentLocalTime = dtNow.toFormat('hh:mm:ss a');
  const currentZoneAbbr = dtNow.toFormat('ZZZZ');
  const timezoneOptions = getAvailableTimezoneOptions();

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
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

        {/* Global Timezone Switcher with Clear Label */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Your Time:</span>
            <span className="font-bold text-slate-900 font-mono">{currentLocalTime}</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
              {currentZoneAbbr}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 rounded-xl px-2.5 py-1.5 transition-colors">
            <Globe className="w-4 h-4 text-blue-600 shrink-0" />
            <select
              value={selectedTimezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1"
              title="Change your local timezone"
            >
              {timezoneOptions.map((tz) => (
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
