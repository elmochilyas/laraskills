# Decomposition: Tool Selection By Layer

## Topic Overview
Choose benchmarking tools by the layer you're testing: **Protocol/application load testing** (k6, JMeter, Gatling, Locust) for realistic user journeys — multi-step, variable think times, assertions. **Network edge/throughput** (wrk, wrk2, Vegeta, hey) for raw throughput and latency — single endpoint, high concurrency. **Browser** (Lighthouse, Playwright) for frontend performance — LCP, CLS, INP. Use the right tool for the right question.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
benchmarking-methodology/tool-selection-by-layer/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Tool Selection By Layer
- **Purpose:** Choose benchmarking tools by the layer you're testing: **Protocol/application load testing** (k6, JMeter, Gatling, Locust) for realistic user journeys — multi-step, variable think times, assertions. **Network edge/throughput** (wrk, wrk2, Vegeta, hey) for raw throughput and latency — single endpoint, high concurrency. **Browser** (Lighthouse, Playwright) for frontend performance — LCP, CLS, INP. Use the right tool for the right question.
- **Difficulty:** Foundation
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Using Apache Bench (ab) for production benchmarking
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