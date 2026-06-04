# ECC Standardized Knowledge — Integration Metrics

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | observability-monitoring |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Integration Metrics |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K028, K029, K007, K024 |

## Overview (Engineering Value)
Integration metrics provide quantitative data about the health, performance, and reliability of API integrations. Key metrics include request volume, latency, error rates, and rate limit headroom per service. Laravel Pulse provides built-in monitoring for queue throughput and job duration, while custom metrics track integration-specific KPIs. Circuit breaker state, webhook delivery success rates, and retry frequency are leading indicators of integration health. These metrics enable data-driven decisions about capacity planning, provider reliability, and integration optimization.

## Core Concepts
- **Request Volume**: Requests per minute per integration service
- **Latency Distribution**: P50, P95, P99 response times per endpoint
- **Error Rate**: Percentage of 4xx and 5xx responses per service
- **Rate Limit Headroom**: Remaining requests in current rate limit window
- **Circuit Breaker State**: Time in Open/Half-Open state per service
- **Retry Rate**: Percentage of requests requiring retry; indicator of service stability
- **Webhook Delivery Success Rate**: Successful vs failed webhook deliveries

## When To Use
- Production monitoring for all critical integrations
- Capacity planning based on integration usage trends
- Provider reliability assessment (deciding whether to switch providers)
- SLA compliance monitoring for consumer-facing integrations

## When NOT To Use
- Prototypes or non-production systems
- Integrations with negligible traffic or business impact

## Best Practices
- Track both client-side metrics (what your app experiences) and server-side (what the API reports)
- Monitor leading indicators (rate limit headroom, retry rate) not just lagging (error rate)
- Set alert thresholds based on baseline data (first 2 weeks of operation)
- Use Pulse cards for real-time metrics; long-term storage for trend analysis
- Correlate integration metrics with business metrics (webhook delays → order fulfillment lag)

## Architecture Guidelines
- Pulse custom cards for integration metrics per service
- Structured logging for metric collection (extract metrics from logs)
- Horizon dashboards for webhook queue metrics
- Custom metric collectors in service classes (timing, status tracking)
- Alerting on error rate spikes and rate limit headroom exhaustion

## Performance Considerations
- Metric collection adds <1ms overhead per request (increment counters)
- Pulse snapshot storage: ~100 bytes per snapshot per queue
- Avoid blocking metric collection on critical path; use async recording
- Sample metrics for high-volume integrations to reduce storage

## Common Mistakes
- Tracking only error rates, not leading indicators (retry rate, headroom)
- No baseline period before setting alert thresholds (too noisy or too silent)
- Storing all raw metrics indefinitely (unbounded storage growth)
- Not correlating metrics across layers (HTTP errors + queue delays + business impact)

## Related Topics
- **Prerequisites**: Laravel Pulse, logging fundamentals
- **Closely Related**: Integration health checks (ku-01), logging and tracing
- **Advanced**: Prometheus/Grafana integration, SLO/SLA tracking
- **Cross-Domain**: Site reliability engineering, observability

## Verification
- [ ] Request volume, latency, and error rate tracked per service
- [ ] Rate limit headroom monitored and alerted
- [ ] Circuit breaker state transitions recorded
- [ ] Webhook delivery success rate tracked
- [ ] Metrics displayed in Pulse dashboard
- [ ] Alert thresholds configured based on baseline data
