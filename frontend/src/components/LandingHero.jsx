import React from 'react';
import { Calendar, Users, Award, ShieldCheck, ArrowRight, Clock, Video } from 'lucide-react';

export default function LandingHero({ onStartBooking, selectedTimezone }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl shadow-indigo-950/20 mb-12">
        {/* Background glow decorations */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 border border-white/15 backdrop-blur-sm mb-6">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
            100% Free · 45-Minute 1-on-1 Trial Session
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
            Book a Live 1-on-1 Trial Class for Your Child
          </h1>

          <p className="text-blue-100/90 text-base sm:text-lg leading-relaxed mb-8">
            Experience interactive coding, math, and robotics education led by certified expert educators in India, seamlessly coordinated for your local time.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onStartBooking}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 cursor-pointer text-base"
            >
              Select Date & Book Slot
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="text-xs text-blue-200/80 flex items-center justify-center sm:justify-start gap-1.5 py-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              No credit card required
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">10 Dedicated Expert Mentors</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our certified teachers personalize every lesson to your child’s learning pace, grade, and coding interests.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Smart Timezone Matching</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Automatic Daylight Saving Time adjustment converts India mentor hours precisely into your US/UK local schedule.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Instant Class Link</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Receive an immediate meeting link and dual timezone breakdown as soon as your booking is confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}
