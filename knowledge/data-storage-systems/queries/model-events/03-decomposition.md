# Decomposition: 2.19 Model events (retrieved, creating, created, updating, updated, saving, saved, deleting, deleted, trashed, forceDeleted)

## Topic Overview
Model events fire at specific points in the model lifecycle: retrieval, creation, update, save, delete, restore, and force delete. They enable side-effect logic (logging, cache invalidation, notifications) to be attached to model operations without cluttering controllers.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-19-model-events/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.19 Model events (retrieved, creating, created, updating, updated, saving, saved, deleting, deleted, trashed, forceDeleted)
- **Purpose:** Model events fire at specific points in the model lifecycle: retrieval, creation, update, save, delete, restore, and force delete. They enable side-effect logic (logging, cache invalidation, notifications) to be attached to model operations without cluttering controllers.
- **Difficulty:** Foundation
- **Dependencies:** 2.20 Hydration, 2.25 touch/touchOwners, 2.21 upsert

## Dependency Graph
**Depends on:** "2.20 Hydration", "2.25 touch/touchOwners", "2.21 upsert"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Event types**: `retrieved` (after DB read), `creating`/`created` (before/after INSERT), `updating`/`updated` (before/after UPDATE), `saving`/`saved` (before/after both INSERT and UPDATE), `deleting`/`deleted` (before/after DELETE), `trashed` (soft delete), `forceDeleted` (force delete).; - **Returning false**: In `creating`, `updating`, `saving`, `deleting`, returning `false` cancels the operation.; - **Observers**: Classes that group multiple model events. Registered in `AppServiceProvider::boot()`..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization