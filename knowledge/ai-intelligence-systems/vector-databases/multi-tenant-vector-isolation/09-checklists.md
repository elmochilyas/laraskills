# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** vector-databases
**Knowledge Unit:** multi-tenant-vector-isolation
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Audit log
- [ ] Database schema isolation for AI
- [ ] Index-per-tenant (pgvector)
- [ ] Multi-driver per tenant
- [ ] Scoped repository
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Always Apply Tenant Filter on Vector Queries
- [ ] Never Pass Tenant ID via LLM Arguments
- [ ] Test Cross-Tenant Leakage with Penetration Tests
- [ ] Cross-tenant isolation tested and verified (user A cannot access user B's data)
- [ ] Every vector query includes tenant filter
- [ ] Every vector stores tenant_id metadata
- [ ] Cross-tenant data leakage prevented (verified by security tests)
- [ ] Every vector query includes tenant filter (enforced by global scope)
- [ ] Isolation strategy documented for the chosen vector database

---

# Architecture Checklist

- [ ] Application
- [ ] Row
- [ ] Shared vs. isolated index â†’ Shared for cost efficiency; isolated for compliance (healthcare, finance) or when tenant data sizes vary dramatically (one tenant has 10M vectors, others have 1K)
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Audit log
- [ ] Database schema isolation for AI
- [ ] Index-per-tenant (pgvector)
- [ ] Multi-driver per tenant
- [ ] Scoped repository
- [ ] Tenant namespace
- [ ] Tenant-aware tool
- [ ] Always Apply Tenant Filter on Vector Queries
- [ ] Never Pass Tenant ID via LLM Arguments
- [ ] Test Cross-Tenant Leakage with Penetration Tests
- [ ] Global enforcement
- [ ] Isolation strategy

---

# Performance Checklist

- [ ] HNSW + tenant filter: if tenant has few vectors, HNSW may not be beneficial â€” brute-force is faster for <1K vectors per tenant
- [ ] pgvector RLS: slight overhead per query (policy check)
- [ ] Qdrant per-collection: index per tenant â€” small tenants have tiny indexes (fast), large tenants have dedicated resources
- [ ] Row-level filter on pgvector: `tenant_id` index + HNSW index â†’ two-stage query (first filter by tenant, then vector search). For small tenants, all vectors may be filtered before HNSW.
- [ ] Tenant filter on indexed column: negligible overhead (<1ms)

---

# Security Checklist

- [ ] Backup strategy: ensure backups are tenant-restorable for compliance (GDPR right to deletion)
- [ ] Cache vector query results per tenant â€” don't share cache keys across tenants
- [ ] Implement tenant ID injection via middleware â€” never trust tenant ID from user input
- [ ] Monitor for missing tenant_id in queries â€” log warnings when queries lack tenant filter
- [ ] Test cross-tenant leakage with penetration testing â€” intentionally attempt to search other tenant's vectors
- [ ] Use read-only database connections for vector queries â€” prevent cross-tenant data modification
- [ ] Missing tenant filter = data leakage vulnerability â€” most critical RAG security concern
- [ ] Never rely on post-retrieval filtering alone

---

# Reliability Checklist

- [ ] Assuming namespace isolation is complete â€” Pinecone namespaces share underlying index structure
- [ ] Not testing cross-tenant leakage in QA â€” undetected until production incident
- [ ] Omitting tenant filter in vector query â€” returns cross-tenant results (data leakage)
- [ ] Passing tenant ID via prompt/tool input â€” allows prompt injection to change tenant scope
- [ ] Sharing HNSW index across tenants without tenant filter â€” approximate search may leak proximity
- [ ] Using same vector DB credentials across tenants â€” no audit trail for which tenant accessed which vectors
- [ ] Always Apply Tenant Filter on Vector Queries
- [ ] Never Pass Tenant ID via LLM Arguments

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Cross-tenant data leakage prevented (verified by security tests)
- [ ] Cross-tenant isolation tested and verified (user A cannot access user B's data)
- [ ] Every vector query includes tenant filter
- [ ] Every vector query includes tenant filter (enforced by global scope)
- [ ] Every vector stores tenant_id metadata
- [ ] Global scope/middleware enforces tenant filter
- [ ] Isolation strategy documented for the chosen vector database

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Separate Index Per Tenant â€” Resource Waste]
- [ ] [Single Index Without Tenant Metadata Filter]
- [ ] [No Tenant ID in Chunk Metadata]
- [ ] [Tenant Removal Leaves Orphan Vectors]
- [ ] [Shared HNSW Index â€” Tenant A Data in Tenant B's Results]
- [ ] Backup leakage
- [ ] Cache collision
- [ ] Index-level leakage
- [ ] Missing tenant filter
- [ ] Tenant ID injection

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log any vector query executed without tenant context

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


