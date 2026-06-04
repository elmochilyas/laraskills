# Knowledge Unit: Multi-Tenant Vector Isolation

## Metadata

- **ID:** KU-033
- **Subdomain:** Vector Database Integration
- **Slug:** multi-tenant-vector-isolation
- **Version:** 1.0.0
- **Maturity:** Emerging (documented gap)
- **Status:** Published

## Executive Summary

Multi-tenant vector isolation ensures each tenant's embeddings cannot leak into other tenants' search results. Strategies range from row-level filtering (pgvector) to separate collections (Qdrant) to namespaces (Pinecone). The critical risk is cross-tenant data leakage in shared vector indexes — a reported gap in the ecosystem with limited documented patterns for Laravel.

## Core Concepts

- **Row-level isolation**: pgvector: add `WHERE tenant_id = ?` to every vector query — vectors are in same table, filtered by tenant
- **Collection-level isolation**: Qdrant: separate collection per tenant — no cross-tenant access possible
- **Namespace isolation**: Pinecone: logical namespace within shared index — metadata-driven separation
- **Shared index risks**: HNSW index on shared table still allows approximate cross-tenant neighbor proximity
- **Leakage vectors**: Direct vector search without tenant filter, backup restoration across tenants, index statistics disclosure

## Mental Models

- **Database schema isolation for AI**: Like multi-tenant databases — shared table with tenant_id (row-level), separate database per tenant (collection-level), or separate server (instance-level). Each has different isolation guarantees.
- **Tenant namespace**: Think of each tenant having their own "search space" — vectors from other tenants simply don't exist in that space.

## Internal Mechanics

**pgvector row-level isolation**:
- Single `documents` table with `tenant_id` column and `embedding` vector column
- Every query: `WHERE tenant_id = ? AND embedding <=> ? ORDER BY ... LIMIT ?`
- HNSW index cannot include tenant_id — approximate search may return results from wrong tenant if filter is incorrectly applied
- Risk: omitting the `WHERE tenant_id` clause returns cross-tenant results

**Qdrant collection isolation**:
- Separate collection per tenant (e.g., `tenant_123_docs`)
- Collection-level API key permissions possible
- Complete isolation — no shared index, no cross-tenant proximity
- Cost: per-collection overhead, separate HNSW index per tenant

**Pinecone namespace isolation**:
- Single index, logical namespaces (`tenant_123`)
- Query scoped to namespace automatically
- Underlying index is shared — statistical cross-tenant leakage still theoretically possible
- Simpler than separate indexes but weaker isolation

## Patterns

- **Scoped repository**: `DocumentRepository` always applies `tenant_id` filter — never expose raw `whereVectorSimilarTo` without scoping
- **Multi-driver per tenant**: Large tenants get dedicated collection/index, small tenants share with row-level filter
- **Audit log**: Log every vector query with tenant_id — detect missing filters in production
- **Index-per-tenant (pgvector)**: Use PostgreSQL schemas or partitioned tables for true isolation — advanced, adds ops complexity
- **Tenant-aware tool**: `SimilaritySearch` tool receives tenant context via constructor injection (never from prompt)

## Architectural Decisions

- **Decision**: Row-level vs. collection-level → Row-level (pgvector) for <100 tenants or <10M vectors total. Collection-level (Qdrant) for >100 tenants or compliance-driven isolation requirements.
- **Decision**: Application-enforced vs. database-enforced → Database-enforced (RBAC, row-level security) as defense-in-depth; application-enforced as primary mechanism.
- **Decision**: Shared vs. isolated index → Shared for cost efficiency; isolated for compliance (healthcare, finance) or when tenant data sizes vary dramatically (one tenant has 10M vectors, others have 1K).

## Tradeoffs

| Strategy | Isolation | Complexity | Cost | Best For |
|----------|-----------|------------|------|----------|
| Row-level (pgvector) | Soft (app-layer) | Low | Free | Most B2B SaaS |
| PostgreSQL RLS | Strong (DB-layer) | Medium | Free | Compliance-mandated |
| Separate collection (Qdrant) | Strong | Medium | Per-collection overhead | Compliance, large tenants |
| Namespace (Pinecone) | Medium | Low | Per-namespace included | Serverless |
| Separate index/DB | Strongest | High | High | Regulated industries |

## Performance Considerations

- Row-level filter on pgvector: `tenant_id` index + HNSW index → two-stage query (first filter by tenant, then vector search). For small tenants, all vectors may be filtered before HNSW.
- Qdrant per-collection: index per tenant — small tenants have tiny indexes (fast), large tenants have dedicated resources
- pgvector RLS: slight overhead per query (policy check)
- HNSW + tenant filter: if tenant has few vectors, HNSW may not be beneficial — brute-force is faster for <1K vectors per tenant

## Production Considerations

- Test cross-tenant leakage with penetration testing — intentionally attempt to search other tenant's vectors
- Implement tenant ID injection via middleware — never trust tenant ID from user input
- Use read-only database connections for vector queries — prevent cross-tenant data modification
- Monitor for missing tenant_id in queries — log warnings when queries lack tenant filter
- Backup strategy: ensure backups are tenant-restorable for compliance (GDPR right to deletion)
- Cache vector query results per tenant — don't share cache keys across tenants

## Common Mistakes

- Omitting tenant filter in vector query — returns cross-tenant results (data leakage)
- Passing tenant ID via prompt/tool input — allows prompt injection to change tenant scope
- Sharing HNSW index across tenants without tenant filter — approximate search may leak proximity
- Assuming namespace isolation is complete — Pinecone namespaces share underlying index structure
- Not testing cross-tenant leakage in QA — undetected until production incident
- Using same vector DB credentials across tenants — no audit trail for which tenant accessed which vectors

## Failure Modes

- **Missing tenant filter**: Application code path without `where('tenant_id', ...)` — cross-tenant data returned
- **Tenant ID injection**: Malicious actor provides other tenant's ID — if not server-validated, data leaks
- **Index-level leakage**: HNSW graph structure reveals information about other tenants' vectors (theoretical, hard to exploit)
- **Backup leakage**: Shared backup restored to different environment exposes all tenants' vectors
- **Cache collision**: Vector query cache key without tenant discriminator — returns other tenant's results

## Ecosystem Usage

- `moneo/laravel-rag` driver supports per-tenant filtering via callable scoping on SimilaritySearch
- No dedicated multi-tenant vector package exists for Laravel — application-level implementation required
- pgvector RLS policies: `CREATE POLICY tenant_isolation ON documents USING (tenant_id = current_setting('app.tenant_id')::int)`
- Qdrant collection-per-tenant is common in regulated Laravel deployments

## Related Knowledge Units

- KU-028: pgvector Native Support
- KU-030: Qdrant Integration
- KU-032: Vector Database Selection Framework

## Research Notes

- Cross-tenant vector leakage is identified as a documented gap in the Laravel AI ecosystem
- No standardized pattern exists — each team implements tenant isolation differently
- PostgreSQL Row-Level Security is the strongest isolation option for pgvector
- Qdrant's collection-per-tenant is architecturally cleanest but operationally expensive at >100 tenants
- The SimilaritySearch tool's closure-based scoping (`->where(fn($q) => $q->where('tenant_id', $id))`) is the recommended Laravel AI SDK approach
