import React, { useState } from 'react';
import { PatientProfile, IntakeForm, ServiceType } from '../types';

interface ClinicalIntakeScreenProps {
  patient: PatientProfile;
  service: ServiceType;
  onBack: () => void;
  onSubmit: (form: IntakeForm) => void;
}

export const ClinicalIntakeScreen: React.FC<ClinicalIntakeScreenProps> = ({
  patient,
  service,
  onBack,
  onSubmit,
}) => {
  const [symptoms, setSymptoms] = useState(
    patient.id === '#8492-A'
      ? 'I have been experiencing sharp abdominal pain in the lower right quadrant for the past few hours. It feels worse when I move.'
      : ''
  );
  const [duration, setDuration] = useState(patient.id === '#8492-A' ? 'hours' : '');
  const [meds, setMeds] = useState<string[]>(['Ibuprofen', 'Vitamin D']);
  const [newMed, setNewMed] = useState('');
  
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  const handleAddMed = () => {
    if (newMed.trim()) {
      if (!meds.includes(newMed.trim())) {
        setMeds([...meds, newMed.trim()]);
      }
      setNewMed('');
    }
  };

  const handleRemoveMed = (indexToRemove: number) => {
    setMeds(meds.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveDraft = () => {
    setShowDraftSaved(true);
    setTimeout(() => {
      setShowDraftSaved(false);
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      symptoms: symptoms || 'Routine consultation / General wellness check.',
      duration: duration || 'Not specified',
      medications: meds,
    });
  };

  const getServiceLabel = () => {
    switch (service) {
      case 'doctor':
        return 'Seek General Doctor';
      case 'laboratory':
        return 'Laboratory Services';
      case 'triage':
        return 'Triage / Check-up';
      case 'pharmacy':
        return 'Pharmacy Refill';
      default:
        return 'Medical Intake';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 z-10 animate-fade-in">
      {/* Dynamic Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-3 gap-2">
          <div>
            <span className="text-secondary font-semibold text-sm uppercase tracking-widest block">
              {getServiceLabel()}
            </span>
            <h2 className="font-bold text-2xl md:text-3xl text-primary tracking-tight">
              Clinical Intake
            </h2>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-on-surface-variant">
              Step 1 of 3
            </span>
            <span className="text-xs text-on-surface-variant/70 italic text-right">
              Patient: <strong className="text-primary">{patient.name}</strong> ({patient.id})
            </span>
          </div>
        </div>
        <div className="w-full bg-surface-container-high rounded-full h-2">
          <div className="bg-primary h-2 rounded-full w-1/3 transition-all duration-500 ease-in-out"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Intake Questionnaire */}
        <div className="md:col-span-8 lg:col-span-9">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Symptoms Card */}
            <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
              <h3 className="font-semibold text-lg md:text-xl text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">stethoscope</span>
                What brings you in today?
              </h3>
              <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                Please describe your symptoms, discomfort, or general health concerns in detail.
              </p>
              <div className="relative">
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface p-3 outline-none text-sm leading-relaxed"
                  id="symptoms"
                  name="symptoms"
                  placeholder="I have been experiencing..."
                  rows={4}
                  required
                ></textarea>
              </div>
            </section>

            {/* Section 2: Duration Card */}
            <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-tertiary"></div>
              <h3 className="font-semibold text-lg md:text-xl text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary font-medium">schedule</span>
                How long have you felt this way?
              </h3>
              <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                Understanding the duration helps prioritize emergency response level or referral categories.
              </p>
              <div className="mt-2">
                <label className="sr-only" htmlFor="duration">
                  Duration Setting
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full md:w-1/2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface p-3 outline-none text-sm font-medium"
                  id="duration"
                  name="duration"
                  required
                >
                  <option value="" disabled>
                    Select duration
                  </option>
                  <option value="Just today">Just today</option>
                  <option value="2 - 4 hours">A few hours (2-4 hours)</option>
                  <option value="A few days">A few days</option>
                  <option value="A few weeks">A few weeks</option>
                  <option value="Months or longer">Months or longer</option>
                </select>
              </div>
            </section>

            {/* Section 3: Medications Card */}
            <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <h3 className="font-semibold text-lg md:text-xl text-on-surface mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary fill">medication</span>
                Are you taking any medicine?
              </h3>
              <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                Include daily prescriptions, over-the-counter tablets, herbal remedies, and vitamins.
              </p>
              
              <div className="space-y-4">
                {/* Chip list */}
                {meds.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4" id="medication-tags">
                    {meds.map((med, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high text-on-surface rounded-full text-xs font-medium border border-outline-variant/30 transition-all hover:bg-error-container hover:text-on-error-container"
                      >
                        {med}
                        <button
                          onClick={() => handleRemoveMed(idx)}
                          className="material-symbols-outlined text-[14px] hover:text-error hover:scale-110 cursor-pointer rounded-full flex items-center justify-center p-0.5"
                          type="button"
                          aria-label={`Remove ${med}`}
                        >
                          close
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant italic mb-2">
                    No medications listed yet. Add any you take regularly.
                  </p>
                )}

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    value={newMed}
                    onChange={(e) => setNewMed(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMed();
                      }
                    }}
                    className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface px-3 py-2.5 text-sm outline-none"
                    id="new-medication"
                    placeholder="Type a medication and press Add"
                    type="text"
                  />
                  <button
                    onClick={handleAddMed}
                    className="px-6 py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-medium text-sm hover:bg-secondary hover:text-on-secondary transition-all cursor-pointer shadow-sm active:scale-95"
                    type="button"
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>

            {/* Save Status Banner */}
            {showDraftSaved && (
              <div className="p-3 bg-secondary-container/30 border border-secondary/20 text-on-secondary-container rounded-lg text-sm flex items-center gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-secondary fill animate-bounce">check_circle</span>
                Session draft successfully synchronized to clinical sandbox server.
              </div>
            )}

            {/* Navigation Buttons Row */}
            <div className="flex justify-between items-center pt-4 border-t border-surface-variant">
              <button
                onClick={handleSaveDraft}
                className="px-6 py-3 border border-outline text-primary rounded-lg font-medium text-sm hover:bg-surface-container transition-all active:scale-[0.98] cursor-pointer"
                type="button"
              >
                Save Draft
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-3 text-on-surface-variant hover:text-on-surface text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  className="px-8 py-3 bg-primary text-on-primary rounded-lg font-medium text-sm hover:bg-opacity-95 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                  type="submit"
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Advisory Sidebar */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="sticky top-24 bg-surface-container-low p-6 rounded-xl border border-surface-variant space-y-6">
            <div>
              <h4 className="font-semibold text-base mb-3 flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">info</span>
                Why we ask
              </h4>
              <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
                Providing detailed and accurate information helps your doctor prepare for your visit, allows our AI agent to preempt medication interactions, and ensures you receive the best care.
              </p>
            </div>
            
            <hr className="border-outline-variant/30" />

            <div className="bg-surface-container p-4 rounded-lg">
              <p className="text-xs font-semibold text-on-surface mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-secondary">help</span>
                Need quick help?
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                If you're unsure about a medication's exact spelling, describe its pill form, color, or bring the container with you to the physician review desk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
