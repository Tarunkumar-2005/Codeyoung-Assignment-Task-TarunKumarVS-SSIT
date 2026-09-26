import React, { useState } from 'react';
import { submitBooking } from '../services/api';
import { getTimezoneAbbreviation } from '../utils/timezones';
import { User, Mail, GraduationCap, Calendar, Clock, Globe, ShieldCheck, AlertCircle, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react';

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
  const parentZoneAbbr = getTimezoneAbbreviation(parentZone);

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
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 mb-2">
            Step 3 of 3 · Final Confirmation
          </span>
          <h2 className="text-2xl font-bold text-slate-900">Review & Confirm Your Trial Class</h2>
          <p className="text-sm text-slate-500 mt-1">
            Times shown in <strong className="text-slate-800">{parentZone}</strong> ({parentZoneAbbr}).
          </p>
        </div>

        {/* Friendly No Mentor Available & Alternative Slots Card */}
        {bookingError && (
          <div className="p-6 bg-amber-50/90 border border-amber-200 rounded-3xl mb-6 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-3 flex-1">
                <div>
                  <h4 className="text-base font-bold text-amber-950">
                    {bookingError.message || 'No mentor is available for this time.'}
                  </h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Mentors are fully booked or outside operating hours for this specific slot.
                  </p>
                </div>

                {/* Same-Day Available Alternative Slots */}
                {bookingError.suggestedAlternativeSlots && bookingError.suggestedAlternativeSlots.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <p className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Available Alternative Times on the Same Day:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bookingError.suggestedAlternativeSlots.map((alt) => (
                        <button
                          key={alt.slotId || alt.startTimeUTC}
                          type="button"
                          onClick={() => handlePickAlternative(alt)}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer group"
                        >
                          <span>{alt.localTime} {parentZoneAbbr}</span>
                          <span className="text-[10px] font-normal text-amber-700 bg-amber-100 group-hover:bg-white px-1.5 py-0.5 rounded">
                            {alt.availableMentorsCount} free
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-1 flex items-center gap-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={onSelectAnotherSlot}
                    className="text-amber-900 hover:text-amber-950 underline cursor-pointer"
                  >
                    ← Browse all other dates & slots
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dual Coordinated Summary Card */}
        <div className="bg-slate-50/90 rounded-2xl p-6 border border-slate-200/80 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Class Schedule & Timezones
            </h3>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              45-Minute 1-on-1 Session
            </span>
          </div>

          {/* Side-by-side Dual Times Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Parent Time */}
            <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                Parent Local Time
              </span>
              <div className="text-xl font-extrabold text-blue-950 mt-1 flex items-baseline gap-1.5">
                {selectedSlot?.localTime}
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">
                  {parentZoneAbbr}
                </span>
              </div>
              <p className="text-xs text-blue-800 mt-1 font-medium">
                {selectedSlot?.localDate} · {parentZone}
              </p>
            </div>

            {/* Mentor Time */}
            <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
                Mentor Time (India)
              </span>
              <div className="text-xl font-extrabold text-purple-950 mt-1 flex items-baseline gap-1.5">
                {selectedSlot?.mentorTimeIST?.replace(' IST', '')}
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-purple-200 text-purple-900">
                  IST
                </span>
              </div>
              <p className="text-xs text-purple-800 mt-1 font-medium">
                Asia/Kolkata (UTC+5:30)
              </p>
            </div>
          </div>

          {/* Participant Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Student:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-blue-600" />
                {formData.studentName}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">{formData.studentGrade}</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">Parent:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-4 h-4 text-blue-600" />
                {formData.parentName}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">{formData.parentEmail}</span>
            </div>
          </div>
        </div>

        {/* Free Assurance */}
        <div className="mt-6 flex items-center gap-3 text-xs text-slate-600 bg-emerald-50 border border-emerald-200/70 p-3.5 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>100% Free Trial Class.</strong> An expert coding mentor will be automatically assigned to conduct your child’s session.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={submitting}
            onClick={onBack}
            className="px-5 py-3 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Slot
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleConfirm()}
            className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assigning Mentor & Booking...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm & Book Trial Class
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
