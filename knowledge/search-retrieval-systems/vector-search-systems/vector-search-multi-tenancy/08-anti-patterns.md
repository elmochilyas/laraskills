# Anti-Patterns: Vector Search Multi-Tenancy

## Metadata

| | |
|---|---|
| **KU ID** | ku-15 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Vector Search Multi-Tenancy |
| **Source** | Qdrant / Pinecone / Industry |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Per-Tenant Collections for Most Use Cases | Architecture | Medium |
| 2 | Unenforced Tenant ID Filter | Security | Critical |
| 3 | No Index on tenant_id Field | Performance | Medium |
| 4 | Unmonitored Tenant Data Balance | Scalability | Medium |

## Repository-Wide Anti-Patterns

- **Collection-Per-Tenant at Scale**: Managing hundreds of collections instead of using shared + filtering
- **Unfiltered Multi-Tenant Queries**: Running vector search without tenant filter, leaking cross-tenant data
- **Silent Unbalance**: One tenant growing 100× and degrading search for all others

---

## 1. Per-Tenant Collections for Most Use Cases

**Category:** Architecture

**Description:** Creating a separate vector store collection/index per tenant instead of using shared collection with tenant ID filtering.

**Why It Happens:** Per-tenant collections seem conceptually clean. The overhead is not visible at small scale (5-10 tenants).

**Warning Signs:**
- Collection/index name includes tenant ID
- Dozens of collections exist
- Adding a tenant requires collection creation

**Why Harmful:** Per-tenant collections don't scale beyond 100s of tenants, cause inefficient segment merging (Qdrant) or index management (Pinecone), and prevent cross-tenant operations.

**Consequences:**
- Excessive management overhead
- Inefficient resource utilization
- Slow tenant provisioning

**Alternative:** Use shared collection with tenant_id payload/namespace filtering.

**Refactoring Strategy:**
1. Create single shared collection
2. Add tenant_id to all points
3. Update queries to filter by tenant_id
4. Delete per-tenant collections

**Detection Checklist:**
- [ ] Is shared collection used with tenant filtering?
- [ ] Are per-tenant collections avoided?

**Related Rules/Skills/Trees:**
- Rule: Prefer Shared Collection with tenant_id Filter (`05-rules.md:1-37`)

---

## 2. Unenforced Tenant ID Filter

**Category:** Security

**Description:** Running vector search queries without including a tenant_id filter, returning results from all tenants.

**Why It Happens:** Some query code paths omit the filter. There is no enforcement at the application or middleware level.

**Warning Signs:**
- Some search queries don't include tenant filter
- Tenant A can see Tenant B's search results
- No middleware enforces tenant filtering

**Why Harmful:** Cross-tenant data leakage is a critical security and compliance violation (GDPR, SOC2).

**Consequences:**
- Data privacy breach
- Compliance violation
- Loss of customer trust

**Alternative:** Enforce tenant_id filter in every query via middleware or query builder wrapper.

**Refactoring Strategy:**
1. Create query builder that always includes tenant_id
2. Replace all raw query calls with builder
3. Add integration tests for isolation

**Detection Checklist:**
- [ ] Is tenant_id filter enforced on every query?
- [ ] Are there unfiltered query code paths?

**Related Rules/Skills/Trees:**
- Rule: Enforce Tenant ID Filter on Every Query (`05-rules.md:39-70`)

---

## 3. No Index on tenant_id Field

**Category:** Performance

**Description:** Not creating an index on the tenant_id column in pgvector or payload index in Qdrant.

**Why It Happens:** Developers add the tenant_id column but forget the index. Queries work slowly.

**Warning Signs:**
- No B-tree index on tenant_id
- No payload index on tenant_id in Qdrant
- Tenant filtering adds significant query latency

**Why Harmful:** Without index, tenant filtering requires full scan, negating the benefit of pre-filtering.

**Consequences:**
- Slow tenant-filtered queries
- Poor UX for all tenants

**Alternative:** Create B-tree index on tenant_id (pgvector) or payload index (Qdrant).

**Refactoring Strategy:**
1. Create index on tenant_id
2. Verify query latency improvement

**Detection Checklist:**
- [ ] Is tenant_id indexed?
- [ ] Does EXPLAIN show index usage?

**Related Rules/Skills/Trees:**
- Rule: Index tenant_id for Fast Pre-Filtering (`05-rules.md:72-101`)

---

## 4. Unmonitored Tenant Data Balance

**Category:** Scalability

**Description:** Not monitoring the data volume distribution across tenants, allowing one tenant to dominate and degrade performance for all.

**Why It Happens:** Data distribution changes gradually. Without monitoring, imbalance goes unnoticed until performance degrades.

**Warning Signs:**
- One tenant has significantly more vectors than others
- Query latency increased for all tenants
- No tenant size monitoring

**Why Harmful:** In shared collections, a large tenant skews the index distribution (IVFFlat centroids shift, HNSW graph is unbalanced), degrading search for all tenants.

**Consequences:**
- Performance degradation for all tenants
- Hard to diagnose cause
- Emergency tenant migration needed

**Alternative:** Monitor tenant data volume distribution and alert on imbalance.

**Refactoring Strategy:**
1. Implement tenant size tracking (count vectors per tenant)
2. Set alert if any tenant exceeds threshold (e.g., 20% of total)
3. Plan for large-tenant isolation if needed

**Detection Checklist:**
- [ ] Is tenant data distribution monitored?
- [ ] Are alerts configured for imbalance?

**Related Rules/Skills/Trees:**
- Rule: Monitor Tenant Data Balance (`05-rules.md:103-133`)
