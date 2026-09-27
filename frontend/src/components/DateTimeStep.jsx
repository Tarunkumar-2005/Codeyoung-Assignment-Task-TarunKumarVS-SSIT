import React, { useState, useEffect, useMemo } from 'react';
import { fetchAvailableSlots } from '../services/api';
import { getAvailableTimezoneOptions, getTimezoneAbbreviation } from '../utils/timezones';
import { DateTime } from 'luxon';
import { Calendar, Clock, ArrowLeft, ArrowRight, AlertCircle, RefreshCw, Globe, CheckCircle2, Sparkles, UserCheck } from 'lucide-react';

export default function DateTimeStep({
  selectedTimezone,
  selectedSlot,
  selectedDate,
  onSelectDate,
  onSelectSlot,
  onTimezoneChange,
  onNext,
  onBack,
}) {
  const [slotsState, setSlotsState] = useState({ loading: true, slots: [], error: null });
  const timezoneOptions = getAvailableTimezoneOptions();
  // Generate 14-day booking calendar window starting from tomorrow in parent's timezone
  const upcomingDates = useMemo(() => {
    const dates = [];
    const base = DateTime.now().setZone(selectedTimezone).plus({ days: 1 });
    for (let i = 0; i < 14; i++) {
      const dt = base.plus({ days: i });
      dates.push({
        dateStr: dt.toFormat('yyyy-MM-dd'),
        dayName: dt.toFormat('EEE'),
        dayNumber: dt.toFormat('dd'),
        monthName: dt.toFormat('LLL'),
        fullLabel: dt.toFormat('cccc, LLL dd, yyyy'),
      });
    }
    return dates;
  }, [selectedTimezone]);

  const activeDateStr = selectedDate || upcomingDates[0]?.dateStr;
  const currentZoneAbbr = getTimezoneAbbreviation(selectedTimezone, activeDateStr);

  useEffect(() => {
    if (!selectedDate && upcomingDates[0]) {
      onSelectDate(upcomingDates[0].dateStr);
    }
  }, [upcomingDates, selectedDate, onSelectDate]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    if (!activeDateStr) return;

    const loadSlots = async () => {
      setSlotsState({ loading: true, slots: [], error: null });
      try {
        const response = await fetchAvailableSlots(activeDateStr, selectedTimezone);
        if (isMounted) {
          setSlotsState({
            loading: false,
            slots: response.data?.slots || [],
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setSlotsState({
            loading: false,
            slots: [],
            error: err.message || 'Network Error: Unable to establish a connection with the scheduling server. Please check your connection and try again.',
          });
        }
      }
    };

    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [activeDateStr, selectedTimezone, refreshTrigger]);

  const activeDateObj = upcomingDates.find((d) => d.dateStr === activeDateStr);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Date & Timezone Selection Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-cy-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200/80 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Step 2 of 3 · Choose Date & Time
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Select Your Preferred Time Slot
            </h2>
            <p className="text-xs sm:text-sm font-bold text-amber-700 mt-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-amber-600" />
              All times displayed in your local timezone:{' '}
              <span className="underline font-black text-slate-900">{selectedTimezone} ({currentZoneAbbr})</span>
            </p>
          </div>

          {/* Timezone Selector Helper */}
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200 self-start md:self-auto">
            <span className="text-xs text-slate-500 font-bold pl-1">Zone:</span>
            <select
              value={selectedTimezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="text-xs font-extrabold text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
            >
              {timezoneOptions.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Selection: Direct Date Picker & 14-Day Strip */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Choose Date
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Specific Date:</span>
              <input
                type="date"
                id="date-picker-input"
                value={activeDateStr}
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectDate(e.target.value);
                    onSelectSlot(null);
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            {upcomingDates.map((item) => {
              const isSelected = item.dateStr === activeDateStr;
              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => {
                    onSelectDate(item.dateStr);
                    onSelectSlot(null);
                  }}
                  className={`flex flex-col items-center justify-center min-w-[76px] py-3 px-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-lg ring-4 ring-amber-300 scale-105 font-black'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-bold hover:border-slate-300'
                  }`}
                >
                  <span className={`text-[11px] uppercase tracking-wider ${isSelected ? 'text-amber-300' : 'text-slate-500'}`}>
                    {item.dayName}
                  </span>
                  <span className="text-lg font-black my-0.5">{item.dayNumber}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {item.monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Available Slots Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-cy-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Available Times on{' '}
              <span className="text-amber-600 underline decoration-amber-300">
                {activeDateObj?.fullLabel || activeDateStr}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              45-minute 1-on-1 personalized demo class
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
            title="Refresh availability"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${slotsState.loading ? 'animate-spin text-amber-500' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading State Skeleton */}
        {slotsState.loading && (
          <div className="py-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              Finding available certified mentors in your timezone...
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse border border-slate-200/60" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!slotsState.loading && slotsState.error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-4">
            <div className="flex items-start gap-3.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-rose-900">Could Not Load Slots</h4>
                <p className="text-xs text-rose-700 mt-1">{slotsState.error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Slots Grid */}
        {!slotsState.loading && !slotsState.error && (
          <>
            {slotsState.slots.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-700">No trial slots available for this date in your timezone.</p>
                <p className="text-xs mt-1 text-slate-500">Please choose an alternative date above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {slotsState.slots.map((slot) => {
                  const isSelected = selectedSlot?.startTimeUTC === slot.startTimeUTC;
                  const isAvailable = slot.isAvailable;

                  return (
                    <button
                      key={slot.slotId}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => onSelectSlot(slot)}
                      className={`relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[108px] cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-400 shadow-md scale-102 font-bold'
                          : isAvailable
                          ? 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-amber-300 hover:shadow-xs'
                          : 'bg-slate-50/80 border-slate-200/60 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div>
                          {/* Unambiguous Local Time */}
                          <div className={`text-base font-black flex items-center gap-1.5 ${isSelected ? 'text-slate-950' : 'text-slate-900'}`}>
                            {slot.localTime}
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                              isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {currentZoneAbbr}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            45 min · 1-on-1
                          </div>
                        </div>

                        {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-600 fill-amber-100 shrink-0" />}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        {isAvailable ? (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {slot.availableMentorsCount} {slot.availableMentorsCount === 1 ? 'mentor free' : 'mentors free'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-full">
                            Outside Hours
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold">
                          {slot.mentorTimeIST}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Selected Slot Reassurance Card */}
        {selectedSlot && (
          <div className="mt-6 p-4.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                ✓
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">Selected Trial Class Slot:</span>
                <p className="text-sm font-black text-slate-900">
                  {selectedSlot.localTime} {currentZoneAbbr} · {activeDateObj?.fullLabel}
                </p>
                <p className="text-xs text-amber-900 font-semibold mt-0.5">
                  🇮🇳 Certified India Mentor joins at <span className="font-black">{selectedSlot.mentorTimeIST}</span> (Asia/Kolkata)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-full text-slate-600 hover:text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </button>

          <button
            type="button"
            disabled={!selectedSlot}
            onClick={onNext}
            className={`px-8 py-3.5 font-black text-sm rounded-full shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              selectedSlot
                ? 'bg-[#F9B233] hover:bg-[#F59E0B] active:bg-[#D97706] text-slate-950 shadow-amber-500/20 transform hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Review Booking</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
}
