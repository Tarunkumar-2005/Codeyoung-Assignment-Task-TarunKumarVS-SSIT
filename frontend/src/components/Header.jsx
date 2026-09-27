import React from 'react';
import CodeyoungLogo from './CodeyoungLogo';
import { getAvailableTimezoneOptions } from '../utils/timezones';
import { Globe, Clock, Sparkles } from 'lucide-react';
import { DateTime } from 'luxon';

export default function Header({ 
  selectedTimezone, 
  onTimezoneChange, 
  onReset, 
  onStartBooking, 
  currentStep,
  viewMode,
  onToggleViewMode,
}) {
  const dtNow = DateTime.now().setZone(selectedTimezone);
  const currentLocalTime = dtNow.toFormat('hh:mm a');
  const currentZoneAbbr = dtNow.toFormat('ZZZZ');
  const timezoneOptions = getAvailableTimezoneOptions();

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Authentic Codeyoung Brand Logo with White Background */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 p-1 cursor-pointer transition-transform hover:opacity-95"
            aria-label="Codeyoung Home"
          >
            <CodeyoungLogo className="h-9 sm:h-10 w-auto" />
          </button>

          {/* View Switcher Pill */}
          <div className="hidden md:flex items-center p-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              id="nav-parent-view"
              onClick={() => onToggleViewMode('parent')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'parent'
                  ? 'bg-white text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parent Booking
            </button>
            <button
              type="button"
              id="nav-mentor-view"
              onClick={() => onToggleViewMode('mentor')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'mentor'
                  ? 'bg-white text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mentor Timeline & Quotas
            </button>
          </div>
        </div>

        {/* Right: Clean Timezone Indicator & Primary Codeyoung Yellow CTA */}
        <div className="flex items-center gap-3">
          {/* Timezone Selector Pill */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:border-slate-300 transition-colors shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline text-slate-500 font-medium">Zone:</span>
            <select
              id="header-timezone-select"
              value={selectedTimezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer pr-1"
              title="Change your local timezone for scheduling"
            >
              {timezoneOptions.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 font-black">
              {currentZoneAbbr}
            </span>
          </div>

          {/* Primary Codeyoung Yellow Pill Button */}
          {viewMode === 'mentor' ? (
            <button
              type="button"
              onClick={() => onToggleViewMode('parent')}
              className="bg-[#F9B233] hover:bg-[#F59E0B] active:bg-[#D97706] text-slate-950 font-black text-xs sm:text-sm px-4 sm:px-6 py-2.5 rounded-full shadow-sm hover:shadow-cy-yellow transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            >
              <span>Back to Booking</span>
            </button>
          ) : (
            <button
              type="button"
              id="header-book-trial-cta"
              onClick={onStartBooking}
              className="bg-[#F9B233] hover:bg-[#F59E0B] active:bg-[#D97706] text-slate-950 font-black text-xs sm:text-sm px-4 sm:px-6 py-2.5 rounded-full shadow-sm hover:shadow-cy-yellow transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Book a FREE trial</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

