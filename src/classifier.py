import re
from typing import Any, Dict, List

# Rule-based keyword scoring for document type classification.
_CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Invoice": [
        "invoice", "total", "amount due", "billing", "tax", "facture", "montant",
        "payment due", "subtotal", "vat",
    ],
    "Contract": [
        "agreement", "party", "terms", "signatures", "shall", "contrat", "article",
        "whereas", "obligations", "effective date",
    ],
    "Report": [
        "summary", "analysis", "results", "findings", "rapport", "conclusion",
        "executive summary", "methodology", "recommendations",
    ],
}

_EMAIL_PATTERN = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
_DATE_PATTERNS = [
    re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"),
    re.compile(r"\b\d{4}-\d{2}-\d{2}\b"),
    re.compile(
        r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
        r"Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|"
        r"Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b",
        re.IGNORECASE,
    ),
]
_AMOUNT_PATTERN = re.compile(
    r"(?:USD|EUR|TND|\$|€)\s*\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{2})?"
    r"|\b\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{2})?\s*(?:USD|EUR|TND)\b",
    re.IGNORECASE,
)


class DocumentProcessor:
    """Document classification and lightweight metadata extraction."""

    def __init__(self) -> None:
        self.categories = _CATEGORY_KEYWORDS

    def classify(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        scores = {category: 0 for category in self.categories}

        for category, keywords in self.categories.items():
            for keyword in keywords:
                if keyword in text_lower:
                    scores[category] += 1

        total_hits = sum(scores.values())
        if total_hits == 0:
            return {"category": "Unclassified", "confidence": 0.33, "scores": scores}

        best_category = max(scores, key=scores.get)
        confidence = round(scores[best_category] / total_hits, 2)
        return {"category": best_category, "confidence": confidence, "scores": scores}

    def extract_information(self, text: str) -> Dict[str, Any]:
        emails = list(dict.fromkeys(_EMAIL_PATTERN.findall(text)))

        dates: List[str] = []
        for pattern in _DATE_PATTERNS:
            dates.extend(pattern.findall(text))
        dates = list(dict.fromkeys(dates))

        amounts = list(dict.fromkeys(_AMOUNT_PATTERN.findall(text)))[:5]

        return {
            "extracted_emails": emails,
            "extracted_dates": dates,
            "potential_amounts": amounts,
        }

    def process(self, text: str) -> Dict[str, Any]:
        return {
            "classification": self.classify(text),
            "extraction": self.extract_information(text),
        }
