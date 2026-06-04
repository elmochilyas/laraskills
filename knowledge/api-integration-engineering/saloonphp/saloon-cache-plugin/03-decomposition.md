# Decomposition: Cache Plugin for SaloonPHP

## Topic Overview
SaloonPHP's cache plugin provides connector-level response caching for GET requests, reducing API call volume and improving response latency. It supports configurable TTL, conditional caching via ETag/Last-Modified headers, cache invalidation strategies, and customizable cache stores. The plugin operates at the Saloon middleware layer, intercepting responses before they reach the caller and caching them transparently.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k026-saloon-cache-plugin/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Cache Plugin for SaloonPHP
- **Purpose:** SaloonPHP's cache plugin provides connector-level response caching for GET requests, reducing API call volume and improving response latency. It supports configurable TTL, conditional caching via ETag/Last-Modified headers, cache invalidation strategies, and customizable cache stores. The plugin operates at the Saloon middleware layer, intercepting responses before they reach the caller and caching them transparently.
- **Difficulty:** Intermediate
- **Dependencies:** K010, K015, K016, K006

## Dependency Graph
**Depends on:**
- K010
- K015
- K016
- K006

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Response Caching
- TTL (Time-To-Live)
- Conditional Caching
- Cache Store
- Cache Key Generation
- Request Exclusions

**Out of scope:**
- K010 topics covered in their respective KUs
- K015 topics covered in their respective KUs
- K016 topics covered in their respective KUs
- K006 topics covered in their respective KUs

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