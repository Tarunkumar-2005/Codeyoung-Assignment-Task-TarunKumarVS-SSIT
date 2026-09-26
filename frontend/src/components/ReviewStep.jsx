import React, { useState } from 'react';
import { submitBooking } from '../services/api';
import { User, Mail, GraduationCap, Calendar, Clock, Globe, ShieldCheck, AlertCircle, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ReviewStep({
  formData,
  selectedSlot,
  selectedTimezone,
  onBookingSuccess,
  onBack,
  onSelectAnotherSlot,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setBookingError(null);

    const payload = {
      parent: {
        name: formData.parentName,
        email: formData.parentEmail,
        timezone: formData.parentTimezone || selectedTimezone,
      },
      startTime: selectedSlot.startTimeUTC,
      timezone: formData.parentTimezone || selectedTimezone,
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
        message: err.message || 'An error occurred while confirming your trial class.',
        details: err.details || null,
      });
    } finally {
      setSubmitting(false);
    }
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
            Please verify your details before we assign your child a dedicated 1-on-1 mentor.
          </p>
        </div>

        {/* Error Alert Box */}
        {bookingError && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-rose-900">Booking Unavailable</h4>
                <p className="text-xs text-rose-700 leading-relaxed">{bookingError.message}</p>
                {bookingError.details?.suggestion && (
                  <p className="text-xs font-semibold text-rose-800 bg-rose-100/80 p-2 rounded-lg">
                    💡 {bookingError.details.suggestion}
                  </p>
                )}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onSelectAnotherSlot}
                    className="text-xs font-bold text-rose-800 hover:text-rose-950 underline cursor-pointer"
                  >
                    ← Choose another time slot
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Summary Card */}
        <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/60 pb-2">
            Appointment Summary
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Student */}
            <div>
              <span className="text-xs text-slate-400 block">Student:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-blue-600" />
                {formData.studentName}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">{formData.studentGrade}</span>
            </div>

            {/* Parent */}
            <div>
              <span className="text-xs text-slate-400 block">Parent:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-4 h-4 text-blue-600" />
                {formData.parentName}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">{formData.parentEmail}</span>
            </div>

            {/* Local Time */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
              <span className="text-xs text-slate-400 block">Class Time (Your Local Time):</span>
              <span className="font-bold text-base text-blue-950 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                {selectedSlot?.localDate} · {selectedSlot?.localTimeFormatted}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Duration: 45 minutes · 1-on-1 Interactive Mentorship
              </span>
            </div>

            {/* Timezone Notice */}
            <div className="sm:col-span-2 bg-blue-100/50 p-3 rounded-xl flex items-center justify-between text-xs text-blue-900 border border-blue-200/60">
              <div className="flex items-center gap-2 font-medium">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Parent Zone: <strong>{selectedTimezone}</strong></span>
              </div>
              <span className="text-slate-600 font-mono text-[11px]">
                Mentor IST: {selectedSlot?.mentorTimeIST}
              </span>
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
            onClick={handleConfirm}
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
