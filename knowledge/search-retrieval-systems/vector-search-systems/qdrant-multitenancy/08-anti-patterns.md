# Anti-Patterns: Qdrant Multitenancy

## Metadata

| | |
|---|---|
| **KU ID** | K052 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Qdrant Multitenancy |
| **Source** | Qdrant Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Per-Tenant Collections Instead of Payload Filtering | Architecture | Medium |
| 2 | No tenant_id Filter in Search Queries | Security | Critical |
| 3 | No Payload Index on tenant_id | Performance | Medium |
| 4 | Untested Cross-Tenant Isolation | Security | High |

## Repository-Wide Anti-Patterns

- **Collection-Per-Tenant Approach**: Creating separate Qdrant collections per tenant, missing the benefits of single-collection payload filtering
- **Unenforced Tenant Filtering**: Adding tenant_id to payload but not ensuring it is always included in queries
- **Selectivity Assumption**: Assuming tenant_id filters are always selective without monitoring

---

## 1. Per-Tenant Collections Instead of Payload Filtering

**Category:** Architecture

**Description:** Creating a separate Qdrant collection per tenant instead of using a single collection with tenant_id payload filtering.

**Why It Happens:** Separate collections feel conceptually clean. Teams come from relational database thinking (one table per tenant). The Qdrant recommendation for single-collection + filtering is discovered later.

**Warning Signs:**
- Collection name includes tenant ID
- Dozens of collections exist in Qdrant
- Each new tenant requires collection creation
- Collection configuration must be replicated across tenants
- Segment merging is inefficient (many small collections)

**Why Harmful:** Qdrant optimizes segment merging and indexing for a single large collection rather than many small ones. Per-tenant collections create management overhead (create, index, backup each collection), inefficient segment merging (each small collection has its own segments), and non-scalable operations (querying across tenants requires querying all collections).

**Consequences:**
- Excessive collection management overhead
- Inefficient segment merging (many small collections)
- Slower indexing per collection
- Monitoring fragmentation
- Inability to scale to hundreds of tenants

**Alternative:** Use a single collection with tenant_id in the payload. Filter by tenant_id at query time.

**Refactoring Strategy:**
1. Create a single consolidated collection
2. Add tenant_id to each point's payload during migration
3. Update queries to filter by tenant_id
4. Delete per-tenant collections after verification
5. Create payload index on tenant_id

**Detection Checklist:**
- [ ] Is a single collection used with payload filtering?
- [ ] Are per-tenant collections avoided?
- [ ] Does the payload include tenant_id for every point?
- [ ] Can new tenants be added without collection creation?

**Related Rules/Skills/Trees:**
- Rule: Use Payload-Based Partitioning for Multi-Tenancy (`05-rules.md:1-38`)
- Skill: Configure and Implement Qdrant Multitenancy (`06-skills.md:1-78`)

---

## 2. No tenant_id Filter in Search Queries

**Category:** Security

**Description:** Querying Qdrant without including a tenant_id filter, returning vectors from all tenants and leaking cross-tenant data.

**Why It Happens:** The query code does not enforce the tenant_id filter. It relies on the developer remembering to add it. Code paths (API routes, background jobs, admin tools) may omit the filter. There is no enforcement at the Qdrant or application middleware level.

**Warning Signs:**
- Some search query code paths do not include tenant_id filter
- Tenant A searches can see Tenant B's data
- Admin tools or background jobs query without tenant filter
- No middleware or interceptor enforces tenant filtering
- Cross-tenant queries are possible (and not intentional)

**Why Harmful:** Without enforced tenant filtering, any query returns results from all tenants. This is a data privacy violation — one tenant can discover another tenant's vector data. In production, this is a compliance breach (GDPR, SOC2). The bug is silent: queries work, return results, and there is no error.

**Consequences:**
- Cross-tenant data leakage
- Privacy violation and compliance breach
- Loss of customer trust if discovered
- Legal and regulatory penalties
- Data exfiltration risk via vector search API

**Alternative:** Enforce tenant_id filtering at the application layer. Use a query builder or middleware that automatically includes the current tenant's ID filter. Never allow unfiltered queries.

