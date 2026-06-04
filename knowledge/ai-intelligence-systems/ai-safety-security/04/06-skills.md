# Skill: Protect PII and Data Privacy

## Purpose
Detect, redact, and govern personally identifiable information (PII) flowing through AI pipelines using regex and ML-based detection, reversible masking, data residency controls, and tenant-isolated storage — preventing PII exposure to third-party LLM providers and ensuring regulatory compliance.

## When To Use
- Any application that processes user data through third-party LLM providers (data leaves your infrastructure)
- Applications subject to privacy regulations (GDPR, CCPA, HIPAA, LGPD)
- Multi-tenant SaaS applications where one tenant's data must be isolated from another's
- Applications that store conversation history or embeddings for future retrieval

## When NOT To Use
- Internal tools processing non-sensitive data with no external LLM calls
- Fully on-premise deployments where data never leaves your infrastructure
- Applications where users explicitly consent to data processing for model training (opt-in)

## Prerequisites
- KU-04 (Data Privacy & PII Protection) — understanding of PII types and regulations
- PII detection service (regex patterns + NER model)
- LLM provider DPA and data handling policies verified
- Data classification scheme (public, internal, sensitive, restricted)

## Inputs
- User messages and content to be sent to LLM
- PII detection patterns (emails, phones, SSNs, addresses, credit cards, IPs)
- NER model for unstructured PII (names, locations, organizations)
- Data residency requirements (which regions data can be processed in)
- Data retention policies (how long to store conversations, embeddings, logs)

## Workflow
1. **Inventory data flows**: Map every point where user data reaches external services (LLM providers, embedding APIs, vector databases, monitoring services). Identify which flows carry PII.
2. **Verify provider data handling**: For each external provider, review data retention policy, opt out of training data usage, and sign a Data Processing Agreement (DPA). Document provider data handling commitments.
3. **Implement PII detection middleware**: Create a middleware layer that detects PII in both request and response paths. Use regex for structured PII (emails, phones, SSNs, credit cards) and ML-based NER for unstructured PII (names, addresses).
4. **Implement reversible masking**: For cases where the LLM needs to reference PII (e.g., "email user at [EMAIL]"), use deterministic masking per session. Map each PII value to a unique token (EMAIL_001, NAME_002). De-mask in the response before returning to the user.
5. **Apply PII redaction to requests**: Before sending to the LLM provider, redact or mask all detected PII. Apply to all message roles (system, user, tool results). Log redaction events for compliance.
6. **Apply PII redaction to responses**: After receiving the LLM response, redact or de-mask PII. The LLM may echo back PII from context. Apply the same detection and redaction pipeline.
7. **Handle streaming PII protection**: For streaming responses, apply per-chunk PII redaction. Handle partial PII matches (e.g., a phone number split across chunks) by buffering minimally and checking for complete patterns.
8. **Implement data retention**: Define retention policies for conversations, embeddings, and logs. Use Laravel's model pruning or scheduled jobs to delete expired data. Provide user-facing data deletion API.
9. **Isolate tenant data**: For multi-tenant systems, store embeddings in tenant-isolated vector indexes. Tag all data with tenant_id. Ensure one tenant's PII is never visible to another.
10. **Monitor and audit**: Log PII detection events (type detected, action taken, provider). Monitor PII bypass rate (PII that passes through undetected). Review and update detection patterns quarterly.

## Validation Checklist
- [ ] PII is redacted before sending to any third-party LLM provider
- [ ] PII redaction is applied to both requests and responses
- [ ] Reversible masking exists for cases where LLM needs to reference PII (de-redacted in response)
- [ ] Data retention policies are defined and enforced (conversations, embeddings, logs)
- [ ] Users can request data deletion (conversations, profile data, embeddings)
- [ ] Embeddings do not contain PII (or PII is in isolated index)
- [ ] A DPA is signed with each LLM provider processing user data

## Common Failures
- **Request-only redaction**: PII redacted in request but LLM echoes it back, and response has no PII protection. Fix: apply redaction to both request and response paths.
- **Irreversible redaction**: PII replaced with `[REDACTED]` and the LLM can't reference it meaningfully (e.g., "your account [REDACTED] has been updated"). Fix: use reversible masking with deterministic tokens.
- **Partial PII in streaming**: A credit card number split across two stream chunks is not detected by per-chunk processing. Fix: buffer 2-3 chunks and check for complete patterns.
- **PII in embeddings**: User data with PII is embedded and stored in the vector index, making deletion difficult. Fix: strip PII from content before embedding.
- **Data retention not enforced**: Conversations stored indefinitely, violating GDPR right to deletion. Fix: implement automated data purging with configurable retention periods.

## Decision Points
- **Regex vs. NER for detection**: Regex for structured PII (emails, phones, SSNs) — fast, precise. NER for unstructured PII (names, addresses) — slower but catches what regex misses. Use both.
- **Irreversible redaction vs. reversible masking**: Redaction (replace with `[EMAIL]`) when the LLM doesn't need to reference the specific value. Masking (replace with `EMAIL_001`, de-mask in response) when the LLM needs to work with the value.
- **Per-tenant vs. shared vector index**: Per-tenant indexes for strong isolation (no cross-tenant data leakage). Shared index with filter for cost efficiency (requires careful access control).

## Performance Considerations
- Regex PII detection: <1ms per message
- NER-based PII detection: 10-100ms per message (model-dependent)
- Reversible masking: add/remove mapping (sub-millisecond)
- Per-chunk streaming PII: sub-millisecond per chunk (pattern matching)
- Encrypted storage: ~10-20% overhead on read/write
- Cache PII detection results: similar inputs from same user likely have similar PII profile

## Security Considerations
- Verify LLM provider data retention policies and opt out of training data usage
- De-redaction mapping store must be as secure as the original PII (encrypted, access-controlled)
- Even without explicit PII, LLMs may infer sensitive information from context (medical history, financial status)
- Embeddings can be partially reversed — avoid embedding PII entirely
- Multi-tenant data isolation: one tenant's PII must never be visible to another (stronger than just rate limiting)
- Sign DPAs with all LLM providers processing user data

## Related Rules
- Always pseudonymize PII before the request reaches the LLM provider — never send raw PII externally
- Use deterministic pseudonymization so that the same PII value maps to the same token within a session
- Never use regex-only PII detection — always combine with ML-based NER

## Related Skills
- Skill: Prevent Prompt Injection Attacks (ku-01)
- Skill: Implement Content Moderation and Safety Filtering (ku-02)
- Skill: Secure Output Handling and Safe Rendering (ku-06)

## Success Criteria
- Zero raw PII sent to external LLM providers (verified by periodic audit)
- >95% of PII detected across both structured (regex) and unstructured (NER) categories
- Reversible masking correctly de-masks PII in LLM responses
- Data retention policies enforced with automated purging — no data kept beyond policy
- Users can delete their data via API with confirmation within 24 hours
- PII bypass rate (PII that passes through detection undetected) <1%
- DPA signed with all LLM providers processing user data