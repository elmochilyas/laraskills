# Decomposition: Hybrid: domains inside default Laravel structure

## Topic Overview

The hybrid approach keeps Laravel's default top-level directories (`app/Http/Controllers/`, `app/Models/`) but organizes within them by domain: `app/Http/Controllers/Billing/`, `app/Models/Billing/`. This is the recommended starting point for most teams according to community leaders (Benjamin Crozat, Laravel Daily, Spatie).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-07-hybrid-approach/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Hybrid: domains inside default Laravel structure
- **Purpose:** The hybrid approach keeps Laravel's default top-level directories (`app/Http/Controllers/`, `app/Models/`) but organizes within them by domain: `app/Http/Controllers/Billing/`, `app/Models/Billing/`. This is the recommended starting point for most teams according to community leaders (Benjamin Crozat, Laravel Daily, Spatie).
- **Difficulty:** Intermediate
- **Dependencies:** COS-01 Default structure

## Dependency Graph

This KU depends on: COS-01 Default structure
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** ``` app/ ├── Http/Controllers/
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