# Decomposition: Ebpf Php Profiling

## Topic Overview
**eBPF** (extended Berkeley Packet Filter) enables kernel-level CPU sampling with **near-zero overhead** (<1%). Tools like Pyroscope and Parca use eBPF to capture stack traces of PHP processes without modifying PHP or installing a PHP extension. Sampling frequency: 99-199 Hz (configurable). PID scoping limits profiling to specific containers or PHP-FPM process IDs.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
profiling-observability/ebpf-php-profiling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Ebpf Php Profiling
- **Purpose:** **eBPF** (extended Berkeley Packet Filter) enables kernel-level CPU sampling with **near-zero overhead** (<1%). Tools like Pyroscope and Parca use eBPF to capture stack traces of PHP processes without modifying PHP or installing a PHP extension. Sampling frequency: 99-199 Hz (configurable). PID scoping limits profiling to specific containers or PHP-FPM process IDs.
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
  - eBPF
  - eBPF + PHP profiler combo
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