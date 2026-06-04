# Decomposition: Slow Log Configuration Analysis

## Topic Overview
`request_slowlog_timeout` enables PHP-FPM to log a stack trace of any request exceeding a threshold. This is the most direct way to identify slow code paths in production without installing a profiler. Set it to the p75 latency — requests slower than this trigger a backtrace showing exactly which function is taking too long.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/slow-log-configuration-analysis/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Slow Log Configuration Analysis
- **Purpose:** `request_slowlog_timeout` enables PHP-FPM to log a stack trace of any request exceeding a threshold. This is the most direct way to identify slow code paths in production without installing a profiler. Set it to the p75 latency — requests slower than this trigger a backtrace showing exactly which function is taking too long.
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
  - Slow log triage
  - Setting request_slowlog_timeout too low
  - Restaurant kitchen model
  - Monitor-then-size

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