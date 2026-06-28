"""Abstract base class for all clinical agents.

This module defines the BaseAgent interface that all specialized clinical agents
inherit from, ensuring consistent behavior and structure across the agent ecosystem.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseAgent(ABC):
    """Abstract base class for all clinical agents.

    All clinical agents (CliniClerker, CliniScribe, Validator, Librarian, Optimizer)
    inherit from this base class and must implement the `process` method for their
    specific clinical function.

    Attributes:
        gemini_client: Reference to the Gemini API client for LLM interactions.
        agent_name: Descriptive name of the agent for logging and identification.
    """

    def __init__(self, gemini_client: Any, agent_name: str) -> None:
        """Initialize the BaseAgent.

        Args:
            gemini_client: An instance of the Gemini client for LLM interactions.
            agent_name: A descriptive name for this agent (e.g., "CliniClerker").
        """
        self.gemini_client = gemini_client
        self.agent_name = agent_name

    @abstractmethod
    def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data and return structured output.

        This abstract method must be implemented by all concrete agent subclasses.
        Each agent will define its own processing logic based on its clinical role.

        Args:
            data: Input dictionary containing the data to be processed by the agent.

        Returns:
            A dictionary containing the agent's processed output and metadata.

        Raises:
            NotImplementedError: If the subclass does not implement this method.
        """
        pass

    def __repr__(self) -> str:
        """Return a string representation of the agent."""
        return f"{self.__class__.__name__}(agent_name={self.agent_name!r})"
