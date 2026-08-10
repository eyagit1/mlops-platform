"""Unit tests for document classification and extraction."""

from src.classifier import DocumentProcessor


def test_classify_invoice() -> None:
    processor = DocumentProcessor()
    result = processor.classify(
        "Invoice #99. Total amount due with billing and tax information."
    )
    assert result["category"] == "Invoice"
    assert result["confidence"] > 0.3


def test_classify_contract() -> None:
    processor = DocumentProcessor()
    result = processor.classify(
        "This agreement between Party A and Party B defines terms and signatures."
    )
    assert result["category"] == "Contract"


def test_extract_metadata() -> None:
    processor = DocumentProcessor()
    text = (
        "Contact finance@acme.com on 2026-08-10. "
        "Approved budget: EUR 3,500.00."
    )
    extracted = processor.extract_information(text)
    assert extracted["extracted_emails"] == ["finance@acme.com"]
    assert "2026-08-10" in extracted["extracted_dates"]
    assert extracted["potential_amounts"]
