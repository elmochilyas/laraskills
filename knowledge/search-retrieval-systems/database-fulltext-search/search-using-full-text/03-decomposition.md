# Decomposition: search using full text

## Topic Overview

The `SearchUsingFullText` attribute (introduced in Laravel 11) allows Scout's database engine to use database-native full-text indexes (`FULLTEXT` in MySQL, `tsvector`/GIN in PostgreSQL) for specific model columns instead of the default LIKE query. This dramatically improves search performance and relevance for the database engine.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
search-using-full-text/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### search using full text
- **Purpose:** The `SearchUsingFullText` attribute (introduced in Laravel 11) allows Scout's database engine to use database-native full-text indexes (`FULLTEXT` in MySQL, `tsvector`/GIN in PostgreSQL) for specific model columns instead of the default LIKE query. This dramatically improves search performance and relevance for the database engine.
- **Difficulty:** Foundation
- **Dependencies:** K002 (Scout database engine), K016 (SearchUsingPrefix attribute), and K003 (Scout collection engine)

## Dependency Graph
**Depends on:** K002 (Scout database engine), K016 (SearchUsingPrefix attribute), and K003 (Scout collection engine)
**Depended on by:** Knowledge units that leverage or extend search using full text patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for search using full text.
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