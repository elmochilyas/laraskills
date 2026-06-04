# Decomposition: 7.3 Automatic query routing (how Laravel determines read/write queries)

## Topic Overview
Laravel determines read vs write by checking the SQL statement's first word: SELECT, SHOW, DESCRIBE, EXPLAIN → read. INSERT, UPDATE, DELETE, CREATE, ALTER, DROP → write. The query builder and Eloquent inherit this routing.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-3-automatic-query-routing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.3 Automatic query routing (how Laravel determines read/write queries)
- **Purpose:** Laravel determines read vs write by checking the SQL statement's first word: SELECT, SHOW, DESCRIBE, EXPLAIN → read. INSERT, UPDATE, DELETE, CREATE, ALTER, DROP → write.
- **Difficulty:** Intermediate
- **Dependencies:** 7.2 Read/write config, 7.4 Sticky writes

## Dependency Graph
**Depends on:** "7.2 Read/write config", "7.4 Sticky writes"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Keyword detection**: `str_starts_with($query, 'select')` (case-insensitive). Simple heuristic. Works for most frameworks.; - **Write connection for transactions**: When a transaction is started, all queries use the write connection (read-your-writes consistency).; - **DB::statement routing**: Always goes to write connection. Use `DB::select()` for reads..
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