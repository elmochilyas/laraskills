# Decomposition: scout database engine

## Topic Overview

Scout's database engine leverages MySQL FULLTEXT indexes and PostgreSQL `tsvector`/`tsquery` to perform full-text search directly on the database without requiring an external search server. It is the simplest Scout driver — no server setup, no API keys, no queue workers required. Best suited for applications with <50K records and straightforward search needs.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
scout-database-engine/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### scout database engine
- **Purpose:** Scout's database engine leverages MySQL FULLTEXT indexes and PostgreSQL `tsvector`/`tsquery` to perform full-text search directly on the database without requiring an external search server. It is the simplest Scout driver — no server setup, no API keys, no queue workers required. Best suited for applications with <50K records and straightforward search needs.
- **Difficulty:** Foundation
- **Dependencies:** K015 (SearchUsingFullText attribute), K016 (SearchUsingPrefix attribute), and K001 (Searchable trait)

## Dependency Graph
**Depends on:** K015 (SearchUsingFullText attribute), K016 (SearchUsingPrefix attribute), and K001 (Searchable trait)
**Depended on by:** Knowledge units that leverage or extend scout database engine patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for scout database engine.
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