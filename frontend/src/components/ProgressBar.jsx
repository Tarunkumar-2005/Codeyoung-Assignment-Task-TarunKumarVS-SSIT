import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Your Details', subtitle: 'Student & Parent' },
  { id: 2, label: 'Choose Date & Time', subtitle: 'Local Slots' },
  { id: 3, label: 'Confirm', subtitle: 'Review & Book' },
];

export default function ProgressBar({ currentStep, onStepClick }) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8 px-4">
      <nav aria-label="Booking Progress" className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-200 -z-0 rounded-full" />
        
        {/* Active Progress Fill Line */}
        <div
          className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-amber-400 transition-all duration-300 rounded-full -z-0"
          style={{
            width:
              currentStep === 1
                ? '0%'
                : currentStep === 2
                ? '50%'
                : '100%',
          }}
        />

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = isCompleted;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.id)}
              className={`flex flex-col items-center group relative z-10 focus:outline-none ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Step Circle Indicator */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-extrabold text-xs sm:text-sm transition-all duration-200 border-2 ${
                  isCompleted
                    ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-sm group-hover:scale-105'
                    : isCurrent
                    ? 'bg-slate-900 border-amber-400 text-white shadow-md ring-4 ring-amber-100 scale-105 font-black'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="text-center mt-2">
                <span
                  className={`block text-xs sm:text-sm font-bold transition-colors ${
                    isCurrent
                      ? 'text-slate-900 font-extrabold'
                      : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                <span className="hidden sm:block text-[11px] text-slate-400 font-medium">
                  {step.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
