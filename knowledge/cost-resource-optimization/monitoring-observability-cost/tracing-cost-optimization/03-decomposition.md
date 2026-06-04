# Decomposition: Tracing Cost Optimization

## Topic Overview
Distributed tracing (X-Ray, Datadog APM, New Relic Distributed Tracing) captures end-to-end request flows across services. For Laravel applications, tracing spans are generated for every HTTP request, database query, cache operation, and queue job. Pricing is per span ingested. An unoptimized Laravel app can generate 50+ spans per request, making tracing the most expensive observability component at scale. Sampling and span filtering are essential cost controls.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-tracing-cost-optimization/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Tracing Cost Optimization
- **Purpose:** Distributed tracing (X-Ray, Datadog APM, New Relic Distributed Tracing) captures end-to-end request flows across services. For Laravel applications, tracing spans are generated for every HTTP request, database query, cache operation, and queue job. Pricing is per span ingested. An unoptimized Laravel app can generate 50+ spans per request, making tracing the most expensive observability component at scale. Sampling and span filtering are essential cost controls.
- **Difficulty:** Foundation
- **Dependencies:** - Sampling Strategies (ku-04), - Metric Cost Optimization (ku-02), - Data Retention Tiering (ku-05), - Scout APM vs X-Ray vs Datadog

## Dependency Graph
**Depends on:**
- Sampling Strategies (ku-04)
- Metric Cost Optimization (ku-02)
- Data Retention Tiering (ku-05)
- Scout APM vs X-Ray vs Datadog

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Distributed tracing: Microservices or multi-service Laravel apps (app + queue + worker + cron)
- Performance debugging: Identifying latency bottlenecks across service boundaries
- Error correlation: Tracing errors across services with single trace ID
- X-Ray: Low-cost option for AWS-native Laravel apps
- Tail-based sampling: When you need to capture all error traces and slow traces (not just random sample)
**Out of scope:**
- Single-service Laravel app: Monolithic app doesn't benefit from distributed tracing (APM is sufficient)
- All-spans tracing at high volume: 1000 req/s x 50 spans = 50M spans/day = $500-3500/month in tracing costs
- Tracing every request: For high-traffic apps, 100% sampling costs more than the compute infrastructure
- X-Ray for high-trace volume: X-Ray's per-trace pricing adds up quickly at scale ($1000+/month for 200M spans)
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