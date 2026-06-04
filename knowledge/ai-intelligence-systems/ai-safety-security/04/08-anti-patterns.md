# Anti-Patterns: Data Privacy & PII Protection

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-04 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Safety & Security |
| **Type** | Compliance |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Redact-Everything Approach](#1-redact-everything-approach)
2. [Manual PII Tagging](#2-manual-pii-tagging)
3. [PII in Vector Embeddings](#3-pii-in-vector-embeddings)
4. [One Policy for All Data](#4-one-policy-for-all-data)
5. [Request-Only Redaction](#5-request-only-redaction)

---

## 1. Redact-Everything Approach

### Category
Over-Blocking / Functionality Breakage

### Description
Applying indiscriminate PII redaction that replaces all potentially sensitive patterns without considering context or application needs. Email addresses, phone numbers, names, and other patterns are aggressively stripped even when the LLM legitimately needs them to perform the requested task (e.g., "send an email to john@example.com" redacts the email, making the action impossible).

### Why It Happens
- Risk-averse security policy: better to over-redact than under-redact
- Simplified implementation: one-size-fits-all redaction is easier to code
- No analysis of which PII the application legitimately needs to process
- Legal team mandates comprehensive redaction without functional review

### Warning Signs
- All PII patterns are redacted with no exceptions or context awareness
- Application features break when users include their own contact info
- Users report that the AI "doesn't understand" basic personal information
- The redaction layer runs on every message without sensitivity classification
- Support tickets about "the AI forgot my name/email/address" are common

### Why Harmful
- Core application features become unusable (e.g., "email me the results" fails)
- Users have a poor experience and may stop using the application
- False sense of security: team believes all PII is protected, but functionality is broken
- Wasted compute and latency from redacting non-sensitive content
- Compliance risk from broken features that cannot fulfill data subject requests

### Real-World Consequences
- Language learning app cannot reference the user's name in personalized lessons
- Customer support AI cannot look up user by their provided email
- Healthcare app blocks medical record numbers that are needed for treatment
- Users abandon the platform for competitors with more functional AI

### Preferred Alternative
Implement sensitivity-classified redaction. Classify data sensitivity at ingestion and apply different redaction policies: always redact (SSN), redact but allow with override (email for specific actions), pass through (non-sensitive). Use reversible masking so the LLM can reference PII when needed.

### Refactoring Strategy
1. Classify PII types by sensitivity: critical (SSN, credit card), high (email, phone), medium (name, address), low (IP, device ID)
2. Map each classification to a default action: redact, mask, warn, pass
3. Implement context-aware policies: email is redacted for general chat but passed for "send email" intent
4. Use reversible masking for PII the LLM needs to reference
5. Test each feature with realistic PII use cases

### Detection Checklist
- [ ] PII redaction is sensitivity-classified (not all-or-nothing)
- [ ] Core features work correctly with realistic PII input
- [ ] Reversible masking exists for LLM-referenceable PII
- [ ] Non-sensitive data passes through without redaction overhead

### Related Rules/Skills/Trees
- Skill: Implement PII Protection and Data Privacy
- Decision Tree: Security Configuration

---

## 2. Manual PII Tagging

### Category
Process Reliability Failure

### Description
Relying on developers or users to manually classify data sensitivity and tag PII instead of using automated detection. This assumes humans will consistently identify and tag all PII, which is unreliable at scale and creates inevitable gaps where untagged PII reaches LLM providers.

### Why It Happens
- Automated detection setup (regex, NER) seems complex to implement
- False assumption that developers "know" what's sensitive in their code
- Cultural belief that "responsible developers will tag PII correctly"
- No budget for ML-based detection implementation

### Warning Signs
- Comments in code say "// TODO: add PII redaction here"
- Privacy documentation says "developers must ensure PII is tagged"
- No automated PII detection exists in the AI pipeline
- Incident post-mortems reveal PII leaks that "someone should have tagged"
- Privacy reviews rely on manual code inspection for PII flows

### Why Harmful
- Human error guarantees missed PII: tired developers, rushed releases, new team members
- No systematic coverage: PII detection depends on individual vigilance
- Scaling is impossible: as the codebase grows, manual tagging becomes inconsistent
- False sense of compliance: "our developers are trained" doesn't prevent leaks
- Audit findings reveal gaps that manual processes cannot close

### Real-World Consequences
- Untagged PII in user messages reaches OpenAI servers despite "manual review"
- GDPR fine for processing PII without proper controls
- Embarrassing data leak when a developer forgets to tag the "notes" field
- Compliance team discovers untagged PII during audit, triggering remediation project

### Preferred Alternative
Implement automated PII detection using layered detection: regex patterns for structured PII (email, phone, SSN, credit card), NER models for unstructured PII (names, addresses), and ML classifiers for context-sensitive detection. Automated detection is the first line; manual tags are supplemental overrides.

### Refactoring Strategy
1. Implement regex-based PII detection for structured patterns
2. Add NER-based detection for names, locations, and organizations
3. Apply detection as middleware that runs on every message
4. Add a sensitivity classification step before redaction
5. Remove reliance on manual tagging; treat manual tags as metadata, not security controls
6. Backfill PII detection on stored data (conversations, logs)

### Detection Checklist
- [ ] Automated PII detection exists (not dependent on human tagging)
- [ ] Structured PII (email, phone, SSN) is detected by regex
- [ ] Unstructured PII (names, addresses) is detected by NER
- [ ] Manual tags are supplemental, not primary detection
- [ ] Detection accuracy is measured and monitored

### Related Rules/Skills/Trees
- Skill: Implement PII Protection and Data Privacy

---

## 3. PII in Vector Embeddings

### Category
Data Lifecycle Blind Spot

### Description
Including PII in text that gets embedded and stored in vector databases for RAG or semantic search. The resulting embeddings cannot be easily deleted on user request (as required by GDPR right to erasure), and recent research shows that embeddings can be partially reversed to recover original content.

### Why It Happens
- Convenience: embedding the full document text without preprocessing
- Unawareness: not realizing that embeddings are effectively persistent
- Architectural oversight: the embedding pipeline lacks a PII redaction step
- User deletion requirements being an afterthought in vector storage

### Warning Signs
- RAG documents are embedded without PII redaction
- Embedding storage has no "delete by user" capability
- Vector database entries lack user ID or tenant isolation
- No periodic purge or anonymization process for embeddings
- Data subject access requests cannot be fulfilled for embedded content

### Why Harmful
- Embeddings are effectively permanent: removing them requires rebuilding the index
- GDPR right to erasure cannot be fulfilled for embedded PII
- Embedding reversal attacks can recover original PII from the vector store
- PII in embeddings persists even after source documents are deleted
- Cross-tenant PII leakage if embeddings are not isolated

### Real-World Consequences
- Cannot delete user data from vector database despite deletion request
- Embedding reversal attack demonstrates PII recovery from production vectors
- Compliance audit flags vector database as uncontrolled PII store
- Expensive full index rebuild required to remove one user's PII

### Preferred Alternative
Redact PII from text before embedding. Use isolated vector indexes per tenant or user. Implement per-vector metadata tagging that enables targeted deletion. Maintain a mapping of user to vectors for deletion requests.

### Refactoring Strategy
1. Add PII redaction step before the embedding pipeline
2. Add user/tenant metadata to each vector entry for targeted deletion
3. Implement vector deletion API that removes all vectors for a given user
4. Evaluate embedding reversal risk and apply differential privacy if needed
5. Document vector database in data processing register and data flow maps

### Detection Checklist
- [ ] PII is redacted before embedding
- [ ] Vectors can be deleted per user (targeted, not full rebuild)
- [ ] Vectors are isolated per tenant
- [ ] Embedding reversal risk is assessed and mitigated

### Related Rules/Skills/Trees
- Skill: Implement PII Protection and Data Privacy
- RAG: ku-06 (PII in RAG Document Processing)

---

## 4. One Policy for All Data

### Category
Inflexible Privacy Architecture

### Description
Applying the same privacy protection policy to all data types regardless of sensitivity. A user's public forum post receives the same PII treatment as their medical history or financial details. This either over-protects low-sensitivity data (breaking functionality) or under-protects high-sensitivity data (creating compliance risk).

### Why It Happens
- Simplicity: one policy is easier to implement and maintain
- No data classification framework exists
- Legal/compliance provides a single policy without sensitivity tiers
- Technical debt: the system was built without sensitivity-aware architecture

### Warning Signs
- All data flows through the same redaction pipeline with identical rules
- No concept of data sensitivity levels in the system
- Privacy policies are not configurable per feature or data type
- Cannot relax redaction for low-risk data without also relaxing for high-risk data
- Compliance team cannot define different handling for different data categories

### Why Harmful
- Public data (user bios) gets the same treatment as sensitive data (payment info)
- Functionality is unnecessarily limited for harmless data
- High-sensitivity data is not adequately protected because policies are generic
- Cannot adapt to different regulatory requirements (GDPR vs. CCPA vs. HIPAA)
- Product features are blocked because the privacy policy is too broad

### Real-World Consequences
- User profile features cannot display member since date (overly redacted)
- Healthcare application treats diagnosis discussions same as appointment reminders
- Cannot offer different privacy tiers for different subscription plans
- Regulatory fine for inadequate protection of specifically regulated data types

### Preferred Alternative
Implement a tiered privacy policy framework. Define sensitivity levels (public, internal, sensitive, restricted). Map each data type and feature to a sensitivity level. Apply different redaction/masking/retention policies per level.

### Refactoring Strategy
1. Define data sensitivity levels (3-4 tiers)
2. Classify all data inputs by sensitivity level
3. Map features to sensitivity levels based on data they process
4. Implement per-level privacy policies: redaction rules, retention periods, access controls
5. Create a privacy policy configuration that is hot-reloadable

### Detection Checklist
- [ ] Data sensitivity levels are defined and implemented
- [ ] Different data types have different privacy policies
- [ ] Features can specify which sensitivity level they operate at
- [ ] Policy configuration is hot-reloadable (no deploy for policy change)

### Related Rules/Skills/Trees
- Skill: Implement PII Protection and Data Privacy

---

## 5. Request-Only Redaction

### Category
Incomplete Pipeline Coverage

### Description
Applying PII redaction only to the outgoing request to the LLM provider, but not to the incoming response. The LLM may echo back PII that was present in the conversation (despite redaction, if masking was reversible) or generate new PII from training data. Users see unredacted PII in responses, and logs store raw PII.

### Why It Happens
- Focus on input security: most security effort goes to request validation
- Assumption that LLMs don't repeat PII (incorrect: models can regurgitate training data)
- Response pipeline is less scrutinized in security reviews
- Streaming output makes per-chunk redaction seem complex

### Warning Signs
- PII redaction is only implemented in the request pipeline
- LLM responses sometimes contain email addresses, phone numbers, or SSNs
- Chat history logs contain raw, unredacted PII
- Users report seeing other users' information in responses (data leakage)
- No PII detection or redaction on the output side of the middleware pipeline

### Why Harmful
- PII exposed to users violates privacy regulations
- LLM can regurgitate training data containing others' PII
- Conversation logs become PII stores requiring their own compliance
- De-redacted PII from request masking leaks back to users
- No defense against model data leakage vulnerabilities

### Real-World Consequences
- Customer support AI shows a user someone else's email address (training data regurgitation)
- Conversation history database becomes a PII store without consent
- Regulatory fine for exposing PII in AI responses
- Users' private information appears in chat transcripts shared with support

### Preferred Alternative
Implement symmetric PII protection: redact PII from requests before sending to the LLM, and apply PII detection and redaction to responses before returning to the user and logging.

### Refactoring Strategy
1. Add PII redaction middleware to the response pipeline
2. Apply the same detection patterns to both request and response
3. For streaming, implement buffer-then-check or per-chunk redaction
4. Add PII leakage detection for training data regurgitation
5. Strip PII from conversation logs and chat history storage

### Detection Checklist
- [ ] PII redaction exists on both request and response pipelines
- [ ] Streaming responses are redacted per-chunk or after buffering
- [ ] Conversation logs are stored without PII
- [ ] PII leakage detection (training data regurgitation) is implemented

### Related Rules/Skills/Trees
- Skill: Implement PII Protection and Data Privacy
- KU-06: Secure Output Handling
