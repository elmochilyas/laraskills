# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-safety-security
**Knowledge Unit:** ku-04
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Classify data sensitivity
- [ ] Implement reversible masking
- [ ] Log PII detection events
- [ ] Never send raw PII to LLM APIs
- [ ] Provide data deletion APIs
- [ ] A DPA is signed with each LLM provider processing user data.
- [ ] Data retention policies are defined and enforced (conversations, embeddings, logs).
- [ ] Embeddings do not contain PII (or PII is in isolated index).
- [ ] Rules for OWASP LLM Compliance
- [ ] A DPA is signed with each LLM provider processing user data
- [ ] Data retention policies are defined and enforced (conversations, embeddings, logs)
- [ ] Embeddings do not contain PII (or PII is in isolated index)
- [ ] **Apply PII redaction to requests**: Before sending to the LLM provider, redact or mask all detected PII. Apply to all message roles (system, user, tool results). Log redaction events for compliance.
- [ ] **Apply PII redaction to responses**: After receiving the LLM response, redact or de-mask PII. The LLM may echo back PII from context. Apply the same detection and redaction pipeline.
- [ ] **Handle streaming PII protection**: For streaming responses, apply per-chunk PII redaction. Handle partial PII matches (e.g., a phone number split across chunks) by buffering minimally and checking for complete patterns.
- [ ] >95% of PII detected across both structured (regex) and unstructured (NER) categories
- [ ] Data retention policies enforced with automated purging â€” no data kept beyond policy
- [ ] DPA signed with all LLM providers processing user data

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Classify data sensitivity
- [ ] Implement reversible masking
- [ ] Log PII detection events
- [ ] Never send raw PII to LLM APIs
- [ ] Provide data deletion APIs
- [ ] Redact PII before sending to any LLM provider.
- [ ] **Apply PII redaction to requests**: Before sending to the LLM provider, redact or mask all detected PII. Apply to all message roles (system, user, tool results). Log redaction events for compliance.
- [ ] **Apply PII redaction to responses**: After receiving the LLM response, redact or de-mask PII. The LLM may echo back PII from context. Apply the same detection and redaction pipeline.
- [ ] **Handle streaming PII protection**: For streaming responses, apply per-chunk PII redaction. Handle partial PII matches (e.g., a phone number split across chunks) by buffering minimally and checking for complete patterns.
- [ ] **Implement data retention**: Define retention policies for conversations, embeddings, and logs. Use Laravel's model pruning or scheduled jobs to delete expired data. Provide user-facing data deletion API.
- [ ] **Implement PII detection middleware**: Create a middleware layer that detects PII in both request and response paths. Use regex for structured PII (emails, phones, SSNs, credit cards) and ML-based NER for unstructured PII (names, addresses).
- [ ] **Implement reversible masking**: For cases where the LLM needs to reference PII (e.g., "email user at [EMAIL]"), use deterministic masking per session. Map each PII value to a unique token (EMAIL_001, NAME_002). De-mask in the response before returning to the user.

---

# Performance Checklist

- [ ] Cache PII detection results: if the same user sends similar content, the PII profile is likely similar.
- [ ] Encrypted storage adds ~10-20% overhead on read/write. Plan database capacity accordingly.
- [ ] For streaming, PII protection must either buffer chunks (adds latency) or process per-chunk (complex).
- [ ] Redaction adds minimal overhead (string replacement). Masking with tokenization adds a lookup.
- [ ] Regex-based PII detection is <1ms. NER-based detection is 10-100ms depending on model size.
- [ ] Cache PII detection results: similar inputs from same user likely have similar PII profile
- [ ] Encrypted storage: ~10-20% overhead on read/write

---

# Security Checklist

- [ ] Context leakage:
- [ ] Cross-tenant data isolation:
- [ ] De-redaction attacks:
- [ ] Embedding reversal:
- [ ] Provider data handling:
- [ ] Cache PII detection results: similar inputs from same user likely have similar PII profile
- [ ] De-redaction mapping store must be as secure as the original PII (encrypted, access-controlled)
- [ ] Embeddings can be partially reversed â€” avoid embedding PII entirely

---

# Reliability Checklist

- [ ] Not considering indirect PII (combinations of non-PII fields that together identify a person).
- [ ] Only redacting PII from the request but not from the response (LLM may echo back PII).
- [ ] Sending PII to providers despite zero-retention claims â€” "zero retention" is not "zero exposure".
- [ ] Storing raw conversation history without PII redaction in logs or training data.
- [ ] Using irreversible redaction when the LLM needs to reference the PII (causes poor UX).

---

# Testing Checklist

- [ ] >95% of PII detected across both structured (regex) and unstructured (NER) categories
- [ ] A DPA is signed with each LLM provider processing user data
- [ ] A DPA is signed with each LLM provider processing user data.
- [ ] Data retention policies are defined and enforced (conversations, embeddings, logs)
- [ ] Data retention policies are defined and enforced (conversations, embeddings, logs).
- [ ] Data retention policies enforced with automated purging â€” no data kept beyond policy
- [ ] DPA signed with all LLM providers processing user data
- [ ] Embeddings do not contain PII (or PII is in isolated index)
- [ ] Embeddings do not contain PII (or PII is in isolated index).
- [ ] PII bypass rate (PII that passes through detection undetected) <1%

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Classify data sensitivity

---

# Anti-Pattern Prevention Checklist

- [ ] [[Redact-Everything Approach](#1-redact-everything-approach)]
- [ ] [[Manual PII Tagging](#2-manual-pii-tagging)]
- [ ] [[PII in Vector Embeddings](#3-pii-in-vector-embeddings)]
- [ ] [[One Policy for All Data](#4-one-policy-for-all-data)]
- [ ] [[Request-Only Redaction](#5-request-only-redaction)]
- [ ] Manual PII Tagging:
- [ ] One Policy for All Data:
- [ ] PII in Embeddings:
- [ ] Redact-Everything:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


