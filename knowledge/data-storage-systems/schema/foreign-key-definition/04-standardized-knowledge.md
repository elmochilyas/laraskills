# 1-4 Foreign Key Definition

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-4 |
| Knowledge Unit Title | Foreign Key Definition |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.2 Relationship types | 15.1 Foreign key constraints | 15.12 Foreign key cascade implications | 1.29 FK in PlanetScale/Vitess |
| Last Updated | 2026-06-02 |

## Overview

Foreign key constraints enforce referential integrity at the database level. Laravel's `constrained()` helper provides a concise, convention-based syntax for defining FKs that reduces boilerplate and eliminates type mismatch bugs. The `onDelete` and `onUpdate` options determine behavior when referenced rows are deleted or updated. Choosing the correct referential action is a data integrity decision with production implications for data loss and operational complexity.

---

## Core Concepts

- **constrained()**: Automatically infers table and column from the relationship name. `$table->foreignId('user_id')->constrained()` references `users.id`.
- **onDelete() / onUpdate()**: Defines referential action. Options: `cascade` (propagate), `restrict` (block), `set null` (nullify FK), `no action` (defer check).
- **foreignId()**: Creates an `unsignedBigInteger` column that matches the type Laravel uses for `id()` by default.
- **Key points**: `constrained()` adds both the FK constraint AND an index on the column. Manually defined FKs via `$table->foreign('col')->references('id')->on('table')` do NOT automatically add an index.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **CASCADE for ownership**: When a parent record (user, order) owns its children (posts, order_items), CASCADE on delete ensures children are cleaned up automatically. This prevents orphaned records.
- **RESTRICT for financial data**: Never cascade on financial records. A journal entry should never be automatically deleted — require explicit handling. RESTRICT prevents accidental mass deletion.
- **SET NULL for optional relationships**: When a parent is deleted but children may remain valid (e.g., removing a sales rep but keeping their customers), SET NULL clears the FK reference.
- **constrained() as default**: Always use `constrained()` instead of manual FK definitions. It reduces errors (type mismatch, missing index) and improves readability.


## Architecture Guidelines

- | Action | Use Case | Risk |
- |--------|----------|------|
- | CASCADE | Owned child records (post belongs to user) | Accidental mass deletion |
- | RESTRICT | Financial, audit, compliance data | Blocks legitimate deletes if orphan cleanup is missing |
- | SET NULL | Optional relationships, historical preservation | Orphaned nullable FKs accumulate |
- | NO ACTION (deferred, PG) | Circular references, complex validation | Performance overhead of deferred checks |


## Performance Considerations

- - FK constraints add a read check on the parent table for every INSERT/UPDATE to the child table. High-throughput child tables incur a measurable lookup cost.
- - CASCADE operations are not free — deleting a parent with 10,000 children generates 10,001 delete operations (all in one transaction).
- - Index on the referencing column is required for FK performance — without it, every FK check triggers a full table scan on the child table.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Missing constrained() — manual FK without index**: `$table->unsignedBigInteger('user_id'); $table->foreign('user_id')->references('id')->on('users');` — this adds the constraint but NOT the index, causing full table scans on joins. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. If the referenced PK uses `increments()` (signed integer), the FK constraint fails. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Circular cascade**: Two tables with CASCADE in both directions create infinite loops. The database detects and blocks these. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **CASCADE escalation**: Deleting a parent cascades through multiple FK chains, deleting far more data than intended. No confirmation prompt.
- - **RESTRICT blocked delete**: Application tries to delete a parent that has children, gets a FK violation exception. Unhandled exceptions cause 500 errors.
- - **FK check timeout**: In high-throughput inserts, FK checks on the parent table can cause lock waits or timeouts.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

