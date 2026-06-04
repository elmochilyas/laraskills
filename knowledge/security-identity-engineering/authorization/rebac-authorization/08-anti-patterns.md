# Anti-Patterns: ReBAC (Relationship-Based Access Control)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | ReBAC (Relationship-Based Access Control) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-RE-01 | Embedding Relationships in Resource Columns | High | High | High |
| AP-RE-02 | Eventually Consistent ReBAC | Critical | Medium | Medium |
| AP-RE-03 | Orphaned Relationship Tuples | Medium | High | Low |
| AP-RE-04 | Uncached Relationship Traversal | High | Medium | Low |
| AP-RE-05 | ReBAC Without RBAC Foundation | Medium | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **No Relationship Type Vocabulary**: Inconsistent relationship names (owner, admin, manager used interchangeably)
- **ReBAC for Simple Ownership**: Using relationship tuples when a simple `owner_id` column suffices
- **No Cascade on Resource Delete**: Relationship tuples accumulate when resources are deleted

---

## 1. Embedding Relationships in Resource Columns

### Category
Architecture · Maintainability

### Description
Storing user-resource relationships in resource table columns (JSON arrays, comma-separated IDs) instead of a dedicated relationship tuples table.

### Why It Happens
Adding a `shared_with` JSON column to the resource table is the path of least resistance. It doesn't require a new migration or model. For simple sharing ("add a few viewers"), it seems adequate. The problems become apparent when the application needs to answer "what resources does user X have access to?" — a query that requires scanning every resource table.

### Warning Signs
- Resource tables have JSON columns like `shared_with`, `editors`, or `viewers`
- Resource tables have comma-separated user ID columns
- Querying "all resources accessible by user X" requires full table scans
- No dedicated `resource_relationships` table exists
- Relationship queries use `LIKE '%user_id%'` pattern matching

### Why Harmful
Embedded relationships cannot be indexed for efficient querying. Finding all resources a user has access to requires scanning every row of every resource table. This doesn't scale beyond a few hundred records. Relationship changes (grant, revoke) require reading and writing the entire JSON column, risking race conditions. Cascade deletes are impossible — deleting a user or resource leaves orphaned references in JSON columns.

### Real-World Consequences
- "My shared documents" page times out because it scans all resource tables
- Revoking user access requires locating every JSON column that references them
- Race condition: two simultaneous share operations on the same resource overwrite each other
- Database migration to fix this requires rewriting every resource row

### Preferred Alternative
Store relationship tuples in a dedicated `resource_relationships` table with indexed columns.

### Refactoring Strategy
1. Create a `resource_relationships` migration: `resource_type`, `resource_id`, `relation`, `user_id`
2. Write a data migration to extract relationships from JSON/embedded columns
3. Add unique compound index on `[resource_type, resource_id, relation, user_id]`
4. Remove JSON/embedded columns from resource tables
5. Update all queries to use the relationship table
6. Add cascade deletes for user and resource removal

### Detection Checklist
- [ ] Are relationships stored in JSON or embedded columns on resource tables?
- [ ] Can you efficiently query "all resources user X can access"?
- [ ] Are there `LIKE '%user_id%'` patterns in queries?
- [ ] Is there a dedicated relationship tuples table?
- [ ] Can relationships be indexed and queried efficiently?

### Related Rules/Skills/Trees
- Store Relationship Tuples in a Dedicated Table (05-rules.md)
- Implement Relationship-Based Access Control for Graph-Like Permissions (06-skills.md)
- Relationship Storage Strategy decision tree (07-decision-trees.md)

---

## 2. Eventually Consistent ReBAC

### Category
Security · Critical

### Description
Using eventual consistency for ReBAC relationship changes, allowing revoked users to retain access for a period after the relationship is removed.

### Why It Happens
Eventual consistency is common in distributed systems and caching layers. Developers apply the same pattern to ReBAC — cache the authorization decision with a TTL. When a relationship is revoked, the cache isn't invalidated immediately, so the user retains access until the TTL expires.

### Warning Signs
- Relationship changes use caching with TTL but no immediate invalidation
- User reports "I removed their access but they can still see the document"
- Cache-aside pattern for authorization without write-through invalidation
- Relationship grant/revoke does not execute in a database transaction
- No synchronous cache invalidation after relationship changes

