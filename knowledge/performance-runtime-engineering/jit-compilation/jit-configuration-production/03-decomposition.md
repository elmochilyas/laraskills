# Decomposition: Jit Configuration Production

## Topic Overview
Production JIT configuration requires balancing compilation overhead against execution gains. The recommended starting point is `opcache.jit=1254` with `jit_buffer_size=128M`. For CPU-bound workloads, increase to `1255` or `1235` with `256M` buffer. For I/O-bound workloads, JIT provides minimal benefit but can remain enabled without harm — just ensure buffer size doesn't starve memory.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/jit-configuration-production/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Jit Configuration Production
- **Purpose:** Production JIT configuration requires balancing compilation overhead against execution gains. The recommended starting point is `opcache.jit=1254` with `jit_buffer_size=128M`. For CPU-bound workloads, increase to `1255` or `1235` with `256M` buffer. For I/O-bound workloads, JIT provides minimal benefit but can remain enabled without harm — just ensure buffer size doesn't starve memory.
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
  - Progressive enablement
  - Interpreter vs translator model
  - Profile-then-enable

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