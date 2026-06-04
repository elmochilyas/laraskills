# Decomposition: search using prefix

## Topic Overview

The `SearchUsingPrefix` attribute optimizes Scout's database engine to use prefix matching (`example%`) instead of substring matching (`%example%`) for specific columns. This enables the use of standard B-tree indexes for LIKE queries with trailing wildcards, avoiding expensive full-text scans on columns where prefix matching is semantically appropriate (IDs, SKUs, emails, slugs).

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
search-using-prefix/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### search using prefix
- **Purpose:** The `SearchUsingPrefix` attribute optimizes Scout's database engine to use prefix matching (`example%`) instead of substring matching (`%example%`) for specific columns. This enables the use of standard B-tree indexes for LIKE queries with trailing wildcards, avoiding expensive full-text scans on columns where prefix matching is semantically appropriate (IDs, SKUs, emails, slugs).
- **Difficulty:** Foundation
- **Dependencies:** K002 (Scout database engine), and K015 (SearchUsingFullText attribute)

## Dependency Graph
**Depends on:** K002 (Scout database engine), and K015 (SearchUsingFullText attribute)
**Depended on by:** Knowledge units that leverage or extend search using prefix patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for search using prefix.
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