### Why Harmful
ReBAC authorization decisions must reflect the current relationship state. If a relationship is revoked but the cached decision persists, the former collaborator retains access. For sensitive resources, minutes or seconds of stale authorization can lead to data exposure.

### Real-World Consequences
- Employee removed from team but retains document access for 5 minutes — downloads sensitive data
- Document share revoked but collaborator still sees it in their shared list due to cache
- Compliance violation: "Access revocation must take effect immediately"
- Security incident: timed cache window exploited by insider threat

### Preferred Alternative
Use strong consistency for relationship changes. Execute grants and revokes within database transactions. Invalidate caches synchronously after relationship changes.

### Refactoring Strategy
1. Wrap all relationship changes (grant, revoke, transfer) in database transactions
2. Implement synchronous cache invalidation after relationship mutations
3. For cached authorization decisions, use write-through invalidation
4. Remove TTL-based eventual consistency for authorization data
5. Add a test that verifies revocation takes effect immediately

### Detection Checklist
- [ ] Are relationship changes executed in database transactions?
- [ ] Is authorization cache invalidated immediately after relationship changes?
- [ ] Does revoked access take effect immediately?
- [ ] Is there a window where revoked users retain access?
- [ ] Is eventual consistency used for authorization decisions?

### Related Rules/Skills/Trees
- Use Strong Consistency for Relationship Changes (05-rules.md)
- Implement Relationship-Based Access Control for Graph-Like Permissions (06-skills.md)
- ReBAC Consistency & Caching Model decision tree (07-decision-trees.md)

---

## 3. Orphaned Relationship Tuples

### Category
Architecture · Maintainability

### Description
Failing to delete relationship tuples when a resource or user is deleted, leaving orphaned records that accumulate and cause confusion.

### Why It Happens
Relationship tuples reference resources and users via foreign keys. When a resource is deleted, the tuples are not automatically removed unless cascade deletes are configured. The tuples become orphaned — they reference entities that no longer exist. Over time, the relationship table fills with dead entries.

### Warning Signs
- Resource deleted but `resource_relationships` still has entries for it
- Relationship count exceeds the total number of active resources
- Queries on relationships return references to deleted resources
- No `cascadeOnDelete()` on relationship foreign keys
- No cleanup job for orphaned relationships

### Why Harmful
Orphaned tuples waste storage, slow down queries, and cause confusing behavior — a user may see "shared documents" that include deleted resources. If a new resource is created with the same ID as a deleted one, the orphaned relationship may grant access to the new resource unintentionally.

### Real-World Consequences
- "Shared with me" list shows deleted documents — users confused
- New document created with same ID as old one — old relationships grant unintended access
- Relationship table grows 30% with orphaned entries
- Support tickets: "Why can I see documents that were deleted?"
- Privacy concern: deleted resource relationships persist in database

### Preferred Alternative
Configure foreign key cascade deletes or implement model event handlers to clean up relationships on resource/user deletion.

### Refactoring Strategy
1. Add foreign key constraints with `cascadeOnDelete()` to relationship table
2. For polymorphic relationships (where FK constraints are not possible), add model event handlers
3. Implement a scheduled cleanup job for orphaned relationships as a safety net
4. Run a one-time cleanup to remove existing orphaned tuples
5. Add monitoring for orphaned tuple counts

### Detection Checklist
- [ ] Do relationship table foreign keys have `cascadeOnDelete()`?
- [ ] Are relationships cleaned up when a resource is deleted?
- [ ] Are there orphaned relationship tuples in the database?
- [ ] Can a new resource with an old ID inherit unintended relationships?
- [ ] Is there a periodic cleanup job for orphaned relationships?

### Related Rules/Skills/Trees
- Cascade Delete Relationships When Resources Are Deleted (05-rules.md)
- Implement Relationship-Based Access Control for Graph-Like Permissions (06-skills.md)

---

## 4. Uncached Relationship Traversal

### Category
Performance

### Description
Traversing the ReBAC relationship graph on every authorization request without caching, causing repeated queries for the same user-resource combination.

### Why It Happens
The first implementation of ReBAC simply queries the relationship table for each authorization check. This works fine at low traffic. As the application grows, the same user-resource combination is checked multiple times per page load (controller authorization + Blade `@can` directives). Without caching, each check repeats the same query.

