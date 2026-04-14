import re
import json
from typing import List, Dict, Any, Tuple, Optional
from loguru import logger
from core.config.settings import settings


class Redactor:
    """
    Rule-based PII redaction engine.

    Single-pass strategy: collect all pattern matches across the whole text,
    sort by position descending, then replace in reverse order so earlier
    replacements do not shift offsets for later ones.  This prevents a phone
    regex from corrupting a crypto-wallet address before its own pattern fires.
    """

    PATTERNS = {
        "crypto_wallet": r"\b(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b",
        "email": r"\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\b",
        "url": r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+",
        "phone": r"(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}",
    }

    MASK = "********"  # fixed 8-char mask — never leaks original length

    def __init__(
        self, 
        mask_char: str = settings.PII_MASK_CHAR,
        blocklist: Optional[List[str]] = None,
        allowlist: Optional[List[str]] = None
    ):
        # mask_char kept for API compatibility; internal MASK constant used for output
        self.mask_char = mask_char
        self.blocklist = blocklist or []
        self.allowlist = allowlist or []
        
        self.compiled_patterns = {
            name: re.compile(pattern) for name, pattern in self.PATTERNS.items()
        }

    def redact(self, text: str) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Redacts PII from text in a single pass.
        Returns (redacted_text, list_of_redaction_events).
        """
        # Collect all matches from all patterns
        all_matches: List[Dict[str, Any]] = []
        
        # 1. Regex Patterns
        for name, pattern in self.compiled_patterns.items():
            # Skip URL redaction if disabled in settings
            if name == "url" and not settings.ENABLE_URL_REDACTION:
                continue
                
            for match in pattern.finditer(text):
                val = match.group()
                # Check allowlist
                if val in self.allowlist:
                    continue
                    
                all_matches.append({
                    "type": name,
                    "start": match.start(),
                    "end": match.end(),
                    "original": val,
                })
        
        # 2. Blocklist matches
        for blocked_item in self.blocklist:
            if not blocked_item:
                continue
            # Simple exact match for blocklist
            start_pos = 0
            while True:
                idx = text.find(blocked_item, start_pos)
                if idx == -1:
                    break
                all_matches.append({
                    "type": "blocklist",
                    "start": idx,
                    "end": idx + len(blocked_item),
                    "original": blocked_item,
                })
                start_pos = idx + 1

        # Remove overlapping matches: keep the longest match at each position
        all_matches = _remove_overlaps(all_matches)

        # Replace in reverse order to preserve offsets
        events = []
        for m in sorted(all_matches, key=lambda x: x["start"], reverse=True):
            text = text[: m["start"]] + self.MASK + text[m["end"]:]
            events.append({
                "type": m["type"],
                "original_hash": hash(m["original"]),
                "span": (m["start"], m["end"]),
            })

        return text, events

    def process_file(
        self,
        input_path: str,
        output_path: str,
        audit_report_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Processes a JSONL file and redacts all 'text' fields."""
        logger.info(f"Redacting PII in {input_path}")

        counts: Dict[str, Any] = {"total": 0, "redacted": 0, "events": 0, "by_type": {}}
        detailed_audit: List[Dict[str, Any]] = []

        with open(input_path, "r", encoding="utf-8") as fin, \
             open(output_path, "w", encoding="utf-8") as fout:

            for line in fin:
                data = json.loads(line)
                original_text = data.get("text", "")
                message_id = data.get("id", "unknown")

                redacted_text, events = self.redact(original_text)

                data["text"] = redacted_text
                data["privacy_audit"] = len(events) > 0

                fout.write(json.dumps(data, ensure_ascii=False) + "\n")

                counts["total"] += 1
                if events:
                    counts["redacted"] += 1
                    counts["events"] += len(events)
                    for event in events:
                        etype = event["type"]
                        counts["by_type"][etype] = counts["by_type"].get(etype, 0) + 1
                        detailed_audit.append({
                            "message_id": message_id,
                            "type": etype,
                            "span": event["span"],
                        })

        logger.success(
            f"Redaction complete: {counts['redacted']}/{counts['total']} messages modified "
            f"({counts['events']} events total)."
        )

        if audit_report_path:
            report = {"summary": counts, "detailed_events": detailed_audit}
            with open(audit_report_path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)
            logger.info(f"Privacy audit report saved to {audit_report_path}")

        return counts


def _remove_overlaps(matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Given a list of matches (each with start/end), removes overlapping entries
    by keeping whichever match is longer at each conflict.
    """
    if not matches:
        return []
    # Sort by start, then by length descending
    sorted_m = sorted(matches, key=lambda x: (x["start"], -(x["end"] - x["start"])))
    kept: List[Dict[str, Any]] = []
    last_end = -1
    for m in sorted_m:
        if m["start"] >= last_end:
            kept.append(m)
            last_end = m["end"]
        elif m["end"] > last_end:
            # Current match extends beyond the previous — replace it with longer one
            kept[-1] = m
            last_end = m["end"]
    return kept


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        redactor = Redactor()
        redactor.process_file(sys.argv[1], sys.argv[2])
