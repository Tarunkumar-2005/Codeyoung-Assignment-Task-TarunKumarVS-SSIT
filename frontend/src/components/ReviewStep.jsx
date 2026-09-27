import React, { useState } from 'react';
import { submitBooking } from '../services/api';
import { getTimezoneAbbreviation } from '../utils/timezones';
import { User, Mail, GraduationCap, Calendar, Clock, Globe, ShieldCheck, AlertCircle, ArrowLeft, Loader2, CheckCircle, Sparkles, HelpCircle } from 'lucide-react';

export default function ReviewStep({
  formData,
  selectedSlot,
  selectedTimezone,
  onBookingSuccess,
  onBack,
  onSelectSlot,
  onSelectAnotherSlot,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const parentZone = formData.parentTimezone || selectedTimezone;
  const parentZoneAbbr = getTimezoneAbbreviation(parentZone, selectedSlot?.localDate || selectedSlot?.startTimeUTC);

  const handleConfirm = async (slotToBook = selectedSlot) => {
    setSubmitting(true);
    setBookingError(null);

    const payload = {
      parent: {
        name: formData.parentName,
        email: formData.parentEmail,
        timezone: parentZone,
      },
      startTime: slotToBook.startTimeUTC,
      timezone: parentZone,
    };

    try {
      const response = await submitBooking(payload);
      if (response.success && response.data) {
        onBookingSuccess(response.data);
      } else {
        throw new Error(response.message || 'Booking could not be confirmed.');
      }
    } catch (err) {
      setBookingError({
        code: err.code || 'BOOKING_FAILED',
        message: err.message === 'No mentor is available for this time.' 
          ? 'No mentor is available for this time.' 
          : (err.message || 'An error occurred while confirming your trial class.'),
        details: err.details || null,
        suggestedAlternativeSlots: err.details?.suggestedAlternativeSlots || [],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickAlternative = (altSlot) => {
    if (onSelectSlot) {
      onSelectSlot(altSlot);
    }
    setBookingError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-cy-md">
        {/* Step Header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200/80 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Step 3 of 3 · Final Confirmation
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Review & Confirm Your Trial Class
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Times shown in <strong className="text-slate-900">{parentZone}</strong> ({parentZoneAbbr}).
          </p>
        </div>

        {/* Friendly Error & Guidance Card */}
        {bookingError && (
          <div 
            id="booking-error-banner"
            className="p-6 bg-amber-50 border border-amber-300 rounded-3xl mb-6 shadow-xs animate-in fade-in"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-black">
                ⚠️
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <h4 className="text-base font-black text-amber-950">
                    {bookingError.code === 'PARENT_DAILY_LIMIT_REACHED'
                      ? 'Daily trial limit reached'
                      : bookingError.code === 'DUPLICATE_PARENT_BOOKING'
                      ? 'Duplicate appointment time'
                      : (bookingError.message || 'No mentor is available for this time.')}
                  </h4>
                  <p className="text-xs text-amber-900 font-medium mt-1 leading-relaxed">
                    {bookingError.code === 'PARENT_DAILY_LIMIT_REACHED'
                      ? 'You have reached the maximum of 2 trial classes for today. Please choose another date.'
                      : bookingError.code === 'DUPLICATE_PARENT_BOOKING'
                      ? 'You already have a trial class booked for this time. Please choose another time.'
                      : (bookingError.details?.suggestion || "Don't worry — all mentors are currently booked or outside working hours for this specific slot, but we have other slots available today!")}
                  </p>
                </div>

                {/* Same-Day Available Alternative Slots for Mentor Capacity */}
                {bookingError.code !== 'PARENT_DAILY_LIMIT_REACHED' && bookingError.suggestedAlternativeSlots && bookingError.suggestedAlternativeSlots.length > 0 && (
                  <div className="pt-2 border-t border-amber-200">
                    <p className="text-xs font-black text-amber-950 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      Try another time on the same day:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bookingError.suggestedAlternativeSlots.map((alt) => (
                        <button
                          key={alt.slotId || alt.startTimeUTC}
                          type="button"
                          onClick={() => handlePickAlternative(alt)}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-slate-950 text-xs font-black shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer group"
                        >
                          <span>{alt.localTime} {parentZoneAbbr}</span>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 group-hover:bg-white px-1.5 py-0.5 rounded">
                            {alt.availableMentorsCount} free
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-1 flex items-center gap-4 text-xs font-bold">
                  <button
                    type="button"
                    onClick={onSelectAnotherSlot}
                    className="text-amber-950 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>← Browse other dates & times</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Dual Coordinated Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Your Trial Class Schedule
            </h3>
            <span className="text-[11px] font-black text-slate-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
              45-Minute 1-on-1 Session
            </span>
          </div>

          {/* Side-by-side Dual Times Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Parent Local Time */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Your Local Time
              </span>
              <div className="text-2xl font-black text-slate-950 mt-1 flex items-baseline gap-1.5">
                {selectedSlot?.localTime}
                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  {parentZoneAbbr}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                📅 {selectedSlot?.localDate} · {parentZone}
              </p>
            </div>

            {/* Mentor Time */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Mentor Time (India)
              </span>
              <div className="text-2xl font-black text-slate-950 mt-1 flex items-baseline gap-1.5">
                {selectedSlot?.mentorTimeIST?.replace(' IST', '')}
                <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                  IST
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-semibold">
                🇮🇳 Asia/Kolkata (UTC+5:30)
              </p>
            </div>
          </div>

          {/* Participant Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-sm">
            <div>
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Student:</span>
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-amber-500" />
                {formData.studentName}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5 font-medium">{formData.studentGrade}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Parent:</span>
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-4 h-4 text-amber-500" />
                {formData.parentName}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5 font-medium">{formData.parentEmail}</span>
            </div>
          </div>
        </div>

        {/* Free Assurance Pill */}
        <div className="mt-6 flex items-center gap-3 text-xs text-slate-700 bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl font-medium">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>100% Free Trial Class.</strong> An expert educator will be assigned to conduct your child’s customized demo.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={submitting}
            onClick={onBack}
            className="px-5 py-3 rounded-full text-slate-600 hover:text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Slot
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleConfirm()}
            className="px-8 py-3.5 bg-[#F9B233] hover:bg-[#F59E0B] active:bg-[#D97706] text-slate-950 font-black text-sm rounded-full shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Assigning Mentor & Booking...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>Confirm & Book Trial Class</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