**Refactoring Strategy:**
1. Audit all Qdrant search query code paths
2. Add tenant_id filter to every search query
3. Create a query builder wrapper that enforces tenant filtering
4. Add integration tests that verify cross-tenant isolation
5. Remove any code paths that bypass tenant filtering

**Detection Checklist:**
- [ ] Is tenant_id filter included in every search query?
- [ ] Are there any unfiltered query code paths?
- [ ] Is tenant filtering enforced by middleware or query builder?
- [ ] Are integration tests verifying cross-tenant isolation?
- [ ] Is there an audit log of queries without tenant_id?

**Related Rules/Skills/Trees:**
- Rule: Always Enforce tenant_id Filter (`05-rules.md:40-74`)
- Skill: Configure and Implement Qdrant Multitenancy (`06-skills.md:1-78`)

---

## 3. No Payload Index on tenant_id

**Category:** Performance

**Description:** Filtering by tenant_id without creating a payload index on the field, causing full scan of all points' payloads on every query.

**Why It Happens:** Payload indexes must be explicitly created. The Qdrant API does not create them automatically. Developers may not know about payload indexes or may defer index creation.

**Warning Signs:**
- No `create_payload_index` call for `tenant_id`
- Query latency increases as total collection size grows
- EXPLAIN-type analysis shows payload scan instead of index lookup
- tenant_id filtering adds significant query overhead
- No payload index creation in collection setup

**Why Harmful:** Without a payload index, Qdrant must scan every point's payload to find matching tenant_ids. This adds O(n) overhead to every query, negating the performance benefit of filter-integrated ANN. As the collection grows, the filtering overhead grows proportionally.

**Consequences:**
- Query latency increases linearly with collection size
- Filter overhead dominates query time for large collections
- Poor performance compared to indexed filtering
- Scalability limits hit sooner than necessary

**Alternative:** Create a payload index on tenant_id: keyword type for exact match, integer type if tenant IDs are numeric.

**Refactoring Strategy:**
1. Create payload index on tenant_id
2. Use keyword type for string tenant IDs
3. Verify query latency reduction
4. Document payload index creation in collection setup

**Detection Checklist:**
- [ ] Is there a payload index on tenant_id?
- [ ] Was the index created before production traffic?
- [ ] Is query latency monitored?
- [ ] Are payload indexes documented for all filtered fields?

**Related Rules/Skills/Trees:**
- Rule: Create Payload Index on tenant_id (`05-rules.md:76-108`)

---

## 4. Untested Cross-Tenant Isolation

**Category:** Security

**Description:** Deploying multi-tenant vector search without testing that tenant_id filtering prevents cross-tenant data leakage.

**Why It Happens:** Teams implement tenant filtering and assume it works correctly. Testing cross-tenant isolation requires specific scenarios (missing filter, wrong filter, empty filter) that are easy to overlook.

**Warning Signs:**
- No integration test for cross-tenant isolation
- No security testing for data leakage scenarios
- Tenant A can query Tenant B's data in manual testing
- Different authentication levels bypass tenant filters
- No automated checks prevent unfiltered queries

**Why Harmful:** Cross-tenant data leakage is a critical security vulnerability. Without testing, a bug in tenant filtering (wrong field name, case sensitivity, null filter) can expose all tenants' data silently. The vulnerability may exist for months before discovery.

**Consequences:**
- Undetected cross-tenant data leakage
- Compliance violation discovered during audit
- Customer data exposure
- Security incident requiring disclosure
- Legal liability and reputational damage

**Alternative:** Write integration tests that verify: Tenant A cannot see Tenant B's results, unfiltered queries return empty or error, and tenant filter is case-sensitive and exact-matched.

**Refactoring Strategy:**
1. Write integration tests for cross-tenant isolation
2. Test: Tenant A queries with Tenant B's filter → empty results
3. Test: Missing tenant_id filter → no results or error
4. Test: Wrong tenant_id format → no results
5. Run tests in CI pipeline
6. Add periodic security testing

**Detection Checklist:**
- [ ] Are there integration tests for cross-tenant isolation?
- [ ] Do tests cover missing/wrong/empty tenant filters?
- [ ] Are isolation tests run in CI?
- [ ] Is there periodic security testing for data leakage?

**Related Rules/Skills/Trees:**
- Rule: Test Filter Selectivity for Tenant Isolation (`05-rules.md:110-140`)
