"""Clinical agents module for CliniMax.

This package provides a collection of specialized agents for various clinical workflows:
- CliniClerker: Patient intake and history-taking
- CliniScribe: Audio transcription and note generation
- Validator: Safety and quality assurance
- Librarian: Template retrieval and context assembly
- Optimizer: Analytics and feedback-driven optimization
"""

from app.agents.base_agent import BaseAgent
from app.agents.clini_clerker import CliniClerker
from app.agents.clini_scribe import CliniScribe
from app.agents.librarian import Librarian
from app.agents.optimizer import Optimizer
from app.agents.validator import Validator

__all__ = [
    "BaseAgent",
    "CliniClerker",
    "CliniScribe",
    "Librarian",
    "Optimizer",
    "Validator",
]
