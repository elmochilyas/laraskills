# Decomposition: 3.13 Full-text indexes (MySQL FULLTEXT, PostgreSQL GIN tsvector)

## Topic Overview
Full-text indexes enable efficient natural language search within text columns. MySQL uses `FULLTEXT` indexes with `MATCH...AGAINST`. PostgreSQL uses GIN indexes on `tsvector` columns with `@@` operator.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-13-full-text-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.13 Full-text indexes (MySQL FULLTEXT, PostgreSQL GIN tsvector)
- **Purpose:** Full-text indexes enable efficient natural language search within text columns. MySQL uses `FULLTEXT` indexes with `MATCH...AGAINST`.
- **Difficulty:** Intermediate
- **Dependencies:** 12.6 Full-text search tsvector/tsquery, 12.11 GIN index on tsvector, 13.13 Full-text search MATCH...AGAINST

## Dependency Graph
**Depends on:** "12.6 Full-text search tsvector/tsquery", "12.11 GIN index on tsvector", "13.13 Full-text search MATCH...AGAINST"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **MySQL FULLTEXT**: Inverted word index. Supports `IN BOOLEAN MODE` (operators +, -, *, ""), `WITH QUERY EXPANSION`, and relevance ranking.; - **PostgreSQL tsvector**: Converts text to lexeme list. `to_tsvector('english', body)` creates search vector. GIN index on tsvector enables fast `@@` queries.; - **Ranking**: MySQL uses relevance score from `MATCH...AGAINST`. PostgreSQL uses `ts_rank()` and `ts_rank_cd()`..
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