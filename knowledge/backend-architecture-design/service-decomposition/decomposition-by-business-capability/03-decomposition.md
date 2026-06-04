# Decomposition: Decomposition by business capability vs subdomain

## Topic Overview

Two primary strategies drive service decomposition: business capabilities (what the business does — process-oriented) and DDD subdomains (core/supporting/generic — value-oriented). Business capability decomposition maps to organizational structure (Conway's Law).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
decomposition-by-business-capability/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Decomposition by business capability vs subdomain
- **Purpose:** Two primary strategies drive service decomposition: business capabilities (what the business does — process-oriented) and DDD subdomains (core/supporting/generic — value-oriented). Business capability decomposition maps to organizational structure (Conway's Law).
- **Difficulty:** Advanced
- **Dependencies:** Strategic DDD, Business capability mapping |

## Dependency Graph

This KU depends on: Strategic DDD, Business capability mapping |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** decomposition-by-business-capability is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------...
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