# Decomposition: Repository pattern: feature-oriented vs. generic

## Topic Overview

The debate within the repository pattern is between generic repositories (CRUD methods for every entity) and feature-oriented repositories (business-specific queries targeted to use cases). Feature-oriented repositories encapsulate meaningful business queries: `findOverdueInvoices()`, `getTopCustomersByRevenue()`, `searchProductsByCategory()`—each a targeted data access method specific to a business need.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-15-repository-feature-vs-generic/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Repository pattern: feature-oriented vs. generic
- **Purpose:** The debate within the repository pattern is between generic repositories (CRUD methods for every entity) and feature-oriented repositories (business-specific queries targeted to use cases). Feature-oriented repositories encapsulate meaningful business queries: `findOverdueInvoices()`, `getTopCustomersByRevenue()`, `searchProductsByCategory()`—each a targeted data access method specific to a business need.
- **Difficulty:** Advanced
- **Dependencies:** SLP-14 Repository pattern debate

## Dependency Graph

This KU depends on: SLP-14 Repository pattern debate
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Generic repository:** ```php class UserRepository {
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