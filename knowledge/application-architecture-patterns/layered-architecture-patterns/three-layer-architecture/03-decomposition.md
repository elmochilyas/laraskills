# Decomposition: Three-layer architecture: Presentation, Business, Data

## Topic Overview

Three-layer architecture divides application code into Presentation (handles user interaction), Business Logic (encapsulates rules and orchestration), and Data Access (manages persistence). This is the architectural foundation that MVC concretely implements: Controller (Presentation), Model (Business + Data), View (Presentation).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-01-three-layer-architecture/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Three-layer architecture: Presentation, Business, Data
- **Purpose:** Three-layer architecture divides application code into Presentation (handles user interaction), Business Logic (encapsulates rules and orchestration), and Data Access (manages persistence). This is the architectural foundation that MVC concretely implements: Controller (Presentation), Model (Business + Data), View (Presentation).
- **Difficulty:** Foundation
- **Dependencies:** COS-01 Default structure

## Dependency Graph

This KU depends on: COS-01 Default structure
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Presentation Layer:** Controllers, Form Requests, API Resources, Blade views, route definitions. Owns HTTP concerns: request parsing, validation, response formatting. Should contain zero business lo...
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