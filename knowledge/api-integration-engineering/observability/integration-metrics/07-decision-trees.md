# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 07-observability
**Knowledge Unit:** integration-metrics
**Generated:** 2026-06-03

---

# Decision Inventory

1. Metric Collection Scope (Basic vs Comprehensive)
2. Metric Storage and Retention Strategy
3. Alert Threshold Configuration Strategy

---

# Architecture-Level Decision Trees

---

## Metric Collection Scope

---

## Decision Context

Determining which integration metrics to collect and at what granularity.

---

## Decision Criteria

* service criticality
* traffic volume
* debugging needs
* operational cost

---

## Decision Tree

Is the integration business-critical (payments, auth, orders)?
↓
YES → Collect comprehensive metrics per service
  ↓
  Metrics to collect (all of):
  Request volume (req/min) → P50/P95/P99 latency → Error rate (4xx, 5xx)
  Rate limit headroom → Circuit breaker state → Retry rate
  ↓
  Different endpoints or aggregate per service?
  ↓
  Per-endpoint → Structured logging extracts metrics per route
  Aggregate → Track at service level only (simpler, less noisy)
NO → Collect basic metrics per service
  ↓
  Basic metrics:
  Request volume → P95 latency → Error rate (aggregate)
  Circuit breaker state (if implemented)
↓
  Track leading indicators (retry rate, headroom)?
  ↓
  YES → Adds alerting lead time before errors occur
  NO → Reactive — only know of problems when errors appear
↓
  Webhook-specific metrics needed?
  ↓
  YES → Track delivery success rate, delivery latency, event type distribution
  NO → HTTP metrics cover webhook receiving; delivery metrics separate

---

## Rationale

Critical services warrant full metrics for proactive detection. Basic metrics suffice for non-critical services to reduce storage and noise. Leading indicators provide minutes of warning before error rates spike.

---

## Recommended Default

**Default:** Full metrics (volume, latency P50/P95/P99, error rate, headroom, retry rate) for critical services; basic (volume, P95, error rate) for standard services
**Reason:** Appropriate depth for each tier without over-collecting for low-impact services

---

## Risks Of Wrong Choice

Too few metrics miss degradation indicators. Too many metrics create noise and storage costs. No leading indicators mean errors are the first signal of trouble.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Pulse vs Prometheus selection)
* 07-observability: integration-health-checks (health checks vs metrics)

---

---

## Metric Storage and Retention Strategy

---

## Decision Context

Choosing where to store metrics and how long to retain them.

---

## Decision Criteria

* query performance
* retention requirements
* cost budget
* analysis depth

---

## Decision Tree

Is real-time dashboard visibility needed?
↓
YES → Use Laravel Pulse for live metrics (last hour)
  ↓
  Need historical trend analysis (>24h)?
  ↓
  YES → Export Pulse snapshots to time-series DB (InfluxDB, TimescaleDB)
  ↓
    Compliance requirement for 90-day retention?
    ↓
    YES → Store raw metrics in cost-optimized storage (S3, BigQuery)
    NO → Store aggregated hourly metrics for 30 days; purge raw
  NO → Pulse snapshots suffice; extend snapshot retention to 7 days
NO → Use structured logs as metric source; query on-demand
  ↓
  Log volume high (>1GB/day)?
  ↓
  YES → Sample logs (keep 10% of requests) before metric extraction
  NO → Full log ingestion; extract metrics via log aggregation tool
↓
  Budget for dedicated metrics infrastructure?
  ↓
  YES → Prometheus + Grafana for full SLO/SLA tracking and alerting
  NO → Pulse + structured logs; manual analysis for deeper investigation
↓
  Metric cardinality concerns?
  ↓
  High (many unique tag values per service) → Limit to service name + endpoint group
  Low (few unique service names) → Include endpoint path, status code, error type

---

## Rationale

Pulse provides real-time visibility with minimal infrastructure. Time-series DB enables trend analysis for capacity planning. Structured logs as fallback avoid dedicated infrastructure cost.

---

## Recommended Default

**Default:** Laravel Pulse for live metrics + log-extracted metrics for 30-day aggregated retention
**Reason:** Zero additional infrastructure cost; 30-day trends sufficient for most capacity and reliability analysis

---

## Risks Of Wrong Choice

No historical metrics mean no trend analysis for capacity planning. Only raw logs mean slow queries for common metrics. High-cardinality tags increase storage costs without proportional insight.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Pulse configuration, Prometheus alternatives)
* 07-observability: telescope-debugging (Telescope for deep dive vs metrics for trends)

---

---

## Alert Threshold Configuration Strategy

---

## Decision Context

Setting appropriate thresholds for metric-based alerts to minimize noise while catching real issues.

---

## Decision Criteria

* baseline behavior
* tolerance for false positives
* integration criticality
* traffic patterns

---

## Decision Tree

Has baseline data been collected (>2 weeks)?
↓
YES → Set dynamic thresholds based on observed P95/P99 baselines
  ↓
  Is traffic predictable (steady-state)?
  ↓
  YES → Fixed percentage above baseline (e.g., alert on latency >2x P95 baseline)
  NO → Moving average with seasonal adjustment for traffic patterns
  ↓
  Error rate threshold:
  Critical services → Alert on >1% error rate sustained for 2+ minutes
  Standard services → Alert on >5% error rate sustained for 5+ minutes
NO → Start with conservative static thresholds
  ↓
  Error rate → 10% for 5 minutes (reduces noise while baseline established)
  Latency → >5s P95 for 3 minutes (catches severe degradation only)
  Retry rate → >20% for 5 minutes (indicates upstream issues)
↓
  Leading indicator thresholds (after baseline established):
  Rate limit headroom → Alert when <20% remaining for 5+ minutes
  Retry rate → Alert when >2x baseline retry rate for 5+ minutes
  Circuit breaker open → Immediate alert (service is down)
↓
  Day-of-week / time-of-day adjustment?
  ↓
  YES → Higher thresholds during known peak hours (lower false positives)
  NO → Single threshold risks noise during peaks, misses during troughs

---

## Rationale

Baseline-based thresholds adapt to normal service behavior. Conservative initial thresholds prevent alert fatigue. Leading indicators provide earlier warning than error-rate-only alerts.

---

## Recommended Default

**Default:** After 2-week baseline: latency >2x P95 for 3min, error rate >1% for 2min (critical) / >5% for 5min (standard), headroom <20% for 5min
**Reason:** Balances early detection with acceptable false positive rate for each service tier

---

## Risks Of Wrong Choice

No baseline causes too many or too few alerts. Static thresholds on variable traffic cause alert fatigue during peaks and missed issues during troughs. No leading indicators mean you only discover problems after users report errors.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Pulse alerting configuration)
* 07-observability: integration-health-checks (health check alerts vs metric alerts)
