# Decomposition: Organizing by layer: app/Http, app/Models, app/Services

## Topic Overview

Layer-based organization—grouping code by its technical role (Controllers in `app/Http/Controllers/`, Models in `app/Models/`, Services in `app/Services/`)—is the default approach in Laravel and the most intuitive for developers coming from traditional MVC frameworks. It answers "what does this code do?" by placing all HTTP-handling code together, all data-access code together, and all business-logic code together.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-02-layer-based-organization/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Organizing by layer: app/Http, app/Models, app/Services
- **Purpose:** Layer-based organization—grouping code by its technical role (Controllers in `app/Http/Controllers/`, Models in `app/Models/`, Services in `app/Services/`)—is the default approach in Laravel and the most intuitive for developers coming from traditional MVC frameworks. It answers "what does this code do?" by placing all HTTP-handling code together, all data-access code together, and all business-logic code together.
- **Difficulty:** Foundation
- **Dependencies:** COS-01 Default structure

## Dependency Graph

This KU depends on: COS-01 Default structure
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** Layer-based organization sorts classes by their architectural role: - **Presentation layer** (`app/Http/`): Controllers, Middleware, Form Requests, route files. - **Business logic layer** (`app/Servic...
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