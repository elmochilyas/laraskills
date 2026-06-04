# Decomposition: Builder pattern in PHP/Laravel context

## Topic Overview

Builder separates the construction of a complex object from its representation, allowing the same construction process to create different representations. In Laravel, Builders appear extensively: Eloquent Query Builder for SQL construction, DTO/Data builders for test factories, and request builders for complex API calls.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
builder/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Builder pattern in PHP/Laravel context
- **Purpose:** Builder separates the construction of a complex object from its representation, allowing the same construction process to create different representations. In Laravel, Builders appear extensively: Eloquent Query Builder for SQL construction, DTO/Data builders for test factories, and request builders for complex API calls.
- **Difficulty:** Foundation
- **Dependencies:** PHP 8 named arguments, Constructor promotion |

## Dependency Graph

This KU depends on: PHP 8 named arguments, Constructor promotion |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Step-by-step construction: each builder method configures one aspect - Fluent interface: methods return `$this` for chaining - Immutable vs mutable builders: immutable returns new instance on each...
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