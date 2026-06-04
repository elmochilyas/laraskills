# Decomposition: Blackfire Installation Triggered Profiling

## Topic Overview
Blackfire provides **low-overhead production profiling** (2-5% overhead in sampling mode). Architecture: **Probe** (PHP extension collecting data), **Agent** (local daemon aggregating and forwarding), **CLI/API** (trigger profiling, retrieve results). Supports **triggered profiling** (profile on demand via HTTP header), **automated testing** (assertions on wall time, I/O time, CPU time in CI), and **continuous integration** (performance regression detection).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
profiling-observability/blackfire-installation-triggered-profiling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Blackfire Installation Triggered Profiling
- **Purpose:** Blackfire provides **low-overhead production profiling** (2-5% overhead in sampling mode). Architecture: **Probe** (PHP extension collecting data), **Agent** (local daemon aggregating and forwarding), **CLI/API** (trigger profiling, retrieve results). Supports **triggered profiling** (profile on demand via HTTP header), **automated testing** (assertions on wall time, I/O time, CPU time in CI), and **continuous integration** (performance regression detection).
- **Difficulty:** Intermediate
- **Dependencies:
  - Hosted Profiling | eBPF PHP Profiling | Production Guardrails
  - --

## Dependency Graph
**Depends on:**
  - Hosted Profiling | eBPF PHP Profiling | Production Guardrails
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Canary profiling
  - Blackfire probe without agent
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