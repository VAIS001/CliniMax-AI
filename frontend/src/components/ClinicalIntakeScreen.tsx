import React, { useState } from 'react';
import { PatientProfile, IntakeForm, ServiceType } from '../types';
import { ChatMessage, postIntakeChat, postConsultation, saveLocalConsultation } from '../lib/api';

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
  // Navigation / Tabs Configuration: 'form' | 'chat'
  const [activeTab, setActiveTab] = useState<'form' | 'chat'>('chat');

  // Modal 1 (Traditional Form) states
  const [symptoms, setSymptoms] = useState(
    patient.id === '#8492-A'
      ? 'I have been experiencing sharp abdominal pain in the lower right quadrant for the past few hours. It feels worse when I move.'
      : ''
  );
  const [duration, setDuration] = useState(patient.id === '#8492-A' ? 'hours' : '');
  const [meds, setMeds] = useState<string[]>(['Ibuprofen', 'Vitamin D']);
  const [newMed, setNewMed] = useState('');
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  // Chat Triager States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `Hello ${patient.name}, I am CliniMax AI Triager. I will guide you through our smart check-in by asking a few questions. To begin, please describe the symptoms or main concerns that bring you in today.`
    }
  ]);
  const [chatInput, setChatInput] = useState(
    patient.id === '#8492-A'
      ? 'I have been experiencing sharp abdominal pain in the lower right quadrant for the past few hours. It feels worse when I move.'
      : ''
  );
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatComplete, setIsChatComplete] = useState(false);
  const [compiledSummary, setCompiledSummary] = useState<string | null>(null);
  const [detectedPriority, setDetectedPriority] = useState<'IMMEDIATE' | 'ROUTINE'>('ROUTINE');

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

  // Chat Submission Core Loop
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading || isChatComplete) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    // Update state with user message
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', text: userMsg }
    ];
    setChatHistory(updatedHistory);

    try {
      // Hit Developer FastAPI Endpoint: POST /api/intake/chat
      const response = await postIntakeChat(updatedHistory, userMsg);
      
      // Update history with AI model reply
      setChatHistory(prev => [
        ...prev,
        { role: 'model', text: response.reply }
      ]);
      
      if (response.is_complete) {
        setIsChatComplete(true);
        // Prompt a quick evaluation auto-urgency detector
        const isUrgent = updatedHistory.some(m => 
          /severe|sharp|blood_pressure|breathing|extreme|heart|chest|unconscious|choking|stroke/i.test(m.text)
        );
        setDetectedPriority(isUrgent ? 'IMMEDIATE' : 'ROUTINE');
      }
    } catch (e) {
      console.error("Failed to query triage chat endpoint:", e);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Compile full Consultation to Supabase & finalize 
  const handleCompileConsultation = async () => {
    setIsChatLoading(true);
    
    // Formulate raw complaints
    const rawSymptomsCompiled = chatHistory
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join(' | ');

    try {
      // Hit Developer FastAPI Endpoint: POST /api/consultations
      const res = await postConsultation({
        patient_name: patient.name,
        raw_symptoms: rawSymptomsCompiled,
        triage_priority: detectedPriority === 'IMMEDIATE' ? 'URGENT' : 'ROUTINE',
        clinical_summary: `AI Triaged Check-In for ${patient.name}. Primary concern flagged: "${rawSymptomsCompiled.substring(0, 100)}..."`,
        chat_history: chatHistory
      });

      // Cache consultation locally for high-resilience retrieval in Sandbox
      saveLocalConsultation(res);

      setCompiledSummary(res.clinical_summary);
      
      // Submit the formal results up to top level APP
      onSubmit({
        symptoms: res.clinical_summary || rawSymptomsCompiled || 'Interactive AI Triage completed.',
        duration: 'Hours (Self-Triaged)',
        medications: meds
      });
    } catch (err) {
      console.error("Consultation file failed to save:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
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
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-3 gap-2">
          <div>
            <span className="text-secondary font-bold text-xs uppercase tracking-widest block">
              {getServiceLabel()}
            </span>
            <h2 className="font-bold text-2xl md:text-3xl text-primary tracking-tight">
              Clinical Intake Workspace
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
        <div className="w-full bg-surface-container-high rounded-full h-2 mb-4">
          <div className="bg-primary h-2 rounded-full w-1/3 transition-all duration-500 ease-in-out"></div>
        </div>

        {/* Dynamic Modality Selector Tabs */}
        <div className="flex p-1 bg-surface-container-low rounded-lg border border-outline-variant/30 max-w-md">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-xs font-bold rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">chat_spark</span>
            Interactive AI Triager (FastAPI)
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-xs font-bold rounded-md cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'form'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">assignment</span>
            Traditional Structured Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Content Area */}
        <div className="lg:col-span-9">
          
          {/* MODALITY A: SMART INTERACTIVE AI TRIAGER (ENDPOINT CONFORMANT) */}
          {activeTab === 'chat' && (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden flex flex-col h-[520px]">
              
              {/* Chat Panel Header Status */}
              <div className="bg-surface-container-low px-6 py-3 border-b border-surface-variant flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary fill">chat_spark</span>
                  <div>
                    <span className="font-bold text-xs text-primary block">CLINIMAX INTELLIGENT ROUTING</span>
                    <span className="text-[10px] text-on-surface-variant">Live interview with AI Clinical Assessor</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase">FASTAPI SYNC</span>
                </div>
              </div>

              {/* Chat Message Scroll Log */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                {chatHistory.map((item, id) => (
                  <div
                    key={id}
                    className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                        item.role === 'user'
                          ? 'bg-primary text-white rounded-br-none shadow-sm'
                          : 'bg-white border border-outline-variant/50 text-on-surface rounded-bl-none shadow-xs'
                      }`}
                    >
                      <p className="font-semibold mb-1 uppercase text-[9px] opacity-75 tracking-wider">
                        {item.role === 'user' ? 'Patient' : 'Clinical Triager AI'}
                      </p>
                      <p className="font-medium whitespace-pre-wrap">{item.text}</p>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex justify-start items-center gap-2.5 p-3 text-xs text-on-surface-variant/70 italic bg-white border border-outline-variant/30 rounded-xl rounded-bl-none max-w-[200px] shadow-xs">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200"></span>
                    <span>AI digesting parameters...</span>
                  </div>
                )}
              </div>

              {/* Chat Panel Controls Foot */}
              <div className="p-4 border-t border-surface-variant bg-surface-container-lowest">
                {!isChatComplete ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                      disabled={isChatLoading}
                      placeholder="Describe your symptoms or answer the AI's question..."
                      className="flex-grow rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface px-3 py-3 outline-none disabled:opacity-60"
                    />
                    <button
                      onClick={handleSendChat}
                      disabled={isChatLoading || !chatInput.trim()}
                      className="px-5 py-3 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-opacity-95 shadow transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      Send
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-[#fdf8e2] border border-amber-300/40 rounded-lg gap-4 animate-fade-in">
                    <div>
                      <h4 className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-amber-600">verified</span>
                        Assessment Concluded Successfully
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                        The AI has generated enough parameters to prepare an intake report with <strong className="uppercase">{detectedPriority}</strong> triage code.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleCompileConsultation}
                      disabled={isChatLoading}
                      className="px-6 py-3 bg-[#FF7A00] text-slate-950 font-black text-xs rounded-lg hover:bg-amber-400 transition-all cursor-pointer shadow-lg flex items-center gap-1 w-full sm:w-auto justify-center"
                    >
                      {isChatLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                          Compiling...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">clinical_notes</span>
                          Compile & Submit Consultation
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* MODALITY B: TRADITIONAL QUESTIONNAIRE FORM */}
          {activeTab === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Section 1: Symptoms Card */}
              <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                <h3 className="font-semibold text-lg text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">stethoscope</span>
                  What brings you in today?
                </h3>
                <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                  Please describe your symptoms, discomfort, or general health concerns in detail.
                </p>
                <div>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary text-on-surface p-3 outline-none text-xs leading-relaxed"
                    id="symptoms"
                    placeholder="I have been experiencing..."
                    rows={4}
                    required={activeTab === 'form'}
                  ></textarea>
                </div>
              </section>

              {/* Section 2: Duration Card */}
              <section className="bg-surface-container-lowest p-6 rounded-xl border border-surface-variant shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-tertiary"></div>
                <h3 className="font-semibold text-lg text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary font-medium">schedule</span>
                  How long have you felt this way?
                </h3>
                <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                  Understanding the duration helps prioritize emergency response level or referral categories.
                </p>
                <div>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full md:w-1/2 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary text-on-surface p-3 outline-none text-xs font-medium"
                    id="duration"
                    required={activeTab === 'form'}
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
                <h3 className="font-semibold text-lg text-on-surface mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary fill">medication</span>
                  Are you taking any medicine?
                </h3>
                <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                  Include daily prescriptions, over-the-counter tablets, herbal remedies, and vitamins.
                </p>
                
                <div className="space-y-4">
                  {meds.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {meds.map((med, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high text-on-surface rounded-full text-xs font-medium border border-outline-variant/30 transition-all"
                        >
                          {med}
                          <button
                            onClick={() => handleRemoveMed(idx)}
                            className="material-symbols-outlined text-[14px] hover:text-error cursor-pointer rounded-full p-0.5"
                            type="button"
                          >
                            close
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant italic mb-2">No medications listed yet.</p>
                  )}

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
                      className="flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary text-on-surface px-3 py-2.5 text-xs outline-none"
                      placeholder="Type a medication and press Add"
                      type="text"
                    />
                    <button
                      onClick={handleAddMed}
                      className="px-6 py-2.5 bg-secondary-container text-on-secondary-container rounded-lg font-bold text-xs hover:bg-secondary hover:text-on-secondary transition-all cursor-pointer border border-transparent"
                      type="button"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>

              {/* Save Status Banner */}
              {showDraftSaved && (
                <div className="p-3 bg-secondary-container/30 border border-secondary/20 text-on-secondary-container rounded-lg text-xs flex items-center gap-2 animate-fade-in font-medium">
                  <span className="material-symbols-outlined text-secondary fill animate-bounce">check_circle</span>
                  Session draft successfully synchronized to clinical sandbox server.
                </div>
              )}

              {/* Navigation Buttons Row */}
              <div className="flex justify-between items-center pt-4 border-t border-surface-variant">
                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-3 border border-outline text-primary rounded-lg font-bold text-xs hover:bg-surface-container transition-all cursor-pointer"
                  type="button"
                >
                  Save Draft
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onBack}
                    className="px-5 py-3 text-on-surface-variant hover:text-on-surface text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-8 py-3 bg-primary text-on-primary rounded-lg font-bold text-xs hover:bg-opacity-95 shadow transition-all flex items-center gap-2 cursor-pointer"
                    type="submit"
                  >
                    <span>Continue Check-In</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

        {/* Informative Side Card */}
        <div className="lg:col-span-3">
          <div className="sticky top-24 bg-surface-container-low p-5 rounded-xl border border-surface-variant space-y-6">
            <div>
              <h4 className="font-bold text-xs mb-3 flex items-center gap-2 text-primary uppercase tracking-wider">
                <span className="material-symbols-outlined">info</span>
                AI Triage Process
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">
                The **Interactive AI Triager** matches FastAPI endpoints configured by the team. Chatting clarifies severity to sort clinical priority instantly, saving you time at physician check desks.
              </p>
            </div>
            
            <hr className="border-outline-variant/30" />

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-[11px] font-bold text-on-surface mb-2 flex items-center gap-1 uppercase tracking-wider text-primary">
                <span className="material-symbols-outlined text-xs">shield_with_heart</span>
                Data Security
              </p>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                All records, questions, and replies are evaluated and stored under robust end-to-end sandbox privacy guidelines.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
