# Decomposition: Horizon Dashboard Authorization

## Topic Overview

The Horizon dashboard provides a web UI at `/horizon` with queue metrics, job monitoring, and retry functionality. Access is controlled by the `Horizon::auth()` callback in `AppServiceProvider`, which returns a boolean indicating whether the current user can access the dashboard.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k082-horizon-dashboard-authorization/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Horizon Dashboard Authorization
- **Purpose:** The Horizon dashboard provides a web UI at `/horizon` with queue metrics, job monitoring, and retry functionality. Access is controlled by the `Horizon::auth()` callback in `AppServiceProvider`, which returns a boolean indicating whether the current user can access the dashboard.
- **Difficulty:** Foundation
- **Dependencies:** - K041 Horizon Supervisor Configuration (context)

## Dependency Graph

This KU depends on: - K041 Horizon Supervisor Configuration (context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`Horizon::auth()`**: Callback registered in `AppServiceProvider::boot()`. Receives the incoming request, returns `true`/`false`. - **Default behavior**: In `local` environment, all access is grant...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

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