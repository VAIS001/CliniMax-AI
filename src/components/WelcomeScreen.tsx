import React from 'react';
import { ServiceType, ServiceDetail } from '../types';

interface WelcomeScreenProps {
  onSelectService: (service: ServiceType) => void;
}

const SERVICES: ServiceDetail[] = [
  {
    id: 'doctor',
    title: 'See a Doctor',
    icon: 'stethoscope',
    themeColor: 'primary',
    hoverBg: 'hover:bg-primary-container hover:text-on-primary-container',
    textClass: 'text-primary',
    iconClass: 'text-primary group-hover:text-on-primary-container',
  },
  {
    id: 'laboratory',
    title: 'Laboratory Services',
    icon: 'science',
    themeColor: 'secondary',
    hoverBg: 'hover:bg-secondary-container hover:text-on-secondary-container',
    textClass: 'text-secondary',
    iconClass: 'text-secondary group-hover:text-on-secondary-container',
  },
  {
    id: 'triage',
    title: 'Triage / Check-up',
    icon: 'vital_signs',
    themeColor: 'error',
    hoverBg: 'hover:bg-error-container hover:text-on-error-container',
    textClass: 'text-error',
    iconClass: 'text-error group-hover:text-on-error-container',
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy',
    icon: 'medication',
    themeColor: 'tertiary',
    hoverBg: 'hover:bg-tertiary-container hover:text-on-tertiary-container',
    textClass: 'text-tertiary',
    iconClass: 'text-tertiary group-hover:text-on-tertiary-container',
  },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelectService }) => {
  return (
    <div className="w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-md border border-surface-variant p-6 md:p-12 text-center animate-fade-in">
      <div className="mb-10 flex flex-col items-center">
        <span className="material-symbols-outlined text-primary text-6xl mb-4 fill" id="clinic-logo">
          local_hospital
        </span>
        <h1 className="font-semibold text-2xl md:text-3xl text-primary mb-2 tracking-tight">
          Welcome to CliniMax
        </h1>
        <p className="text-lg text-on-surface-variant">
          How can we help you today?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="service-grid">
        {SERVICES.map((srv) => (
          <button
            key={srv.id}
            id={`btn-${srv.id}`}
            onClick={() => onSelectService(srv.id)}
            className={`flex flex-col items-center justify-center p-6 bg-surface-container ${srv.hoverBg} text-on-surface rounded-xl transition-all duration-200 group active:scale-[0.98] border border-outline-variant/20 hover:scale-[1.02] cursor-pointer shadow-sm`}
          >
            <span
              className={`material-symbols-outlined text-4xl mb-3 ${srv.iconClass}`}
              data-icon={srv.icon}
            >
              {srv.icon}
            </span>
            <span className="font-semibold text-lg md:text-xl tracking-tight">
              {srv.title}
            </span>
          </button>
        ))}
      </div>
      
      <div className="mt-8 text-xs text-on-surface-variant/70 italic flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-sm">verified_user</span>
        Secure and Encrypted Patient Hub
      </div>
    </div>
  );
};
