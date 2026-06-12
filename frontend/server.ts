import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface Consultation {
  id?: string;
  patient_name: string;
  raw_symptoms: string;
  triage_priority: 'IMMEDIATE' | 'ROUTINE' | 'PENDING' | 'URGENT';
  clinical_summary: string;
  chat_history: ChatMessage[];
  created_at?: string;
}

// In-memory consultations datastore seeded with realistic records
const consultationsDb: Consultation[] = [
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. System Health Check
  app.get("/health", (req, res) => {
    res.json({ status: "healthy" });
  });

  // 4. Fetch Doctor Dashboard Data
  app.get("/api/consultations", (req, res) => {
    res.json(consultationsDb);
  });

  // 2. Interactive Patient Intake Chat Agent
  app.post("/api/intake/chat", async (req, res) => {
    try {
      const { history, next_message } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        // Safe interactive Sandbox fallback
        const turns = Array.isArray(history) ? history.length : 0;
        let reply = "";
        let is_complete = false;

        if (turns <= 1) {
          reply = "Thank you for stating your core complaint. Let's explore your symptoms further. Are you experiencing any severe pain, nausea, fever, or visual changes?";
        } else if (turns === 2 || turns === 3) {
          reply = "Noted. Do you have any known drug allergies, or is there any relevant past medical history you'd like the practitioner to review?";
        } else if (turns === 4) {
          reply = "Are you taking any medications daily? Mention any over-the-counter tablets or supplements.";
        } else {
          reply = "Excellent. I have recorded all triage parameters. We are finalizing and compiling your clinical intake report now.";
          is_complete = true;
        }

        return res.json({ reply, is_complete });
      }

      // Live server-side Gemini client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are CliniMax AI Triager, a state-of-the-art empathetic clinical assessor.
Your objective is to conduct a multi-turn chat interview with the patient to gather key details about their current chief complaints, additional symptoms, duration, home medications, and drug allergies.
Observe these strict guidelines:
- Be warm but highly professional. Ask exactly *one* relevant clinical follow-up question at a time.
- Read the entire conversation history and the patient's latest message.
- If the patient has clearly described their symptoms, duration, medical history, medications, and allergies, or when you have reached at least 4 turns and have sufficient parameters, conclude the assessment by saying "Thank you, I have compiled your intake details." and set "is_complete" to true.
- Output a valid JSON object matching this schema:
{
  "reply": "string detailing your supportive response and exactly one follow-up question or concluding sentence",
  "is_complete": boolean indicating if the intake interview has compiled enough context to finish
}`;

      let conversationStr = "Conversation:\n";
      if (Array.isArray(history)) {
        history.forEach((m: any) => {
          conversationStr += `${m.role === 'user' ? 'Patient' : 'AI'}: ${m.text}\n`;
        });
      }
      conversationStr += `Patient's newest message: "${next_message || ""}"\n`;

      const geminiRes = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `${conversationStr}\nGenerate the next chat turn as the specified JSON output schema.`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const responseText = geminiRes.text;
      const parsed = JSON.parse(responseText.trim());
      res.json({
        reply: parsed.reply || "Could you provide some more context regarding your symptoms?",
        is_complete: !!parsed.is_complete,
      });

    } catch (err: any) {
      console.error("Gemini Intake Chat error:", err);
      res.status(500).json({ error: "Failed to generate intake question." });
    }
  });

  // 3. Save & Compile Consultation
  app.post("/api/consultations", async (req, res) => {
    try {
      const { patient_name, raw_symptoms, triage_priority, clinical_summary, chat_history } = req.body;
      
      let finalPriority: "IMMEDIATE" | "ROUTINE" | "PENDING" | "URGENT" = triage_priority || 'ROUTINE';
      let finalSummary = clinical_summary || 'No summary compiled.';

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
        try {
          const ai = new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const summaryInstruction = `You are a clinical compiler. Analyze the provided patient intake chat history and raw symptoms, and generate:
1. A concise, authoritative physical clinical summary suitable for an EHR (Electronic Health Record) dashboard reviewed by a busy ER doctor. Use medical terminology.
2. An appropriate triage level from this precise list: "IMMEDIATE", "URGENT", "ROUTINE", "PENDING".
Output your response as a JSON object matching this schema:
{
  "triage_priority": "IMMEDIATE" | "URGENT" | "ROUTINE" | "PENDING",
  "clinical_summary": "detailed medical summary text"
}`;

          const promptText = `Patient Name: ${patient_name}
Raw Symptoms: ${raw_symptoms}
Chat History:
${Array.isArray(chat_history) ? chat_history.map((m: any) => `${m.role === 'user' ? 'Patient' : 'AI'}: ${m.text}`).join('\n') : "None"}`;

          const geminiRes = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: promptText,
            config: {
              systemInstruction: summaryInstruction,
              responseMimeType: "application/json",
              temperature: 0.2,
            }
          });

          const parsed = JSON.parse(geminiRes.text.trim());
          if (parsed.triage_priority) finalPriority = parsed.triage_priority;
          if (parsed.clinical_summary) finalSummary = parsed.clinical_summary;
        } catch (sumErr) {
          console.error("Failed to compile with Gemini, using defaults:", sumErr);
        }
      }

      const newRecord: Consultation = {
        id: `rec-${Math.random().toString(36).substr(2, 9)}`,
        patient_name: patient_name || 'Anonymous Guest',
        raw_symptoms: raw_symptoms || 'None recorded.',
        triage_priority: finalPriority,
        clinical_summary: finalSummary,
        chat_history: chat_history || [],
        created_at: new Date().toISOString()
      };

      consultationsDb.unshift(newRecord);
      res.status(210).json(newRecord);

    } catch (err: any) {
      console.error("Save consultation error:", err);
      res.status(500).json({ error: "Failed to record consultation." });
    }
  });



  // Serve static assets or mount Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer();
