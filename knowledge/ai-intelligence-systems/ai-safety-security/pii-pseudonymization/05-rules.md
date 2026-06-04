---
id: KU-037 (AI Safety)
title: "PII Pseudonymization - Rules"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for PII Pseudonymization

### R1: Never implement in-house PII detection when a well-maintained NLP library is available
- **Category:** Maintainability
- **Rule:** Use established NLP libraries (presidio-anonymizer, spacy-transformers) for PII detection instead of implementing custom regex or rule-based systems; custom PII detection is always worse than maintained libraries.
- **Reason:** Building a comprehensive PII detector requires maintaining patterns for 50+ categories across multiple languages. Libraries like Microsoft Presidio are continuously updated for new PII patterns. Custom implementations inevitably miss edge cases.
- **Bad Example:** A team writes 200 regex patterns to detect PII — they miss international phone number formats, and a German mobile number with PII passes through.
- **Good Example:** Integration with `microsoft/presidio-analyzer` with analyzers for EMAIL, PHONE, CREDIT_CARD, US_SSN, and custom analyzers for local-specific PII.
- **Exceptions:** When no library supports the required language or data format.
- **Consequences of Violation:** Unstructured or non-standard PII passes through undetected; compliance audit reveals PII in LLM provider logs; regulatory fines for data exposure.

### R2: Always map pseudonymized tokens in persistent storage for multi-session conversations
- **Category:** Reliability
- **Rule:** When conversations span multiple sessions, persist the PII token mapping (encrypted) so that "USER_NAME_001" consistently maps to the same person across sessions; never rely on in-memory mapping for multi-session conversations.
- **Reason:** In-memory mapping is lost between requests. If a user asks a question on Monday using their name, and follows up on Tuesday, the new session assigns a new token — the model can't connect the conversation.
- **Bad Example:** An in-memory `PiiMapper` that starts fresh for every PHP request — "John" → "USER_1" in one request and "John" → "USER_2" in the next, confusing the model.
- **Good Example:** A `PersistencePiiMapper` that stores `{ session_id, original_value, token }` in an encrypted Redis store with the same TTL as the conversation history.
- **Exceptions:** One-shot (single-request) conversations with no history.
- **Consequences of Violation:** Broken referential consistency across sessions; the model refers to tokens the user doesn't recognize; conversation coherence is lost.

### R3: De-pseudonymize responses in a separate middleware step that runs before any other post-processing
- **Category:** Architecture
- **Rule:** Register de-pseudonymization as the last middleware in the post-receive pipeline (closest to returning the response); never run de-pseudonymization before other transforms that could leak real PII.
- **Reason:** If de-pseudonymization runs before logging middleware, the real PII appears in logs. If it runs before output caching, the cache contains real PII. De-pseudonymizing last ensures downstream systems never see raw PII.
- **Bad Example:** Middleware pipeline order: [Logging, DePiiRedact, CacheResponse] — logs contain raw PII from de-pseudonymized output.
- **Good Example:** Pipeline order: [InjectionScan, PiiRedact, ...AI call..., Logging, CacheResponse, FormatOutput, DePiiRedact] — PII tokens are in logs and cache, not raw PII.
- **Exceptions:** Applications that don't log, cache, or store responses.
- **Consequences of Violation:** PII leaks into logs, caches, analytics, or monitoring systems intended to be PII-free; compliance violations from multiple data stores containing PII without appropriate controls.
