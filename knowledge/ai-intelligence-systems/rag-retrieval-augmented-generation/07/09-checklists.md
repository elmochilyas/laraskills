# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** ku-07
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Audit all retrievals.
- [ ] Filter retrieval results by permissions.
- [ ] Implement document-level ACLs.
- [ ] Support document deletion and re-indexing.
- [ ] Use content-addressed storage.
- [ ] Document deletion propagates to the vector index (chunks removed).
- [ ] Document-level access control is enforced at retrieval time (not post-retrieval).
- [ ] Ingested documents are validated for injection patterns, content safety, and metadata completeness.
- [ ] Apply PII Redaction Before Indexing
- [ ] Audit All Retrieval Operations
- [ ] Implement Document-Level Access Control at Retrieval Time
- [ ] Propagate Document Deletion to Vector Index
- [ ] Use Tenant-Isolated Indexes for Multi-Tenant Systems
- [ ] Context-level filtering removes sensitive fields before LLM injection
- [ ] Data retention policies enforced with automated cleanup
- [ ] Document permissions stored as chunk metadata during ingestion
- [ ] Audit trail provides complete record of who queried what
- [ ] Document deletion propagates to embedding store within configured SLA
- [ ] Ingested documents validated for malicious content

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

- [ ] Audit all retrievals.
- [ ] Filter retrieval results by permissions.
- [ ] Implement document-level ACLs.
- [ ] Support document deletion and re-indexing.
- [ ] Use content-addressed storage.
- [ ] Validate all ingested documents.
- [ ] Apply PII Redaction Before Indexing
- [ ] Audit All Retrieval Operations
- [ ] Implement Document-Level Access Control at Retrieval Time
- [ ] Propagate Document Deletion to Vector Index
- [ ] Use Tenant-Isolated Indexes for Multi-Tenant Systems
- [ ] Validate Ingested Documents Before Indexing

---

# Performance Checklist

- [ ] ACL filtering adds 5-20ms per query (applying permission filters to search results).
- [ ] Audit logging should be async (queue) to avoid adding latency to the retrieval path.
- [ ] Document validation on ingestion adds 100-500ms per document. Run in background queue jobs.
- [ ] Index updates (re-indexing after document changes): use differential indexing (only update affected chunks).
- [ ] Tenant-isolated indexes are faster than row-level filtering for multi-tenant systems (no filter logic overhead).
- [ ] Audit logging: async queue for production (non-blocking)
- [ ] Permission filtering at DB level: negligible overhead (<1ms with indexed permission column)

---

# Security Checklist

- [ ] Backup security:
- [ ] Cross-tenant leakage:
- [ ] Deletion propagation:
- [ ] Embedding reversal:
- [ ] Index poisoning detection:
- [ ] Retrieval side-channel:
- [ ] Index poisoning via document injection â€” validate all ingested content
- [ ] Permission filtering at DB level: negligible overhead (<1ms with indexed permission column)

---

# Reliability Checklist

- [ ] Indexing sensitive documents without PII redaction â€” embeddings may leak PII.
- [ ] No audit trail â€” when a user accesses sensitive information, there's no record.
- [ ] Not handling document deletion â€” deleted documents remain in the index and continue to be retrieved.
- [ ] Not implementing document-level access control â€” every user can retrieve every document.
- [ ] Not validating user-uploaded documents â€” an attacker uploads a document with injection payloads.
- [ ] Relying on the LLM to enforce access control â€” the LLM may ignore access control instructions.

---

# Testing Checklist

- [ ] Audit trail provides complete record of who queried what
- [ ] Context-level filtering removes sensitive fields before LLM injection
- [ ] Data retention policies enforced with automated cleanup
- [ ] Document deletion propagates to embedding store within configured SLA
- [ ] Document deletion propagates to the vector index (chunks removed).
- [ ] Document permissions stored as chunk metadata during ingestion
- [ ] Document provenance tracked (source, date, integrity hash)
- [ ] Document-level access control is enforced at retrieval time (not post-retrieval).
- [ ] Embeddings deleted when source documents removed
- [ ] Index poisoning prevention validates all ingested documents

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Document-Level Access Control â€” All Users See All Documents]
- [ ] [Access Control at Application Layer Only â€” Vector Index Exposes All Data]
- [ ] [Embedding Sensitive Documents Without Encryption]
- [ ] [No Audit Logging on Retrieved Documents]
- [ ] [Shared Vector Index for Multi-Tenant Without Tenant Isolation]
- [ ] LLM-as-Authorization:
- [ ] No Input Validation:
- [ ] Orphaned Indexes:
- [ ] Post-Retrieval Filtering:
- [ ] Shared Index, Shared Risk:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Audit logging: async queue for production (non-blocking)
- [ ] Audit trails for regulated data â€” log who retrieved what and when

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


