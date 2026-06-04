# Decomposition: Front Controller pattern

## Topic Overview

Front Controller centralizes all incoming requests through a single handler, which performs common pre-processing (routing, authentication, logging) before delegating to appropriate actions. In Laravel, `public/index.php` and the routing layer implement Front Controller — all HTTP requests enter through index.php, which bootstraps the application and passes control to the router.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
front-controller/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Front Controller pattern
- **Purpose:** Front Controller centralizes all incoming requests through a single handler, which performs common pre-processing (routing, authentication, logging) before delegating to appropriate actions. In Laravel, `public/index.php` and the routing layer implement Front Controller — all HTTP requests enter through index.php, which bootstraps the application and passes control to the router.
- **Difficulty:** Foundation
- **Dependencies:** HTTP lifecycle, Middleware |

## Dependency Graph

This KU depends on: HTTP lifecycle, Middleware |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Single entry point: all requests handled by one file/class - Common pre-processing: routing, auth, session, CSRF - Request dispatch: delegates to appropriate handler
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