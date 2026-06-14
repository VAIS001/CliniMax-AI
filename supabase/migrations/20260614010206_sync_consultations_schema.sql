-- Sync consultations schema with the backend's current data model.
-- This keeps prior columns for backward compatibility while adding the
-- fields used by the FastAPI consultation write path.

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS patient_name TEXT,
  ADD COLUMN IF NOT EXISTS raw_symptoms TEXT,
  ADD COLUMN IF NOT EXISTS triage_priority TEXT,
  ADD COLUMN IF NOT EXISTS clinical_summary TEXT,
  ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::jsonb;

UPDATE public.consultations
SET patient_name = COALESCE(patient_name, chief_complaint, 'Anonymous Guest')
WHERE patient_name IS NULL;

UPDATE public.consultations
SET raw_symptoms = COALESCE(raw_symptoms, symptoms, '')
WHERE raw_symptoms IS NULL;

UPDATE public.consultations
SET triage_priority = COALESCE(triage_priority, triage_level, 'ROUTINE')
WHERE triage_priority IS NULL;

UPDATE public.consultations
SET clinical_summary = COALESCE(clinical_summary, ai_summary, 'No summary compiled.')
WHERE clinical_summary IS NULL;

UPDATE public.consultations
SET chat_history = COALESCE(chat_history, '[]'::jsonb)
WHERE chat_history IS NULL;

CREATE INDEX IF NOT EXISTS idx_consultations_triage_priority
  ON public.consultations (triage_priority);

CREATE INDEX IF NOT EXISTS idx_consultations_created_at
  ON public.consultations (created_at DESC);