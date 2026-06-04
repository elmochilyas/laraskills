# Decomposition: Tideways Setup Continuous Monitoring

## Topic Overview
Tideways is a **continuous APM and profiling** solution. It samples a percentage of requests (configurable, default 10-20%), captures full call graphs and SQL queries for sampled requests, and aggregates metrics (p50/p95/p99, error rates, slowest endpoints) for all requests. Architecture: PHP extension ? local daemon ? Tideways cloud ? API/dashboard.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
profiling-observability/tideways-setup-continuous-monitoring/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Tideways Setup Continuous Monitoring
- **Purpose:** Tideways is a **continuous APM and profiling** solution. It samples a percentage of requests (configurable, default 10-20%), captures full call graphs and SQL queries for sampled requests, and aggregates metrics (p50/p95/p99, error rates, slowest endpoints) for all requests. Architecture: PHP extension ? local daemon ? Tideways cloud ? API/dashboard.
- **Difficulty:** Intermediate
- **Dependencies:
  - Hosted Profiling | APM Integration Patterns
  - --

## Dependency Graph
**Depends on:**
  - Hosted Profiling | APM Integration Patterns
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Endpoint-level sampling
  - 100% sampling in production
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