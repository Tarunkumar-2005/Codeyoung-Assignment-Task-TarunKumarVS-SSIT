import React, { useState, useEffect } from 'react';
import { getMentors, getMentorSchedule } from '../services/api';
import { 
  Users, Calendar, Clock, AlertCircle, CheckCircle, RefreshCw, 
  ExternalLink, UserCheck, ShieldAlert, Sparkles, Video, ArrowRight 
} from 'lucide-react';
import { DateTime } from 'luxon';

export default function MentorScheduleView({ onSwitchToParentView }) {
  const [mentors, setMentors] = useState([]);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [selectedDateIST, setSelectedDateIST] = useState(
    DateTime.now().setZone('Asia/Kolkata').toISODate()
  );
  const [mentorData, setMentorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState(null);

  // Fetch mentors list
  const fetchMentors = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const queryDate = date || selectedDateIST;
      const res = await getMentors(queryDate);
      if (res.success && res.data) {
        setMentors(res.data);
        if (!selectedMentorId && res.data.length > 0) {
          setSelectedMentorId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load mentors:', err);
      setError(err.message || 'Unable to connect to mentor server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific mentor schedule & bookings
  const fetchMentorSchedule = async (mentorId, date) => {
    if (!mentorId) return;
    try {
      setLoadingSchedule(true);
      const res = await getMentorSchedule(mentorId, date);
      if (res.success && res.data) {
        setMentorData(res.data);
      }
    } catch (err) {
      console.error('Failed to load mentor schedule:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    fetchMentors(selectedDateIST);
  }, [selectedDateIST]);

  useEffect(() => {
    if (selectedMentorId) {
      fetchMentorSchedule(selectedMentorId, selectedDateIST);
    }
  }, [selectedMentorId, selectedDateIST]);

  const handleRefresh = () => {
    fetchMentors(selectedDateIST);
    if (selectedMentorId) {
      fetchMentorSchedule(selectedMentorId, selectedDateIST);
    }
  };

  const selectedMentorOverview = mentors.find((m) => m.id === selectedMentorId);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold mb-3">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            Mentor Administration & Schedule View
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mentor Operations & Capacity Hub
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Live schedule timeline and 2-class daily quota verification under IST (<span className="font-semibold text-slate-800">Asia/Kolkata</span>).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors shadow-2xs"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loadingSchedule ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onSwitchToParentView}
            className="bg-[#F9B233] hover:bg-[#F59E0B] text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-sm transition-transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
          >
            <span>Switch to Parent Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Error loading mentors:</span> {error}
          </div>
          <button
            onClick={() => fetchMentors(selectedDateIST)}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filter Row: Select Mentor & Date */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mentor Selector */}
        <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-500" />
            Select Instructor / Mentor
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {mentors.map((m) => {
              const isSelected = m.id === selectedMentorId;
              const isFull = m.demosScheduledToday >= (m.maxDailyDemos || 2);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMentorId(m.id)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition-all relative ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-400'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-slate-900 truncate">{m.name}</div>
                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-slate-500">
                      {m.workingHours?.start} - {m.workingHours?.end}
                    </span>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        isFull
                          ? 'bg-rose-100 text-rose-800'
                          : m.demosScheduledToday > 0
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {m.demosScheduledToday}/{m.maxDailyDemos || 2}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Mentor Calendar Day (IST)
            </label>
            <input
              type="date"
              value={selectedDateIST}
              onChange={(e) => setSelectedDateIST(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold text-slate-800 text-sm"
            />
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Current IST Time: <span className="font-mono font-bold text-slate-700">{DateTime.now().setZone('Asia/Kolkata').toFormat('hh:mm a, dd LLL yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Selected Mentor Detail Card & Capacity Meter */}
      {mentorData && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-950 font-black text-xl flex items-center justify-center border border-amber-200 shadow-2xs">
                {mentorData.name?.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {mentorData.name}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                  <span>{mentorData.email}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">Timezone: {mentorData.timezone || 'Asia/Kolkata'}</span>
                  <span>•</span>
                  <span>Working Hours: <strong className="text-slate-800">{mentorData.workingHours?.start} – {mentorData.workingHours?.end} IST</strong></span>
                </div>
              </div>
            </div>

            {/* Daily Limit Status Badge */}
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <div className="text-xs text-slate-500 font-semibold">
                Daily Capacity ({selectedDateIST})
              </div>
              {mentorData.isFullyBooked ? (
                <div 
                  id="mentor-capacity-status"
                  className="px-3.5 py-1.5 rounded-full bg-rose-100 border border-rose-300 text-rose-900 font-black text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>2/2 Capacity Reached (Fully Booked)</span>
                </div>
              ) : mentorData.demosScheduledToday === 1 ? (
                <div 
                  id="mentor-capacity-status"
                  className="px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>1/2 Classes Booked (1 Slot Available)</span>
                </div>
              ) : (
                <div 
                  id="mentor-capacity-status"
                  className="px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>0/2 Capacity Used (2 Slots Available)</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointments Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-amber-500" />
                Scheduled Appointments Timeline ({selectedDateIST})
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {mentorData.bookings?.length || 0} appointment(s)
              </span>
            </div>

            {mentorData.bookings && mentorData.bookings.length > 0 ? (
              <div className="space-y-3" id="mentor-timeline">
                {mentorData.bookings.map((b, idx) => {
                  const startUTC = DateTime.fromISO(b.startTimeUTC, { zone: 'utc' });
                  const mentorLocal = startUTC.setZone(mentorData.timezone || 'Asia/Kolkata');
                  const parentZone = b.parentTimezone || b.parentId?.timezone || 'UTC';
                  const parentLocal = startUTC.setZone(parentZone);

                  return (
                    <div
                      key={b._id || idx}
                      className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-amber-300 transition-colors shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono font-black text-xs">
                            Slot #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {b.parentId?.name || 'Trial Student'}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({b.parentId?.email || 'parent@codeyoung.com'})
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {b.status}
                          </span>
                        </div>

                        {/* Dual Time Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          {/* Mentor IST Time */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              Mentor Time (Asia/Kolkata)
                            </div>
                            <div className="font-black text-slate-900 text-base mt-0.5">
                              {mentorLocal.toFormat('hh:mm a')} <span className="text-xs font-semibold text-slate-500">{mentorLocal.toFormat('ZZZZ')}</span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {mentorLocal.toFormat('cccc, dd LLL yyyy')}
                            </div>
                          </div>

                          {/* Parent Local Time */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Parent Time ({parentZone})
                            </div>
                            <div className="font-black text-slate-900 text-base mt-0.5">
                              {parentLocal.toFormat('hh:mm a')} <span className="text-xs font-semibold text-slate-500">{parentLocal.toFormat('ZZZZ')}</span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {parentLocal.toFormat('cccc, dd LLL yyyy')}
                            </div>
                          </div>
                        </div>

                        {/* UTC Instant Verification */}
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 pt-1">
                          <span>UTC Instant:</span>
                          <code className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-800 font-bold">
                            {typeof b.startTimeUTC === 'string' ? b.startTimeUTC : new Date(b.startTimeUTC).toISOString()}
                          </code>
                          <span>•</span>
                          <span>Booking ID:</span>
                          <code className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-800">
                            {b._id}
                          </code>
                        </div>
                      </div>

                      {/* Right: Meeting Link */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <a
                          href={b.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Classroom</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">No Demo Classes Scheduled on {selectedDateIST}</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {mentorData.name} has 2 available trial slots open for scheduling on this calendar date.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
