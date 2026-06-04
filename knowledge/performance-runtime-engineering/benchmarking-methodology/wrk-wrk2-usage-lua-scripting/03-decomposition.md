# Decomposition: Wrk Wrk2 Usage Lua Scripting

## Topic Overview
wrk (`wrk -t12 -c400 -d30s http://target`) fires requests using multiple threads and connections. wrk2 adds `--rate` for constant-RPS mode, eliminating coordinated omission. Lua scripting enables custom request generation (headers, body, authentication tokens, CSRF tokens). Output includes latency percentiles, throughput, and error counts.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
benchmarking-methodology/wrk-wrk2-usage-lua-scripting/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Wrk Wrk2 Usage Lua Scripting
- **Purpose:** wrk (`wrk -t12 -c400 -d30s http://target`) fires requests using multiple threads and connections. wrk2 adds `--rate` for constant-RPS mode, eliminating coordinated omission. Lua scripting enables custom request generation (headers, body, authentication tokens, CSRF tokens). Output includes latency percentiles, throughput, and error counts.
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
  - Benchmark progression
  - Using wrk (closed-loop) for latency measurement
  - Thermometer model
  - Iterative benchmarking protocol

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