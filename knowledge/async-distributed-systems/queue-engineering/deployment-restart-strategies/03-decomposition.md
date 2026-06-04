# Decomposition: Deployment Restart Strategies (`horizon:terminate`)

## Topic Overview

Deploying new code requires restarting queue workers to pick up the updated application. For `queue:work` workers, `queue:restart` broadcasts a restart signal via cache.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k061-deployment-restart-strategies/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Deployment Restart Strategies (`horizon:terminate`)
- **Purpose:** Deploying new code requires restarting queue workers to pick up the updated application. For `queue:work` workers, `queue:restart` broadcasts a restart signal via cache.
- **Difficulty:** Intermediate
- **Dependencies:** - K057 Process Signals (what happens during termination)

## Dependency Graph

This KU depends on: - K057 Process Signals (what happens during termination)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`queue:restart`**: Sets a cache key (`illuminate:queue:restart`) that all workers check. Workers finish their current job, then exit. Supervisor restarts them with new code. - **`horizon:terminate...
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