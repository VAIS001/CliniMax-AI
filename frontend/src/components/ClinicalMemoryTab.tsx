import React, { useState, useEffect } from 'react';
import { Trash2, Edit3, Plus, Save, RotateCcw, Award, CheckCircle } from 'lucide-react';

export interface NoteTemplate {
  id: string;
  category: string;
  description: string;
  content: string;
  style: 'SOAP' | 'Narrative' | 'Problem-Oriented';
}

interface ClinicalMemoryTabProps {
  onStyleChanged?: (style: 'SOAP' | 'Narrative' | 'Problem-Oriented') => void;
}

const DEFAULT_TEMPLATES: NoteTemplate[] = [
  {
    id: 'temp-1',
    category: 'Emergency Cardiology Check',
    description: 'Standard documentation for chest pain triage, cardiovascular checks, and rule-outs.',
    style: 'SOAP',
    content: `[SUBJECTIVE]
Patient reports sudden onset retrosternal chest tightness radiating to the left shoulder, triggered by exertion, lasting 45 minutes. Associated with mild dyspnea and diaphoresis. Denies nausea, palpitations, or syncope.

[OBJECTIVE]
BP: 135/85 mmHg, HR: 92 bpm, RR: 18/min, Temp: 98.4 F, SpO2: 96% on room air.
Chest: Clear to auscultation bilaterally. Heart: Regular rate and rhythm, normal S1/S2, no murmurs.
ECG: Normal sinus rhythm with no ST-elevation or acute ischemia noted.

[ASSESSMENT]
1. Retrosternal chest tightness - suspect cardiac ischemia vs skeletal muscle soreness.
2. Mild dyspnea secondary to pain response.

[PLAN]
1. Order immediate serial Troponin assays (t=0h, t=3h).
2. Administer Aspirin 324mg chewable stat.
3. Keep patient on continuous telemetry monitoring.
4. Consult attending cardiologist if Troponins return positive or symptoms intensify.`
  },
  {
    id: 'temp-2',
    category: 'Acute Orthopedic Follow-Up',
    description: 'Post-operative evaluation of joint reconstructions and skeletal alignment progress.',
    style: 'Narrative',
    content: `The patient returned for their 2-week post-operative follow-up following an arthroscopic right ACL reconstruction. They report compliant usage of the knee brace and regular physical therapy sessions. Currently, subjective pain scores are noted as 3/10, managed adequately with PRN Ibuprofen. On physical exam, the surgical incisions are clean, dry, and intact with no erythema, fluctuance, or drainage. Active range of motion is achieved at 0 to 90 degrees with stable patella alignment. Distal pulses are intact, and neurovascular parameters are normal. The recovery is progressing exactly as planned. Instructions given to continue daily rehabilitation exercises, keep the joint elevated, and return for suture removal in 7 days.`
  },
  {
    id: 'temp-3',
    category: 'Pediatric Hyperpyrexia',
    description: 'Triage and assessment protocols for infant and pediatric fever presentations.',
    style: 'Problem-Oriented',
    content: `ACTIVE PROBLEM 1: Acute Febrile Episode
- Subjective: Caregiver reports child has been listless with a tactile fever peaking at 101.5 F over 24 hours. Accompanied by decreased fluid intake and mild dry cough.
- Objective: Temp: 101.2 F, HR: 110 bpm (regular), RR: 24/min. Ear canals clear with no tympanic membrane erythema. Throat shows mild pharyngeal injection without tonsillar exudate.
- Action: Administer pediatric Acetaminophen (15mg/kg) every 6 hours PRN. Educate caregiver on aggressive oral hydration and return triggers.`
  }
];

