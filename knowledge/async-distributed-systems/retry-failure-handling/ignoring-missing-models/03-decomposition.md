# Decomposition: Ignoring Missing Models in Failed Jobs

## Topic Overview

When a job using `SerializesModels` processes a model that was deleted between dispatch and execution, the deserialization silently sets the model property to `null`. Subsequent method calls on that property throw an error, causing the job to fail.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k087-ignoring-missing-models/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Ignoring Missing Models in Failed Jobs
- **Purpose:** When a job using `SerializesModels` processes a model that was deleted between dispatch and execution, the deserialization silently sets the model property to `null`. Subsequent method calls on that property throw an error, causing the job to fail.
- **Difficulty:** Intermediate
- **Dependencies:** - K005 `SerializesModels` Trait (the mechanism that triggers this)

## Dependency Graph

This KU depends on: - K005 `SerializesModels` Trait (the mechanism that triggers this)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`SerializesModels` behavior**: On deserialization, models are re-fetched via `Model::find($id)`. If the model was deleted, `find()` returns `null`. - **`ShouldDeleteMissing`**: A trait that, when ...
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