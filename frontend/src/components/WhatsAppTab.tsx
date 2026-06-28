import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCheck, RefreshCw, Smartphone, ClipboardCheck, MessageSquare, AlertCircle, FileText } from 'lucide-react';
import { FeedbackWidget } from './FeedbackWidget';

interface ChatMessage {
  id: string;
  sender: 'patient' | 'ai';
  text: string;
  time: string;
}

interface PresetScenario {
  name: string;
  description: string;
  patientName: string;
  symptoms: string;
  history: ChatMessage[];
  summary: string;
  notes: {
    SOAP: string;
    Narrative: string;
    'Problem-Oriented': string;
  };
}

const SCENARIOS: PresetScenario[] = [
  {
    name: "Acute Sore Throat (Tonsillitis)",
    description: "Acute pharyngitis checkup for school age sibling or adult.",
    patientName: "Lucas Henderson",
    symptoms: "Severe sore throat, difficulty swallowing, swollen lymph nodes for 3 days.",
    history: [
      { id: '1', sender: 'patient', text: "Hello, my throat hurts so much when I swallow. I can barely drink water.", time: "10:02 AM" },
      { id: '2', sender: 'ai', text: "Hello Lucas. I'm CliniMax AI on your clinic careline. I can help document your symptoms. Are you experiencing any fever or difficulty breathing?", time: "10:02 AM" },
      { id: '3', sender: 'patient', text: "Yes, I had a fever of 101.4°F this morning. Breathing is okay, but my neck feels really tender and swollen.", time: "10:03 AM" },
      { id: '4', sender: 'ai', text: "Understood. Fever and tender neck nodes are important parameters. Do you have any cough, runny nose, or muscle aches?", time: "10:04 AM" },
      { id: '5', sender: 'patient', text: "No cough at all. Just very sore throat and headache. I have a pen allergy by the way.", time: "10:04 AM" },
      { id: '6', sender: 'ai', text: "Thank you, I've logged your penicillin allergy. Are you taking any medications for this throat pain?", time: "10:05 AM" },
      { id: '7', sender: 'patient', text: "Took some Ibuprofen 400mg which helps a tiny bit. That is all.", time: "10:05 AM" }
    ],
    summary: "A 28-year-old male presenting with severe acute pharyngitis (sore throat) for 3 days duration. Characterized by high fever (101.4°F) and tender anterior cervical lymphadenopathy. Negative for rhinorrhea and cough. High clinical likelihood of acute streptococcal pharyngitis (Centor Score 4/4). Patient is allergic to Penicillin.",
    notes: {
      SOAP: `[SUBJECTIVE]
Patient reports severe acute throat pain x3 days, radiating to ears during swallowing. Associated with fever up to 101.4°F and persistent dull headache. Denies rhinorrhea, coughing, dyspnea, or chest symptoms. Currently taking Ibuprofen 400mg PRN. Allergic to Penicillin (anaphylaxis risk).

[OBJECTIVE]
Vitals simulated: Temp 101.4°F, SpO2 98%, HR 84 bpm.
Physical Findings: Exudative pharyngitis, swelling of tonsillar pillars, and tender anterior cervical lymph node chain noted.

[ASSESSMENT]
1. Acute exudative pharyngitis - highly suspicious for Streptococcus pyogenes (Centor Score 4/4).
2. Penicillin Allergy.

[PLAN]
1. Schedule immediate in-clinic rapid strep swab.
2. Prescribe Azithromycin 500mg daily x3 days (due to Penicillin allergy).
3. Advise warm salt water gargles and continuation of Ibuprofen for anti-inflammatory support.`,
      Narrative: `The patient is a 28-year-old male who checked in via WhatsApp Careline reporting a 3-day history of severe, progressive throat pain accompanied by painful swallowing (odynophagia). He reports a fever of 101.4°F with cervical lymph node swelling and persistent headaches. He explicitly denies experiencing cough or respiratory congestion. Medical history is notable for a severe Penicillin allergy. Current therapeutics consist solely of self-administered Ibuprofen 400mg. He presents with exudative pharyngitis and tender anterior nodes. We recommend scheduling an in-clinic rapid strep screen immediately. If positive, initiate Macrolide therapy (Azithromycin) given his Penicillin allergy. Provide hydration coaching.`,
      'Problem-Oriented': `ACTIVE PROBLEM 1: Acute Exudative Pharyngitis (Centor Score 4/4)
- Subjective: 3 days of severe throat pain, painful swallowing, headache, and fever of 101.4°F. Denies productive or dry cough.
- Objective: Swollen exudative pharynx, tender anterior lymph glands.
- Action: Schedule urgent throat swab. Avoid beta-lactam antibiotics due to Penicillin anaphylaxis history. Prescribe Azithromycin 500mg PO daily for 3 days instead.

ACTIVE PROBLEM 2: Drug Allergy Profile
- Subjective: Reports severe historical allergy to Penicillin.
- Objective: On file.
- Action: Flag medical record and avoid all beta-lactam derivatives (Penicillins, Cephalosporins).`
    }
  },
  {
    name: "Hypertension Home Log Follow-up",
    description: "Monitoring elevated blood pressures reported by home monitor.",
    patientName: "Dorothy Myers",
    symptoms: "Home blood pressure average of 148/92 mmHg over past 10 days.",
    history: [
      { id: '1', sender: 'patient', text: "Hello doctor, my home blood pressure cuffs are showing high numbers this week. Average is 148/92.", time: "09:12 AM" },
      { id: '2', sender: 'ai', text: "Hello Dorothy. I've flagged this with Dr. Harper. Are you experiencing any headaches, dizziness, chest tightness, or blurry vision?", time: "09:13 AM" },
      { id: '3', sender: 'patient', text: "I have a mild headache at the back of my head, but no vision changes or chest pain. I feel a bit anxious.", time: "09:14 AM" },
      { id: '4', sender: 'ai', text: "Thank you for monitoring these signs closely. Are you taking your daily Lisinopril 10mg as prescribed, and have you missed any doses recently?", time: "09:15 AM" },
      { id: '5', sender: 'patient', text: "Yes, I take it every morning. Haven't missed any. I did start drinking more coffee because of some stressful projects.", time: "09:16 AM" }
    ],
    summary: "A 64-year-old female patient with established hypertension presenting with persistent home-logged blood pressures averaging 148/92 mmHg over 10 days. Accompanied by mild occipital headaches. Denies critical red flags like chest pain, dyspnea, or visual disturbances. Patient is compliant with daily Lisinopril 10mg. Reports increased caffeine intake and professional stressors.",
    notes: {
      SOAP: `[SUBJECTIVE]
Dorothy Myers (64y) reports elevated home BP readings averaging 148/92 mmHg x10 days. Reports concurrent mild tension-type occipital headaches. Patient denies dyspnea, chest discomfort, palpitations, or visual blurring. Denies missed doses of her daily Lisinopril 10mg. Admits to increased stress levels and elevated caffeine consumption (3-4 cups daily).

[OBJECTIVE]
Vitals: BP 148/92 mmHg (home log average). HR: 76 bpm.
No acute distress noted on communication.

[ASSESSMENT]
1. Essential Hypertension - currently suboptimal on Lisinopril monotherapy, exacerbated by caffeine and acute occupational stress.
2. Occupational Stress.

[PLAN]
1. Counsel patient on reducing caffeine intake to max 1 cup/day.
2. Instruct to continue twice-daily BP logging for another week.
3. Schedule telehealth consult with Dr. Harper next week to review logs; consider escalating Lisinopril to 20mg daily if systolic remains above 140 mmHg.`,
      Narrative: `Dorothy Myers, a 64-year-old female with essential hypertension, reported elevated home BP logs averaging 148/92 mmHg over the past 10 days via WhatsApp. She complains of mild occipital headaches but denies major red flag signs of hypertensive crisis. Compliance with Lisinopril 10mg is verified. Patient reports elevated stress and increased coffee consumption. Recommend lifestyle modification, including reduced caffeine intake, stress mitigation techniques, and daily BP logging twice daily. She will be scheduled for a follow-up telehealth visit with Dr. Harper to evaluate if medication titration is required.`,
      'Problem-Oriented': `ACTIVE PROBLEM 1: Essential Hypertension (Uncontrolled)
- Subjective: Average home logs of 148/92 mmHg over 10 days, with occasional mild occipital headaches. Compliant with Lisinopril 10mg.
- Objective: Logged pressures of 148/92 mmHg.
- Action: Counsel on sodium reduction and caffeine restriction. Instruct to maintain BP journal twice daily. Schedule telehealth review for potential dosage escalation to 20mg.

ACTIVE PROBLEM 2: Occupational Stress
- Subjective: Reports increased anxiety and caffeine use due to stress.
- Objective: Increased caffeine (3-4 cups/day).
- Action: Discuss basic lifestyle stress reduction strategies.`
    }
  }
];

