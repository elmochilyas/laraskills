# Decomposition: Spx Self Hosted Profiling

## Topic Overview
**SPX** (Simple Profiling eXtension) is a self-hosted, open-source PHP profiler with a modern web UI. It collects timing and memory metrics with low overhead (<5%), stores them locally, and provides a browser-based dashboard for exploring profiles. Ideal for private/internal environments where sending data to external cloud services (Blackfire/Tideways) is restricted.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
profiling-observability/spx-self-hosted-profiling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Spx Self Hosted Profiling
- **Purpose:** **SPX** (Simple Profiling eXtension) is a self-hosted, open-source PHP profiler with a modern web UI. It collects timing and memory metrics with low overhead (<5%), stores them locally, and provides a browser-based dashboard for exploring profiles. Ideal for private/internal environments where sending data to external cloud services (Blackfire/Tideways) is restricted.
- **Difficulty:** Intermediate
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - SPX
  - SPX exposed without HTTP key
  - Camera model
  - Tiered profiling workflow

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