export const ClinicalMemoryTab: React.FC<ClinicalMemoryTabProps> = ({ onStyleChanged }) => {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [preferredStyle, setPreferredStyle] = useState<'SOAP' | 'Narrative' | 'Problem-Oriented'>('SOAP');
  
  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState<'SOAP' | 'Narrative' | 'Problem-Oriented'>('SOAP');
  const [content, setContent] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const storedTemplates = localStorage.getItem('clinimax_templates');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      localStorage.setItem('clinimax_templates', JSON.stringify(DEFAULT_TEMPLATES));
    }

    const storedStyle = localStorage.getItem('clinimax_preferred_style');
    if (storedStyle) {
      setPreferredStyle(storedStyle as any);
      if (onStyleChanged) onStyleChanged(storedStyle as any);
    } else {
      localStorage.setItem('clinimax_preferred_style', 'SOAP');
    }
  }, []);

  const saveToStorage = (updatedTemplates: NoteTemplate[]) => {
    setTemplates(updatedTemplates);
    localStorage.setItem('clinimax_templates', JSON.stringify(updatedTemplates));
  };

  const handleStyleChange = (newStyle: 'SOAP' | 'Narrative' | 'Problem-Oriented') => {
    setPreferredStyle(newStyle);
    localStorage.setItem('clinimax_preferred_style', newStyle);
    if (onStyleChanged) onStyleChanged(newStyle);
    triggerSuccess(`Globally preferred note style updated to ${newStyle}`);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !content.trim()) return;

    if (editingId) {
      const updated = templates.map(t => 
        t.id === editingId ? { ...t, category, description, style, content } : t
      );
      saveToStorage(updated);
      triggerSuccess('Template updated successfully!');
      setEditingId(null);
    } else {
      const newTemplate: NoteTemplate = {
        id: `temp-${Date.now()}`,
        category,
        description,
        style,
        content
      };
      saveToStorage([newTemplate, ...templates]);
      triggerSuccess('New template added to clinical memory!');
    }

    // Reset Form
    setCategory('');
    setDescription('');
    setStyle('SOAP');
    setContent('');
  };

  const handleEdit = (t: NoteTemplate) => {
    setEditingId(t.id);
    setCategory(t.category);
    setDescription(t.description);
    setStyle(t.style);
    setContent(t.content);
    
    // Smooth scroll to form
    const formElem = document.getElementById('template-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this clinical template from memory?')) {
      const updated = templates.filter(t => t.id !== id);
      saveToStorage(updated);
      triggerSuccess('Template removed from memory.');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset to standard clinic seed templates? Any custom templates will be overwritten.')) {
      saveToStorage(DEFAULT_TEMPLATES);
      triggerSuccess('Clinical memory restored to factory guidelines.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100">
      
      {/* Consultation & General Settings Panel */}
      <div className="glass rounded-xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FF7A00] to-transparent pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF7A00]">clinical_notes</span>
              Consultation Synthesis Settings
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Configure the globally preferred document structuring style. All notes generated from patient dialogues, transcribed audio, or WhatsApp queues will dynamically align to this archetype.
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0 bg-[#060812] border border-slate-800 p-1.5 rounded-xl flex gap-1">
            {(['SOAP', 'Narrative', 'Problem-Oriented'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleStyleChange(mode)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  preferredStyle === mode
                    ? 'bg-[#FF7A00] text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                {mode === 'Problem-Oriented' ? 'Problem-Oriented' : mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Split Grid for Templates and Adding */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Upload/Edit Form */}
        <div id="template-form" className="lg:col-span-5 bg-[#0e1324]/80 border border-slate-800 p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-[#FF7A00]" />
              {editingId ? 'Edit Clinical Memory Template' : 'Upload Sample Clinical Note'}
            </h3>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setCategory('');
                  setDescription('');
                  setStyle('SOAP');
                  setContent('');
                }}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10.5px] uppercase font-mono font-extrabold text-slate-400 mb-1">
                Category / Specialism
              </label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Cardiorespiratory Chest Pain, Orthopedics ACL"
                className="w-full bg-[#060812] border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-[#FF7A00]"
                required
              />
            </div>

            <div>
              <label className="block text-[10.5px] uppercase font-mono font-extrabold text-slate-400 mb-1">
                Description / Clinical Scenario
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief summary of clinical parameters of this note"
                className="w-full bg-[#060812] border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-[#FF7A00]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] uppercase font-mono font-extrabold text-slate-400 mb-1">
                  Note Structural Style
                </label>
                <select
                  value={style}
                  onChange={e => setStyle(e.target.value as any)}
                  className="w-full bg-[#060812] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 outline-none focus:border-[#FF7A00]"
                >
                  <option value="SOAP">SOAP format</option>
                  <option value="Narrative">Narrative format</option>
                  <option value="Problem-Oriented">Problem-Oriented</option>
                </select>
              </div>
              <div className="flex items-end">
                <span className="text-[10px] text-slate-400 italic leading-tight mb-1 bg-slate-900/50 p-2 border border-slate-850 rounded">
                  Saves note to local clinical AI context.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] uppercase font-mono font-extrabold text-slate-400 mb-1">
                Sample Note Content (AI Memory Reference)
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Paste or type a high-quality clinical practitioner note here as a guideline..."
                className="w-full bg-[#060812] border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 h-64 font-mono leading-relaxed outline-none focus:border-[#FF7A00]"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF7A00] hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Update Clinical Template' : 'Commit Template to Memory'}
            </button>
          </form>
        </div>

        {/* Right Hand: Saved Templates List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-[#FF7A00]" />
              My Clinical Templates & Reference Notes ({templates.length})
            </h3>
            <button
              onClick={handleResetDefaults}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Defaults
            </button>
          </div>

          <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
            {templates.length > 0 ? (
              templates.map((t) => (
                <div key={t.id} className="bg-[#0b0e1a]/80 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {t.category}
                        <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[9px] text-[#00e0b4]">
                          {t.style}
                        </span>
                      </h4>
                      {t.description && (
                        <p className="text-xs text-slate-300 mt-1">{t.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEdit(t)}
                        title="Edit Template"
                        className="p-1.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Delete Template"
                        className="p-1.5 bg-slate-900 border border-slate-800 text-red-400 hover:text-red-300 rounded hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Note Body Container */}
                  <div className="bg-[#05070f] border border-slate-900 rounded-lg p-3.5 max-h-40 overflow-y-auto">
                    <pre className="text-[11px] text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                      {t.content}
                    </pre>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center bg-[#070a14] border border-dashed border-slate-800 rounded-xl p-8 text-slate-300 italic text-sm">
                Clinical reference memory is empty. Use the left panel to upload sample notes.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Embedded success notification */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00e0b4] text-slate-950 py-3 px-5 rounded-lg shadow-xl font-bold flex items-center gap-2 animate-fade-in text-xs">
          <CheckCircle className="w-4 h-4 text-slate-950" />
          {successMsg}
        </div>
      )}

    </div>
  );
};
