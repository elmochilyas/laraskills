# Decomposition: stancl tenancy

## Topic Overview

`stancl/tenancy` is the gold-standard multi-tenancy package for Laravel, supporting both single-database (tenant_id scoping) and multi-database (per-tenant databases) isolation patterns. Its architecture centers on a `Tenant` model, customizable bootstrappers (classes that initialize tenant context: database, cache, filesystem, Redis, mail, etc.), and automatic middleware-based tenant resolution. The package handles the full lifecycle: tenant creation → database migration → domain resolut...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
stancl-tenancy/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### stancl tenancy
- **Purpose:** `stancl/tenancy` is the gold-standard multi-tenancy package for Laravel, supporting both single-database (tenant_id scoping) and multi-database (per-tenant databases) isolation patterns. Its architecture centers on a `Tenant` model, customizable bootstrappers (classes that initialize tenant context: database, cache, filesystem, Redis, mail, etc.), and automatic middleware-based tenant resolution. The package handles the full lifecycle: tenant creation → database migration → domain resolut...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Shared-database multi-tenancy with global scopes, Database-per-tenant isolation pattern, Related: Tenant-aware queues and job context, Multi-tenant audit logging, Advanced Follow-up: stancl/tenancy Octane configuration, Custom bootstrapper development, and Tenant migration strategies at scale

## Dependency Graph
**Depends on:** Prerequisites: Shared-database multi-tenancy with global scopes, Database-per-tenant isolation pattern, Related: Tenant-aware queues and job context, Multi-tenant audit logging, Advanced Follow-up: stancl/tenancy Octane configuration, Custom bootstrapper development, and Tenant migration strategies at scale
**Depended on by:** Knowledge units that leverage or extend stancl tenancy patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for stancl tenancy.
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