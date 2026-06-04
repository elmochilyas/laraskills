# Decomposition: database per tenant

## Topic Overview

Database-per-tenant multi-tenancy gives each tenant an isolated database. Connection switching happens at the middleware level — the tenant's database connection is resolved based on subdomain or user and set as the default connection for the request. This provides the strongest data isolation (no global scope bypass risk, no cross-tenant SQL injection), at the cost of operational complexity (N databases to migrate, monitor, backup). Each tenant gets their own full schema, making it impossi...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
database-per-tenant/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### database per tenant
- **Purpose:** Database-per-tenant multi-tenancy gives each tenant an isolated database. Connection switching happens at the middleware level — the tenant's database connection is resolved based on subdomain or user and set as the default connection for the request. This provides the strongest data isolation (no global scope bypass risk, no cross-tenant SQL injection), at the cost of operational complexity (N databases to migrate, monitor, backup). Each tenant gets their own full schema, making it impossi...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Database connection configuration, Migration management, Related: Shared-database multi-tenancy with global scopes (alternative pattern), Tenant-aware queues and job context, Advanced Follow-up: Database-per-tenant migration strategies, Central database HA patterns, and Per-tenant database credential rotation

## Dependency Graph
**Depends on:** Prerequisites: Database connection configuration, Migration management, Related: Shared-database multi-tenancy with global scopes (alternative pattern), Tenant-aware queues and job context, Advanced Follow-up: Database-per-tenant migration strategies, Central database HA patterns, and Per-tenant database credential rotation
**Depended on by:** Knowledge units that leverage or extend database per tenant patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for database per tenant.
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