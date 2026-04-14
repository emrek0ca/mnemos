from pathlib import Path
from typing import Optional, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    # Project Identity
    PROJECT_NAME: str = "MNEMOS"
    USER_NAME: str = Field(default="", description="Your name in chat exports")
    USER_ID: str = Field(default="", description="Your Telegram ID or internal identifier")

    # Paths
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    ARTIFACTS_DIR: Path = BASE_DIR / "artifacts"
    RAW_DIR: Path = ARTIFACTS_DIR / "raw"
    PROCESSED_DIR: Path = ARTIFACTS_DIR / "processed"
    DATASETS_DIR: Path = ARTIFACTS_DIR / "datasets"
    LOGS_DIR: Path = ARTIFACTS_DIR / "logs"
    REPORTS_DIR: Path = ARTIFACTS_DIR / "reports"

    # Privacy
    PII_MASK_CHAR: str = "*"
    ENABLE_PHONE_REDACTION: bool = True
    ENABLE_EMAIL_REDACTION: bool = True
    ENABLE_URL_REDACTION: bool = False  # URLs often useful for context; opt-in redaction

    # Inference / LLM Backend
    # Options: "anthropic" | "ollama" | "openai" | "stub"
    INFERENCE_BACKEND: Literal["anthropic", "ollama", "openai", "stub"] = "stub"
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    # Model IDs per backend
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OLLAMA_MODEL: str = "llama3"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    # Inference parameters
    MAX_TOKENS: int = 512
    TEMPERATURE: float = 0.7
    MAX_CONTEXT_WINDOW: int = 10  # conversation turns to retain per session

    # Training
    TRAINING_MODEL_ID: str = "meta-llama/Llama-2-7b-chat-hf"
    TRAINING_LORA_R: int = 16
    TRAINING_LORA_ALPHA: int = 32
    TRAINING_BATCH_SIZE: int = 4
    TRAINING_EPOCHS: int = 3
    TRAINING_LEARNING_RATE: float = 2e-4

    # Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = None

    # Ingestion
    MIN_MESSAGE_LENGTH: int = 2

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
