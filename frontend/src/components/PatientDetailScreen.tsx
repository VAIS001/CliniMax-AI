import React, { useState } from 'react';
import { DoctorPatient } from './DoctorDashboard';
import { API_BASE_URL } from '../config/api';

interface PatientDetailScreenProps {
  patient: DoctorPatient;
  onBackToDashboard: () => void;
}

export const PatientDetailScreen: React.FC<PatientDetailScreenProps> = ({
  patient,
  onBackToDashboard
}) => {
  const [userQuestion, setUserQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clinicalHistory, setClinicalHistory] = useState(patient.history || []);

  // Preset queries for professional clinicians
  const presetQueries = [
    { label: "Differential Diagnosis Support", query: "Give me top 3 differential diagnoses based on reported symptoms and vitals. Explain clinical reasoning." },
    { label: "Check Lisinopril Interactions", query: "Are there any contraindications or medication safety variables for their current symptoms?" },
    { label: "Formulate Next Actions", query: "Compile an optimal listing of immediate next checkups, specialist referrals, or lab works to execute." },
  ];

  const handleAskAI = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;
    setIsLoading(true);
    setAiResponse(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/clinimax-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: patient.name,
          patientAge: patient.dob ? (2026 - parseInt(patient.dob.split(' ').pop() || '1990')) : 35,
          id: patient.id,
          symptoms: patient.complaintDesc,
          meds: patient.medications,
          question: queryText,
          history: clinicalHistory.map(h => `${h.date}: ${h.type} (${h.text})`).join(' \n')
        })
      });

      const data = await response.json();
      if (response.ok) {
        setAiResponse(data.response);
      } else {
        setAiResponse(`Failed to query CliniMax AI: ${data.error || 'Server error occurred'}`);
      }
    } catch (err) {
      console.error(err);
      setAiResponse("Network failure. Please ensure the dev server is active and responding.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as any).elements.noteText;
    if (!input.value.trim()) return;

    const newHistoryItem = {
      type: "Clinical Note",
      date: "Today, May 14th 2026",
      text: input.value.trim(),
      doctor: "Dr. Harper"
    };

    setClinicalHistory([newHistoryItem, ...clinicalHistory]);
    input.value = "";
  };

  return (
    <div className="w-full min-h-screen bg-[#090d16] text-[#f8fafc] pb-16 animate-fade-in font-sans">
      
      {/* Chart Back Button */}
      <button
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-blue-300 hover:text-amber-400 font-extrabold text-sm mb-6 group cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
          arrow_back
        </span>
        Return to Attending Hub
      </button>

      {/* Header Profile Area */}
      <div className="glass rounded-xl p-6 border-b-4 border-b-amber-500 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 text-[10px] uppercase font-mono font-bold rounded-sm border border-amber-500/25">
                ACTIVE PATIENT CHARTS
              </span>
              <span className="text-xs text-blue-200 font-mono font-bold leading-none">MRN: {patient.id}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-white mt-2">
              {patient.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-100 font-title font-semibold mt-1">
              DOB: {patient.dob} • Insurance: <span className="text-[#00e0b4]">Aetna Commercial PPO</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="px-4 py-2 bg-[#12192e] border border-slate-700/60 rounded-lg text-xs font-mono font-bold text-white">
              Status: <span className="text-red-400 font-extrabold">{patient.status}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Health Profile & Details */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Recent Vitals Signs Box */}
          <div className="glass rounded-xl p-6 border border-slate-800">
            <h2 className="text-sm uppercase font-bold tracking-widest text-blue-200 mb-4">
              Real-Time Vital Observations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* BP */}
              <div className="bg-[#10162a] p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-blue-200 font-bold">Blood Pressure</span>
                <p className="text-xl font-extrabold font-display text-white mt-1">
                  {patient.vitals?.bp || "120/80"}
                </p>
                <span className="text-[10px] font-bold text-green-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                  Optimal Range
                </span>
              </div>
              {/* HR */}
              <div className="bg-[#10162a] p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-blue-200 font-bold">Heart Rate</span>
                <p className="text-xl font-extrabold font-display text-white mt-1">
                  {patient.vitals?.hr || "72 bpm"}
                </p>
                <span className="text-[10px] font-bold text-green-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                  Sinus Rhythm
                </span>
              </div>
              {/* Temp */}
              <div className="bg-[#10162a] p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-blue-200 font-bold">Body Temp</span>
                <p className="text-xl font-extrabold font-display text-white mt-1">
                  {patient.vitals?.temp || "98.6 °F"}
                </p>
                <span className="text-[10px] font-bold text-green-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                  Apyrexial
                </span>
              </div>
              {/* SpO2 */}
              <div className="bg-[#1a1c12] p-4 rounded-xl border border-yellow-500/50">
                <span className="text-xs text-blue-200 font-bold">O2 Saturation (SpO2)</span>
                <p className="text-xl font-extrabold font-display text-[#fcb603] mt-1">
                  {patient.vitals?.spo2 || "94%"}
                </p>
                <span className="text-[10px] font-bold text-[#fcb603] mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block animate-pulse"></span>
                  Borderline Mild Hypoxemia
                </span>
              </div>
            </div>
          </div>

          {/* Chief Complaint, Symptoms, Meds */}
          <div className="glass rounded-xl p-6 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase text-slate-300 tracking-widest mb-2">
                Triage Incident Record
              </h2>
              <div className="bg-[#0b0c14] rounded-lg p-4 border border-slate-800">
                <h3 className="text-sm font-bold text-[#FF7A00] uppercase tracking-wide mb-1">
                  Immediate Presentation: {patient.complaintTitle}
                </h3>
                <p className="text-sm text-slate-100 leading-relaxed">
                  {patient.complaintDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-300 tracking-widest mb-3">
                  Reported Symptom Markers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {patient.symptomsList && patient.symptomsList.length > 0 ? (
                    patient.symptomsList.map((s, index) => (
                      <span
                        key={index}
                        className="text-xs font-bold px-3 py-1.5 bg-[#10162a] border border-slate-700 rounded-full flex items-center gap-1.5 text-slate-100"
                      >
                        <span className="w-1.5 h-1.5 bg-[#00e0b4] rounded-full"></span>
                        {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs italic text-slate-400">No dynamic symptom markers reported.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-slate-300 tracking-widest mb-3">
                  Current Medications (EHR)
                </h3>
                <ul className="space-y-1.5">
                  {patient.medications && patient.medications.length > 0 ? (
                    patient.medications.map((m, idx) => (
                      <li key={idx} className="text-xs font-bold text-slate-100 flex items-center gap-2 animate-pulse-slow">
                        <span className="material-symbols-outlined text-[14px] text-[#FF7A00]">pill</span>
                        {m}
                      </li>
                    ))
                  ) : (
                    <p className="text-xs italic text-slate-400">No current pharmaceutical therapies on file.</p>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Clinical History Timeline */}
          <div className="glass rounded-xl p-6 border border-slate-800">
            <h2 className="text-xs uppercase font-bold tracking-widest text-slate-300 mb-6">
              EHR Clinical Log Timeline
            </h2>
            
            <div className="relative border-l-2 border-slate-850 ml-3 space-y-6">
              {clinicalHistory.map((item, index) => (
                <div key={index} className="relative pl-6 clinical-timeline-node">
                  {/* Circle Indicator on the line */}
                  <span className="absolute w-3 h-3 rounded-full bg-blue-500 shadow-md -left-[7px] top-1.5 z-10"></span>
                  
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-sm uppercase font-extrabold leading-none">
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-slate-300">{item.date}</span>
                    </div>

                    <p className="text-sm font-bold text-slate-100">
                      {item.text}
                    </p>

                    {item.doctor && (
                      <p className="text-[10px] text-slate-300 mt-0.5 font-bold">
                        Advising Officer: <span className="text-[#00e0b4]">{item.doctor}</span>
                      </p>
                    )}

                    {item.labs && (
                      <div className="mt-2 text-xs flex items-center gap-1 text-[#00e0b4] font-bold">
                        <span className="material-symbols-outlined text-sm animate-pulse">lab_research</span>
                        Diagnostic Lab Outputs Integrated (CBC, Lipids)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Chart entry addition form */}
            <form onSubmit={handleAddNote} className="mt-6 pt-5 border-t border-slate-800 flex gap-3">
              <input 
                type="text" 
                name="noteText"
                placeholder="Append quick clinical note..."
                className="w-full text-xs rounded-lg border border-slate-700 bg-[#060812] py-2 px-3 focus:outline-none focus:border-[#FF7A00]/80 text-white placeholder-slate-500"
                required
              />
              <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black leading-none select-none text-xs rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer">
                <span className="material-symbols-outlined text-xs font-bold">add</span>
                Append
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: CliniMax AI Assistant Workspace */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <div className="glass rounded-xl p-6 border border-slate-800 relative overflow-hidden flex flex-col h-full min-h-[500px]">
            {/* Soft Ambient decorative backdrop glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-4 relative z-10">
              <span className="material-symbols-outlined text-[#FF7A00] animate-pulse">
                clinical_notes
              </span>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  CliniMax AI Advisory Portal
                </h2>
                <p className="text-[10.5px] text-slate-300 font-bold">
                  Real-time clinical decision intelligence & summaries
                </p>
              </div>
            </div>

            {/* Suggestions list */}
            <div className="space-y-2 mb-4 relative z-10">
              <p className="text-[10px] font-extrabold text-blue-200 uppercase tracking-wide">
                Suggested Decision Pathways:
              </p>
              {presetQueries.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleAskAI(item.query)}
                  className="w-full text-left bg-[#0e1324] p-2.5 rounded-lg border border-slate-800 hover:border-amber-500/50 hover:bg-[#151d38] transition-all font-extrabold text-xs text-slate-100 flex items-center justify-between group cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span className="material-symbols-outlined text-xs text-[#FF7A00] font-normal group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                </button>
              ))}
            </div>

            {/* Interactive Query Prompt */}
            <div className="flex gap-2.5 mb-4 relative z-10">
              <input
                type="text"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="Ask decision assistant a specific medical query..."
                className="w-full text-xs rounded-lg border border-slate-700 bg-[#060812] py-2.5 px-3 focus:outline-none focus:border-[#FF7A00]/80 text-white placeholder-slate-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI(userQuestion)}
              />
              <button
                onClick={() => handleAskAI(userQuestion)}
                disabled={isLoading}
                className="px-4 py-2 bg-[#FF7A00] text-slate-950 font-black text-xs rounded-lg hover:bg-amber-400 transition-all select-none disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xs">send</span>
                    Query
                  </>
                )}
              </button>
            </div>

            {/* Scrollable output workspace */}
            <div className="flex-1 bg-[#05060b] border border-slate-800 rounded-xl p-4 overflow-y-auto max-h-[300px] text-xs leading-relaxed font-mono text-slate-100">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-slate-300">
                  <span className="w-8 h-8 border-3 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></span>
                  <p className="italic">Assembling Clinical Synthesis...</p>
                </div>
              ) : aiResponse ? (
                <div className="space-y-2 whitespace-pre-wrap text-slate-200 font-sans">
                  {/* Simple text formatting replacement for pristine rendering */}
                  {aiResponse.split("\n").map((line, lid) => {
                    if (line.startsWith("### ")) {
                      return <h3 key={lid} className="text-sm font-bold text-white mt-3 mb-1">{line.replace("### ", "")}</h3>;
                    }
                    if (line.startsWith("#### ")) {
                      return <h4 key={lid} className="text-xs font-bold text-[#FF7A00] mt-2 mb-1">{line.replace("#### ", "")}</h4>;
                    }
                    if (line.startsWith("- ")) {
                      return <li key={lid} className="list-disc list-inside ml-2 py-0.5 text-slate-200">{line.replace("- ", "")}</li>;
                    }
                    if (line.startsWith("* ")) {
                      return <li key={lid} className="list-disc list-inside ml-2 py-0.5 text-slate-200">{line.replace("* ", "")}</li>;
                    }
                    return <p key={lid} className="mb-2 text-slate-200">{line}</p>;
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 italic text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">clinical_notes</span>
                  Select a clinical preset query above or enter a customized diagnostic medical question.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