### Warning Signs
- Same relationship query appears in the query log multiple times per page
- Relationship traversal involves 2+ queries that repeat on every request
- Nested relationship resolution (org → team → project → document) runs on every check
- No cache layer around ReBAC evaluation
- Page load time is proportional to the number of authorization checks

### Why Harmful
ReBAC evaluation can require multiple queries — traversing a relationship graph of depth N requires N queries. Without caching, every `@can` directive and `$this->authorize()` call repeats the traversal. A page with 5 authorization checks on a depth-3 hierarchy executes 15 queries just for authorization.

### Real-World Consequences
- Page with 10 `@can` directives on nested relationships executes 30+ authorization queries
- Server CPU 15% higher from repeated relationship traversals
- Page load time doubles for authorization-heavy views
- Database query count exceeds connection pool limits during traffic spikes

### Preferred Alternative
Cache resolved ReBAC decisions per user+resource combination. Invalidate the cache when relationships change.

### Refactoring Strategy
1. Design a cache key: `rebac:{user_id}:{resource_type}:{resource_id}:{relation}`
2. Implement cache-remember pattern around ReBAC evaluation
3. Set TTL based on relationship change frequency (5 minutes for moderate change rate)
4. Invalidate cache synchronously when relationships are modified
5. Monitor cache hit ratio — tune TTL and invalidation strategy

### Detection Checklist
- [ ] Are ReBAC authorization results cached?
- [ ] How many relationship queries execute per page load?
- [ ] Is graph traversal repeated for the same user-resource combination?
- [ ] Is cache invalidated on relationship changes?
- [ ] What is the cache hit ratio for ReBAC decisions?

### Related Rules/Skills/Trees
- Cache Resolved Relationship Queries (05-rules.md)
- Implement Relationship-Based Access Control for Graph-Like Permissions (06-skills.md)

---

## 5. ReBAC Without RBAC Foundation

### Category
Architecture · Maintainability

### Description
Implementing ReBAC as the sole authorization model without any RBAC layer, forcing all authorization — including application-level role checks — through relationship tuples.

### Why It Happens
ReBAC is powerful and expressive. For applications with complex sharing needs, it's tempting to use ReBAC for everything. The problem surfaces when simple permission checks like "can the user access the admin panel?" are forced into the relationship model, requiring awkward tuple structures for what should be a simple role check.

### Warning Signs
- Application-level permissions (dashboard access, feature flags) are modeled as relationships
- Simple role checks require relationship tuples — no role table exists
- Every authorization check, including trivial ones, goes through graph traversal
- No `$user->hasRole()` or `$user->can()` — all authorization is ReBAC
- Adding a new application-level permission requires relationship schema changes

### Why Harmful
ReBAC is designed for per-resource relationships, not application-level access control. Using it for everything makes simple checks unnecessarily complex and slow. Roles and permissions are better suited for application-level access. Mixing concerns makes the relationship graph harder to reason about and debug.

### Real-World Consequences
- "Can user view admin panel?" requires a relationship tuple lookup instead of a role check
- New feature flag requires adding relationship types to the vocabulary
- Security audit cannot distinguish between application access and resource sharing
- Authorization debugging requires understanding the full relationship graph

### Preferred Alternative
Use RBAC for application-level authorization (roles, permissions, feature flags). Layer ReBAC on top only for per-resource relationship-based access.

### Refactoring Strategy
1. Identify ReBAC checks that are actually application-level authorization
2. Replace them with RBAC role/permission checks
3. Create roles for common access patterns (admin, editor, viewer)
4. Keep ReBAC only for per-resource relationship grants
5. Update tests to reflect the hybrid model

### Detection Checklist
- [ ] Are application-level permissions (dashboard, features) in ReBAC?
- [ ] Is there an RBAC layer for role-based checks?
- [ ] Can a simple "is this user an admin?" check work without ReBAC?
- [ ] Are relationship types mixed with application permissions?
- [ ] Could 50%+ of ReBAC checks be replaced with simple role checks?

### Related Rules/Skills/Trees
- Start With RBAC, Add ReBAC Only Where Relationships Are Needed (05-rules.md)
- Implement Relationship-Based Access Control for Graph-Like Permissions (06-skills.md)
- ReBAC vs RBAC vs ABAC decision tree (07-decision-trees.md)
