# Decomposition: Deferred Providers Resolved Bindings

## Topic Overview
Octane shifts the cost of service provider boot from per-request to per-worker-start. **Deferred providers** delay provider loading until a bound service is actually requested. **Pre-resolved bindings** resolve services during worker boot (not per-request) to reduce request-time latency. Together, they optimize the boot/request split that Octane creates.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-octane-performance/deferred-providers-resolved-bindings/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Deferred Providers Resolved Bindings
- **Purpose:** Octane shifts the cost of service provider boot from per-request to per-worker-start. **Deferred providers** delay provider loading until a bound service is actually requested. **Pre-resolved bindings** resolve services during worker boot (not per-request) to reduce request-time latency. Together, they optimize the boot/request split that Octane creates.
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
  - Defer default
  - Pre-resolving everything
  - Power plant model
  - Safe migration pattern

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