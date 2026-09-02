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
            api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if api_key:
                self.client = genai.Client(api_key=api_key)
                self._active_model_name = self.primary_model
                logger.info(f"GenAI Client initialized with API Key, target model: {self.primary_model}")
            elif self.project_id and self.project_id != "your-gcp-project-id":
                self.client = genai.Client(
                    vertexai=True,
                    project=self.project_id,
                    location=self.region,
                )
                self._active_model_name = self.primary_model
                logger.info(
                    f"Vertex AI Client initialized on project {self.project_id} (region {self.region}), target model: {self.primary_model}"
                )
            else:
                # Attempt default genai client
                try:
                    self.client = genai.Client()
                    self._active_model_name = self.primary_model
                except Exception:
                    self.client = None
        except Exception as e:
            logger.warning(f"GenAI/Vertex AI Client initialization warning: {e}")
            self.client = None

    def get_client(self) -> Optional[genai.Client]:
        if self.client is None:
            self._init_client()
        return self.client

    def get_model_candidates(self) -> List[str]:
        """Returns prioritized list of Vertex AI model IDs to try."""
        candidates = [self.primary_model]
        for m in self.fallback_models:
            if m not in candidates:
                candidates.append(m)
        return candidates
