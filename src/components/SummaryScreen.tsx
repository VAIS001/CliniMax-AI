import React from 'react';
import { IntakeForm, PatientProfile } from '../types';

interface SummaryScreenProps {
  patient: PatientProfile;
  form: IntakeForm;
  onBack: () => void;
  onConfirm: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  patient,
  form,
  onBack,
  onConfirm,
}) => {
  // Extract initials from patient name
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-md w-full mx-auto bg-surface min-h-[85vh] flex flex-col relative shadow-md border border-outline-variant/30 rounded-xl overflow-hidden animate-fade-in">
      {/* TopAppBar inside the container */}
      <header className="w-full top-0 bg-surface-container-low border-b border-outline-variant/30 h-16 sticky z-10 flex items-center px-4">
        <div className="flex items-center gap-4 w-full">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="cursor-pointer active:scale-95 text-primary hover:bg-surface-container-high transition-colors rounded-full p-2 flex items-center justify-center border border-outline-variant/20 bg-surface"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-bold text-xl text-primary flex-1">
            Intake Summary
          </h1>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 flex flex-col px-6 py-6 space-y-6 overflow-y-auto">
        {/* Patient Info Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg select-none">
            {getInitials(patient.name)}
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-lg text-on-surface">
              {patient.name}
            </h2>
            <p className="text-sm text-on-surface-variant font-medium">
              Intake ID: <span className="font-mono">{patient.id}</span>
            </p>
          </div>
        </section>

        {/* Symptoms Section */}
        <section className="flex flex-col gap-2">
          <h3 className="text-xs text-primary font-bold uppercase tracking-wider">
            What brings you in today?
          </h3>
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant">
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
              {form.symptoms}
            </p>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="flex flex-col gap-2">
          <h3 className="text-xs text-primary font-bold uppercase tracking-wider">
            How long have you felt this way?
          </h3>
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary fill">
              schedule
            </span>
            <p className="text-sm text-on-surface font-semibold">
              {form.duration || 'Just today'}
            </p>
          </div>
        </section>

        {/* Medications Section */}
        <section className="flex flex-col gap-2 pb-6">
          <h3 className="text-xs text-primary font-bold uppercase tracking-wider">
            Current Medications
          </h3>
          {form.medications.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {form.medications.map((med, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container rounded-full px-4 py-2 text-xs font-semibold border border-outline-variant/30 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    pill
                  </span>
                  {med}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant text-center">
              <p className="text-xs text-on-surface-variant italic">
                No active medications indicated.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer Action Anchor */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/40 p-4 sticky bottom-0 z-10 flex flex-col gap-2 mt-auto">
        <p className="text-xs text-on-surface-variant text-center mb-1 font-medium italic">
          Your summary has been securely saved.
        </p>
        <button
          onClick={onConfirm}
          className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Confirm & Return to Home</span>
          <span className="material-symbols-outlined font-normal fill">
            check_circle
          </span>
        </button>
      </footer>
    </div>
  );
};
