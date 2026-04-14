from datetime import datetime
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field


class TelegramTextEntity(BaseModel):
    type: str
    text: str


class TelegramMessage(BaseModel):
    id: int
    type: str
    date: datetime
    from_name: Optional[str] = Field(None, alias="from")
    from_id: Optional[str] = None
    reply_to_message_id: Optional[int] = None
    photo: Optional[str] = None
    file: Optional[str] = None
    text: Union[str, List[Union[str, TelegramTextEntity]]]
    
    def get_full_text(self) -> str:
        """Extracts and joins all text segments."""
        if isinstance(self.text, str):
            return self.text
        
        parts = []
        for part in self.text:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                parts.append(part.get("text", ""))
            else:
                parts.append(str(part))
        return "".join(parts)


class TelegramChatExport(BaseModel):
    name: str
    type: str
    id: int
    messages: List[TelegramMessage]
