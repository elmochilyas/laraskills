# Decomposition: SOLID principles in PHP: LSP violations

## Topic Overview

Liskov Substitution Principle states that subtypes must be substitutable for their base types without altering the correctness of the program. In PHP, common violations include overriding methods with more restrictive preconditions (type narrowing), weaker postconditions (returning less), throwing new exceptions not thrown by base, and violating base class invariants.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
lsp-violations/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### SOLID principles in PHP: LSP violations
- **Purpose:** Liskov Substitution Principle states that subtypes must be substitutable for their base types without altering the correctness of the program. In PHP, common violations include overriding methods with more restrictive preconditions (type narrowing), weaker postconditions (returning less), throwing new exceptions not thrown by base, and violating base class invariants.
- **Difficulty:** Intermediate
- **Dependencies:** Inheritance, Polymorphism, Design by Contract |

## Dependency Graph

This KU depends on: Inheritance, Polymorphism, Design by Contract |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Behavioral subtyping: subtype must satisfy base type's contract - Preconditions cannot be strengthened: subtype cannot require more than base - Postconditions cannot be weakened: subtype cannot gu...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent design patterns covered in related KUs.

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