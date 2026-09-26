import React, { useState } from 'react';
import { CheckCircle, Copy, Check, ExternalLink, Calendar, Clock, User, Video, ShieldCheck, RefreshCw } from 'lucide-react';

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-lg shadow-blue-900/5 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/10">
          <CheckCircle className="w-9 h-9 stroke-[2.5]" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 mb-2">
          Booking Confirmed
        </span>

        <h2 className="text-3xl font-extrabold text-slate-900">Your Trial Class is Scheduled!</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          We have assigned an expert mentor and generated your child's trial session classroom link.
        </p>

        {/* Booking Reference ID */}
        <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs border border-slate-200">
          <span className="text-slate-400">Booking Reference:</span>
          <span className="font-bold text-slate-900">{bookingId}</span>
        </div>

        {/* Dual Coordinated Time Presentation */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {/* Parent Time Card */}
          <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Your Local Time</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-200/80 text-blue-900">
                {parentLocalTime?.zoneAbbreviation || parentLocalTime?.timezone}
              </span>
            </div>
            <div className="text-lg font-bold text-blue-950">
              {parentLocalTime?.time}
            </div>
            <div className="text-xs text-blue-800 font-medium">
              {parentLocalTime?.date} · {parentLocalTime?.zoneNameLong}
            </div>
          </div>

          {/* Mentor Time Card */}
          <div className="bg-purple-50/80 p-5 rounded-2xl border border-purple-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800">Mentor's Time (India)</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-200/80 text-purple-900">
                IST (UTC+5:30)
              </span>
            </div>
            <div className="text-lg font-bold text-purple-950">
              {mentorLocalTime?.time}
            </div>
            <div className="text-xs text-purple-800 font-medium">
              {mentorLocalTime?.date} · India Standard Time
            </div>
          </div>
        </div>

        {/* Assigned Mentor Card */}
        <div className="mt-6 bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {mentor?.name?.charAt(0) || 'M'}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                Assigned Mentor
              </span>
              <h4 className="text-base font-bold text-slate-900">{mentor?.name}</h4>
              <p className="text-xs text-slate-500">{mentor?.email}</p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Certified Educator
          </span>
        </div>

        {/* Meeting Link Card */}
        <div className="mt-6 bg-slate-900 text-white rounded-2xl p-6 text-left shadow-lg shadow-slate-950/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Classroom Meeting Link
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
              Ready
            </span>
          </div>

          <div className="bg-slate-800/90 rounded-xl p-3 font-mono text-xs text-blue-200 break-all select-all border border-slate-700">
            {appointment?.meetingLink}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
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
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-600/30"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Join Classroom Demo</span>
            </a>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center">
          <button
            type="button"
            onClick={onBookAnother}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
            Book Another Trial Class
          </button>
        </div>
      </div>
    </div>
  );
}
