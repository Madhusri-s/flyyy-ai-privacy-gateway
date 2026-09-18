import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_analyzer.nlp_engine import NlpEngineProvider
from backend.models.database import SourceCustomer
from backend.schemas.schemas import FieldIntelligence, DiscoverResponse

class DiscoveryEngine:
    """
    Intelligent PII Discovery service combining:
    - Microsoft Presidio Analyzer (with spaCy en_core_web_sm)
    - Custom regex recognizers for Indian & International Phone Numbers, Identifiers, Alphanumeric codes
    - Statistical confidence evaluation across sample customer records
    """

    def __init__(self):
        # Configure Presidio with the lightweight installed spaCy model
        provider = NlpEngineProvider(nlp_configuration={
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}]
        })
        nlp_engine = provider.create_engine()
        self.analyzer = AnalyzerEngine(nlp_engine=nlp_engine)

        # Register custom recognizers
        self._register_custom_recognizers()

    def _register_custom_recognizers(self):
        # 1. 10-digit Phone Recognizer (India / Standard 10-digit mobile)
        phone_patterns = [
            Pattern(name="ten_digit_phone", regex=r"\b[6-9]\d{9}\b", score=0.95),
            Pattern(name="intl_phone", regex=r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", score=0.90)
        ]
        phone_recognizer = PatternRecognizer(
            supported_entity="PHONE_NUMBER",
            patterns=phone_patterns,
            name="CustomPhoneRecognizer"
        )
        self.analyzer.registry.add_recognizer(phone_recognizer)

        # 2. Customer ID / Numeric ID Recognizer (e.g. C001, 84729103)
        cust_id_patterns = [
            Pattern(name="cust_code", regex=r"\b[A-Z]\d{3,7}\b", score=0.85),
            Pattern(name="numeric_8digit_id", regex=r"\b\d{8}\b", score=0.80)
        ]
        cust_id_recognizer = PatternRecognizer(
            supported_entity="IDENTIFIER",
            patterns=cust_id_patterns,
            name="CustomIdentifierRecognizer"
        )
        self.analyzer.registry.add_recognizer(cust_id_recognizer)

    def analyze_dataset(self, session: Session, sample_limit: int = 50) -> DiscoverResponse:
        """
        Samples actual customer records from the source database and runs deep PII analysis.
        """
        records = session.query(SourceCustomer).limit(sample_limit).all()
        if not records:
            return DiscoverResponse(total_fields=0, detected_pii_count=0, fields=[])

        # Columns to analyze
        columns = ["customer_id", "name", "email", "mobile", "city", "segment"]
        field_results: List[FieldIntelligence] = []
        detected_pii_count = 0

        for col in columns:
            values = [str(getattr(r, col, "") or "") for r in records if getattr(r, col, None) is not None]
            sample_count = len(values)
            if sample_count == 0:
                field_results.append(FieldIntelligence(
                    field_name=col,
                    data_type="VARCHAR",
                    detected_entity="EMPTY",
                    confidence=0.0,
                    sensitivity="LOW",
                    sample_count=0,
                    recommended_action="KEEP",
                    explanation="No non-null sample records available"
                ))
                continue

            # Detect data type
            if all(v.isdigit() for v in values):
                data_type = "INTEGER / NUMERIC"
            else:
                data_type = "VARCHAR / TEXT"

            # Aggregate Presidio scores across samples
            entity_scores: Dict[str, List[float]] = {}
            for val in values:
                if not val.strip():
                    continue
                # Run Presidio analysis
                results = self.analyzer.analyze(text=val, language="en")
                for res in results:
                    entity_scores.setdefault(res.entity_type, []).append(res.score)

            # Heuristics for column name context and values
            col_lower = col.lower()
            if "phone" in col_lower or "mobile" in col_lower:
                phone_match_ratio = sum(1 for v in values if re.search(r"\b[6-9]?\d{9,10}\b", re.sub(r"\D", "", v))) / sample_count
                entity_scores["PHONE_NUMBER"] = [max(0.95, 0.85 + (phone_match_ratio * 0.15))]
                # Suppress false-positive UK_NHS / DATE_TIME on phone columns
                entity_scores.pop("UK_NHS", None)
                entity_scores.pop("DATE_TIME", None)
            elif "email" in col_lower:
                email_match_ratio = sum(1 for v in values if "@" in v and "." in v) / sample_count
                entity_scores["EMAIL_ADDRESS"] = [max(0.98, 0.90 + (email_match_ratio * 0.10))]
                entity_scores.pop("URL", None)
            elif "name" in col_lower:
                entity_scores.setdefault("PERSON", []).append(0.92)
            elif "city" in col_lower or "location" in col_lower:
                entity_scores.setdefault("LOCATION", []).append(0.85)
            elif "id" in col_lower or "code" in col_lower:
                entity_scores.setdefault("IDENTIFIER", []).append(0.88)

            # Determine dominant entity and average confidence
            if entity_scores:
                best_entity = max(entity_scores.keys(), key=lambda e: sum(entity_scores[e]) / len(entity_scores[e]))
                avg_confidence = round(sum(entity_scores[best_entity]) / len(entity_scores[best_entity]), 2)
                # Cap confidence between 0.0 and 1.0
                avg_confidence = max(0.0, min(1.0, avg_confidence))
            else:
                best_entity = "GENERIC_TEXT"
                avg_confidence = 0.10

            # Map to Sensitivity & Recommended Action
            if best_entity in ("PHONE_NUMBER", "NUMERIC_ID"):
                sensitivity = "HIGH"
                recommended_action = "FPE"
                explanation = f"Detected {best_entity} with {int(avg_confidence * 100)}% confidence. Recommend Format-Preserving Encryption (FPE) to preserve business usability."
                detected_pii_count += 1
            elif best_entity in ("EMAIL_ADDRESS", "PERSON"):
                sensitivity = "HIGH"
                recommended_action = "TOKENIZE"
                explanation = f"Detected {best_entity} with {int(avg_confidence * 100)}% confidence. Recommend Tokenization with deterministic HMAC for referential cross-referencing."
                detected_pii_count += 1
            elif best_entity in ("IDENTIFIER",):
                sensitivity = "MEDIUM"
                recommended_action = "KEEP"  # Typically keep public business identifier or apply FPE if sensitive
                explanation = f"Primary business identifier detected ({best_entity}). Recommend KEEP to maintain downstream relational integrity."
            elif best_entity in ("LOCATION",):
                sensitivity = "LOW"
                recommended_action = "KEEP"
                explanation = "General geographic attribute with low privacy risk. Recommend KEEP for regional reporting."
            else:
                sensitivity = "LOW"
                recommended_action = "KEEP"
                explanation = "Non-sensitive business attribute."

            field_results.append(FieldIntelligence(
                field_name=col,
                data_type=data_type,
                detected_entity=best_entity,
                confidence=avg_confidence,
                sensitivity=sensitivity,
                sample_count=sample_count,
                recommended_action=recommended_action,
                explanation=explanation
            ))

        return DiscoverResponse(
            total_fields=len(field_results),
            detected_pii_count=detected_pii_count,
            fields=field_results
        )

discovery_engine = DiscoveryEngine()
