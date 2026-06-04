# Decomposition: Metric Cost Optimization

## Topic Overview
Custom metrics (CloudWatch, Datadog, New Relic, Scout APM) are priced per metric per month. For Laravel applications, instrumenting every query, cache hit, queue job, and response time can generate thousands of custom metrics, rapidly escalating costs. Selective instrumentation, metric aggregation, and proper resolution settings reduce metric costs by 60-80% while preserving essential signals.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-metric-cost-optimization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Metric Cost Optimization
- **Purpose:** Custom metrics (CloudWatch, Datadog, New Relic, Scout APM) are priced per metric per month. For Laravel applications, instrumenting every query, cache hit, queue job, and response time can generate thousands of custom metrics, rapidly escalating costs. Selective instrumentation, metric aggregation, and proper resolution settings reduce metric costs by 60-80% while preserving essential signals.
- **Difficulty:** Foundation
- **Dependencies:** - Log Cost Optimization (ku-01), - Tracing Cost Optimization (ku-03), - Sampling Strategies (ku-04), - Scout APM vs Datadog vs New Relic

## Dependency Graph
**Depends on:**
- Log Cost Optimization (ku-01)
- Tracing Cost Optimization (ku-03)
- Sampling Strategies (ku-04)
- Scout APM vs Datadog vs New Relic

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Custom metrics: Monitor business KPIs, application performance trends, deployment health
- Business metrics: Orders placed, users registered, revenue processed (not just technical)
- APM: Scout APM for Laravel-specific insights (queries, N+1 detection, cache performance)
- Standard resolution: Most application metrics (1-minute resolution is sufficient for trend monitoring)
- High-resolution: Only for real-time alerting on fast-changing metrics (request latency spikes)
**Out of scope:**
- Per-endpoint metrics: Don't create separate metric per URL path (use labels/tags instead; high cardinality)
- High-resolution for trend data: 1-second resolution for "monthly active users" is wasteful
- Unused metrics: Don't create metrics that are never graphed or alerted on
- datadog for all-in-one: Consider Scout APM for simpler Laravel monitoring (host-based pricing)
- Excessive dimensions: Each dimension multiplies metric count; limit to 3-5 dimensions
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization