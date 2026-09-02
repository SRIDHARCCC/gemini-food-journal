import os
import logging
from typing import Optional, List, Any
from google import genai
from server.config import settings

logger = logging.getLogger(__name__)

class BaseVertexAgent:
    """
    Base Agent initializing Google Cloud Vertex AI SDK via IAM / ADC.
    Mandate 1: Zero API keys. Direct Workload Identity / ADC on GCP project.
    """
    def __init__(self, project_id: Optional[str] = None, region: Optional[str] = None):
        self.project_id = project_id or settings.PROJECT_ID
        self.region = region or settings.REGION
        self.primary_model = settings.PRIMARY_MODEL
        self.fallback_models = settings.FALLBACK_MODELS
        self.client: Optional[genai.Client] = None
        self._active_model_name: Optional[str] = None
        self._init_client()

    def _init_client(self):
        try:
            self.client = genai.Client(
                vertexai=True,
                project=self.project_id,
                location=self.region,
            )
            self._active_model_name = self.primary_model
            logger.info(
                f"Vertex AI Client initialized on project {self.project_id} (region {self.region}), target model: {self.primary_model}"
            )
        except Exception as e:
            logger.warning(f"Vertex AI Client initialization warning: {e}")
            self.client = None

    def get_client(self) -> genai.Client:
        if self.client is None:
            self._init_client()
        if self.client is None:
            raise RuntimeError(
                f"Vertex AI Client unavailable. Ensure Google Cloud ADC is active on project '{self.project_id}'."
            )
        return self.client

    def get_model_candidates(self) -> List[str]:
        """Returns prioritized list of Vertex AI model IDs to try."""
        candidates = [self.primary_model]
        for m in self.fallback_models:
            if m not in candidates:
                candidates.append(m)
        return candidates
