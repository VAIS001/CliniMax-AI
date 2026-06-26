import React, { useState, useRef } from 'react';
import { Upload, AudioLines, FileText, CheckCircle, RefreshCw, AlertTriangle, Disc } from 'lucide-react';
import { FeedbackWidget } from './FeedbackWidget';

interface AudioUploadTabProps {
  preferredStyle: 'SOAP' | 'Narrative' | 'Problem-Oriented';
}

interface AudioSample {
  name: string;
  duration: string;
  category: string;
  transcript: string;
  note: {
    SOAP: string;
    Narrative: string;
    'Problem-Oriented': string;
  };
}

const AUDIO_SAMPLES: AudioSample[] = [
  {
    name: "Doctor-Patient Cardiology Encounter.mp3",
    duration: "1m 45s",
    category: "Cardiology",
    transcript: "Doctor: Welcome back Eleanor. How have your symptoms been? Patient: Well, Doctor, my chest tightness has recurred a few times this week, mostly when I walk up the stairs. It is a squeezing sensation, goes away after 5 minutes of rest. Doctor: Okay, any shortness of breath? Patient: Just a little when the tightness occurs. No coughing. No ankle swelling. Doctor: Excellent, your blood pressure is 134/82, heart rate is regular. I will double check your serial troponins and order a stress echo.",
    note: {
      SOAP: `[SUBJECTIVE]
Eleanor reports episodic retrosternal chest tightness (described as "squeezing") occurring on exertion (e.g., walking up stairs) x3 this week. Duration is approximately 5 minutes, completely relieved by rest. Accompanied by mild exertional dyspnea. Denies orthopnea, productive cough, palpitations, or lower extremity edema.

[OBJECTIVE]
BP: 134/82 mmHg, HR: 74 bpm (regular). 
Patient appears in no acute distress. Chest is clear to auscultation. Heart reveals regular rate and rhythm without murmurs, rubs, or gallops. 

[ASSESSMENT]
1. Stable Angina Pectoris - suspect epicardial coronary artery narrowing.
2. Mild exertional dyspnea.

[PLAN]
1. Order an outpatient Stress Echocardiogram.
2. Review baseline cardiac troponin panels.
3. Prescribe Nitroglycerin 0.4mg sublingual PRN for acute chest pain episodes; instruct on proper administration and emergency precautions.`,
      Narrative: `The patient is Eleanor, presenting for cardiovascular review following recurrent chest tightness on exertion. She reports three distinct episodes of retrosternal squeezing chest pain over the past week, predominantly while climbing stairs. Each episode resolved within five minutes of resting. She reports mild accompanying dyspnea during the pain, but denies swelling, coughing, or palpitations. Vitals reveal stable blood pressure at 134/82 mmHg and regular heart rhythm. Clear breath sounds bilaterally. Stable exertional angina is suspected. Plan includes scheduling a stress echocardiogram, checking troponins, and prescribing sublingual Nitroglycerin PRN.`,
      'Problem-Oriented': `ACTIVE PROBLEM 1: Stable Angina Pectoris
- Subjective: Squeezing retrosternal tightness triggered by exertion, relieved within 5 minutes of rest.
- Objective: BP 134/82, regular heart rate. Lungs clear, no murmurs.
- Action: Order outpatient stress echocardiography to evaluate ischemic thresholds. Prescribe sublingual Nitroglycerin PRN for acute pain relief.

ACTIVE PROBLEM 2: Exertional Dyspnea
- Subjective: Mild shortness of breath accompanying chest tightness.
- Objective: Clear lungs, SpO2 96% on room air.
- Action: Assess during upcoming stress echo.`
    }
  },
  {
    name: "Emergency Asthma Triage Recording.wav",
    duration: "2m 10s",
    category: "Pulmonology",
    transcript: "Doctor: Hello, checking your breathing. I hear some bilateral wheezing. Patient: Yes... hard to... talk. Started... last night... cold air. Doctor: Are you using your Albuterol rescue inhaler? Patient: Used it... three times... not helping much. Doctor: Okay, let's measure your peak flow. BP is 120/75, HR is 112, respiratory rate is 26, SpO2 is 92%. Lungs show generalized expiratory wheezes.",
    note: {
      SOAP: `[SUBJECTIVE]
Patient presents in acute respiratory distress, reporting severe asthma exacerbation triggered by cold air exposure last night. Reports progressive shortness of breath, tachypnea, and difficulty speaking in full sentences. Has used Albuterol rescue inhaler 3 times over the past 4 hours with minimal relief.

[OBJECTIVE]
Vitals: BP 120/75 mmHg, HR 112 bpm (tachycardia), RR 26/min (tachypnea), SpO2 92% on room air (borderline hypoxemia).
Physical exam: Patient is sitting upright, using accessory muscles for respiration. Auscultation reveals diffuse bilateral expiratory wheezing and prolonged expiratory phase.

[ASSESSMENT]
1. Acute Asthma Exacerbation - moderate to severe, refractory to home rescue inhalers.
2. Sinus Tachycardia secondary to respiratory distress and albuterol use.

[PLAN]
1. Administer continuous Albuterol-Ipratropium (Duoneb) nebulizer treatments immediately.
2. Initiate oral Prednisolone 50mg stat.
3. Keep on continuous pulse oximetry; administer supplemental oxygen via nasal cannula to maintain SpO2 > 94%.
4. Re-evaluate respiratory status and peak flows every 20 minutes.`,
      Narrative: `The patient presents with an acute moderate-to-severe asthma exacerbation initiated by cold air exposure. They are in visible distress, speak in broken words, and report minimal improvement after using Albuterol three times. Examination shows tachycardia (112 bpm), tachypnea (26/min), and mild hypoxemia (SpO2 92%). Auscultation reveals generalized expiratory wheezing. Immediate intervention consists of nebulized bronchodilator therapies, systemic corticosteroids (Prednisolone 50mg), and low-flow supplemental oxygen. Patient will be monitored continuously.`,
      'Problem-Oriented': `ACTIVE PROBLEM 1: Acute Moderate Asthma Exacerbation
- Subjective: Severe shortness of breath, speaks in broken sentences, refractory to home rescue inhaler.
- Objective: RR 26, HR 112, SpO2 92%. Diffuse bilateral wheezes on exam.
- Action: Administer Duoneb nebulizer treatments and systemic Prednisolone. Titrate supplemental oxygen to target SpO2 above 94%.

ACTIVE PROBLEM 2: Borderline Hypoxemia
- Subjective: Shortness of breath on exertion/at rest.
- Objective: SpO2 92%.
- Action: Monitor oxygen saturation. Keep on supplemental O2.`
    }
  }
];