export const WhatsAppTab: React.FC<{ preferredStyle: 'SOAP' | 'Narrative' | 'Problem-Oriented' }> = ({ preferredStyle }) => {
  const [activeScenario, setActiveScenario] = useState<PresetScenario>(SCENARIOS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>(SCENARIOS[0].history);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  
  // Compiled output states
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [generatedNote, setGeneratedNote] = useState('');
  const [activeView, setActiveView] = useState<'welcome' | 'results'>('welcome');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  const selectScenario = (sc: PresetScenario) => {
    setActiveScenario(sc);
    setMessages(sc.history);
    setInputText('');
    setIsAiTyping(false);
    setActiveView('welcome');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'patient',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsAiTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponseText = getMockAiResponse(inputText);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsAiTyping(false);
    }, 1800);
  };

  const getMockAiResponse = (input: string): string => {
    const text = input.toLowerCase();
    if (text.includes('allergy') || text.includes('allergic')) {
      return "Thank you for advising me of this drug allergy. I am registering this in your clinical charts. Are you taking any other therapeutics daily?";
    }
    if (text.includes('pain') || text.includes('hurt')) {
      return "I have updated the intensity metrics for your symptoms. On a scale of 1-10, how severe is it? And have you taken anything like paracetamol or ibuprofen?";
    }
    return "Thank you for these parameters. I am updating your intake profile for the attending practitioner's immediate review. Is there anything else about your clinical history we should list?";
  };

  const handleCompileNote = async () => {
    setIsCompiling(true);
    
    // Simulate compilation time
    await new Promise(resolve => setTimeout(resolve, 2200));

    // Compile from scenario or build dynamic
    setConversationHistory(messages);
    
    if (activeScenario.patientName === "Lucas Henderson") {
      setGeneratedSummary(SCENARIOS[0].summary);
      setGeneratedNote(SCENARIOS[0].notes[preferredStyle]);
    } else if (activeScenario.patientName === "Dorothy Myers") {
      setGeneratedSummary(SCENARIOS[1].summary);
      setGeneratedNote(SCENARIOS[1].notes[preferredStyle]);
    } else {
      // Dynamic generated note based on custom messages
      const symptomSnapshot = messages.filter(m => m.sender === 'patient').map(m => m.text).join('; ');
      const rawSummary = `Self-reported clinical profile checked in via WhatsApp Careline. Symptoms: ${symptomSnapshot.substring(0, 160)}...`;
      setGeneratedSummary(rawSummary);
      
      const noteMap = {
        SOAP: `[SUBJECTIVE]
Patient checked in via WhatsApp Careline. Complains of: ${symptomSnapshot.substring(0, 120)}... No respiratory distress.

[OBJECTIVE]
Simulated baseline vitals: BP 120/80 mmHg, HR 72 bpm, Temp 98.6 F. Communication is clear and compliant.

[ASSESSMENT]
1. Symptom presentation under review - clinical markers gathered.

[PLAN]
1. Attending physician review.
2. Keep symptom logging.`,
        Narrative: `The patient initiated check-in via WhatsApp Careline detailing symptoms including: ${symptomSnapshot.substring(0, 120)}... The reports indicate consistent parameters, without acute respiratory alerts. Recommend clinical consult and active oversight to confirm treatment plan.`,
        'Problem-Oriented': `ACTIVE PROBLEM 1: Acute Symptom Manifestation
- Subjective: Patient checked in with symptoms: ${symptomSnapshot.substring(0, 120)}...
- Objective: Vitals normal, alert on chat log.
- Action: Schedule telehealth or physical consult.`
      };
      setGeneratedNote(noteMap[preferredStyle]);
    }

    setIsCompiling(false);
    setActiveView('results');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Tab Header Description */}
      <div className="bg-[#0e1324]/80 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#FF7A00]" />
          Patient-Facing WhatsApp Clinical Synchronizer
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          WhatsApp serves as the patient-facing clinical triage line. This interface lets you simulate patient messages, review the completed chat history, compile structured summaries, and synchronize clinical records directly into the doctor's EHR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Smartphone WhatsApp Simulator */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Quick Preset Selector */}
          <div className="bg-[#060812] border border-slate-800 p-4 rounded-xl space-y-2">
            <p className="text-[10px] font-extrabold uppercase text-[#FF7A00] tracking-wide">
              Select Simulation Encounter Scenario
            </p>
            <div className="flex flex-col gap-2">
              {SCENARIOS.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => selectScenario(sc)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                    activeScenario.patientName === sc.patientName
                      ? 'bg-[#1a1c13] border-yellow-500/50 text-white'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="font-extrabold">{sc.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sc.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Smartphone Shell Frame Mockup */}
          <div className="bg-[#0b0d16] border-[8px] border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col h-[520px]">
            
            {/* Camera speaker notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-b-xl z-25 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
            </div>

            {/* WhatsApp Header banner */}
            <div className="bg-[#075e54] text-white p-3 pt-5 pb-3 flex items-center justify-between z-10 shrink-0 select-none">
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-[#075e54] flex items-center justify-center font-bold text-sm">
                  {activeScenario.patientName[0]}
                </div>
                <div>
                  <h4 className="text-xs font-black leading-none">{activeScenario.patientName}</h4>
                  <span className="text-[8.5px] text-teal-100 font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-ping"></span>
                    CliniMax Patient Line
                  </span>
                </div>
              </div>
              
              <div className="text-[9px] font-mono text-teal-100 bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-800/40 mt-1">
                WhatsApp API
              </div>
            </div>

            {/* WhatsApp Chat Workspace */}
            <div className="flex-1 bg-slate-950 overflow-y-auto p-4 space-y-3 flex flex-col relative" style={{ backgroundImage: 'radial-gradient(rgba(255,122,0,0.03) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
              
              <div className="mx-auto my-2 px-3 py-1 bg-slate-900 border border-slate-800 text-[9px] text-slate-400 rounded-lg text-center font-semibold uppercase tracking-wider select-none">
                End-to-End Encrypted Clinic Service
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed relative ${
                    m.sender === 'patient'
                      ? 'bg-[#054d44] text-white rounded-tr-none self-end'
                      : 'bg-slate-900 text-slate-100 rounded-tl-none self-start border border-slate-800'
                  }`}
                >
                  <p className="font-medium pr-4">{m.text}</p>
                  <div className="text-[8px] text-slate-400 font-mono text-right mt-1.5 flex items-center justify-end gap-1 select-none">
                    <span>{m.time}</span>
                    {m.sender === 'patient' && (
                      <CheckCheck className="w-3 h-3 text-[#34b7f1]" />
                    )}
                  </div>
                </div>
              ))}

              {isAiTyping && (
                <div className="bg-slate-900 text-slate-300 rounded-2xl rounded-tl-none p-3 text-xs self-start border border-slate-800 max-w-[85%] flex items-center gap-1.5 font-semibold">
                  <span className="w-1.5 h-1.5 bg-[#FF7A00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#FF7A00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#FF7A00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  <span className="text-[9px] italic text-slate-400 font-mono pl-1">Careline replying...</span>
                </div>
              )}

              <div ref={chatEndRef}></div>
            </div>

            {/* WhatsApp input bar */}
            <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type message as patient..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-full py-2 px-4 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-[#128c7e] hover:bg-[#075e54] text-white rounded-full cursor-pointer transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>

          {/* Note compilation button */}
          <button
            onClick={handleCompileNote}
            disabled={isCompiling}
            className="w-full py-3 bg-[#FF7A00] hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isCompiling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Compiling WhatsApp Dialogue...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                Compile Note & Sync to Dashboard
              </>
            )}
          </button>

        </div>

        {/* Right Hand: Attending Clinician Web Workspace Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {activeView === 'welcome' ? (
            <div className="bg-[#0b0e1a]/80 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[500px] text-slate-300">
              <MessageSquare className="w-12 h-12 text-[#FF7A00] mb-4 animate-pulse" />
              <h3 className="text-base font-bold text-white mb-2">Attending Clinician Space: WhatsApp Feed</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Interact with the patient simulator on the left. Once you have concluded the triage, click **"Compile Note & Sync to Dashboard"** to process the chat history. The AI will analyze the exchange and format your clinical note in the globally preferred style (<span className="text-[#FF7A00] font-mono font-black">{preferredStyle}</span>).
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              
              {/* Patient Sync Confirmation Alert */}
              <div className="bg-emerald-950/30 border border-emerald-500/35 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#00e0b4] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#00e0b4] uppercase tracking-wider">
                    WhatsApp Patient Intake Synced
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Intake successfully synchronized with clinic record for patient **{activeScenario.patientName}**. Dialogue history mapped below. Review, copy, or sign off the structured practitioner clinical note.
                  </p>
                </div>
              </div>

              {/* Consultation History Pane */}
              <div className="bg-[#0b0e1a] border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-extrabold text-blue-200 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#FF7A00]" />
                  Raw Chat Conversation History
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 bg-slate-950 p-4 border border-slate-900 rounded-lg">
                  {conversationHistory.map((m) => (
                    <div key={m.id} className="text-xs font-mono leading-relaxed flex items-start gap-1">
                      <span className={`font-extrabold select-none ${m.sender === 'patient' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        [{m.sender === 'patient' ? 'Patient' : 'AI'}]
                      </span>
                      <span className="text-slate-200">{m.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Summary Panel */}
              <div className="bg-[#0b0e1a] border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-extrabold text-blue-200 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-[#FF7A00]" />
                  Extracted Clinical Summary (EHR)
                </h3>
                <div className="bg-[#060812] border border-slate-900 p-4 rounded-lg text-xs leading-relaxed text-slate-100 font-semibold">
                  {generatedSummary}
                </div>
              </div>

              {/* Generated Practitioner Note in preferred format */}
              <div className="bg-[#0b0e1a] border border-slate-800 rounded-xl p-5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-xs font-extrabold text-blue-200 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#FF7A00]" />
                    Generated Clinical Practitioner Note
                  </h3>
                  <span className="px-2 py-0.5 bg-[#FF7A00]/15 text-[#FF7A00] border border-[#FF7A00]/30 rounded text-[9.5px] font-black font-mono">
                    Style: {preferredStyle}
                  </span>
                </div>
                
                <div className="bg-slate-950 border border-slate-900 p-5 rounded-lg text-xs leading-relaxed font-mono text-slate-100 whitespace-pre-wrap">
                  {generatedNote}
                </div>

                {/* Feedback Widget integration */}
                <FeedbackWidget noteContext={`WhatsApp Flow (${preferredStyle})`} />
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
