import React from 'react';
import { ArrowRight, Star, CheckCircle, Code, FlaskConical, Calculator, BookOpen, Bot, CreditCard, Sparkles, Shield, Clock, Globe } from 'lucide-react';
import { getTimezoneAbbreviation } from '../utils/timezones';

export default function LandingHero({ onStartBooking, selectedTimezone }) {
  const zoneAbbr = getTimezoneAbbreviation(selectedTimezone);

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-16 px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Value Prop & CTA */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          {/* Friendly Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            1-on-1 Personalized Live Mentorship · Free Demo
          </div>

          {/* Main Headline from Codeyoung Reference */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            1:1 live learning for your child to reach <span className="text-amber-500 underline decoration-amber-300 decoration-wavy decoration-2">their full potential</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl font-bold text-slate-700">
            One child. One mentor. Real attention. Clear progress.
          </p>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Experience 1:1 live interactive trial classes in Coding, Math, Science, and Robotics with expert mentors. Automatically scheduled in your local timezone ({selectedTimezone} · {zoneAbbr}).
          </p>

          {/* Primary CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              type="button"
              onClick={onStartBooking}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#F9B233] hover:bg-[#F59E0B] active:bg-[#D97706] text-slate-950 font-black text-base sm:text-lg shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-3 group"
            >
              <span>Book a FREE trial class</span>
              <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </button>

            <span className="text-xs sm:text-sm font-semibold text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Takes only 60 seconds · No credit card required
            </span>
          </div>

          {/* Trust Ratings Badges (Matching Screenshot) */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
            {/* Google Rating Card */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="font-black text-sm tracking-tight text-blue-600">
                G<span className="text-red-500">o</span><span className="text-amber-500">o</span><span className="text-blue-600">g</span><span className="text-green-500">l</span><span className="text-red-500">e</span>
              </span>
              <div className="flex items-center text-xs font-bold text-slate-800">
                <span>4.4</span>
                <div className="flex text-amber-400 ml-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-slate-500 border-l border-slate-200 pl-2">2,385 reviews</span>
            </div>

            {/* Trustpilot Rating Card */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="font-extrabold text-xs text-emerald-600 flex items-center gap-1">
                ★ Trustpilot
              </span>
              <div className="flex items-center text-xs font-bold text-slate-800">
                <span>4.4</span>
                <span className="ml-1 px-1 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-mono">★★★★★</span>
              </div>
              <span className="text-[11px] text-slate-500 border-l border-slate-200 pl-2">2,751 reviews</span>
            </div>
          </div>

          {/* Feature Checkmarks */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm font-semibold text-slate-700 max-w-lg mx-auto lg:mx-0 text-left">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Personalized 1:1 learning</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Certified India mentors</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dynamic local time slots</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Free, no commitment</span>
            </div>
          </div>
        </div>

        {/* Right Column: Codeyoung Subject Orbit Graphic (Inspired by screenshot) */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          {/* Subtle background concentric circles */}
          <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-amber-200/60 animate-spin-slow" style={{ animationDuration: '40s' }} />
            <div className="absolute inset-10 rounded-full border border-amber-300/40 border-dashed" />
            <div className="absolute inset-20 rounded-full bg-gradient-to-tr from-amber-50 to-orange-50/50" />

            {/* Central Student Illustration / Avatar Card */}
            <div className="relative z-10 w-44 h-44 rounded-full bg-gradient-to-br from-amber-400 via-amber-300 to-orange-400 p-1.5 shadow-xl shadow-amber-500/20">
              <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center text-white p-4 text-center overflow-hidden relative">
                <span className="text-4xl mb-1">👧‍💻</span>
                <span className="font-extrabold text-sm text-amber-300">Live 1:1 Class</span>
                <span className="text-[10px] text-slate-300">Personal Attention</span>
              </div>
            </div>

            {/* Floating Subject Badges matching Screenshot */}
            {/* 1. Coding */}
            <div className="absolute top-2 left-6 z-20 bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-md flex items-center gap-2 transform -rotate-3 hover:rotate-0 transition-transform cursor-default">
              <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Code className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-800">Coding</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>

            {/* 2. Science */}
            <div className="absolute top-4 right-4 z-20 bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-md flex items-center gap-2 transform rotate-2 hover:rotate-0 transition-transform cursor-default">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FlaskConical className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-800">Science</span>
            </div>

            {/* 3. Math */}
            <div className="absolute bottom-16 left-2 z-20 bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-md flex items-center gap-2 transform rotate-2 hover:rotate-0 transition-transform cursor-default">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-800">Math</span>
            </div>

            {/* 4. English */}
            <div className="absolute right-0 top-36 z-20 bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-md flex items-center gap-2 transform -rotate-2 hover:rotate-0 transition-transform cursor-default">
              <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-800">English</span>
            </div>

            {/* 5. Robotics */}
            <div className="absolute bottom-2 left-24 z-20 bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-md flex items-center gap-2 transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
              <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-xs font-black text-slate-800">Robotics</span>
            </div>

            {/* Floating Speech Bubble matching screenshot */}
            <div className="absolute -bottom-6 right-0 z-30 bg-white border border-amber-200 rounded-2xl p-3 shadow-lg max-w-[200px] text-left text-[11px] text-slate-700">
              <p className="font-medium">
                👋 <strong>Hello there!</strong> Schedule a free trial session in your timezone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="pt-8 border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-600">Simple 3-Step Process</h3>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">How Booking Your Trial Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg mb-4">
              1
            </div>
            <h4 className="text-lg font-bold text-slate-900">Tell Us About Your Child</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Enter your child's grade and interests so our certified mentor can tailor the live 1:1 session.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-lg mb-4">
              2
            </div>
            <h4 className="text-lg font-bold text-slate-900">Pick Your Local Slot</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Choose from available daytime slots in your local timezone ({zoneAbbr}). All DST offsets are handled automatically.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg mb-4">
              3
            </div>
            <h4 className="text-lg font-bold text-slate-900">Join Free 1:1 Demo</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Receive your unique classroom link and meet your dedicated educator for an interactive trial session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
