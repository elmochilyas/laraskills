# Decomposition: Bounded context identification: language, teams, data

## Topic Overview

Bounded context identification uses three heuristics: language (do the same words mean different things?), teams (can a team own this end-to-end?), and data (does this data have a distinct lifecycle?). Each bounded context is a boundary where a domain model applies with consistent meaning.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
DBC-01-context-identification/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Bounded context identification: language, teams, data
- **Purpose:** Bounded context identification uses three heuristics: language (do the same words mean different things?), teams (can a team own this end-to-end?), and data (does this data have a distinct lifecycle?). Each bounded context is a boundary where a domain model applies with consistent meaning.
- **Difficulty:** Intermediate
- **Dependencies:** MMD-02 Boundary identification

## Dependency Graph

This KU depends on: MMD-02 Boundary identification
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Three signals for bounded context:** 1. **Language divergence:** Same word, different meaning. "Customer" in Sales means "buyer"; in Support means "ticket creator"; in Shipping means "address recipi...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization