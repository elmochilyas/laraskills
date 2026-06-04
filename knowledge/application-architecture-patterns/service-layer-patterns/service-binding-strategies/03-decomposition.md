# Decomposition: Service binding strategies: singleton vs. transient

## Topic Overview

Service binding strategies determine whether a service instance is shared across the application (singleton) or created fresh for each resolution (transient). Under the default Laravel lifecycle (per-request), the distinction is minor—objects are garbage collected per request.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-12-service-binding-strategies/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Service binding strategies: singleton vs. transient
- **Purpose:** Service binding strategies determine whether a service instance is shared across the application (singleton) or created fresh for each resolution (transient). Under the default Laravel lifecycle (per-request), the distinction is minor—objects are garbage collected per request.
- **Difficulty:** Advanced
- **Dependencies:** SLP-09 Dependency injection

## Dependency Graph

This KU depends on: SLP-09 Dependency injection
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Singleton (`$this->app->singleton()`):** One instance shared across the entire application lifetime. Under Octane, this instance persists across multiple requests. **Transient (`$this->app->bind()`)...
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