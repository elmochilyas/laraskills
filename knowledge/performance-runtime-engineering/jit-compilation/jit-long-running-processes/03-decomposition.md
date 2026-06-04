# Decomposition: Jit Long Running Processes

## Topic Overview
In long-running processes (Octane workers, Swoole servers, FrankenPHP threads), JIT compilation latency is incurred once per function per process lifetime, then amortized over thousands of requests. This makes JIT more attractive in persistent-worker architectures than in PHP-FPM, where worker recycling (pm.max_requests) periodically resets the JIT buffer's value.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/jit-long-running-processes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Jit Long Running Processes
- **Purpose:** In long-running processes (Octane workers, Swoole servers, FrankenPHP threads), JIT compilation latency is incurred once per function per process lifetime, then amortized over thousands of requests. This makes JIT more attractive in persistent-worker architectures than in PHP-FPM, where worker recycling (pm.max_requests) periodically resets the JIT buffer's value.
- **Difficulty:** Advanced
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Pre-warming JIT
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