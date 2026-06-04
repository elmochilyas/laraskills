# Decomposition: Presentation layer: controllers, requests, resources, routes

## Topic Overview

The Presentation layer is the outermost layer, handling all communication between the application and external actors (users, APIs, CLI). It consists of Controllers (request handlers), Form Requests (validation and authorization), API Resources (response transformation), and Route files (URL-to-controller mapping).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-08-presentation-layer/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Presentation layer: controllers, requests, resources, routes
- **Purpose:** The Presentation layer is the outermost layer, handling all communication between the application and external actors (users, APIs, CLI). It consists of Controllers (request handlers), Form Requests (validation and authorization), API Resources (response transformation), and Route files (URL-to-controller mapping).
- **Difficulty:** Intermediate
- **Dependencies:** LAP-01 Three-layer architecture

## Dependency Graph

This KU depends on: LAP-01 Three-layer architecture
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Controllers:** Receive HTTP request, delegate to Application layer via use case or service, return response. Controllers should be testable by injecting dependencies rather than relying on facades. ...
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