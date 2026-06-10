import React from 'react';

interface CompleteScreenProps {
  onViewSummary: () => void;
  onReturnHome: () => void;
}

export const CompleteScreen: React.FC<CompleteScreenProps> = ({
  onViewSummary,
  onReturnHome,
}) => {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center p-4 animate-fade-in relative z-10">
      {/* Decorative background visual overlay */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] aspect-square bg-primary-container/20 rounded-full blur-[70px] pointer-events-none -z-10"></div>

      {/* Success Pulse Checkmark */}
      <div className="w-24 h-24 bg-primary-container/20 rounded-full flex items-center justify-center mb-8 shadow-sm animate-pulse-slow">
        <div className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-4xl fill">check</span>
        </div>
      </div>

      {/* Title Header */}
      <div className="text-center mb-8">
        <h1 className="font-bold text-2xl md:text-3xl text-on-surface mb-3 tracking-tight">
          Intake Complete
        </h1>
        <p className="text-sm md:text-base text-on-surface-variant max-w-[320px] mx-auto leading-relaxed">
          Your health profile and symptom data have been securely sent to your physician.
        </p>
      </div>

      {/* Bento Metrics Selection */}
      <div className="grid grid-cols-2 gap-3 w-full mb-8">
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm relative overflow-hidden transition-all hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-16 h-16 bg-secondary-container/30 rounded-bl-full pointer-events-none"></div>
          <span className="material-symbols-outlined text-secondary mb-3 text-[28px]">
            schedule
          </span>
          <span className="font-bold text-xl md:text-2xl text-on-surface tracking-tight">
            15-20
          </span>
          <span className="text-[10px] text-on-surface-variant font-semibold mt-1 uppercase tracking-wider">
            Min Wait
          </span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm relative overflow-hidden transition-all hover:scale-[1.02]">
          <div className="absolute top-0 left-0 w-16 h-16 bg-primary-container/20 rounded-br-full pointer-events-none"></div>
          <span className="material-symbols-outlined text-primary mb-3 text-[28px]">
            group
          </span>
          <span className="font-semibold text-xl md:text-2xl text-on-surface tracking-tight">
            2nd
          </span>
          <span className="text-[10px] text-on-surface-variant font-semibold mt-1 uppercase tracking-wider">
            In Queue
          </span>
        </div>
      </div>

      {/* What's Next Glassmorphic Card */}
      <div className="bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/40 rounded-xl p-5 w-full mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-tertiary-container/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary text-lg">
              directions_walk
            </span>
          </div>
          <h2 className="font-bold text-sm text-on-surface tracking-tight">
            What's Next?
          </h2>
        </div>
        <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
          Please proceed to the main waiting area. Your name will be called on the display board shortly. Keep your phone nearby for real-time triage updates.
        </p>
      </div>

      {/* Interactive Actions CTA */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={onViewSummary}
          className="w-full py-3.5 bg-primary text-on-primary rounded-full font-semibold text-sm shadow-md hover:bg-opacity-95 hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>View My Summary</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
        <button
          onClick={onReturnHome}
          className="w-full py-3.5 bg-transparent text-primary rounded-full font-semibold text-sm border border-outline-variant/60 hover:bg-primary-container/10 transition-all cursor-pointer active:scale-[0.98]"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};
