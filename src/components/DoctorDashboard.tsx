import React, { useState, useEffect } from 'react';
import { PatientProfile, IntakeForm, ServiceType } from '../types';
import { fetchConsultations, Consultation, checkBackendHealth, getBackendBaseUrl, setBackendBaseUrl } from '../lib/api';
import { ClinicalMemoryTab } from './ClinicalMemoryTab';
import { WhatsAppTab } from './WhatsAppTab';
import { AudioUploadTab } from './AudioUploadTab';

export interface DoctorPatient {
  name: string;
  dob: string;
  id: string; // ID/MRN
  idType: 'IP' | 'GUEST' | 'NEW_PATIENT';
  status: 'IMMEDIATE' | 'ROUTINE' | 'PENDING';
  complaintTitle: string;
  complaintDesc: string;
  timeLabel: string; // Wait time (e.g. "12 min") or Scheduled time (e.g. "09:30 AM")
  bloodType?: string;
  allergies?: string;
  vitals?: {
    bp: string;
    hr: string;
    temp: string;
    spo2: string;
  };
  medications?: string[];
  symptomsList?: string[];
  history?: Array<{
    type: string;
    date: string;
    text: string;
    doctor?: string;
    labs?: boolean;
  }>;
}

interface DoctorDashboardProps {
  patients: DoctorPatient[];
  onOpenPatient: (patient: DoctorPatient) => void;
  onBackToPortalSelection: () => void;
  onAddPatientToQueue: (newPat: DoctorPatient) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  patients,
  onOpenPatient,
  onBackToPortalSelection,
  onAddPatientToQueue
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'templates' | 'whatsapp' | 'audio'>('queue');
  const [preferredStyle, setPreferredStyle] = useState<'SOAP' | 'Narrative' | 'Problem-Oriented'>('SOAP');

  useEffect(() => {
    const storedStyle = localStorage.getItem('clinimax_preferred_style');
    if (storedStyle) {
      setPreferredStyle(storedStyle as any);
    }
  }, []);

  const [filter, setFilter] = useState<'ALL' | 'IMMEDIATE' | 'ROUTINE' | 'PENDING'>('ALL');

  // API Live synchronization states
  const [liveConsultations, setLiveConsultations] = useState<Consultation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [backendUrl, setBackendUrlState] = useState(getBackendBaseUrl());
  const [showConfig, setShowConfig] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState(backendUrl);
  
  // Interactive Modals for Quick Actions
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [quickNote, setQuickNote] = useState({ title: '', body: '', patientId: '' });
  const [quickRx, setQuickRx] = useState({ rxName: '', dose: '', patientId: '' });
  const [quickAppt, setQuickAppt] = useState({ date: '2026-06-08', time: '10:00', patientId: '', service: 'doctor' });
  const [quickRef, setQuickRef] = useState({ specialist: '', reason: '', patientId: '' });

