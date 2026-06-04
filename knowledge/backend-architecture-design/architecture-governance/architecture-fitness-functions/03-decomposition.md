# Decomposition: Architecture fitness functions via static analysis

## Topic Overview

Architecture fitness functions are automated mechanisms that continuously verify an architecture's characteristics — testable, objective measures of architectural properties. In PHP/Laravel, fitness functions are implemented via PHPStan/PHPCS custom rules, dependency analysis tools, and CI pipeline checks.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
architecture-fitness-functions/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Architecture fitness functions via static analysis
- **Purpose:** Architecture fitness functions are automated mechanisms that continuously verify an architecture's characteristics — testable, objective measures of architectural properties. In PHP/Laravel, fitness functions are implemented via PHPStan/PHPCS custom rules, dependency analysis tools, and CI pipeline checks.
- **Difficulty:** Advanced
- **Dependencies:** Static analysis, Architectural principles |

## Dependency Graph

This KU depends on: Static analysis, Architectural principles |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** architecture-fitness-functions is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------|
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