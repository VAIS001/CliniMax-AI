/**
 * CliniMax API Integration Service
 * Connects the Frontend with the Gemini + Supabase FastAPI Backend
 */

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Consultation {
  id?: string;
  patient_name: string;
  raw_symptoms: string;
  triage_priority: 'IMMEDIATE' | 'ROUTINE' | 'PENDING' | 'URGENT';
  clinical_summary: string;
  chat_history: ChatMessage[];
  created_at?: string;
}

const normalizeBackendUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const getEnvBackendUrl = (): string => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
    ? String(import.meta.env.VITE_BACKEND_URL)
    : '';
  return envUrl ? normalizeBackendUrl(envUrl) : '';
};

const getStoredBackendUrl = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const storedUrl = localStorage.getItem('CLINIMAX_BACKEND_URL');
  return storedUrl ? normalizeBackendUrl(storedUrl) : '';
};

const DEFAULT_LOCAL_BACKEND_URL = 'http://127.0.0.1:8000';

export const getBackendBaseUrl = (): string => {
  return getEnvBackendUrl() || getStoredBackendUrl() || DEFAULT_LOCAL_BACKEND_URL;
};

export const setBackendBaseUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('CLINIMAX_BACKEND_URL', normalizeBackendUrl(url));
  }
};

/**
 * Diagnostic health check to see if the FastAPI service is active
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  const baseUrl = getBackendBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000), // Quick timeout for tactile feedback
    });
    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }
    return false;
  } catch (err) {
    console.warn("FastAPI backend is unreachable on", baseUrl, "- running in resilient Local Sandbox Mode.");
    return false;
  }
};

/**
 * Dynamic patient triage interview chat agent endpoint
 */
export const postIntakeChat = async (
  history: ChatMessage[],
  nextMessage: string
): Promise<{ reply: string; is_complete: boolean }> => {
  const baseUrl = getBackendBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/intake/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history,
        next_message: nextMessage
      }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`Fetch failed: ${response.statusText}`);
  } catch (err) {
    console.error("Integration Chat API failed, engaging fallback simulation...", err);
    return getFallbackChatResponse(history, nextMessage);
  }
};

/**
 * Saves and compiles consultation summary upon chat stream completion
 */
export const postConsultation = async (consultation: Consultation): Promise<Consultation> => {
  const baseUrl = getBackendBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/consultations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_name: consultation.patient_name,
        raw_symptoms: consultation.raw_symptoms,
        triage_priority: consultation.triage_priority === 'URGENT' ? 'URGENT' : consultation.triage_priority,
        clinical_summary: consultation.clinical_summary,
        chat_history: consultation.chat_history
      }),
    });

    if (response.ok || response.status === 201 || response.status === 210) {
      return await response.json();
    }
    throw new Error(`Consultation compilation failed: ${response.statusText}`);
  } catch (err) {
    console.error("Consultation API save failed, engaging fallback compiler...", err);
    return {
      ...consultation,
      id: `fallback-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
  }
};

/**
 * Pulls all logged consultations from database for Doctor Dashboard
 */
export const fetchConsultations = async (): Promise<Consultation[]> => {
  const baseUrl = getBackendBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/consultations`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`Fetch consultations failed: ${response.status}`);
  } catch (err) {
    console.error("Get consultations API failed, loading local workspace storage...", err);
    return getLocalFallbackConsultations();
  }
};


// ==========================================
// RESILIENT HANDOFF FALLBACK SIMULATIONS
// ==========================================

const getFallbackChatResponse = (
  history: ChatMessage[],
  nextMessage: string
): { reply: string; is_complete: boolean } => {
  const turns = history.length;
  
  if (turns <= 1) {
    return {
      reply: "Thank you for stating your core complaint. Let's explore your symptoms further. Are you experiencing any severe pain, nausea, fever, or visual changes?",
      is_complete: false,
    };
  } else if (turns === 2 || turns === 3) {
    return {
      reply: "Noted. Do you have any known drug allergies, or is there any relevant past medical history you'd like the practitioner to review?",
      is_complete: false,
    };
  } else if (turns === 4) {
    return {
      reply: "Are you taking any medications daily? Mention any over-the-counter tablets or supplements.",
      is_complete: false,
    };
  } else {
    return {
      reply: "Excellent. I have recorded all triage parameters. We are finalizing and compiling your clinical intake report now.",
      is_complete: true,
    };
  }
};

const getLocalFallbackConsultations = (): Consultation[] => {
  const defaultLogs: Consultation[] = [
    {
      id: "comp-991A",
      patient_name: "Eleanor Vance",
      raw_symptoms: "Persistent shortness of breath and cough.",
      triage_priority: "URGENT",
      clinical_summary: "Patient displays respiratory efforts, mild non-productive chest symptoms, and persistent bronchospasms over 3 days. Recommend active chest auscultations.",
      chat_history: [
        { role: 'user', text: "Persistent shortness of breath and cough" },
        { role: 'model', text: "Are you witnessing chest congestion?" },
        { role: 'user', text: "Just a mild scratchy throat as well." }
      ],
      created_at: "2026-06-09T17:15:00Z"
    },
    {
      id: "comp-892B",
      patient_name: "Marcus Chen",
      raw_symptoms: "Acute right abdominal tenderness, severe nausea.",
      triage_priority: "URGENT",
      clinical_summary: "High suspicion of appendicitis. Patient points to acute localized lower right quadrant abdominal pain starting 2h ago. Mild fever noted.",
      chat_history: [
        { role: 'user', text: "Sharp abdominal pain in my bottom right side." },
        { role: 'model', text: "Do you have any nausea or fever?" },
        { role: 'user', text: "Yes, threw up once." }
      ],
      created_at: "2026-06-09T16:04:00Z"
    }
  ];
  
  // Try retrieving newly registered items from sessionStorage
  try {
    const saved = sessionStorage.getItem('CLINIMAX_LOCAL_CONSULTATIONS');
    if (saved) {
      const parsed = JSON.parse(saved);
      return [...parsed, ...defaultLogs];
    }
  } catch (e) {
    console.error("Local storage error:", e);
  }
  return defaultLogs;
};

export const saveLocalConsultation = (consultation: Consultation) => {
  try {
    const current = sessionStorage.getItem('CLINIMAX_LOCAL_CONSULTATIONS');
    const records = current ? JSON.parse(current) : [];
    records.unshift({
      ...consultation,
      id: consultation.id || `local-${Date.now()}`,
      created_at: consultation.created_at || new Date().toISOString()
    });
    sessionStorage.setItem('CLINIMAX_LOCAL_CONSULTATIONS', JSON.stringify(records));
  } catch (e) {
    console.error(e);
  }
};
