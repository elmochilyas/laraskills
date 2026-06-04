# Decomposition: Prototype pattern in PHP/Laravel context

## Topic Overview

Prototype creates new objects by cloning existing instances rather than calling constructors. In PHP, the `clone` keyword provides native support, but shallow vs deep copy semantics require careful handling of reference properties.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
prototype/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Prototype pattern in PHP/Laravel context
- **Purpose:** Prototype creates new objects by cloning existing instances rather than calling constructors. In PHP, the `clone` keyword provides native support, but shallow vs deep copy semantics require careful handling of reference properties.
- **Difficulty:** Foundation
- **Dependencies:** PHP object references, `__clone()` magic method |

## Dependency Graph

This KU depends on: PHP object references, `__clone()` magic method |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Cloning: `clone $object` creates a shallow copy with copied references - `__clone()` magic method: allows customization of clone behavior (deep copy references) - Shallow vs deep: references to ot...
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