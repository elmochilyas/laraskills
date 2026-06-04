# Decomposition: Guzzle HTTP Client Internals (Middleware Stack, Handlers, PSR-18)

## Topic Overview
Guzzle is the foundational HTTP client powering Laravel's Http facade and SaloonPHP. Its architecture centers on a handler stack pattern where middleware functions compose around a core handler to form a processing pipeline. Understanding Guzzle's internalsâ€”handler resolution, middleware composition, PSR-7/PSR-17/PSR-18 compliance, and promise-based asyncâ€”is essential for building custom middleware, debugging low-level HTTP issues, and extending Laravel's HTTP client capabilities.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k002-guzzle-internals/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Guzzle HTTP Client Internals (Middleware Stack, Handlers, PSR-18)
- **Purpose:** Guzzle is the foundational HTTP client powering Laravel's Http facade and SaloonPHP. Its architecture centers on a handler stack pattern where middleware functions compose around a core handler to form a processing pipeline. Understanding Guzzle's internalsâ€”handler resolution, middleware composition, PSR-7/PSR-17/PSR-18 compliance, and promise-based asyncâ€”is essential for building custom middleware, debugging low-level HTTP issues, and extending Laravel's HTTP client capabilities.
- **Difficulty:** Intermediate
- **Dependencies:** K001, K010, K005, K007

## Dependency Graph
**Depends on:**
- K001
- K010
- K005
- K007

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- HandlerStack
- Handler
- Middleware
- PSR-18 (HttpClient)
- PSR-7 (Message Interfaces)
- PSR-17 (HTTP Factories)

**Out of scope:**
- K001 topics covered in their respective KUs
- K010 topics covered in their respective KUs
- K005 topics covered in their respective KUs
- K007 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization