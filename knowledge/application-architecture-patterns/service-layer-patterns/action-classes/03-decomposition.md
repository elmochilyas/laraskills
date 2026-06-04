# Decomposition: Action classes: single-operation-per-class pattern

## Topic Overview

Action classes (also called "single-action classes" or "commands") encapsulate one business operation per class. Instead of `UserService::register()` with 10 other methods, you have `RegisterUserAction::execute()`.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-02-action-classes/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Action classes: single-operation-per-class pattern
- **Purpose:** Action classes (also called "single-action classes" or "commands") encapsulate one business operation per class. Instead of `UserService::register()` with 10 other methods, you have `RegisterUserAction::execute()`.
- **Difficulty:** Foundation
- **Dependencies:** SLP-01 Service classes

## Dependency Graph

This KU depends on: SLP-01 Service classes
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** ```php class RegisterUserAction {     public function __construct(
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