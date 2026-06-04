---
id: ku-03
title: "PII Pseudonymization - Rules"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for PII Pseudonymization

### R1: Always pseudonymize PII before the request reaches the LLM provider — never send raw PII externally
- **Category:** Security
- **Rule:** Implement a PII pseudonymization layer that replaces all detected PII (names, emails, phone numbers, addresses, SSNs) with placeholder tokens before the request is sent to the LLM provider; de-pseudonymize responses before returning to the user.
- **Reason:** LLM providers process and log requests on their infrastructure. Sending raw PII to external providers exposes user data to potential breaches, GDPR violations, and unauthorized model training.
- **Bad Example:** A support chat agent sending "My SSN is 123-45-6789" raw to the LLM provider.
- **Good Example:** The request is transformed: "[USER_SSN_1] needs help with his account" before sending; the response "[USER_SSN_1]'s account has been updated" is de-pseudonymized back to the original SSN.
- **Exceptions:** Zero — this is a mandatory privacy protection in production.
- **Consequences of Violation:** PII exposure to third-party LLM providers; GDPR fines (up to 4% of global revenue); user data potentially used for model training without consent.

### R2: Use deterministic pseudonymization so that the same PII value maps to the same token within a session
- **Category:** Reliability
- **Rule:** Implement a deterministic PII-to-token mapping per session (e.g., always map "john@example.com" to "EMAIL_001" within the same conversation); never use random tokens per occurrence.
- **Reason:** Deterministic mapping preserves referential integrity in conversations. If the user says "John" and later the model says "John", de-pseudonymization must map both consistently. Random tokens break references.
- **Bad Example:** Each occurrence of "john@example.com" is replaced with a different random UUID — the model cannot maintain coherent references.
- **Good Example:** A session-scoped `PiiMapper` that assigns "john@example.com" → "EMAIL_001" and reuses that mapping throughout the session.
- **Exceptions:** One-shot (single-turn) requests where reference consistency is irrelevant.
- **Consequences of Violation:** The model refers to tokens the user doesn't recognize; de-pseudonymization produces inconsistent results; conversation coherence is lost.

### R3: Never use regex-only PII detection — always combine with ML-based NER
- **Category:** Security
- **Rule:** Deploy both regex patterns (phone numbers, SSNs, emails) and ML-based named entity recognition (names, addresses, less-structured PII) for detection; never rely on regex alone.
- **Reason:** Regex catches only structured PII (emails, phone numbers). Names, addresses, and contextual PII (e.g., "my username is coolguy42") require semantic understanding. ML-based NER catches what regex misses.
- **Bad Example:** A PII detection system using regex for emails only — user types "my address is 123 Main St, Springfield" and the address passes through un-redacted.
- **Good Example:** A layered detector: regex catches emails/phones/SSNs instantly; a spaCy or similar NER model detects names, locations, and addresses with configurable confidence threshold.
- **Exceptions:** Applications that only accept structured data (e.g., form submission, not free text).
- **Consequences of Violation:** Unstructured PII (names, addresses, contexts) passes through to the LLM provider un-redacted; partial PII protection creates a false sense of security.
