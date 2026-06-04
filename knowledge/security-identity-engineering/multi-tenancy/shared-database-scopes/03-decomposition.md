# Decomposition: shared database scopes

## Topic Overview

Shared-database multi-tenancy uses a single database where each row is tagged with a `tenant_id` column. Eloquent global scopes automatically filter by the current tenant's ID on every query, preventing cross-tenant data leaks. The `BelongsToTenant` trait or a custom global scope enforces the filter. This is the simplest multi-tenancy model — low operational overhead, easy migrations, single backup — but carries the highest risk of cross-tenant data leaks if any query bypasses the global ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
shared-database-scopes/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### shared database scopes
- **Purpose:** Shared-database multi-tenancy uses a single database where each row is tagged with a `tenant_id` column. Eloquent global scopes automatically filter by the current tenant's ID on every query, preventing cross-tenant data leaks. The `BelongsToTenant` trait or a custom global scope enforces the filter. This is the simplest multi-tenancy model — low operational overhead, easy migrations, single backup — but carries the highest risk of cross-tenant data leaks if any query bypasses the global ...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Eloquent global scopes, Eloquent model events, Related: Database-per-tenant isolation pattern, stancl/tenancy package architecture, Advanced Follow-up: PostgreSQL Row-Level Security for hard tenant enforcement, Tenant-aware caching strategies, and Cross-tenant data leak detection testing

## Dependency Graph
**Depends on:** Prerequisites: Eloquent global scopes, Eloquent model events, Related: Database-per-tenant isolation pattern, stancl/tenancy package architecture, Advanced Follow-up: PostgreSQL Row-Level Security for hard tenant enforcement, Tenant-aware caching strategies, and Cross-tenant data leak detection testing
**Depended on by:** Knowledge units that leverage or extend shared database scopes patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for shared database scopes.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization