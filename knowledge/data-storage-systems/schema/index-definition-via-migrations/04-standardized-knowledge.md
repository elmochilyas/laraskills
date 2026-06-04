# 1-5 Index Definition Via Migrations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-5 |
| Knowledge Unit Title | Index Definition Via Migrations |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 3.1 B-Tree index structure | 3.8 Composite/compound indexes | 3.13 Full-text indexes | 3.20 Concurrent index creation | 3.21 Index management in Laravel migrations |
| Last Updated | 2026-06-02 |

## Overview

Indexes in Laravel migrations are defined using Blueprint methods that generate database-specific DDL. The five index types — `index`, `unique`, `primary`, `fullText`, `spatial` — serve different query optimization purposes. Defining indexes at migration time is the correct point to design the physical data access path, not after queries become slow in production.

---

## Core Concepts

- **index()**: Standard B-tree index. Use for columns frequently used in WHERE, JOIN, ORDER BY.
- **unique()**: Enforces uniqueness while providing index benefits. Automatically creates a B-tree index constraint.
- **primary()**: Typically handled by `id()` or `bigIncrements()`. Creates the clustered index (InnoDB) or primary key constraint.
- **fullText()**: Specialized index for full-text search (MySQL FULLTEXT, PostgreSQL GIN tsvector).
- **spatial()**: R-Tree index (MySQL) or GiST index (PostgreSQL) for spatial/GIS data.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Composite indexes for multi-column queries**: `$table->index(['status', 'created_at'])` handles queries filtering by both columns. Single-column indexes on each column do not provide the same optimization.
- **Unique indexes for business rules**: `$table->unique(['email', 'tenant_id'])` enforces a business rule (unique email per tenant) at the database level, preventing race conditions in application-level checks.
- **FullText indexes for text search**: `$table->fullText('body')` enables MySQL's MATCH...AGAINST queries. For PostgreSQL, use raw SQL to create a GIN tsvector index.


## Architecture Guidelines

- | Index Type | Best For | Avoid When |
- |-----------|----------|------------|
- | index() | General WHERE/JOIN/ORDER BY | Columns updated frequently (write amplification) |
- | unique() | Business-unique constraints (email, slug) | Data that is not inherently unique |
- | fullText() | Natural language search on text columns | Small tables (table scan is cheaper) |
- | spatial() | Geographic queries (proximity, containment) | Non-spatial data (use standard indexes) |


## Performance Considerations

- - Every index adds write amplification: each INSERT must update all indexes on the table.
- - Indexes consume disk space and memory (buffer pool / shared buffers).
- - FullText indexes are large — evaluate whether the search use case justifies the storage cost.
- - Unique indexes on large or frequently written tables add constraint-check overhead.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Foreign key without index**: `$table->foreignId('user_id')` without `->constrained()` or `->index()`. The FK constraint exists, but the column is not indexed, causing full table scans on joins. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Redundant indexes**: Creating both `unique('email')` and `index('email')` — the unique index already provides index functionality. The second index is redundant. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | FullText on small tables**: On tables with < 1000 rows, a full table scan is cheaper than a FullText index lookup. Only add FullText when the table size justifies it. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Unique constraint violation in production**: Application attempts to insert a duplicate that passed application-level validation (race condition under concurrent requests). Application must handle `QueryException` with error code 1062 (MySQL) or 23505 (PostgreSQL).
- - **FullText index not supporting the query**: MySQL's FullText index only supports `MATCH...AGAINST` syntax. Regular `LIKE` queries do not use it.


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

