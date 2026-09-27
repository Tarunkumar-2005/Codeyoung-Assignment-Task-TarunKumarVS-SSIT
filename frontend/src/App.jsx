import React, { useState } from 'react';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import LandingHero from './components/LandingHero';
import ParentDetailsStep from './components/ParentDetailsStep';
import DateTimeStep from './components/DateTimeStep';
import ReviewStep from './components/ReviewStep';
import SuccessStep from './components/SuccessStep';
import MentorScheduleView from './components/MentorScheduleView';
import { detectBrowserTimezone } from './utils/timezones';

export default function App() {
  // Navigation step: 'landing' | 1 (details) | 2 (datetime) | 3 (review) | 'success'
  const [currentStep, setCurrentStep] = useState('landing');
  // View mode: 'parent' | 'mentor'
  const [viewMode, setViewMode] = useState('parent');

  // Timezone-state
  const [selectedTimezone, setSelectedTimezone] = useState(detectBrowserTimezone());

  // Form details state
  const [formData, setFormData] = useState({
    studentName: '',
    studentGrade: 'Grade 3-5 (Ages 8-10)',
    parentName: '',
    parentEmail: '',
    parentTimezone: selectedTimezone,
  });

  // Slot-selection state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Booking confirmation payload from backend
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  // Keep parent timezone synced with global timezone changes
  const handleTimezoneChange = (newTimezone) => {
    setSelectedTimezone(newTimezone);
    setFormData((prev) => ({ ...prev, parentTimezone: newTimezone }));
    setSelectedSlot(null); // Reset slot choice if timezone changes
  };

  const handleUpdateFormData = (fields) => {
    setFormData((prev) => {
      const updated = { ...prev, ...fields };
      if (fields.parentTimezone && fields.parentTimezone !== selectedTimezone) {
        setSelectedTimezone(fields.parentTimezone);
      }
      return updated;
    });
  };

  const handleBookingSuccess = (confirmationData) => {
    setBookingConfirmation(confirmationData);
    setCurrentStep('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setViewMode('parent');
    setCurrentStep('landing');
    setFormData({
      studentName: '',
      studentGrade: 'Grade 3-5 (Ages 8-10)',
      parentName: '',
      parentEmail: '',
      parentTimezone: selectedTimezone,
    });
    setSelectedSlot(null);
    setSelectedDate(null);
    setBookingConfirmation(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans antialiased">
      {/* Navigation Header */}
      <Header
        selectedTimezone={selectedTimezone}
        onTimezoneChange={handleTimezoneChange}
        onReset={handleReset}
        onStartBooking={() => {
          setViewMode('parent');
          setCurrentStep(1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentStep={currentStep}
        viewMode={viewMode}
        onToggleViewMode={(mode) => setViewMode(mode)}
      />

      {/* Main Content View */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        {viewMode === 'mentor' ? (
          <MentorScheduleView onSwitchToParentView={() => setViewMode('parent')} />
        ) : (
          <>
            {currentStep === 'landing' && (
              <LandingHero
                onStartBooking={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                selectedTimezone={selectedTimezone}
              />
            )}

            {typeof currentStep === 'number' && (
              <div className="max-w-5xl mx-auto">
                {/* Step Progress Bar */}
                <ProgressBar
                  currentStep={currentStep}
                  onStepClick={(stepId) => {
                    if (stepId < currentStep) {
                      setCurrentStep(stepId);
                    }
                  }}
                />

                {/* Step 1: Parent & Student Details */}
                {currentStep === 1 && (
                  <ParentDetailsStep
                    formData={formData}
                    onUpdate={handleUpdateFormData}
                    onNext={() => {
                      setCurrentStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onBack={() => setCurrentStep('landing')}
                  />
                )}

                {/* Step 2: Date & Slot Selection */}
                {currentStep === 2 && (
                  <DateTimeStep
                    selectedTimezone={selectedTimezone}
                    selectedDate={selectedDate}
                    selectedSlot={selectedSlot}
                    onSelectDate={setSelectedDate}
                    onSelectSlot={setSelectedSlot}
                    onTimezoneChange={handleTimezoneChange}
                    onNext={() => {
                      setCurrentStep(3);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onBack={() => setCurrentStep(1)}
                  />
                )}

                {/* Step 3: Review & Final Confirmation */}
                {currentStep === 3 && (
                  <ReviewStep
                    formData={formData}
                    selectedSlot={selectedSlot}
                    selectedTimezone={selectedTimezone}
                    onBookingSuccess={handleBookingSuccess}
                    onBack={() => setCurrentStep(2)}
                    onSelectSlot={setSelectedSlot}
                    onSelectAnotherSlot={() => setCurrentStep(2)}
                  />
                )}
              </div>
            )}

            {/* Step: Success Confirmation View */}
            {currentStep === 'success' && bookingConfirmation && (
              <SuccessStep
                bookingConfirmation={bookingConfirmation}
                onBookAnother={handleReset}
              />
            )}
          </>
        )}
      </main>


      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-slate-600">
            © 2026 Codeyoung. Trial-Class Booking Platform.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>React + Tailwind CSS</span>
            <span>·</span>
            <span>Node.js + MongoDB</span>
            <span>·</span>
            <span>Luxon IANA Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
