# Decomposition: mysql full text

## Topic Overview

MySQL FULLTEXT indexes enable full-text search directly in the database using MATCH ... AGAINST syntax. Scout's database engine leverages these indexes when the SearchUsingFullText attribute is applied to model columns. MySQL supports Boolean Mode (with +/- operators), Natural Language Mode (relevance-based), and Query Expansion. Default minimum word length is 3 characters.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


mysql-full-text/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### mysql full text
- **Purpose:** MySQL FULLTEXT indexes enable full-text search directly in the database using MATCH ... AGAINST syntax. Scout's database engine leverages these indexes when the SearchUsingFullText attribute is applied to model columns. MySQL supports Boolean Mode (with +/- operators), Natural Language Mode (rele...
- **Difficulty:** Foundation
- **Dependencies:** K002, K015, K016

## Dependency Graph
**Depends on:** K002, K015, K016
**Depended on by:** Knowledge units that leverage or extend mysql full text patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for mysql full text.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

? No Knowledge Unit is overloaded

? No major concept is missing

? Boundaries are clear

? Future phases can operate on individual units

? The structure can scale without reorganization
