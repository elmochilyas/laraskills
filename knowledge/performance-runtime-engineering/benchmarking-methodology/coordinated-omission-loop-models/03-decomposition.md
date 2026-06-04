# Decomposition: Coordinated Omission Loop Models

## Topic Overview
**Coordinated omission** is a benchmark bias where the tool stops measuring latency during overload. Closed-loop tools (wrk, ab, hey) wait for a response before sending the next request — when the server slows down, the tool naturally slows down too, "omitting" the queuing delay from latency measurements. Open-loop tools (wrk2 with `--rate`, k6 with constant RPS) send requests at a fixed rate regardless of response time, capturing true latency under load.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
benchmarking-methodology/coordinated-omission-loop-models/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Coordinated Omission Loop Models
- **Purpose:** **Coordinated omission** is a benchmark bias where the tool stops measuring latency during overload. Closed-loop tools (wrk, ab, hey) wait for a response before sending the next request — when the server slows down, the tool naturally slows down too, "omitting" the queuing delay from latency measurements. Open-loop tools (wrk2 with `--rate`, k6 with constant RPS) send requests at a fixed rate regardless of response time, capturing true latency under load.
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
  - Coordinated omission
  - Correct benchmarking protocol
  - Trusting ab/wrk latency numbers
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