export const AudioUploadTab: React.FC<AudioUploadTabProps> = ({ preferredStyle }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Results states
  const [audioName, setAudioName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [generatedNote, setGeneratedNote] = useState('');
  const [showResults, setShowResults] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    // Basic verification of audio file types
    if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a')) {
      setSelectedFile(file);
    } else {
      alert('Please upload a valid audio file (.mp3, .wav, .m4a)');
    }
  };

  const handleUploadAndGenerate = async () => {
    if (!selectedFile) return;
    triggerProcessing(selectedFile.name, "Simulated transcription of uploaded clinical audio recording. Details include respiratory wheezing on assessment and tachycardia on exam.");
  };

  const handleTriggerSample = (sample: AudioSample) => {
    triggerProcessing(sample.name, sample.transcript, sample);
  };

  const triggerProcessing = async (filename: string, textTranscript: string, sampleObj?: AudioSample) => {
    setIsProcessing(true);
    setProgress(10);
    setShowResults(false);

    // Simulated progress bar updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 300);

    await new Promise((resolve) => setTimeout(resolve, 2500));
    clearInterval(interval);

    setAudioName(filename);
    setTranscript(textTranscript);
    
    if (sampleObj) {
      setGeneratedNote(sampleObj.note[preferredStyle]);
    } else {
      // Dynamic fallback based on general upload
      const fallbackNote = {
        SOAP: `[SUBJECTIVE]
Patient reports clinical symptoms recorded via mobile audio interface. Details suggest acute respiratory congestion.

[OBJECTIVE]
Simulated findings: BP 120/80 mmHg, HR 80 bpm, Lungs reveal mild respiratory effort.

[ASSESSMENT]
1. Respiratory presentation - diagnostic check pending.

[PLAN]
1. Order baseline chest x-ray.
2. Review symptomatology.`,
        Narrative: `The patient checked in via audio upload interface. Transcription reveals symptoms matching acute cough and congestion. Vitals stable. Physical exam suggests mild respiratory exertion. Advise clinical review and follow-up.`,
        'Problem-Oriented': `ACTIVE PROBLEM 1: Respiratory Congestion
- Subjective: Exertional coughing and chest tightness.
- Objective: Mild wheezing.
- Action: Consult attending physician.`
      };
      setGeneratedNote(fallbackNote[preferredStyle]);
    }

    setIsProcessing(false);
    setProgress(0);
    setShowResults(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      
      {/* Header Panel */}
      <div className="bg-[#0e1324]/80 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <AudioLines className="w-5 h-5 text-[#FF7A00]" />
          Clinical Audio Transcription Workspace
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Upload recorded clinical encounters, patient interviews, or diagnostic recordings. The CliniMax audio engine will transcribe the dialogue and compile a structured, compliant practitioner note in your globally preferred style (<span className="text-[#FF7A00] font-mono font-black">{preferredStyle}</span>).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: File Upload Area & Preset Samples */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Preset Audio Samples for live testing */}
          <div className="bg-[#060812] border border-slate-800 p-4 rounded-xl space-y-2">
            <p className="text-[10px] font-extrabold uppercase text-[#FF7A00] tracking-wide flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-[#FF7A00] animate-spin-slow" />
              Standard Medical Audio Samples (Instant Run)
            </p>
            <div className="flex flex-col gap-2">
              {AUDIO_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTriggerSample(sample)}
                  className="text-left p-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-[#131a31] transition-all flex justify-between items-center group cursor-pointer"
                >
                  <div>
                    <div className="font-extrabold text-xs text-white group-hover:text-[#FF7A00] transition-colors">{sample.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{sample.category} • Duration: {sample.duration}</div>
                  </div>
                  <Upload className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all h-60 flex flex-col justify-center items-center gap-3 relative overflow-hidden ${
              isDragging
                ? 'border-[#00e0b4] bg-[#00e0b4]/5'
                : 'border-slate-800 bg-[#060812]/50 hover:border-slate-700 hover:bg-[#0c0f1e]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*"
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-3 animate-fade-in relative z-10">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 mx-auto">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white max-w-[240px] truncate mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 relative z-10">
                <div className="w-12 h-12 bg-[#FF7A00]/10 rounded-full flex items-center justify-center border border-[#FF7A00]/30 mx-auto">
                  <Upload className="w-6 h-6 text-[#FF7A00]" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">Drag & Drop clinical recording here</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Accepts MP3, WAV, M4A up to 25MB • Click to browse files
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload and compile button */}
          <button
            onClick={handleUploadAndGenerate}
            disabled={!selectedFile || isProcessing}
            className="w-full py-3 bg-[#FF7A00] hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing Audio...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Transcribe & Compile Clinical Note
              </>
            )}
          </button>

          {/* Audio processing waveform animation */}
          {isProcessing && (
            <div className="bg-[#0b0e1a] border border-slate-800 rounded-xl p-4 text-center space-y-3 animate-fade-in">
              <p className="text-[10px] font-bold text-[#FF7A00] font-mono animate-pulse">
                ASTRO-TRANSCRIPTION ENGINE COMPILING ... {progress}%
              </p>
              
              {/* Symmetrical Waveform animation */}
              <div className="flex justify-center items-center gap-1 h-8">
                {[...Array(15)].map((_, i) => (
                  <span
                    key={i}
                    className="w-1 bg-[#FF7A00] rounded-full animate-pulse"
                    style={{
                      height: `${Math.floor(Math.random() * 24) + 6}px`,
                      animationDelay: `${i * 80}ms`,
                      animationDuration: '600ms'
                    }}
                  ></span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right column: Transcription Transcript & Generated Clinical Note */}
        <div className="lg:col-span-7">
          
          {!showResults && !isProcessing && (
            <div className="bg-[#0b0e1a]/80 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[460px] text-slate-300">
              <AudioLines className="w-12 h-12 text-[#FF7A00] mb-4" />
              <h3 className="text-base font-bold text-white mb-2">Attending Clinician Space: Audio Transcript</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Choose an audio recording from your local disk or execute one of our instant **Standard Medical Audio Samples** on the left. The transcription engine will convert the doctor-patient dialogue into plain text and compile a clinical note formatted to your globally preferred style (<span className="text-[#FF7A00] font-mono font-black">{preferredStyle}</span>).
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="bg-[#0b0e1a]/80 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[460px] text-slate-300">
              <span className="w-10 h-10 border-3 border-[#FF7A00] border-t-transparent rounded-full animate-spin mb-4"></span>
              <p className="italic text-xs font-bold font-mono text-[#FF7A00]">Ingesting audio & matching structures with Clinical Memory Templates...</p>
            </div>
          )}

          {showResults && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Audio properties */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#00e0b4] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#00e0b4] uppercase tracking-wider">
                    Encounter Transcribed Successfully
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Audio recording **{audioName}** successfully processed. Note structured with templates in clinical memory.
                  </p>
                </div>
              </div>

              {/* Text transcript */}
              <div className="bg-[#0b0e1a] border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-extrabold text-blue-200 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <AudioLines className="w-4 h-4 text-[#FF7A00]" />
                  Transcribed Encounter Dialogue (Dialogue text)
                </h3>
                <div className="bg-[#05070f] border border-slate-900 p-4 rounded-lg text-xs leading-relaxed text-slate-300 font-semibold italic">
                  "{transcript}"
                </div>
              </div>

              {/* Compiled Note */}
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
                <FeedbackWidget noteContext={`Audio Upload (${preferredStyle})`} />
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
