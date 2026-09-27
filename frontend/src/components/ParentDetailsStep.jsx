import React, { useState } from 'react';
import { SUPPORTED_TIMEZONES, getTimezoneAbbreviation } from '../utils/timezones';
import { User, Mail, GraduationCap, Globe, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

export default function ParentDetailsStep({ formData, onUpdate, onNext, onBack }) {
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let err = '';
    if (name === 'studentName') {
      if (!value || value.trim().length < 2) {
        err = 'Please enter your student’s name (at least 2 characters).';
      }
    } else if (name === 'parentName') {
      if (!value || value.trim().length < 2) {
        err = 'Please enter parent or guardian full name.';
      }
    } else if (name === 'parentEmail') {
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        err = 'Please enter a valid email address for class confirmation.';
      }
    } else if (name === 'parentTimezone') {
      if (!value) {
        err = 'Please select your local timezone.';
      }
    }
    return err;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field, value) => {
    onUpdate({ [field]: value });
    if (touched[field]) {
      const err = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {
      studentName: validateField('studentName', formData.studentName),
      parentName: validateField('parentName', formData.parentName),
      parentEmail: validateField('parentEmail', formData.parentEmail),
      parentTimezone: validateField('parentTimezone', formData.parentTimezone),
    };

    setTouched({ studentName: true, parentName: true, parentEmail: true, parentTimezone: true });
    setErrors(newErrors);

    const hasError = Object.values(newErrors).some(Boolean);
    if (!hasError) {
      onNext();
    }
  };

  const zoneAbbr = getTimezoneAbbreviation(formData.parentTimezone);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-cy-md">
      {/* Step Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200/80 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Step 1 of 3 · Student & Parent Details
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Let's get your child's trial class started
        </h2>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          Tell us about your student so our certified India mentor can tailor the 1-on-1 trial class experience.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Student Name */}
        <div>
          <label htmlFor="studentName" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            Student Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="studentName"
              type="text"
              placeholder="e.g. Leo Watson"
              value={formData.studentName}
              onChange={(e) => handleChange('studentName', e.target.value)}
              onBlur={() => handleBlur('studentName')}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                errors.studentName && touched.studentName
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400'
              } focus:outline-none`}
            />
          </div>
          {errors.studentName && touched.studentName && (
            <p className="text-xs text-rose-600 mt-1.5 font-bold flex items-center gap-1">
              ⚠️ {errors.studentName}
            </p>
          )}
        </div>

        {/* Student Grade / Subject Focus */}
        <div>
          <label htmlFor="studentGrade" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            Grade & Preferred Subject Focus <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <GraduationCap className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              id="studentGrade"
              value={formData.studentGrade}
              onChange={(e) => handleChange('studentGrade', e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white text-sm font-semibold focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="Grade 1-2 (Ages 6-7)">Grade 1-2 (Ages 6-7) · Visual Logic, ScratchJr & Coding Basics</option>
              <option value="Grade 3-5 (Ages 8-10)">Grade 3-5 (Ages 8-10) · Block Coding, Game Design & Math</option>
              <option value="Grade 6-8 (Ages 11-13)">Grade 6-8 (Ages 11-13) · Python, Web Development & Robotics</option>
              <option value="Grade 9-12 (Ages 14-18)">Grade 9-12 (Ages 14-18) · Advanced Python, AI & Data Science</option>
            </select>
          </div>
        </div>

        {/* Parent Full Name */}
        <div>
          <label htmlFor="parentName" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            Parent / Guardian Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="parentName"
              type="text"
              placeholder="e.g. Sarah Watson"
              value={formData.parentName}
              onChange={(e) => handleChange('parentName', e.target.value)}
              onBlur={() => handleBlur('parentName')}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                errors.parentName && touched.parentName
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400'
              } focus:outline-none`}
            />
          </div>
          {errors.parentName && touched.parentName && (
            <p className="text-xs text-rose-600 mt-1.5 font-bold flex items-center gap-1">
              ⚠️ {errors.parentName}
            </p>
          )}
        </div>

        {/* Parent Email */}
        <div>
          <label htmlFor="parentEmail" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
            Parent Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="parentEmail"
              type="email"
              placeholder="e.g. sarah.watson@example.com"
              value={formData.parentEmail}
              onChange={(e) => handleChange('parentEmail', e.target.value)}
              onBlur={() => handleBlur('parentEmail')}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                errors.parentEmail && touched.parentEmail
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400'
              } focus:outline-none`}
            />
          </div>
          {errors.parentEmail && touched.parentEmail && (
            <p className="text-xs text-rose-600 mt-1.5 font-bold flex items-center gap-1">
              ⚠️ {errors.parentEmail}
            </p>
          )}
          <p className="text-[11px] text-slate-500 mt-1.5">
            Your classroom link and Google Calendar invite will be sent directly to this address.
          </p>
        </div>

        {/* Parent Timezone Selection */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="parentTimezone" className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-amber-600" />
              Your Local Timezone <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-amber-900 border border-amber-300 font-bold">
              {zoneAbbr}
            </span>
          </div>

          <p className="text-xs text-amber-900 font-medium">
            Times will be automatically shown in your local timezone throughout the booking process.
          </p>

          <select
            id="parentTimezone"
            value={formData.parentTimezone}
            onChange={(e) => handleChange('parentTimezone', e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl border border-amber-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_TIMEZONES.map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reassurance pill */}
        <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>No credit card required. 100% free trial with certified educators.</span>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3 rounded-full text-slate-600 hover:text-slate-900 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <button
            type="submit"
            className="px-8 py-3.5 bg-[#F9B233] hover:bg-[#F59E0B] active:bg-[#D97706] text-slate-950 font-black text-sm rounded-full shadow-md shadow-amber-500/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
          >
            <span>Choose Date & Time</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </form>
    </div>
  );
}
