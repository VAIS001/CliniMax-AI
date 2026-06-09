import React, { useState } from 'react';
import { VisitorType, PatientProfile } from '../types';

interface VisitorTypeScreenProps {
  onBack: () => void;
  onProceed: (profile: PatientProfile, type: VisitorType) => void;
}

export const VisitorTypeScreen: React.FC<VisitorTypeScreenProps> = ({ onBack, onProceed }) => {
  const [selectedType, setSelectedType] = useState<VisitorType>(null);
  
  // Forms state
  const [name, setName] = useState('');
  const [age, setAge] = useState('28');
  const [phone, setPhone] = useState('');
  const [patientId, setPatientId] = useState('');
  
  const [isSubmitError, setIsSubmitError] = useState('');

  // Submit flow
  const handleProceedType = (type: 'guest' | 'create' | 'login') => {
    setIsSubmitError('');
    
    if (type === 'guest') {
      const guestName = name ? name : 'Guest Patient';
      const randId = Math.floor(1000 + Math.random() * 9000);
      onProceed({
        name: guestName,
        id: `GST-${randId}`,
        idType: 'GUEST',
        age: age || '30',
        phone: phone || 'Not provided'
      }, 'guest');
    } else if (type === 'create') {
      if (!name) {
        setIsSubmitError('Please enter your full name to set up your profile.');
        return;
      }
      const randId = Math.floor(1000 + Math.random() * 9000);
      onProceed({
        name: name,
        id: `#${randId}-A`,
        idType: 'NEW_PATIENT',
        age: age,
        phone: phone || 'Not provided'
      }, 'new');
    } else if (type === 'login') {
      // simulate checking an ID
      const targetId = patientId.trim() || '#8492-A';
      onProceed({
        name: name || 'John Doe',
        id: targetId,
        idType: 'IP',
        age: age || '34',
        phone: phone || '+254 701 234 567'
      }, 'returning');
    }
  };

  return (
    <div className="w-full max-w-3xl z-10 flex flex-col items-center animate-fade-in px-4">
      {/* Back button and Branding */}
      <div className="w-full flex justify-between items-center mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-surface-container-high rounded-lg font-medium transition-all group cursor-pointer"
        >
          <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
          <span>Back to Services</span>
        </button>
      </div>

      <div className="mb-10 text-center">
        <span className="material-symbols-outlined fill text-primary text-5xl mb-4">
          medical_services
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-2 tracking-tight">
          Is this your first time with us?
        </h1>
        <p className="text-body-lg text-on-surface-variant max-w-lg mx-auto">
          We're here to guide you to the right care. Let us know if you're a new or returning patient.
        </p>
      </div>

      {/* Choice grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" id="selection-cards">
        {/* Yes, I'm new here Card */}
        <button
          onClick={() => { setSelectedType('new'); setIsSubmitError(''); }}
          className={`group relative flex flex-col items-center justify-center p-8 bg-surface-container-lowest border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-center min-h-[220px] focus:outline-none cursor-pointer ${
            selectedType === 'new' 
              ? 'border-primary bg-primary-fixed/20 ring-2 ring-primary/20' 
              : 'border-outline-variant hover:border-primary'
          }`}
          id="card-new"
        >
          <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined fill text-3xl">person_add</span>
          </div>
          <h2 className="font-semibold text-xl text-on-surface mb-1">Yes, I'm new here</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            I need to set up my profile.
          </p>

          {/* Indicator mark */}
          {selectedType === 'new' && (
            <div className="absolute top-4 right-4 text-primary animate-fade-in">
              <span className="material-symbols-outlined fill">check_circle</span>
            </div>
          )}
        </button>

        {/* Returning Patient Card */}
        <button
          onClick={() => { setSelectedType('returning'); setIsSubmitError(''); }}
          className={`group relative flex flex-col items-center justify-center p-8 bg-surface-container-lowest border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-center min-h-[220px] focus:outline-none cursor-pointer ${
            selectedType === 'returning' 
              ? 'border-primary bg-primary-fixed/20 ring-2 ring-primary/20' 
              : 'border-outline-variant hover:border-primary'
          }`}
          id="card-returning"
        >
          <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined fill text-3xl">how_to_reg</span>
          </div>
          <h2 className="font-semibold text-xl text-on-surface mb-1">No, I've been here before</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            I already have an account or ID.
          </p>

          {/* Indicator mark */}
          {selectedType === 'returning' && (
            <div className="absolute top-4 right-4 text-primary animate-fade-in">
              <span className="material-symbols-outlined fill">check_circle</span>
            </div>
          )}
        </button>
      </div>

      {/* Dynamic forms based on selection */}
      {selectedType && (
        <div className="w-full mt-10 pt-8 border-t border-surface-variant animate-fade-in" id="action-area">
          {/* Form for New Patient registration */}
          {selectedType === 'new' && (
            <div className="max-w-md mx-auto bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 shadow-sm">
              <h3 className="font-semibold text-lg text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">assignment_ind</span>
                Let's set up your profile
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1" htmlFor="p-name">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="p-name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setIsSubmitError(''); }}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface px-3 py-2 text-sm outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1" htmlFor="p-age">
                      Age
                    </label>
                    <input
                      type="number"
                      id="p-age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 28"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface-variant mb-1" htmlFor="p-phone">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="p-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 555-0199"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                {isSubmitError && (
                  <p className="text-xs text-error font-medium mt-1 select-none flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {isSubmitError}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    onClick={() => handleProceedType('create')}
                    className="flex-1 bg-primary text-on-primary font-medium py-3 px-6 rounded-lg hover:bg-opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Create profile</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => handleProceedType('guest')}
                    className="flex-1 bg-surface-container text-on-surface font-medium py-3 px-6 rounded-lg hover:bg-outline-variant/20 transition-all flex items-center justify-center gap-2 border border-outline-variant cursor-pointer"
                  >
                    <span>Continue as Guest</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form for returning Patient login */}
          {selectedType === 'returning' && (
            <div className="max-w-md mx-auto bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 shadow-sm">
              <h3 className="font-semibold text-lg text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">login</span>
                Welcome back
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1" htmlFor="ret-id">
                    Patient Intake ID / Account ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="ret-id"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="#8492-A (Default ID)"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface pl-10 pr-3 py-2.5 text-sm uppercase outline-none font-medium"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px]">
                      badge
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant/80 mt-1">
                    Press Log in to instantly retrieve the default patient profile (**John Doe, ID: #8492-A**).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    onClick={() => handleProceedType('login')}
                    className="flex-1 bg-primary text-on-primary font-medium py-3 px-6 rounded-lg hover:bg-opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Log in with ID</span>
                    <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                  </button>
                  <button
                    onClick={() => handleProceedType('guest')}
                    className="flex-1 bg-surface-container text-on-surface font-medium py-3 px-6 rounded-lg hover:bg-outline-variant/20 transition-all flex items-center justify-center gap-2 border border-outline-variant cursor-pointer"
                  >
                    <span>Continue as Guest</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
