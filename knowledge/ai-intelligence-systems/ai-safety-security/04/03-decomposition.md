# Decomposition: Data Privacy & PII Protection

## Topic Overview

Data privacy and PII (Personally Identifiable Information) protection in AI systems involves detecting, classifying, redacting, and governing sensitive user data that flows through LLM requests and responses. Because LLMs process and may retain data, every user message that reaches an LLM provider represents a potential data exposure risk. This KU covers the techniques and architecture for ensuring sensitive data is protected throughout the AI pipeline â€” from input ingestion through LLM processing to output delivery and logging.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-04/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Data Privacy & PII Protection
- **Purpose:** Data privacy and PII (Personally Identifiable Information) protection in AI systems involves detecting, classifying, redacting, and governing sensitive user data that flows through LLM requests and responses. Because LLMs process and may retain data, every user message that reaches an LLM provider represents a potential data exposure risk. This KU covers the techniques and architecture for ensuring sensitive data is protected throughout the AI pipeline â€” from input ingestion through LLM processing to output delivery and logging.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-06, ku-04, ku-06, ku-04

## Dependency Graph
**Depends on:**
- ku-01
- ku-06
- ku-04
- ku-06
- ku-04

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **PII (Personally Identifiable Information):** Any data that can identify an individual (name, email, SSN, phone, address, IP, device ID, biometrics).
- **PII Detection:** Identifying PII in text using pattern matching (regex), named entity recognition (NER), or ML classifiers.
- **PII Redaction:** Replacing PII with placeholders (e.g., `[EMAIL]`, `[NAME]`) before sending data to the LLM.
- **PII Masking:** Reversible replacement (e.g., tokenized values) that can be de-redacted in the response.
- **Data Residency:** Ensuring data is processed and stored in specific geographic regions to comply with regulations (GDPR, CCPA, LGPD).
- **Data Retention:** Policies for how long raw user data (messages, embeddings) is stored before deletion.
- **Consent Management:** Tracking which data a user has consented to be processed and for what purposes.
- **Anonymization:** Irreversibly removing PII so data can no longer be associated with an individual.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-06 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-06 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

