# Decomposition: OpenTelemetry Metrics API

## Topic Overview
The OpenTelemetry Metrics API provides standard instruments for recording numerical measurements: Counter (monotonic sum), UpDownCounter (non-monotonic sum), Histogram (distribution), and Observable instruments (Gauge, Counter, UpDownCounter) for externally-measured values. The API is stable in PHP as of 2026. Laravel applications can instrument business metrics (orders processed, revenue, active users) alongside system metrics (request duration, queue depth, cache hit ratio).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
metrics-collection/otel-metrics-api/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### OpenTelemetry Metrics API
- **Purpose:** The OpenTelemetry Metrics API provides standard instruments for recording numerical measurements: Counter (monotonic sum), UpDownCounter (non-monotonic sum), Histogram (distribution), and Observable instruments (Gauge, Counter, UpDownCounter) for externally-measured values. The API is stable in PHP as of 2026. Laravel applications can instrument business metrics (orders processed, revenue, active users) alongside system metrics (request duration, queue depth, cache hit ratio).
- **Difficulty:** Advanced
- **Dependencies:
  - Prometheus Integration (Prometheus exposition format for OTel metrics)
  - OpenTelemetry PHP SDK (MeterProvider setup)
  - Laravel Pulse (first-party metrics dashboard, complementary to OTel)

## Dependency Graph
**Depends on:**
  - Prometheus Integration (Prometheus exposition format for OTel metrics)
  - OpenTelemetry PHP SDK (MeterProvider setup)
  - Laravel Pulse (first-party metrics dashboard, complementary to OTel)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Counter
  - UpDownCounter
  - Histogram
  - ObservableGauge
  - ObservableCounter
  - Meter
  - Aggregation temporality
  - Cardinality

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