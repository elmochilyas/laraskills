# Decomposition: 4.27 Laravel profiling tools: Telescope, Debugbar, Clockwork

## Topic Overview
Three primary Laravel profiling tools serve different needs: Telescope (production monitoring with team debugging), Debugbar (development-only browser overlay), Clockwork (browser devtools integration). All capture query count, duration, N+1 detection, and request timeline.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-27-profiling-tools/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.27 Laravel profiling tools: Telescope, Debugbar, Clockwork
- **Purpose:** Three primary Laravel profiling tools serve different needs: Telescope (production monitoring with team debugging), Debugbar (development-only browser overlay), Clockwork (browser devtools integration). All capture query count, duration, N+1 detection, and request timeline.
- **Difficulty:** Intermediate
- **Dependencies:** 4.25 Lazy loading detection, 4.26 Query log analysis

## Dependency Graph
**Depends on:** "4.25 Lazy loading detection", "4.26 Query log analysis"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Laravel Telescope**: Full request dump (queries, model actions, mail, notifications, jobs, logs). Stores to database. Built-in gate for authorization. Cleans old records via `telescope:prune`.; - **Debugbar**: In-browser toolbar showing queries, memory, load time, routes. Development-only. Zero-config for local dev.; - **Clockwork**: Chrome/Firefox devtools panel. Lightweight alternative to Debugbar. Works via custom panel in browser..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization