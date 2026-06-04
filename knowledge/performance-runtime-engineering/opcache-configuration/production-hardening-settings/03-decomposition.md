# Decomposition: Production Hardening Settings

## Topic Overview
The single most impactful production OpCache setting is `opcache.validate_timestamps=0`. This eliminates the `stat()` syscall per file per request � potentially thousands of syscalls per request. Combined with conservative `revalidate_freq` (or 0 when timestamps are disabled), this yields 1-3% additional throughput and significantly reduces CPU syscall overhead.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/production-hardening-settings/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Production Hardening Settings
- **Purpose:** The single most impactful production OpCache setting is `opcache.validate_timestamps=0`. This eliminates the `stat()` syscall per file per request � potentially thousands of syscalls per request. Combined with conservative `revalidate_freq` (or 0 when timestamps are disabled), this yields 1-3% additional throughput and significantly reduces CPU syscall overhead.
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
  - validate_timestamps=1 in production
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