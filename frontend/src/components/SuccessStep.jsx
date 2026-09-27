import React, { useState } from 'react';
import { CheckCircle, Copy, Check, ExternalLink, Calendar, Clock, User, Video, ShieldCheck, RefreshCw, Globe, Sparkles } from 'lucide-react';

export default function SuccessStep({ bookingConfirmation, onBookAnother }) {
  const [copied, setCopied] = useState(false);

  const {
    bookingId,
    parent,
    mentor,
    appointment,
    parentLocalTime,
    mentorLocalTime,
  } = bookingConfirmation;

  const handleCopyLink = () => {
    if (appointment?.meetingLink) {
      navigator.clipboard.writeText(appointment.meetingLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const parentTimeString = `${parentLocalTime?.time} ${parentLocalTime?.zoneAbbreviation || ''}`.trim();
  const mentorTimeString = `${mentorLocalTime?.time} IST`.trim();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-cy-lg text-center">
        {/* Success Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-amber-500/10">
          <CheckCircle className="w-9 h-9 stroke-[2.5]" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Trial Class Confirmed
        </span>

        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          🎉 You're All Set!
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto font-medium">
          Your 1-on-1 personalized trial class has been scheduled with an expert mentor.
        </p>

        {/* Booking Reference ID */}
        <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">
          <span className="text-slate-400 font-sans">Booking ID:</span>
          <span className="font-extrabold text-slate-900">{bookingId}</span>
        </div>

        {/* Exact Coordinated Time Cards (Parent Time + Mentor Time) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Parent Time Card */}
          <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">Your Local Time</span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-mono">
                {parentLocalTime?.zoneAbbreviation}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-950 font-mono">
              {parentTimeString}
            </div>
            <div className="text-xs text-amber-900 font-bold pt-1 border-t border-amber-200/80">
              📅 {parentLocalTime?.date} · {parentLocalTime?.timezone}
            </div>
            <div className="text-[11px] text-amber-800 font-medium">
              {parentLocalTime?.zoneNameLong}
            </div>
          </div>

          {/* Mentor Time Card */}
          <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-900">Mentor Time (India)</span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded bg-purple-200 text-purple-950 font-mono">
                IST
              </span>
            </div>
            <div className="text-2xl font-black text-slate-950 font-mono">
              {mentorTimeString}
            </div>
            <div className="text-xs text-purple-900 font-bold pt-1 border-t border-purple-200/80">
              📅 {mentorLocalTime?.date} · Asia/Kolkata
            </div>
            <div className="text-[11px] text-purple-800 font-medium">
              India Standard Time (UTC+5:30)
            </div>
          </div>
        </div>

        {/* Assigned Mentor Card */}
        <div className="mt-6 bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-xs">
              {mentor?.name?.charAt(0) || 'M'}
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 block">
                Assigned Expert Mentor
              </span>
              <h4 className="text-base font-black text-slate-900">{mentor?.name}</h4>
              <p className="text-xs text-slate-500 font-medium">{mentor?.email}</p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Certified Educator
          </span>
        </div>

        {/* Meeting Link Card */}
        <div className="mt-6 bg-slate-900 text-white rounded-2xl p-6 text-left shadow-lg shadow-slate-950/15 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Classroom Meeting Link
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded font-bold">
              Ready
            </span>
          </div>

          <div className="bg-slate-800/90 rounded-xl p-3 font-mono text-xs text-amber-200 break-all select-all border border-slate-700">
            {appointment?.meetingLink}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Meeting Link</span>
                </>
              )}
            </button>

            <a
              href={appointment?.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-[#F9B233] hover:bg-[#F59E0B] text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-950" />
              <span>Join Classroom Demo</span>
            </a>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center">
          <button
            type="button"
            onClick={onBookAnother}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-full transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
            Book Another Trial Class
          </button>
        </div>
      </div>
    </div>
  );
}
