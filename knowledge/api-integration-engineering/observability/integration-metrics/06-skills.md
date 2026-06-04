# Skill: Collect and Expose Integration Metrics for Monitoring

## Purpose
Collect key metrics for each API integration (request count, latency, error rate, rate limit usage) and expose them for dashboarding and alerting.

## When To Use
- Production monitoring of integration health
- Capacity planning and trend analysis
- SLA compliance measurement
- Identifying integration degradation over time

## When NOT To Use
- Development environments
- Low-volume, non-critical integrations

## Prerequisites
- Metrics collection library (Prometheus, InfluxDB, or log-based)
- Dashboard tool (Grafana, Laravel Dashboard)

## Workflow
1. Define metrics per integration: request count, latency (p50/p95/p99), error count, rate limit headroom
2. Use Prometheus client or log-structured metrics
3. Collect metrics via middleware or Guzzle on-request handler
4. Tag metrics with integration name, endpoint, status code
5. Expose metrics endpoint: `/metrics` for Prometheus scraping
6. Build Grafana dashboard for integration overview
7. Set alert thresholds on error rate and latency
8. Monitor metric trends over time for anomaly detection

## Validation Checklist
- [ ] Metrics defined per integration (count, latency, errors, rate limit)
- [ ] Metrics collection via middleware or handler
- [ ] Metrics tagged with integration, endpoint, status
- [ ] `/metrics` endpoint exposed for scraping
- [ ] Dashboard built for integration overview
- [ ] Alert thresholds configured
- [ ] Metric trends monitored for anomalies
