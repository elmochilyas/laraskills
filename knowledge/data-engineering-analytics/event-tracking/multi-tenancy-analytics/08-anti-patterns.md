# Anti-Patterns: Multi-Tenancy Analytics

## Shared Cache Without Tenant Prefix
A single cache pool for all tenants with no tenant identifier in cache keys. Tenant A's dashboard widget response is returned to Tenant B when the cache key matches. This is one of the most common and dangerous multi-tenant bugs.

**Solution:** Always prefix cache keys with the tenant identifier. Use a cache key builder that enforces tenant scoping.

## Late Tenant Resolution
Tenant identity is resolved at query time rather than at ingestion. The analytics pipeline stores events without tenant context, and filtering is done at read time. This prevents per-tenant partitioning, indexing, and TTL enforcement.

**Solution:** Resolve tenant at the middleware layer and store the tenant ID with every event record.

## "It's Just a WHERE Clause"
Assuming that adding a `->where('tenant_id', $id)` to every query is sufficient isolation. Application bugs, missing scopes, and ad-hoc queries bypass this filter.

**Solution:** Implement defense in depth: application-level scoping, database-level RLS or schema isolation, and monitoring that alerts on cross-tenant access patterns.

## One Queue to Rule Them All
All tenants share a single queue. One tenant's massive data import or export operation queues millions of jobs, delaying all other tenants' real-time analytics processing.

**Solution:** Use tenant-dedicated queues or priority queue with per-tenant rate limiting.

## Ignoring Tenant Tier Differences
Treating all tenants identically in the analytics infrastructure. Enterprise tenants may need dedicated resources, longer retention, or custom processing while small tenants share resources.

**Solution:** Implement tenant tiering with per-tier resource allocation, retention periods, and processing guarantees.
