# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** ReBAC (Relationship-Based Access Control)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | ReBAC vs RBAC vs ABAC | Choosing authorization model | architectural, maintainability, security |
| 2 | Relationship Storage Strategy | How to store relationship tuples | architectural, maintainability, performance |
| 3 | ReBAC Consistency & Caching Model | Balancing consistency guarantees with performance | security, performance, reliability |

---

# Architecture-Level Decision Trees

---

## ReBAC vs RBAC vs ABAC

---

## Decision Context

Choosing the authorization architecture: ReBAC (relationship tuples), RBAC (role-permission database), or ABAC (attribute-based rules engine).

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Do users need per-resource relationship assignments (user A is editor on doc X, viewer on doc Y)?
↓
YES → ReBAC is the primary model
NO → RBAC or ABAC

Does access depend on a graph of relationships (workspace → project → document → comment)?
↓
YES → ReBAC with hierarchical relation expansion (Zanzibar-style)
NO → Simple relationship checks may suffice

Is authorization purely role-based with no per-resource distinctions?
↓
YES → RBAC (spatie/laravel-permission) — simpler, no relationship tuples
NO → Is authorization based on dynamic attributes (time, location, device)?
    YES → ABAC (attribute-based rules engine)
    NO → ReBAC (per-resource relationships)

Does the application have fewer than 5 relationship types and flat ownership?
↓
YES → Consider a simple pivot table instead of full ReBAC graph
NO → Full ReBAC tuple store with relation expansion

---

## Rationale

ReBAC is purpose-built for per-resource relationship-based access (Google Drive-style sharing). RBAC handles role-based access at the application level (80% of use cases). ABAC addresses attribute-based scenarios (time, location, risk). Many applications combine RBAC for base roles with ReBAC for shared resource access on top. Starting with RBAC and adding ReBAC only where relationships are needed prevents over-engineering.

---

## Recommended Default

**Default:** RBAC for application-level roles; ReBAC layered on top only for shared resources with per-resource relationships
**Reason:** RBAC covers most authorization needs with lower complexity. ReBAC adds relationship tuple tables and graph traversal. Premature ReBAC adoption increases complexity without benefit when simple role checks suffice.

---

## Risks Of Wrong Choice

- ReBAC for simple apps: unnecessary tuple storage, graph traversal overhead, harder to debug
- RBAC for shared resources: cannot express per-resource relationships without complex workarounds
- ABAC for relationship-based access: rules engine ill-suited for graph traversal
- No authorization model: ad-hoc checks scattered through codebase

---

## Related Rules

- Start With RBAC, Add ReBAC Only Where Relationships Are Needed (05-rules.md)

---

## Related Skills

- Implement Relationship-Based Access Control for Graph-Like Permissions (06-skills.md)

---

## Relationship Storage Strategy

---

## Decision Context

How to store relationship tuples — dedicated resource_relationships table vs embedded in resource model.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Does every resource have exactly one owner (no sharing, no editors/viewers)?
↓
YES → Simple owner column on resource table (no ReBAC needed)
NO → ReBAC is in play — need relationship storage

Will you need to query "what resources does user X have access to?"
↓
YES → Dedicated relationship tuples table (indexed queryable)
NO → Could embed in resource JSON, but still prefer dedicated table

Are relationships between entities nested (org → team → project → doc)?
↓
YES → Dedicated table with resource_type + resource_id + polymorphic subject
NO → Dedicated table still preferred for queryability

Does the relationship data change frequently (grants/revokes multiple times per day)?
↓
YES → Dedicated table with foreign keys and cascading deletes
NO → Still use dedicated table — JSON columns are not worth the risk

---

## Rationale

A dedicated `resource_relationships` table with columns for `resource_type`, `resource_id`, `relation`, and `user_id` supports efficient indexed queries, cascading deletes, and relationship traversal. Embedding relationships in resource columns (e.g., JSON, comma-separated IDs) makes it impossible to efficiently query "what resources does user X have access to?" and prevents proper cascade on resource deletion.

---

## Recommended Default

**Default:** Dedicated `resource_relationships` table with `resource_type`, `resource_id`, `relation`, `user_id`, and unique composite index
**Reason:** Queryable, indexable, supports cascading deletes, and enables relation expansion for graph traversal. The composite unique index prevents duplicate relationship tuples.

---

## Risks Of Wrong Choice

- JSON column in resource table: not queryable, no indexing, no cascade, hard to maintain
- Polymorphic without type scoping: wrong resource types mixed in queries, confusion
- No unique constraint: duplicate relationship tuples, confused authorization results
- Embedding in resource code: every resource type duplicates relationship logic

---

## Related Rules

- Store Relationship Tuples in a Dedicated Table (05-rules.md)
- Cascade Delete Relationships When Resources Are Deleted (05-rules.md)

---

## Related Skills

- Implement Relationship-Based Access Control for Graph-Like Permissions (06-skills.md)

---

## ReBAC Consistency & Caching Model

---

## Decision Context

Balancing strong consistency guarantees (immediate revocation) with performance (caching for repeated checks).

---

## Decision Criteria

* security
* performance
* reliability

---

## Decision Tree

Does immediate revocation of access matter for security (shared docs with sensitive data)?
↓
YES → Strong consistency (DB transactions, READ COMMITTED, no cache or short TTL)
NO → Eventual consistency with caching may be acceptable

How frequently do relationship changes occur?
↓
HOURLY → Cache with short TTL (60-300s) to balance freshness and performance
DAILY → Cache with longer TTL (300-3600s) — infrequent changes
REAL-TIME COLLAB → No cache or cache-bust on write (each change visible immediately)

Is the relationship graph deep (3+ levels of nesting)?
↓
YES → Cache resolved graph paths per user+resource to avoid repeated traversal
NO → Single-level cache key (user_id + resource_id + relation) is sufficient

Are relationship checks on the critical request path (every page load)?
↓
YES → Cache aggressively, invalidate on relationship change
NO → Cache optional — acceptable to query on every check

---

## Rationale

ReBAC authorization decisions must be based on the latest relationship state. Strong consistency (database transactions with READ COMMITTED isolation) ensures revoked users lose access immediately. However, relationship queries and graph traversals are expensive. Caching with appropriate TTL reduces repeated lookups. The trade-off: longer TTL means stale access, shorter TTL means more database load. For real-time collaboration, cache-bust on write or skip caching entirely.

---

## Recommended Default

**Default:** Strong consistency for writes (transactions, READ COMMITTED); cache reads for 300s with cache-bust on relationship change
**Reason:** Transactions prevent partial updates that could leave stale relationships. 300s TTL balances performance with acceptable staleness. Cache-busting on write ensures the user who made the change sees it immediately.

---

## Risks Of Wrong Choice

- No caching: every request queries relationship table, graph traversal for deep hierarchies
- Long TTL without invalidation: revoked user retains access until cache expiry
- Eventual consistency without transaction: partial changes, orphaned tuples
- Cache-bust on every write: high write-throughput applications invalidate too frequently

---

## Related Rules

- Use Strong Consistency for Relationship Changes (05-rules.md)
- Cache Resolved Relationship Queries (05-rules.md)
- Log All Relationship Changes for Audit (05-rules.md)

---

## Related Skills

- Implement Relationship-Based Access Control for Graph-Like Permissions (06-skills.md)
