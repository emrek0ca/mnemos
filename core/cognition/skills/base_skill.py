from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseExpertSkill(ABC):
    """
    Standard interface for MNEMOS Expert Skills.
    Each skill is a domain-specific analyst that can audit the system and propose improvements.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def domain(self) -> str:
        """The specific subsystem this skill targets (e.g., 'frontend', 'memory', 'api')."""
        pass

    @abstractmethod
    def audit(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Performs a qualitative scan of the target domain.
        Returns a list of ImprovementProposals.
        """
        pass

    def create_proposal(self, title: str, description: str, suggestion: str, priority: str = "MEDIUM") -> Dict[str, Any]:
        """Helper to standardize proposal format."""
        return {
            "skill": self.name,
            "domain": self.domain,
            "title": title,
            "description": description,
            "suggestion": suggestion,
            "priority": priority,
            "status": "pending_approval"
        }