  // Tasks state
  const [tasks, setTasks] = useState([
    { id: 1, time: "08:45 AM", title: "Review Lab Results", desc: "3 CBC panels pending signature", done: false },
    { id: 2, time: "11:30 AM", title: "Consult with Dr. Evans", desc: "Regarding patient transfer to ICU", done: false },
    { id: 3, time: "01:00 PM", title: "Department Meeting", desc: "Conference Room B", done: false }
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const syncBackend = async () => {
    setIsSyncing(true);
    try {
      const healthy = await checkBackendHealth();
      setApiOnline(healthy);
      const list = await fetchConsultations();
      setLiveConsultations(list);
    } catch (e) {
      console.error("Dashboard sync failure:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncBackend();
    const interval = setInterval(syncBackend, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [backendUrl]);

  // Map backend consultations to the DoctorsPatient theme format
  const mappedLive = liveConsultations.map((c): DoctorPatient => {
    const isUrgent = c.triage_priority === 'URGENT' || c.triage_priority === 'IMMEDIATE';
    return {
      name: c.patient_name,
      dob: "Age 34 (Self-Triaged)",
      id: c.id || `C-${Math.floor(Math.random() * 1000)}`,
      idType: 'NEW_PATIENT',
      status: isUrgent ? 'IMMEDIATE' : 'ROUTINE',
      complaintTitle: "AI Consultation Intake Form",
      complaintDesc: c.clinical_summary,
      timeLabel: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now',
      vitals: {
        bp: "124/82 mmHg",
        hr: "76 bpm",
        temp: "98.6 °F",
        spo2: "98%"
      },
      medications: [],
      symptomsList: [c.raw_symptoms],
      history: (c.chat_history || []).map(h => ({
        type: h.role === 'user' ? 'Patient Input' : 'AI Triager Question',
        date: 'During Triage',
        text: h.text
      }))
    };
  });

  // Merge newly registered real Patients from local FastAPI with prefabricated EHR charts
  const allPatients = [...mappedLive, ...patients.filter(p => !mappedLive.some(l => l.name === p.name))];

  const handleToggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    triggerToast("Task status updated");
  };

  const filteredPatients = allPatients.filter(p => {
    if (filter === 'ALL') return true;
    return p.status === filter;
  });

  const countImmediate = allPatients.filter(p => p.status === 'IMMEDIATE').length;
  const countRoutine = allPatients.filter(p => p.status === 'ROUTINE').length;
  const countPending = allPatients.filter(p => p.status === 'PENDING').length;

  const handleActionSubmit = (e: React.FormEvent, type: string) => {
    e.preventDefault();
    if (type === 'note') {
      triggerToast(`Note successfully appended to clinical records for ID ${quickNote.patientId || 'General'}`);
      setQuickNote({ title: '', body: '', patientId: '' });
    } else if (type === 'rx') {
      triggerToast(`E-prescription for ${quickRx.rxName} sent successfully`);
      setQuickRx({ rxName: '', dose: '', patientId: '' });
    } else if (type === 'appt') {
      triggerToast(`Follow-up consultation successfully scheduled on ${quickAppt.date} ${quickAppt.time}`);
      setQuickAppt({ date: '2026-06-08', time: '10:00', patientId: '', service: 'doctor' });
    } else if (type === 'ref') {
      triggerToast(`Referral draft compiled and transmitted to ${quickRef.specialist}`);
      setQuickRef({ specialist: '', reason: '', patientId: '' });
    }
    setActiveModal(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#090d16] text-[#f8fafc] pb-16 animate-fade-in relative font-sans font-normal">
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 pt-4">
        <div>
          <span className="text-xs uppercase font-bold text-[#FF7A00] tracking-widest block mb-1">
            Attending Hub • Live Active Shift
          </span>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-white mb-2 tracking-tight">
            Dr. Harper's Shift
          </h1>
          <p className="text-sm font-title text-blue-200 flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse inline-block"></span>
            Tuesday, May 14th • {patients.length} Candidates Logged
          </p>
        </div>

        {/* Quick Stats Bento Row */}
        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none snap-x">
          <button
            onClick={() => setFilter('IMMEDIATE')}
            className={`glass rounded-xl p-4 min-w-[124px] text-center border-l-4 border-l-[#ffb4ab] transition-all hover:scale-[1.03] active:scale-[0.98] flex-1 md:flex-none cursor-pointer ${
              filter === 'IMMEDIATE' ? 'bg-[#ffb4ab]/15 border-slate-600' : 'bg-[#12182b] border border-slate-800'
            }`}
          >
            <span className="block text-2xl font-bold font-display text-[#ffb4ab]">{countImmediate}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-100 font-bold mt-1 block">Immediate</span>
          </button>
          <button
            onClick={() => setFilter('ROUTINE')}
            className={`glass rounded-xl p-4 min-w-[124px] text-center border-l-4 border-l-[#a4e6ff] transition-all hover:scale-[1.03] active:scale-[0.98] flex-1 md:flex-none cursor-pointer ${
              filter === 'ROUTINE' ? 'bg-[#a4e6ff]/15 border-slate-600' : 'bg-[#12182b] border border-slate-800'
            }`}
          >
            <span className="block text-2xl font-bold font-display text-[#a4e6ff]">{countRoutine}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-100 font-bold mt-1 block">Routine</span>
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`glass rounded-xl p-4 min-w-[124px] text-center border-l-4 border-l-slate-400 transition-all hover:scale-[1.03] active:scale-[0.98] flex-1 md:flex-none cursor-pointer ${
              filter === 'PENDING' ? 'bg-slate-700/20 border-slate-600' : 'bg-[#12182b] border border-slate-800'
            }`}
          >
            <span className="block text-2xl font-bold font-display text-slate-200">{countPending}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-100 font-bold mt-1 block">Pending</span>
          </button>
          {filter !== 'ALL' && (
            <button
              onClick={() => setFilter('ALL')}
              className="px-3 flex items-center justify-center text-xs text-blue-300 font-bold hover:underline cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </header>

      {/* Clinician Workspace Tab Navigation */}
      <div className="flex border-b border-slate-800 mb-6 overflow-x-auto gap-2 scrollbar-none pb-1 relative z-10">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer relative ${
            activeTab === 'queue' ? 'text-[#FF7A00]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xs font-bold">queue_play_next</span>
          Active Patient Queue
          {activeTab === 'queue' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF7A00]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer relative ${
            activeTab === 'templates' ? 'text-[#FF7A00]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xs font-bold">clinical_notes</span>
          Clinical Memory & Templates
          {activeTab === 'templates' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF7A00]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer relative ${
            activeTab === 'whatsapp' ? 'text-[#FF7A00]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xs font-bold">chat_bubble</span>
          WhatsApp Clinical Flow
          {activeTab === 'whatsapp' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF7A00]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`px-4 py-2.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer relative ${
            activeTab === 'audio' ? 'text-[#FF7A00]' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-xs font-bold">audio_file</span>
          Audio Transcription Hub
          {activeTab === 'audio' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF7A00]" />
          )}
        </button>
      </div>

      {activeTab === 'queue' && (
        <>
          {/* Live API Integration Manager */}
          <div className="mb-6 p-4 rounded-xl bg-[#0e1324]/80 border border-slate-800/80 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${apiOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-500'} border-2 border-slate-900`}></div>
              <div>
                <h3 className="text-xs font-extrabold text-white flex items-center gap-2 uppercase tracking-wider">
                  FastAPI Supabase Synchronizer
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[9px] font-normal leading-none text-slate-300">
                    {apiOnline ? "ONLINE" : "SANDBOX FALLBACK"}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Endpoint: {backendUrl} • Polling Active (15s)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-[11px] text-slate-200 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">settings</span>
                Configure Backend URL
              </button>
              <button
                onClick={syncBackend}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-[11px] text-[#FF7A00] rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-xs ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
                Force Sync
              </button>
            </div>
          </div>

          {showConfig && (
            <div className="mb-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 animate-fade-in text-slate-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-mono font-extrabold text-slate-400 mb-1">FastAPI Backend Endpoint Target</label>
                  <input
                    type="text"
                    value={newUrlInput}
                    onChange={e => setNewUrlInput(e.target.value)}
                    placeholder="http://127.0.0.1:8000"
                    className="w-full bg-[#070a14] border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono outline-none focus:border-[#FF7A00]"
                  />
                </div>
                <div className="flex items-end gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setBackendBaseUrl(newUrlInput);
                      setBackendUrlState(newUrlInput);
                      setShowConfig(false);
                      triggerToast("Address updated successfully!");
                    }}
                    className="px-4 py-2 bg-[#FF7A00] text-slate-950 text-xs font-black rounded-lg cursor-pointer hover:bg-amber-400 transition-all"
                  >
                    Apply Address
                  </button>
                  <button
                    onClick={() => setShowConfig(false)}
                    className="px-4 py-2 bg-slate-900 border border-slate-805 text-slate-300 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Patient Active Queue */}
            <div className="md:col-span-8 flex flex-col gap-6">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF7A00] font-normal">
                    queue_play_next
                  </span>
                  Active Queue ({filteredPatients.length})
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <span>Viewing:</span>
                  <span className="px-2.5 py-1 bg-[#131b31] border border-slate-750 rounded text-[#FF7A00] capitalize">
                    {filter.toLowerCase()} Triage
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((pat) => (
                    <div
                      key={pat.id}
                      onClick={() => onOpenPatient(pat)}
                      className="glass rounded-xl p-6 relative overflow-hidden group transition-all duration-300 hover:border-[#FF7A00]/50 hover:-translate-y-0.5 cursor-pointer shadow-md"
                    >
                      {/* Category Status Light Top Stroke */}
                      <div
                        className={`absolute top-0 left-0 w-full h-1 ${
                          pat.status === 'IMMEDIATE' ? 'bg-error' : 'bg-[#a4e6ff]'
                        }`}
                      ></div>

                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold font-display text-white group-hover:text-[#FF7A00] transition-colors">
                                {pat.name}
                              </h3>
                              <p className="text-xs text-blue-200 font-semibold mt-0.5">
                                DOB: {pat.dob} • MRN: <span className="font-mono text-white bg-slate-900 px-1 py-0.5 rounded">{pat.id}</span>
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                pat.status === 'IMMEDIATE'
                                  ? 'bg-error-container/20 text-[#ffb4ab] border-error/50'
                                  : 'bg-emerald-950/45 text-[#00e0b4] border-[#00e0b4]/45'
                              }`}
                            >
                              {pat.status}
                            </span>
                          </div>

                          <div className="bg-[#0b0f1d] rounded-lg p-4 mb-4 border border-slate-800">
                            <p className="text-xs font-extrabold text-amber-200 mb-1.5 uppercase tracking-wide">
                              Chief Complaint: {pat.complaintTitle}
                            </p>
                            <p className="text-sm text-slate-100 font-medium leading-relaxed">
                              {pat.complaintDesc}
                            </p>
                          </div>

                          {/* Pill chips */}
                          <div className="flex gap-2 flex-wrap">
                            {pat.bloodType && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-100 px-2.5 py-1 bg-[#131a31] rounded border border-slate-700">
                                <span className="material-symbols-outlined text-xs text-error fill">bloodtype</span>
                                Type {pat.bloodType}
                              </span>
                            )}
                            {pat.allergies && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#ffb4ab] px-2.5 py-1 bg-red-950/30 rounded border border-red-900/40">
                                <span className="material-symbols-outlined text-xs">warning</span>
                                {pat.allergies}
                              </span>
                            )}
                            {pat.medications && pat.medications.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-100 px-2.5 py-1 bg-[#131a31] rounded border border-slate-700">
                                <span className="material-symbols-outlined text-xs">pill</span>
                                {pat.medications.length} Prescriptions
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Area */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 min-w-[130px]">
                          <div className="text-left md:text-right">
                            <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                              {pat.status === 'IMMEDIATE' ? 'Wait Time' : 'Scheduled'}
                            </p>
                            <p
                              className={`text-lg font-extrabold font-display ${
                                pat.status === 'IMMEDIATE' ? 'text-red-400 animate-pulse' : 'text-slate-100'
                              }`}
                            >
                              {pat.timeLabel}
                            </p>
                          </div>
                          <button className="bg-[#FF7A00] text-slate-950 hover:bg-amber-400 text-xs font-black font-display px-4 py-2.5 rounded-lg transition-all shadow-md group-hover:scale-[1.03] cursor-pointer">
                            Open Chart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center bg-[#070a14] border border-dashed border-slate-800 rounded-xl p-8 text-slate-300 italic text-sm">
                    No patient queues match the filtered triage type.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Sidebar Tasks & Actions */}
            <div className="md:col-span-4 flex flex-col gap-8">
              
              {/* Upcoming Tasks Widget */}
              <div className="glass rounded-xl p-6 border border-slate-850 relative">
                <h2 className="text-lg font-bold text-white mb-6 tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF7A00]">
                    calendar_today
                  </span>
                  Upcoming Tasks
                </h2>
                <div className="relative border-l-2 border-slate-800 ml-2.5 space-y-6">
                  {tasks.map((task) => (
                    <div key={task.id} className="relative pl-6 clinical-timeline-node">
                      {/* Indicator Dot */}
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`absolute w-3.5 h-3.5 rounded-full -left-[8px] top-1.5 flex items-center justify-center transition-all cursor-pointer ${
                          task.done
                            ? 'bg-emerald-900 border border-emerald-500 text-emerald-200'
                            : 'bg-[#090d16] border border-slate-700 hover:border-[#FF7A00]'
                        }`}
                      >
                        {task.done && (
                          <span className="material-symbols-outlined text-[8px] font-bold">check</span>
                        )}
                      </button>
                      <div>
                        <p className={`text-[10px] font-extrabold tracking-wider mb-0.5 ${task.done ? 'text-slate-500 line-through' : 'text-[#FF7A00]'}`}>
                          {task.time}
                        </p>
                        <p className={`text-sm font-bold ${task.done ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                          {task.title}
                        </p>
                        <p className={`text-xs ${task.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                          {task.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="glass rounded-xl p-6 border border-slate-850 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FF7A00] to-transparent pointer-events-none"></div>
                <h2 className="text-lg font-bold text-white mb-4 relative z-10">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <button
                    onClick={() => setActiveModal('note')}
                    className="bg-[#0e1324] border border-slate-800 hover:bg-[#151c36] p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:border-[#FF7A00]/50 cursor-pointer text-center group active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[#FF7A00] text-3xl group-hover:scale-110 transition-transform">
                      edit_document
                    </span>
                    <span className="text-xs font-bold text-slate-100">New Note</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveModal('rx')}
                    className="bg-[#0e1324] border border-slate-800 hover:bg-[#151c36] p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:border-[#FF7A00]/50 cursor-pointer text-center group active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[#FF7A00] text-3xl group-hover:scale-110 transition-transform">
                      prescriptions
                    </span>
                    <span className="text-xs font-bold text-slate-100">Rx Refill</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveModal('appt')}
                    className="bg-[#0e1324] border border-slate-800 hover:bg-[#151c36] p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:border-[#FF7A00]/50 cursor-pointer text-center group active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[#FF7A00] text-3xl group-hover:scale-110 transition-transform">
                      calendar_add_on
                    </span>
                    <span className="text-xs font-bold text-slate-100">Book Appt</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveModal('ref')}
                    className="bg-[#0e1324] border border-slate-800 hover:bg-[#151c36] p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:border-[#FF7A00]/50 cursor-pointer text-center group active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[#FF7A00] text-3xl group-hover:scale-110 transition-transform">
                      outgoing_mail
                    </span>
                    <span className="text-xs font-bold text-slate-100">Referral</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'templates' && (
        <ClinicalMemoryTab onStyleChanged={(newStyle) => setPreferredStyle(newStyle)} />
      )}

      {activeTab === 'whatsapp' && (
        <WhatsAppTab preferredStyle={preferredStyle} />
      )}

      {activeTab === 'audio' && (
        <AudioUploadTab preferredStyle={preferredStyle} />
      )}

      {/* MODALS RENDER SECTION */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setActiveModal(null)}></div>
          
          <div className="bg-[#0d1224] border border-slate-700 rounded-xl p-6 w-full max-w-md relative z-10 text-[#f8fafc]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF7A00] fill">medical_services</span>
                {activeModal === 'note' && "Draft Clinical Practitioner Note"}
                {activeModal === 'rx' && "Authorize Electronic Medication Refill"}
                {activeModal === 'appt' && "Request Patient Consult Schedule"}
                {activeModal === 'ref' && "Formulate Specialist Referral Intake"}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <span className="material-symbols-outlined font-light text-base">close</span>
              </button>
            </div>

            {/* Form Note */}
            {activeModal === 'note' && (
              <form onSubmit={(e) => handleActionSubmit(e, 'note')} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Target Patient MRN / ID</label>
                  <select 
                    value={quickNote.patientId} 
                    onChange={e => setQuickNote({...quickNote, patientId: e.target.value})}
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#FF7A00]/80"
                  >
                    <option value="" className="bg-[#0e1324] text-slate-100">Choose Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id} className="bg-[#0e1324] text-slate-100">{p.name} ({p.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Observation / Subjective Heading</label>
                  <input 
                    type="text" 
                    value={quickNote.title}
                    onChange={e => setQuickNote({...quickNote, title: e.target.value})}
                    placeholder="e.g. Abdominal Tenderness Review"
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#FF7A00]/80 placeholder-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Clinical Observation Notes</label>
                  <textarea 
                    value={quickNote.body}
                    onChange={e => setQuickNote({...quickNote, body: e.target.value})}
                    placeholder="Type details..."
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 h-24 focus:outline-none focus:border-[#FF7A00]/80 placeholder-slate-500"
                    required
                  ></textarea>
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#FF7A00] text-slate-950 font-black rounded-lg text-sm transition-all hover:bg-amber-400 block text-center cursor-pointer">
                  Save Practitioner Note
                </button>
              </form>
            )}

            {/* Form Rx */}
            {activeModal === 'rx' && (
              <form onSubmit={(e) => handleActionSubmit(e, 'rx')} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Target Patient MRN / ID</label>
                  <select 
                    value={quickRx.patientId} 
                    onChange={e => setQuickRx({...quickRx, patientId: e.target.value})}
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#FF7A00]/80"
                  >
                    <option value="" className="bg-[#0e1324] text-slate-100">Select Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id} className="bg-[#0e1324] text-slate-100">{p.name} ({p.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Formulation Name / Molecule</label>
                  <input 
                    type="text" 
                    value={quickRx.rxName}
                    onChange={e => setQuickRx({...quickRx, rxName: e.target.value})}
                    placeholder="e.g. Lisinopril 10mg"
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#FF7A00]/80 placeholder-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Dosage Frequency Instructions</label>
                  <input 
                    type="text" 
                    value={quickRx.dose}
                    onChange={e => setQuickRx({...quickRx, dose: e.target.value})}
                    placeholder="e.g. 1 tablet orally once daily in morning"
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#FF7A00]/80 placeholder-slate-500"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#FF7A00] text-slate-950 font-black rounded-lg text-sm transition-all hover:bg-amber-400 block text-center cursor-pointer">
                  Authorize & Refill Prescription
                </button>
              </form>
            )}

            {/* Form Appt */}
            {activeModal === 'appt' && (
              <form onSubmit={(e) => handleActionSubmit(e, 'appt')} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Patient MRN / ID</label>
                  <select 
                    value={quickAppt.patientId} 
                    onChange={e => setQuickAppt({...quickAppt, patientId: e.target.value})}
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#FF7A00]/80"
                  >
                    <option value="" className="bg-[#0e1324] text-slate-100">Choose Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id} className="bg-[#0e1324] text-slate-100">{p.name} ({p.id})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Select Date</label>
                    <input 
                      type="date" 
                      value={quickAppt.date}
                      onChange={e => setQuickAppt({...quickAppt, date: e.target.value})}
                      className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#FF7A00]/80"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Select Time</label>
                    <input 
                      type="time" 
                      value={quickAppt.time}
                      onChange={e => setQuickAppt({...quickAppt, time: e.target.value})}
                      className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#FF7A00]/80"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#FF7A00] text-slate-950 font-black rounded-lg text-sm transition-all hover:bg-amber-400 block text-center cursor-pointer">
                  Commit Consultation Slot
                </button>
              </form>
            )}

            {/* Form Ref */}
            {activeModal === 'ref' && (
              <form onSubmit={(e) => handleActionSubmit(e, 'ref')} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Select Patient</label>
                  <select 
                    value={quickRef.patientId} 
                    onChange={e => setQuickRef({...quickRef, patientId: e.target.value})}
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#FF7A00]/80"
                  >
                    <option value="" className="bg-[#0e1324] text-slate-100">Choose Patient</option>
                    {patients.map(p => <option key={p.id} value={p.id} className="bg-[#0e1324] text-slate-100">{p.name} ({p.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Specialty Destination Profile</label>
                  <input 
                    type="text" 
                    value={quickRef.specialist}
                    onChange={e => setQuickRef({...quickRef, specialist: e.target.value})}
                    placeholder="e.g. Dr. Jennifer Carter (Cardiology)"
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#FF7A00]/80 placeholder-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Specialty Referral</label>
                  <textarea 
                    value={quickRef.reason}
                    onChange={e => setQuickRef({...quickRef, reason: e.target.value})}
                    placeholder="Provide context regarding symptoms..."
                    className="w-full rounded-lg border border-slate-700 bg-[#060812] px-3 py-2 text-sm text-slate-100 h-20 focus:outline-none focus:border-[#FF7A00]/80 placeholder-slate-500"
                    required
                  ></textarea>
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#FF7A00] text-slate-950 font-black rounded-lg text-sm transition-all hover:bg-amber-400 block text-center cursor-pointer">
                  Prepare & Draft Outgoing Referral
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Internal interactive toast notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-secondary-container text-on-secondary-container py-3.5 px-6 rounded-lg shadow-xl font-semibold border border-outline-variant/20 flex items-center gap-2 animate-fade-in text-xs font-mono">
          <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
          {notification}
        </div>
      )}

    </div>
  );
};
