import React, { useState, useEffect } from 'react';
import { fetchAvailableSlots } from '../services/api';
import { getAvailableTimezoneOptions, getTimezoneAbbreviation } from '../utils/timezones';
import { DateTime } from 'luxon';
import { Calendar, Clock, ArrowLeft, ArrowRight, AlertCircle, RefreshCw, Globe, CheckCircle2 } from 'lucide-react';

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

  // Generate a 14-day booking calendar window starting tomorrow
  const upcomingDates = React.useMemo(() => {
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
  const currentZoneAbbr = getTimezoneAbbreviation(selectedTimezone);

  useEffect(() => {
    if (!selectedDate && upcomingDates[0]) {
      onSelectDate(upcomingDates[0].dateStr);
    }
  }, [upcomingDates, selectedDate, onSelectDate]);

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
            error: err.message || 'Failed to fetch available slots for this date.',
          });
        }
      }
    };

    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [activeDateStr, selectedTimezone]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header with Explicit Timezone Notice */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Select Date & Time Slot</h2>
            <p className="text-sm font-semibold text-blue-600 mt-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" />
              Times shown in <span className="underline decoration-blue-400 font-bold">{selectedTimezone}</span> ({currentZoneAbbr})
            </p>
          </div>

          {/* Timezone Selector Helper */}
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-medium pl-1">Zone:</span>
            <select
              value={selectedTimezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {timezoneOptions.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Horizontal Date Picker Strip */}
        <div className="mt-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            Choose Day (14-Day Window)
          </label>
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
                  className={`flex flex-col items-center justify-center min-w-[76px] py-3.5 px-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 scale-102 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider opacity-80">{item.dayName}</span>
                  <span className="text-lg font-extrabold my-0.5">{item.dayNumber}</span>
                  <span className="text-[10px] opacity-75">{item.monthName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slots Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Available Slots for{' '}
              <span className="text-blue-600">
                {upcomingDates.find((d) => d.dateStr === activeDateStr)?.fullLabel || activeDateStr}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Times displayed in <strong className="text-slate-800">{selectedTimezone} ({currentZoneAbbr})</strong> · 45-min demo class
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectDate(activeDateStr)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
            title="Refresh availability"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${slotsState.loading ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {slotsState.loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 py-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-22 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {!slotsState.loading && slotsState.error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-4 my-4">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-900">Could Not Load Slots</h4>
              <p className="text-xs text-rose-700 mt-1">{slotsState.error}</p>
            </div>
          </div>
        )}

        {/* Slots Grid with Unambiguous Timezone Context on Every Button */}
        {!slotsState.loading && !slotsState.error && (
          <>
            {slotsState.slots.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-sm text-slate-600">No slots available for this date in your timezone.</p>
                <p className="text-xs mt-1 text-slate-400">Please select another date above or check alternative hours.</p>
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
                      className={`relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[104px] cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/95 border-blue-600 ring-2 ring-blue-500/20 shadow-md scale-102'
                          : isAvailable
                          ? 'bg-white hover:bg-slate-50 border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
                          : 'bg-slate-50/80 border-slate-200/50 opacity-45 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div>
                          {/* Unambiguous Local Time with DST code */}
                          <div className={`text-base font-extrabold flex items-center gap-1.5 ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                            {slot.localTime}
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                              {currentZoneAbbr}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            45 min · 1-on-1
                          </div>
                        </div>

                        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-100 shrink-0" />}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        {isAvailable ? (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                            }`}
                          >
                            {slot.availableMentorsCount} {slot.availableMentorsCount === 1 ? 'mentor free' : 'mentors free'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                            Outside Mentor Hours
                          </span>
                        )}

                        <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
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

        {/* Selected Slot Callout */}
        {selectedSlot && (
          <div className="mt-6 p-4 rounded-2xl bg-blue-50/90 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Confirmed Slot Choice:</p>
                <p className="text-sm font-bold text-blue-950">
                  {selectedSlot.localTime} {currentZoneAbbr} ({selectedTimezone}) · {upcomingDates.find((d) => d.dateStr === activeDateStr)?.fullLabel}
                </p>
                <p className="text-xs text-blue-700">
                  Mentor in India will join at {selectedSlot.mentorTimeIST}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            type="button"
            disabled={!selectedSlot}
            onClick={onNext}
            className={`px-8 py-3.5 font-bold text-sm rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              selectedSlot
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 transform hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Review Booking
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
