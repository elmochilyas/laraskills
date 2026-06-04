# Decomposition: 3.21 Index management in Laravel migrations (index, unique, fullText, spatial, raw DB::statement)

## Topic Overview
Laravel's Schema builder supports index creation via Blueprint methods: `->index()`, `->unique()`, `->fullText()`, `->spatial()`. For advanced indexes (partial, expression, concurrent, custom names), raw `DB::statement()` is required.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-21-index-management-in-migrations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.21 Index management in Laravel migrations (index, unique, fullText, spatial, raw DB::statement)
- **Purpose:** Laravel's Schema builder supports index creation via Blueprint methods: `->index()`, `->unique()`, `->fullText()`, `->spatial()`. For advanced indexes (partial, expression, concurrent, custom names), raw `DB::statement()` is required.
- **Difficulty:** Foundation
- **Dependencies:** 1.5 Index definition via migrations, 3.8 Composite indexes

## Dependency Graph
**Depends on:** "1.5 Index definition via migrations", "3.8 Composite indexes"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Standard indexes**: `$table->index(['col1', 'col2'])` — composite B-Tree.; - **Unique indexes**: `$table->unique('email')` — unique constraint.; - **Full-text**: `$table->fullText('body')` — MySQL FULLTEXT.; - **Spatial**: `$table->spatialIndex('location')` — MySQL R-Tree.; - **Raw DDL**: `DB::statement('CREATE INDEX CONCURRENTLY ...')` — for features not supported by Blueprint..
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