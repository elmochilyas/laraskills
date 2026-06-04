# Decomposition: Preloading Reduces Cold Start Latency

## Topic Overview
OpCache preloading eliminates the first-request latency penalty after PHP-FPM restart by loading all specified files into OpCache at startup. The tradeoff: **faster first request** (10-16ms autoloading saved) vs **slower startup** (time to compile and execute the preload script) and **higher baseline memory** (preloaded classes occupy OpCache space even if unused per request).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/preloading-reduces-cold-start-latency/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Preloading Reduces Cold Start Latency
- **Purpose:** OpCache preloading eliminates the first-request latency penalty after PHP-FPM restart by loading all specified files into OpCache at startup. The tradeoff: **faster first request** (10-16ms autoloading saved) vs **slower startup** (time to compile and execute the preload script) and **higher baseline memory** (preloaded classes occupy OpCache space even if unused per request).
- **Difficulty:** Foundation
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Preloading for slow applications
  - Library model
  - Tiered cache warming

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

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