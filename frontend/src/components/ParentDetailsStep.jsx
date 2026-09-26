import React, { useState } from 'react';
import { SUPPORTED_TIMEZONES } from '../utils/timezones';
import { User, Mail, GraduationCap, Globe, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ParentDetailsStep({ formData, onUpdate, onNext, onBack }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.studentName || formData.studentName.trim().length < 2) {
      errs.studentName = 'Please enter student name (at least 2 characters).';
    }
    if (!formData.parentName || formData.parentName.trim().length < 2) {
      errs.parentName = 'Please enter parent full name.';
    }
    if (!formData.parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail.trim())) {
      errs.parentEmail = 'Please provide a valid email address.';
    }
    if (!formData.parentTimezone) {
      errs.parentTimezone = 'Please select your timezone.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Student & Parent Details</h2>
        <p className="text-sm text-slate-500 mt-1">
          Tell us about your student so our mentor can tailor the 1-on-1 trial class experience.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Student Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. Leo Watson"
              value={formData.studentName}
              onChange={(e) => onUpdate({ studentName: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                errors.studentName
                  ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              } focus:outline-none`}
            />
          </div>
          {errors.studentName && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.studentName}</p>}
        </div>

        {/* Student Grade / Age */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Student Grade / Age <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <GraduationCap className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={formData.studentGrade}
              onChange={(e) => onUpdate({ studentGrade: e.target.value })}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="Grade 1-2 (Ages 6-7)">Grade 1-2 (Ages 6-7) · Visual Coding & Logic</option>
              <option value="Grade 3-5 (Ages 8-10)">Grade 3-5 (Ages 8-10) · Block Coding & Games</option>
              <option value="Grade 6-8 (Ages 11-13)">Grade 6-8 (Ages 11-13) · Python & Web Basics</option>
              <option value="Grade 9-12 (Ages 14-18)">Grade 9-12 (Ages 14-18) · Advanced Python / AI</option>
            </select>
          </div>
        </div>

        {/* Parent Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Parent Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. Sarah Watson"
              value={formData.parentName}
              onChange={(e) => onUpdate({ parentName: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                errors.parentName
                  ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              } focus:outline-none`}
            />
          </div>
          {errors.parentName && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.parentName}</p>}
        </div>

        {/* Parent Email */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Parent Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="e.g. sarah.watson@example.com"
              value={formData.parentEmail}
              onChange={(e) => onUpdate({ parentEmail: e.target.value })}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                errors.parentEmail
                  ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              } focus:outline-none`}
            />
          </div>
          {errors.parentEmail && <p className="text-xs text-rose-600 mt-1.5 font-medium">{errors.parentEmail}</p>}
          <p className="text-[11px] text-slate-400 mt-1">Class link and calendar invite will be sent to this email.</p>
        </div>

        {/* Parent Timezone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Your Local Timezone <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Globe className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={formData.parentTimezone}
              onChange={(e) => onUpdate({ parentTimezone: e.target.value })}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <button
            type="submit"
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            Choose Date & Time
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
