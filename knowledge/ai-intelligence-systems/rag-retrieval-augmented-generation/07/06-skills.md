# Skill: Implement RAG Security and Data Governance
## Purpose
Apply document-level access control, retrieval authorization, index poisoning prevention, and audit trails to RAG systems, ensuring safe handling of sensitive information throughout the retrieval pipeline.
## When To Use
- RAG systems processing sensitive or regulated data (PII, financial, health)
- Multi-tenant applications where users must not access other tenants' documents
- Applications requiring compliance (GDPR, HIPAA, SOC2) in AI features
## When NOT To Use
- Public knowledge bases with no access restrictions
- Prototypes before production deployment
## Prerequisites
- RAG pipeline with vector search and context injection
- User/tenant authentication and authorization system
- Document-level permission metadata stored with chunks
- Audit logging infrastructure
## Inputs
- User query with authentication/authorization context
- Retrieved document chunks with permission metadata
- Document ACL/permission mappings
- Audit log configuration
## Workflow (numbered)
1. Store document-level access permissions as metadata with each chunk during ingestion
2. Filter vector search results by user permissions at the database query level (not post-filter)
3. Apply context-level filtering to remove sensitive fields from retrieved content
4. Implement index poisoning prevention: validate all ingested documents, sanitize content
5. Track document provenance: source, ingestion date, integrity hash per document
6. Implement document retention: delete embeddings when source documents are removed
7. Log retrieval audit trail: which documents retrieved for which query, by which user
8. Apply data retention policies: purge embeddings when retention period expires
## Validation Checklist
- [ ] Document permissions stored as chunk metadata during ingestion
- [ ] Vector search filters by user permissions at DB level (not post-retrieval filter)
- [ ] Index poisoning prevention validates all ingested documents
- [ ] Document provenance tracked (source, date, integrity hash)
- [ ] Embeddings deleted when source documents removed
- [ ] Retrieval audit trail logged (who queried what, which results returned)
- [ ] Data retention policies enforced with automated cleanup
- [ ] Context-level filtering removes sensitive fields before LLM injection
## Common Failures
- Post-retrieval filtering instead of DB-level — timing side-channel leaks existence of restricted documents
- No index poisoning protection — attacker injects malicious documents to influence LLM outputs
- Retention not enforced — deleted documents remain retrievable via their embeddings
- No audit trail — can't investigate who accessed which documents
- Inconsistent permission enforcement — some paths bypass access control
## Decision Points
- **DB-level vs post-retrieval filtering**: Always DB-level with permission filter in WHERE clause; never post-filter
- **Permission model**: Document-level ACLs vs role-based access vs attribute-based access
- **Retention enforcement**: Delete embeddings synchronously with source or async queue job?
## Performance Considerations
- Permission filtering at DB level: negligible overhead (<1ms with indexed permission column)
- Metadata storage: 50-200 bytes per chunk for permission metadata
- Audit logging: async queue for production (non-blocking)
## Security Considerations
- Document-level access control at retrieval time — fundamental RAG security control
- Post-retrieval filtering creates timing side-channels — always filter at DB level
- Index poisoning via document injection — validate all ingested content
- Audit trails for regulated data — log who retrieved what and when
- Embedding deletion on document removal — prevent zombie access to deleted content
## Related Rules (from 05-rules.md)
- Implement Document-Level Access Control at Retrieval Time
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Citation-Grounded Answers in RAG
- Implement Prompt Injection Defense
## Success Criteria
- Users only retrieve documents they have permission to access
- Document deletion propagates to embedding store within configured SLA
- Audit trail provides complete record of who queried what
- No timing side-channel reveals existence of restricted documents
- Ingested documents validated for malicious content
