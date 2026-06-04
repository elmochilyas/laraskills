# Skill: Implement Multi-Tenant Vector Isolation
## Purpose
Enforce tenant-level data isolation in vector search by applying tenant filters at query time, preventing cross-tenant data leakage in shared vector indexes.
## When To Use
- Multi-tenant SaaS applications using vector search
- Any system where different users/organizations must not access each other's data
- Compliance-required data isolation (GDPR, HIPAA, SOC2)
## When NOT To Use
- Single-tenant or public-search applications
- Prototypes without multi-tenant requirements
## Prerequisites
- Vector database with metadata/payload filtering support
- Tenant identifier stored with each vector as metadata
- Authentication system providing current tenant context
- Vector search queries with WHERE clause support
## Inputs
- Tenant identifier (from authenticated user context)
- Query embedding
- Search configuration (top-K, minSimilarity)
- Vector store driver (pgvector, Qdrant, Pinecone)
## Workflow (numbered)
1. Store tenant_id as metadata/column with every vector during ingestion
2. Apply `WHERE tenant_id = ?` filter on every vector search query
3. For pgvector: add `->where('tenant_id', $tenantId)` before vector similarity scope
4. For Qdrant: use payload filter on tenant_id field
5. For Pinecone: use namespace isolation per tenant
6. Test cross-tenant isolation: user A's queries never return user B's documents
7. Log and alert on any vector query without tenant filter
8. Add global query scope or middleware to enforce tenant filter automatically
## Validation Checklist
- [ ] Every vector stores tenant_id metadata
- [ ] Every vector query includes tenant filter
- [ ] Cross-tenant isolation tested and verified (user A cannot access user B's data)
- [ ] Missing tenant filter triggers alert or is blocked
- [ ] Global scope/middleware enforces tenant filter
- [ ] Row-level (pgvector), collection-level (Qdrant), or namespace-level (Pinecone) isolation implemented
## Common Failures
- Forgetting tenant filter on vector query — cross-tenant data leakage
- Post-retrieval filtering instead of DB-level — timing side-channel
- Restoring backup across environments — tenant ID mismatch
- Application-layer filtering only — HNSW index may still expose cross-tenant neighbors approximately
## Decision Points
- **Isolation strategy**: Row-level filtering (pgvector) for simplicity; collection-level (Qdrant) for strict isolation; namespace (Pinecone) for logical separation
- **Global enforcement**: Query scopes (Laravel global scopes) vs middleware vs manual filter
## Performance Considerations
- Tenant filter on indexed column: negligible overhead (<1ms)
- Per-tenant collections (Qdrant): no cross-tenant filtering cost, but more collections to manage
- Row-level with shared HNSW index: filtering happens after ANN search — may retrieve cross-tenant candidates that are then filtered
## Security Considerations
- Missing tenant filter = data leakage vulnerability — most critical RAG security concern
- Use query scopes or middleware to enforce tenant filter automatically
- Test cross-tenant isolation as part of security test suite
- Never rely on post-retrieval filtering alone
- Log any vector query executed without tenant context
## Related Rules (from 05-rules.md)
- Always Apply Tenant Filter on Vector Queries
## Related Skills
- Implement pgvector Vector Search in Laravel
- Select Vector Database Using Decision Framework
- Implement RAG Security and Data Governance
## Success Criteria
- Cross-tenant data leakage prevented (verified by security tests)
- Every vector query includes tenant filter (enforced by global scope)
- Tenant isolation works across all retrieval paths (search, similar, browse)
- Isolation strategy documented for the chosen vector database
