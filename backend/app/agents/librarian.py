"""Librarian agent — RAG-based clinical template retrieval.

Workflow:
  1. Embed the patient's chief complaint + demographics using Gemini embeddings.
  2. Run a cosine similarity search against the clinical_templates table in Supabase.
  3. Retrieve the top-k matching templates.
  4. If k > 1, merge them into a single unified template for downstream agents.
  5. Return the merged template text + metadata.
"""

import time
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types
from supabase import Client as SupabaseClient

from app.agents.base_agent import BaseAgent
from app.schemas.librarian import (
    TemplateUpdateRequest,
    LibrarianInput,
    LibrarianOutput,
    MatchedTemplate,
)

# Gemini embedding model — 768-dimensional output, best for semantic similarity
EMBEDDING_MODEL = "models/text-embedding-004"


class Librarian(BaseAgent):
    """Agent responsible for RAG-based clinical template retrieval.

    Embeds the patient's chief complaint and demographics, searches Supabase
    pgvector for the closest matching clinical templates, merges the top-k
    results, and returns a unified template for CliniClerker / CliniScribe.

    Attributes:
        gemini_client: google.genai.Client for embedding generation.
        supabase:      Supabase client for vector similarity search.
        agent_name:    Name identifier for logging and debugging.
    """

    def __init__(
        self,
        gemini_client: genai.Client,
        supabase_client: SupabaseClient,
        agent_name: str = "Librarian",
    ) -> None:
        super().__init__(gemini_client, agent_name)
        self.gemini_client = gemini_client
        self.supabase = supabase_client

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve and merge the most relevant clinical templates.

        Args:
            data: Dictionary containing:
                - "chief_complaint" (str):      Patient's presenting complaint.
                - "age"             (int, optional):  Patient age.
                - "sex"             (str, optional):  Patient sex.
                - "specialty"       (str, optional):  Filter by medical specialty.
                - "top_k"           (int, optional):  Number of templates to retrieve
                                                      and merge (default: 1, min: 1).

        Returns:
            Dictionary containing:
                - "merged_template"   (str):  Single unified template for downstream agents.
                - "matched_templates" (list): Metadata for each matched template.
                - "retrieval_metadata" (dict): Timing and search statistics.
        """
        payload = LibrarianInput.model_validate(data)
        start = time.perf_counter()

        # 1 — Build the search query from complaint + demographics
        query_text = self._build_query(payload)

        # 2 — Embed the query
        query_embedding = self._embed(query_text)

        # 3 — Similarity search in Supabase
        matches = self.search_templates(
            query_embedding=query_embedding,
            top_k=payload.top_k,
            specialty=payload.specialty,
        )

        # 4 — Merge top-k templates into one
        merged = self._merge_templates(matches)

        elapsed_ms = (time.perf_counter() - start) * 1000

        output = LibrarianOutput(
            merged_template=merged,
            matched_templates=matches,
            retrieval_metadata={
                "query":           query_text,
                "retrieved_count": len(matches),
                "top_k_requested": payload.top_k,
                "search_time_ms":  round(elapsed_ms, 2),
            },
        )

        return output.model_dump()

    # ------------------------------------------------------------------
    # Template search
    # ------------------------------------------------------------------

    def search_templates(
        self,
        query_embedding: List[float],
        top_k: int = 1,
        specialty: Optional[str] = None,
    ) -> List[MatchedTemplate]:
        """Run cosine similarity search against Supabase pgvector.

        Args:
            query_embedding: 768-dimensional embedding of the search query.
            top_k:           Number of templates to retrieve.
            specialty:       Optional specialty filter.

        Returns:
            List of MatchedTemplate objects ordered by similarity (highest first).
        """
        response = self.supabase.rpc(
            "match_templates",
            {
                "query_embedding":  query_embedding,
                "match_count":      top_k,
                "specialty_filter": specialty,
            },
        ).execute()

        if not response.data:
            return []

        return [
            MatchedTemplate(
                id=row["id"],
                title=row["title"],
                specialty=row.get("specialty"),
                tags=row.get("tags", []),
                content=row["content"],
                similarity=row["similarity"],
            )
            for row in response.data
        ]

    # ------------------------------------------------------------------
    # Template upload (called by admin route)
    # ------------------------------------------------------------------

    def upload_template(
        self,
        title: str,
        content: str,
        specialty: Optional[str] = None,
        tags: Optional[List[str]] = None,
        uploaded_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Embed and store a new clinical template in Supabase.

        Args:
            title:       Descriptive name for the template.
            content:     Full text of the completed sample clerking note.
            specialty:   Medical specialty (e.g. "Cardiology").
            tags:        Keywords for filtering (e.g. ["chest pain", "cardiac"]).
            uploaded_by: UUID of the physician uploading the template.

        Returns:
            The inserted row data from Supabase.
        """
        embedding = self._embed(content)

        response = self.supabase.table("clinical_templates").insert({
            "title":       title,
            "content":     content,
            "specialty":   specialty,
            "tags":        tags or [],
            "embedding":   embedding,
            "uploaded_by": uploaded_by,
        }).execute()

        return response.data[0] if response.data else {}

    def get_template_by_id(self, template_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific template by its UUID."""
        response = (
            self.supabase.table("clinical_templates")
            .select("id, title, specialty, tags, content, created_at")
            .eq("id", template_id)
            .single()
            .execute()
        )
        return response.data

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_query(self, payload: "LibrarianInput") -> str:
        """Construct a rich search query from complaint + demographics."""
        parts = [f"Chief complaint: {payload.chief_complaint}"]
        if payload.age:
            parts.append(f"Age: {payload.age}")
        if payload.sex:
            parts.append(f"Sex: {payload.sex}")
        return ". ".join(parts)

    def _embed(self, text: str) -> List[float]:
        """Generate a 768-dimensional embedding using Gemini text-embedding-004."""
        response = self.gemini_client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
        )
        return response.embeddings[0].values

    def _merge_templates(self, matches: List[MatchedTemplate]) -> str:
        """Merge multiple template texts into one unified template.

        If only one template matched, return it as-is.
        If multiple, concatenate with clear section separators so downstream
        agents (CliniClerker, CliniScribe) can read all sections.
        """
        if not matches:
            return ""

        if len(matches) == 1:
            return matches[0].content

        sections = []
        for i, match in enumerate(matches, start=1):
            sections.append(
                f"--- Template {i}: {match.title} "
                f"(similarity: {match.similarity:.2f}) ---\n\n"
                f"{match.content}"
            )

        return "\n\n".join(sections)


    # ------------------------------------------------------------------
    # Image extraction (called by /templates/from-image route)
    # ------------------------------------------------------------------

    def extract_text_from_image(
        self,
        image_path: Path,
        mime_type: str,
    ) -> str:
        """Extract clinical template text from an image using Gemini.

        Reads a photo or scan of a completed clerking note and returns
        the full text content, preserving section structure.

        Args:
            image_path: Local path to the saved image file.
            mime_type:  MIME type of the image (e.g. "image/jpeg").

        Returns:
            Extracted text of the clerking note.

        Raises:
            ValueError: If Gemini returns an empty or unreadable response.
        """
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        response = self.gemini_client.models.generate_content(
            model="models/gemini-2.5-flash-lite",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                (
                    "This image contains a completed clinical clerking note or medical template. "
                    "Extract the full text exactly as written, preserving all section headings, "
                    "their order, and the level of detail under each section. "
                    "Do not summarise, interpret, or add anything. Output the extracted text only."
                ),
            ],
        )

        extracted = response.text.strip()
        if not extracted:
            raise ValueError(
                "Gemini could not extract text from the image. "
                "Please ensure the image is clear and legible."
            )

        return extracted

    # ------------------------------------------------------------------
    # Template update (called by PATCH route)
    # ------------------------------------------------------------------

    def update_template(
        self,
        template_id: str,
        updates: "TemplateUpdateRequest",
    ) -> Dict[str, Any]:
        """Update template fields. Re-embeds if content has changed.

        Args:
            template_id: UUID of the template to update.
            updates:     TemplateUpdateRequest with only the fields to change.

        Returns:
            The updated row from Supabase.
        """
        payload: Dict[str, Any] = {}

        if updates.title is not None:
            payload["title"] = updates.title
        if updates.specialty is not None:
            payload["specialty"] = updates.specialty
        if updates.tags is not None:
            payload["tags"] = updates.tags
        if updates.content is not None:
            payload["content"] = updates.content
            # Content changed — regenerate embedding
            payload["embedding"] = self._embed(updates.content)

        payload["updated_at"] = "now()"

        response = (
            self.supabase.table("clinical_templates")
            .update(payload)
            .eq("id", template_id)
            .execute()
        )

        return response.data[0] if response.data else {}

    # ------------------------------------------------------------------
    # Template delete (called by DELETE route)
    # ------------------------------------------------------------------

    def delete_template(self, template_id: str) -> None:
        """Permanently delete a template from Supabase.

        Args:
            template_id: UUID of the template to delete.
        """
        self.supabase.table("clinical_templates") \
            .delete() \
            .eq("id", template_id) \
            .execute()