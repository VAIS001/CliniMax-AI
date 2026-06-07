/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ServiceType, VisitorType, PatientProfile, IntakeForm, IntakeRecord } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { VisitorTypeScreen } from './components/VisitorTypeScreen';
import { ClinicalIntakeScreen } from './components/ClinicalIntakeScreen';
import { CompleteScreen } from './components/CompleteScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { DoctorDashboard, DoctorPatient } from './components/DoctorDashboard';
import { PatientDetailScreen } from './components/PatientDetailScreen';

export default function App() {
  // Portal Navigation Strategy: 'patient' | 'doctor'
  const [portalMode, setPortalMode] = useState<'patient' | 'doctor'>('patient');
  
  // High-Security Auth states to split Patient Kiosk from Physician Dashboard
  const [isDoctorAuthorized, setIsDoctorAuthorized] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [logoClicks, setLogoClicks] = useState<number>(0);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Verification method for the secure 4-digit physician PIN code
  const verifyPin = (pin: string) => {
    if (pin === '7788') {
      setIsDoctorAuthorized(true);
      setPortalMode('doctor');
      setDoctorView('dashboard');
      setSelectedDoctorPatient(null);
      setShowAuthModal(false);
      setPinInput('');
      setPinError(false);
      triggerNotification("Clinician Authorized under Dr. Harper session.");
    } else {
      setPinError(true);
      setPinInput('');
      triggerNotification("Invalid Clinical Security passcode.");
    }
  };

  // Click handler for stealth logo clicks (5 taps to unlock)
  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const nextClicks = prev + 1;
      if (nextClicks >= 5) {
        setShowAuthModal(true);
        setPinInput('');
        setPinError(false);
        return 0; // reset
      }
      return nextClicks;
    });
  };

  // Setup global stealth clinician hotkeys for rapid desktop testing (Ctrl + Shift + D)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'D') {
        e.preventDefault();
        setShowAuthModal(true);
        setPinInput('');
        setPinError(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Set click reset so slow accidental clicks don't randomly trigger it
  React.useEffect(() => {
    if (logoClicks > 0) {
      const timer = setTimeout(() => {
        setLogoClicks(0);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [logoClicks]);
  
  // Stepper state for Doctor Portal: 'dashboard' | 'patient_detail'
  const [doctorView, setDoctorView] = useState<'dashboard' | 'patient_detail'>('dashboard');
  const [selectedDoctorPatient, setSelectedDoctorPatient] = useState<DoctorPatient | null>(null);

  // Stepper state for Patient Portal: 'welcome' | 'visitor_type' | 'intake' | 'complete' | 'summary'
  const [currentView, setCurrentView] = useState<'welcome' | 'visitor_type' | 'intake' | 'complete' | 'summary'>('welcome');
  
  // Selected clinical configurations
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [visitorType, setVisitorType] = useState<VisitorType>(null);
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  
  // Custom form records
  const [formData, setFormData] = useState<IntakeForm>({
    symptoms: '',
    duration: '',
    medications: ['Ibuprofen', 'Vitamin D']
  });

  // Simulated system list of registered checks
  const [pastSubmissions, setPastSubmissions] = useState<IntakeRecord[]>([]);

  // Doctor Patients list that syncs live with self-serve inputs
  const [doctorPatients, setDoctorPatients] = useState<DoctorPatient[]>([
    {
      name: "Eleanor Vance",
      dob: "12 Oct 1988 (35y)",
      id: "PT-8829-X",
      idType: "IP",
      status: "IMMEDIATE",
      complaintTitle: "Persistent Shortness of Breath",
      complaintDesc: "Patient reports persistent mild shortness of breath and fatigue over the past 3 days. Denies chest pain or radiating discomfort. Notes a slight dry cough that worsens at night.",
      timeLabel: "12 min",
      bloodType: "A+",
      allergies: "Sulfonamides Allergy",
      vitals: {
        bp: "118/76 mmHg",
        hr: "72 bpm",
        temp: "98.6 °F",
        spo2: "94%"
      },
      medications: ["Lisinopril 10mg (Daily)", "Sertraline 50mg (Daily)"],
      symptomsList: ["Shortness of breath (Mild)", "Fatigue", "Dry Cough"],
      history: [
        { type: "Telehealth Consult", date: "12 Apr 2024", text: "Follow-up for seasonal allergies. Prescribed Cetirizine.", doctor: "Dr. Sarah Smith" },
        { type: "Annual Physical", date: "05 Jan 2024", text: "Routine checkup. All labs within normal limits. BP slightly elevated, advised lifestyle modifications.", labs: true }
      ]
    },
    {
      name: "Marcus Chen",
      dob: "12 Apr 1985 (39y)",
      id: "892-11A",
      idType: "NEW_PATIENT",
      status: "IMMEDIATE",
      complaintTitle: "Acute Lower Right Abdominal Pain",
      complaintDesc: "Acute onset of severe lower right quadrant pain starting 2 hours ago. Pain intensified and localized. Nausea present, vomited once. Abdominal palpation shows severe tenderness at McBurney's Point.",
      timeLabel: "4 min",
      bloodType: "O+",
      allergies: "Penicillin Allergy",
      vitals: {
        bp: "135/88 mmHg",
        hr: "102 bpm",
        temp: "101.3 °F",
        spo2: "99%"
      },
      medications: [],
      symptomsList: ["Lower Right Pain", "Severe Nausea", "Feverish"],
      history: [
        { type: "Primary Care Review", date: "10 Nov 2025", text: "General wellbeing review. Patient showed normal abdominal profiles.", doctor: "Dr. Harper" }
      ]
    },
    {
      name: "Sarah Jenkins",
      dob: "22 May 1992 (31y)",
      id: "442-99B",
      idType: "GUEST",
      status: "ROUTINE",
      complaintTitle: "Post-op Follow up (ACL Reconstruction)",
      complaintDesc: "2 weeks post ACL reconstruction. Checking active range of motion, surgical site healing, and pain management compliance.",
      timeLabel: "09:30 AM",
      vitals: {
        bp: "120/80 mmHg",
        hr: "68 bpm",
        temp: "98.4 °F",
        spo2: "98%"
      },
      medications: ["Ibuprofen 400mg (PRN)", "Acetaminophen 500mg"],
      symptomsList: ["Surgical healing status", "Localized soreness"],
      history: [
        { type: "Surgical Incident Record", date: "15 Apr 2026", text: "Arthroscopic reconstruction of Right ACL. No intraoperative complications noted.", doctor: "Dr. Evans (Ortho)" }
      ]
    },
    {
      name: "David Alaya",
      dob: "10 Nov 1978 (47y)",
      id: "110-33C",
      idType: "IP",
      status: "ROUTINE",
      complaintTitle: "Hypertension Management Intake",
      complaintDesc: "Quarterly follow-up to optimize anti-hypertensive medication dosages. Home logs indicate elevated systolic pressure (average 145/92 mmHg) over the past month.",
      timeLabel: "10:15 AM",
      vitals: {
        bp: "148/94 mmHg",
        hr: "80 bpm",
        temp: "98.5 °F",
        spo2: "97%"
      },
      medications: ["Amlodipine 5mg (Daily)", "Lisinopril 20mg (Daily)"],
      symptomsList: ["Home blood pressure elevation", "Occasional mild headaches"],
      history: [
        { type: "ECG Standard Diagnostic", date: "14 Dec 2025", text: "Normal sinus rhythm. No significant ischemic changes.", doctor: "Dr. Patel" }
      ]
    }
  ]);

  // Sliding Drawer Controls
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSelectService = (service: ServiceType) => {
    setSelectedService(service);
    setCurrentView('visitor_type');
    triggerNotification(`Triage category modified to ${service.toUpperCase()}`);
  };

  const handleVisitorProceed = (profile: PatientProfile, type: VisitorType) => {
    setPatient(profile);
    setVisitorType(type);
    
    // Auto-prepopulate symptoms if they use John Doe returning ID to match Screen 5 mockup
    if (profile.id === '#8492-A') {
      setFormData({
        symptoms: 'I have been experiencing sharp abdominal pain in the lower right quadrant for the past few hours. It feels worse when I move.',
        duration: '2 - 4 hours',
        medications: ['Ibuprofen', 'Vitamin D']
      });
    } else {
      setFormData({
        symptoms: '',
        duration: '',
        medications: []
      });
    }

    setCurrentView('intake');
    triggerNotification(`Patient profile logged: ${profile.name}`);
  };

  const handleIntakeSubmit = (form: IntakeForm) => {
    setFormData(form);
    
    // Save to historical/past submissions state
    if (patient && selectedService) {
      const randNo = Math.floor(100 + Math.random() * 900);
      const newRecord: IntakeRecord = {
        patient: patient,
        service: selectedService,
        form: form,
        queueNo: `T-${randNo}`,
        waitTime: '15-20 Min',
        queuePosition: 2,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setPastSubmissions([newRecord, ...pastSubmissions]);

      // Connect Kiosk user directly into Dr. Harper's queue in real-time
      const newDocPat: DoctorPatient = {
        name: patient.name,
        dob: `${patient.dob || "Age 34"}`,
        id: patient.id || `PT-${randNo}-X`,
        idType: 'NEW_PATIENT',
        status: 'ROUTINE', // Default to Routine triage
        complaintTitle: selectedService === 'triage' ? 'Clinical Triage Evaluation' : `${selectedService} Consultation`.toUpperCase(),
        complaintDesc: form.symptoms || "Self-guided clinical check-in completed.",
        timeLabel: "Just Now",
        vitals: {
          bp: "120/80 mmHg",
          hr: "74 bpm",
          temp: "98.4 °F",
          spo2: "98%"
        },
        medications: form.medications || [],
        symptomsList: form.symptoms ? [form.symptoms.substring(0, 32)] : ["Registered Patient"],
        history: [
          { type: 'Mobile Kiosk', date: 'Just Now', text: `Patient checked in self-service for ${selectedService.toUpperCase()}` }
        ]
      };
      setDoctorPatients([newDocPat, ...doctorPatients]);
    }

    setCurrentView('complete');
    triggerNotification('Intake record securely encrypted and transferred to clinical queue.');
  };

  const handleResetHome = () => {
    setCurrentView('welcome');
    setSelectedService(null);
    setVisitorType(null);
    setPatient(null);
  };

  return (
    <div className={`min-h-screen font-sans antialiased flex flex-col relative overflow-x-hidden ${
      portalMode === 'doctor' ? 'bg-[#090d16] text-[#f8fafc]' : 'bg-[#f9f9ff] text-[#191c21]'
    }`}>
      
      {/* TopAppBar header - Sticky across views */}
      <header className={`border-b flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-50 shadow-sm transition-colors duration-300 ${
        portalMode === 'doctor' 
          ? 'bg-[#161a29] border-slate-800 text-white' 
          : 'bg-[#f9f9ff] border-surface-variant/30 text-[#191c21]'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Toggle Navigation Drawer"
            className={`p-2 -ml-2 rounded-full transition-all active:scale-95 cursor-pointer flex items-center justify-center border border-transparent hover:border-outline-variant/30 ${
              portalMode === 'doctor' ? 'text-white hover:bg-surface-container/20' : 'text-primary hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <div 
            onClick={(e) => {
              handleResetHome();
              handleLogoClick();
            }} 
            className="flex items-center gap-2 cursor-pointer select-none active:scale-98 transition-all"
            title="Kiosk Home (Secret Clinical Staff Area)"
          >
            <span className={`material-symbols-outlined font-bold fill text-2xl ${
              portalMode === 'doctor' ? 'text-[#FF7A00]' : 'text-primary'
            }`}>
              local_hospital
            </span>
            <span className={`font-semibold text-lg md:text-xl font-sans tracking-tight ${
              portalMode === 'doctor' ? 'text-white' : 'text-primary'
            }`}>
              CliniMax
            </span>
          </div>
        </div>

        {/* Dynamic Portal View Switcher Pill - Hidden entirely from patient of the kiosk */}
        {portalMode === 'doctor' && (
          <div className="flex p-1 rounded-full border relative z-10 max-w-[320px] shrink-0 bg-[#090d16] border-slate-700/60 shadow-lg">
            <button
              onClick={() => {
                setIsDoctorAuthorized(false);
                setPortalMode('patient');
                handleResetHome();
                triggerNotification("Clinician session safely locked & logged out.");
              }}
              className="px-3.5 py-1.5 rounded-full text-[10.5px] uppercase tracking-wider font-extrabold leading-none cursor-pointer transition-all text-slate-300 hover:text-[#FF7A00] flex items-center gap-1.5 hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-[12px] font-bold">lock</span>
              Lock & Exit Dashboard
            </button>
            <div
              className="px-3 py-1.5 rounded-full text-[10.5px] uppercase tracking-widest font-black leading-none bg-[#FF7A00] text-slate-950 shadow-md flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 bg-slate-950 rounded-full animate-ping"></span>
              Doctor Active
            </div>
          </div>
        )}

        {/* Avatar/EHR Log section */}
        <div className="flex items-center gap-3">
          {portalMode === 'patient' && patient && (
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-primary">{patient.name}</span>
              <span className="text-[10px] text-on-surface-variant/80 font-mono">{patient.id}</span>
            </div>
          )}
          <button 
            onClick={() => {
              if (portalMode === 'patient') {
                if (patient) {
                  setCurrentView('summary');
                } else {
                  triggerNotification("Register or choose patient status to view details.");
                }
              } else {
                setDoctorView('dashboard');
                setSelectedDoctorPatient(null);
                triggerNotification("Returned to Physician Dashboard home.");
              }
            }}
            className={`flex items-center gap-2 hover:bg-surface-container transition-colors p-1 rounded-full border cursor-pointer group ${
              portalMode === 'doctor' ? 'border-[#FF7A00]/40' : 'border-surface-variant'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border ${
              portalMode === 'doctor' ? 'bg-[#FF7A00]/15' : 'bg-primary-container'
            }`}>
              {portalMode === 'doctor' ? (
                <span className="material-symbols-outlined text-[#FF7A00] text-sm font-bold">supervisor_account</span>
              ) : (
                <img
                  alt="Patient Avatar Icon"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida/AP1WRLs8woEtLkMcJ36FZ0sp7Kac-twrvoOTiEG9keUlxZkUhBvdv0UIPaOwqFe-GYlHivVyOw7-pANbYSINnWKbD7dTY6htH-ry8GWO-9mMLA5XLPbC6MssQQOQKwAy2JvAXFFU9BrXCw5Iavs6se4QezGYUIzdFdfRM5xBppKCAtwDGvH4psaaUtR9QhU0wyb2sP_jR6yyCHNMTjqSR0SvnaV6q-WcFWlf5QeRKDYqe99nqNZJI2cdZdoril8"
                />
              )}
            </div>
          </button>
        </div>
      </header>

      {/* Slide-out Sidebar Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex" id="sidebar-drawer">
          {/* Blur backdrop overlay */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
          ></div>
          
          {/* Drawer body panel */}
          <div className={`relative flex flex-col w-72 md:w-80 max-w-[85vw] h-full border-r shadow-xl animate-fade-in z-10 p-6 ${
            portalMode === 'doctor' 
              ? 'bg-[#0e1322] border-slate-800 text-white' 
              : 'bg-surface-container-lowest border-outline-variant text-on-surface'
          }`}>
            <div className="flex justify-between items-center mb-8">
              <div className={`flex items-center gap-2 font-bold ${portalMode === 'doctor' ? 'text-[#FF7A00]' : 'text-primary'}`}>
                <span className="material-symbols-outlined fill">local_hospital</span>
                <span className="text-lg font-sans tracking-tight">CliniMax Hub</span>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-surface-container/25 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-1 flex-1">
              <button 
                onClick={() => {
                  setPortalMode('patient');
                  handleResetHome();
                  setIsDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-left cursor-pointer ${
                  portalMode === 'patient' ? 'bg-primary/10 text-primary' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined">person</span>
                Kiosk: Patient Welcome
              </button>
              
              {/* Only show Doctor Dashboard link in sidebar if the clinician is authenticated in doctor mode */}
              {portalMode === 'doctor' && (
                <>
                  <button 
                    onClick={() => {
                      setPortalMode('doctor');
                      setDoctorView('dashboard');
                      setSelectedDoctorPatient(null);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-left cursor-pointer ${
                      portalMode === 'doctor' ? 'bg-[#FF7A00]/10 text-[#FF7A00]' : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined">supervisor_account</span>
                    Portal: Doctor Dashboard
                  </button>

                  <hr className="border-outline-variant/30 my-4" />

                  <div className="pt-2 px-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest block mb-2 text-[#FF7A00]">
                      Live Workspace Submissions
                    </span>
                    {doctorPatients.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
                        {doctorPatients.map((rec, index) => (
                          <div 
                            key={index}
                            onClick={() => {
                              setPortalMode('doctor');
                              setSelectedDoctorPatient(rec);
                              setDoctorView('patient_detail');
                              setIsDrawerOpen(false);
                            }}
                            className="p-2 border rounded text-xs cursor-pointer hover:border-[#FF7A00]/50 transition-colors bg-[#090d16]/80 border-slate-700/60 text-white"
                          >
                            <div className="flex justify-between font-semibold">
                              <span>{rec.name}</span>
                              <span className={`${rec.status === 'IMMEDIATE' ? 'text-error' : 'text-green-400'}`}>
                                {rec.status}
                              </span>
                            </div>
                            <p className="text-[10px] opacity-75 mt-0.5 truncate">{rec.complaintTitle}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] opacity-60 italic p-3 border border-dashed border-outline-variant/40 rounded text-center">
                        No active triage queues logged in this workspace.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-outline-variant/40 pt-4 text-[11px] opacity-70 space-y-1 font-medium bg-transparent">
              <p>CliniMax Integrated EHR Workspace v2.5</p>
              <p>Clinical Engine Standard: <span className="font-mono text-[10px]">FHIR / HIPAA V3</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout Container */}
      <main className={`flex-grow flex p-4 md:p-8 lg:p-12 relative overflow-hidden transition-colors duration-300 ${
        portalMode === 'doctor' ? 'bg-[#090d16]' : 'bg-[#f9f9ff]'
      }`}>
        
        {/* Abstract vector ambient glowing backgrounds (Hidden in Doctor's slate theme to avoid noise) */}
        {portalMode === 'patient' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center opacity-30 select-none">
            <div className="w-[800px] h-[800px] bg-primary-fixed/20 rounded-full blur-[140px] opacity-15 absolute top-[-25%] right-[-15%]"></div>
            <div className="w-[600px] h-[600px] bg-secondary-fixed/20 rounded-full blur-[120px] opacity-15 absolute bottom-[-15%] left-[-15%]"></div>
          </div>
        )}

        {/* Stage selection views router */}
        <div className={portalMode === 'doctor' ? 'w-full z-10 max-w-7xl mx-auto' : 'w-full flex items-center justify-center z-10'}>
          {portalMode === 'patient' ? (
            <>
              {currentView === 'welcome' && (
                <WelcomeScreen onSelectService={handleSelectService} />
              )}

              {currentView === 'visitor_type' && (
                <VisitorTypeScreen
                  onBack={() => setCurrentView('welcome')}
                  onProceed={handleVisitorProceed}
                />
              )}

              {currentView === 'intake' && patient && selectedService && (
                <ClinicalIntakeScreen
                  patient={patient}
                  service={selectedService}
                  onBack={() => setCurrentView('visitor_type')}
                  onSubmit={handleIntakeSubmit}
                />
              )}

              {currentView === 'complete' && (
                <CompleteScreen
                  onViewSummary={() => setCurrentView('summary')}
                  onReturnHome={handleResetHome}
                />
              )}

              {currentView === 'summary' && patient && formData && (
                <SummaryScreen
                  patient={patient}
                  form={formData}
                  onBack={() => {
                    // If they completed checkout, back takes them to complete, otherwise intake
                    if (pastSubmissions.length > 0) {
                      setCurrentView('complete');
                    } else {
                      setCurrentView('intake');
                    }
                  }}
                  onConfirm={() => {
                    triggerNotification("Intake verified by patient. File compiled and closed.");
                    handleResetHome();
                  }}
                />
              )}
            </>
          ) : (
            /* Clinician Active Views */
            <>
              {doctorView === 'dashboard' ? (
                <DoctorDashboard
                  patients={doctorPatients}
                  onOpenPatient={(pat) => {
                    setSelectedDoctorPatient(pat);
                    setDoctorView('patient_detail');
                  }}
                  onBackToPortalSelection={() => {
                    setIsDoctorAuthorized(false);
                    setPortalMode('patient');
                    triggerNotification("Switched to Patient Kiosk Mode");
                  }}
                  onAddPatientToQueue={(pat) => {
                    setDoctorPatients([pat, ...doctorPatients]);
                  }}
                />
              ) : (
                selectedDoctorPatient && (
                  <PatientDetailScreen
                    patient={selectedDoctorPatient}
                    onBackToDashboard={() => {
                      setDoctorView('dashboard');
                      setSelectedDoctorPatient(null);
                    }}
                  />
                )
              )}
            </>
          )}
        </div>
      </main>

      {/* Secure Clinical Authentication Overlay Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-[#04060ab5] backdrop-blur-md transition-opacity duration-300" 
            onClick={() => {
              setShowAuthModal(false);
              setPinInput('');
              setPinError(false);
            }}
          ></div>
          
          <div className="bg-[#0b0f1d] border border-slate-800 rounded-2xl p-6 w-full max-w-sm relative z-10 text-[#f8fafc] shadow-2xl animate-fade-in">
            <div className="flex flex-col items-center text-center">
              {/* Shield lock Icon */}
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/30 mb-4 animate-pulse">
                <span className="material-symbols-outlined text-amber-500 text-3xl font-bold">shield_lock</span>
              </div>
              
              <h3 className="font-extrabold text-lg text-white font-display">Secure Clinical Access</h3>
              <p className="text-xs text-slate-400 mt-2 mb-6 max-w-[280px]">
                Enter your 4-digit Practitioner PIN to authorize Dr. Harper's clinical environment.
              </p>

              {/* Secret Dev Badge */}
              <div className="px-2.5 py-1 bg-amber-500/5 border border-amber-500/20 text-amber-400 text-[10px] font-mono rounded mb-6 tracking-wide select-none">
                STAFF PIN CODE: <span className="font-extrabold text-white">7788</span>
              </div>

              {/* Passcode dots display */}
              <div className="flex gap-4 justify-center mb-6">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      pinInput.length > i 
                        ? 'bg-amber-400 border-amber-400 scale-110 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                        : pinError 
                          ? 'border-red-500 bg-red-950/20 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                          : 'border-slate-700 bg-transparent'
                    }`}
                  ></div>
                ))}
              </div>

              {/* Custom responsive tactile clinical keypad */}
              <div className="grid grid-cols-3 gap-3 w-full mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button 
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pinInput.length < 4) {
                        setPinError(false);
                        const nextPin = pinInput + num;
                        setPinInput(nextPin);
                        if (nextPin.length === 4) {
                          // Touch feedback duration delay to see the 4th digit entered active
                          setTimeout(() => verifyPin(nextPin), 200);
                        }
                      }
                    }}
                    className="aspect-square bg-slate-900 hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-95 border border-slate-805 rounded-xl flex items-center justify-center text-sm font-extrabold text-white cursor-pointer select-none"
                  >
                    {num}
                  </button>
                ))}
                
                {/* Clear Button */}
                <button 
                  type="button"
                  onClick={() => {
                    setPinInput('');
                    setPinError(false);
                  }}
                  className="aspect-square bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 transition-all rounded-xl flex items-center justify-center text-red-400 cursor-pointer text-xs font-bold select-none"
                >
                  CLR
                </button>

                {/* Zero Button */}
                <button 
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 4) {
                      setPinError(false);
                      const nextPin = pinInput + '0';
                      setPinInput(nextPin);
                      if (nextPin.length === 4) {
                        setTimeout(() => verifyPin(nextPin), 200);
                      }
                    }
                  }}
                  className="aspect-square bg-slate-900 hover:bg-slate-800 hover:border-slate-700 transition-all border border-slate-805 rounded-xl flex items-center justify-center text-sm font-extrabold text-white cursor-pointer select-none"
                >
                  0
                </button>

                {/* Cancel Button */}
                <button 
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setPinInput('');
                    setPinError(false);
                  }}
                  className="aspect-square bg-slate-950 hover:bg-slate-900 border border-slate-800 transition-all rounded-xl flex items-center justify-center text-slate-400 cursor-pointer text-xs font-semibold select-none"
                >
                  ESC
                </button>
              </div>

              {pinError && (
                <p className="text-red-400 text-[11px] font-bold tracking-wide animate-pulse">
                  Verification Denied. Please retry.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer bar branding credentials */}
      <footer className={`py-4 text-center text-xs font-semibold select-none border-t ${
        portalMode === 'doctor' 
          ? 'bg-[#161a29] text-slate-400 border-slate-800' 
          : 'bg-surface-container-low text-on-surface-variant border-surface-variant/20'
      }`}>
        <p>
          © 2026 CliniMax Healthcare Inc. All rights reserved. •{' '}
          <span 
            onClick={() => {
              setShowAuthModal(true);
              setPinInput('');
              setPinError(false);
            }}
            className="cursor-pointer hover:text-primary transition-colors hover:underline"
            title="Clinician Access Gate"
          >
            HIPAA Compliant Sandbox Environment
          </span>
        </p>
      </footer>
    </div>
  );
}
