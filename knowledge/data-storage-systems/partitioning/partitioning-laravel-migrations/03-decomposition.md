# Decomposition: 8.9 Partitioning in Laravel migrations (syntax, limitations)

## Topic Overview
Laravel migrations support partition syntax via raw SQL in `DB::statement()`. No native partition builder in Laravel Schema Builder. Partition-related migration commands: `DB::statement('ALTER TABLE ...

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-9-partitioning-laravel-migrations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.9 Partitioning in Laravel migrations (syntax, limitations)
- **Purpose:** Laravel migrations support partition syntax via raw SQL in `DB::statement()`. No native partition builder in Laravel Schema Builder.
- **Difficulty:** Advanced
- **Dependencies:** 8.1 Range partitioning, 8.6 Partition management, 1.13 Migration structure

## Dependency Graph
**Depends on:** "8.1 Range partitioning", "8.6 Partition management", "1.13 Migration structure"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Create table with partitions**: `Schema::create('orders', function ($table) { ... });` then `DB::statement('ALTER TABLE orders PARTITION BY RANGE ...')`.; - **Partition management migrations**: `DB::statement('ALTER TABLE orders ADD PARTITION ...')` in up(). `DB::statement('ALTER TABLE orders DROP PARTITION ...')` in down().; - **MySQL requirement**: Partition must be declared at table creation or via `ALTER TABLE ... PARTITION BY`. Cannot partition an existing non-partitioned table without rebuilding..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization