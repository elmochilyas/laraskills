# Decomposition: SOLID principles in PHP: ISP violations

## Topic Overview

Interface Segregation Principle states that no client should be forced to depend on methods it does not use. Large, "fat" interfaces force implementors to create empty or throwing methods for irrelevant functionality.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
isp-violations/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### SOLID principles in PHP: ISP violations
- **Purpose:** Interface Segregation Principle states that no client should be forced to depend on methods it does not use. Large, "fat" interfaces force implementors to create empty or throwing methods for irrelevant functionality.
- **Difficulty:** Foundation
- **Dependencies:** Interface basics in PHP |

## Dependency Graph

This KU depends on: Interface basics in PHP |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Client-specific interfaces: each interface serves one client's needs - Role interfaces: interfaces named after client's role, not implementation - No fat interfaces: don't create one interface for...
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