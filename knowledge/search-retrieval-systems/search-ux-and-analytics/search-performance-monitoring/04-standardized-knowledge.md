| Metadata | |
|---|---|
| KU ID | ku-10 |
| Subdomain | search-ux-and-analytics |
| Topic | Search Performance Monitoring |
| Source | Industry |
| Maturity | Stable |

## Overview

Search performance monitoring tracks latency, throughput, error rates, and availability of the search system. Key metrics: P50/P95/P99 latency, queries per second (QPS), error rate, and index lag. Monitoring enables proactive detection of performance degradation before users are impacted.

## Core Concepts

- **Latency Percentiles**: P50 (median), P95, P99 — tail latency matters for UX
- **QPS (Queries Per Second)**: Throughput measure for capacity planning
- **Error Rate**: Percentage of search queries returning errors
- **Index Lag**: Time between database write and search index availability
- **Availability**: Search engine uptime percentage
- **Apdex**: Application Performance Index for user-satisfaction-based scoring

## When To Use

- Any production search implementation
- Performance SLO (Service Level Objective) tracking
- Capacity planning for search infrastructure
- Proactive issue detection

## When NOT To Use

- Development/staging environments
- Very low-traffic applications (noise)

## Best Practices

1. **Monitor P95 latency, not just average**: Tail latency affects user experience.
2. **Set latency SLOs**: e.g., P95 < 200ms, P99 < 500ms.
3. **Track error rate**: Alert on > 1% error rate.
4. **Monitor index lag**: Ensure index is up-to-date within acceptable window.
5. **Use APM tools**: Laravel Telescope, New Relic, Datadog for integrated monitoring.
6. **Alert proactively**: Threshold-based alerts before users notice issues.

## Related Topics

- K004 (Performance benchmarking)
- K014 (Index failure handling)
- K008 (Analytics tracking)

## AI Agent Notes

- P95 latency is the most important user-facing metric
- Index lag is often overlooked but critical for consistency
- For agents: implement P95 latency, error rate, and index lag monitoring

## Verification

- [ ] Latency percentiles measured (P50, P95, P99)
- [ ] QPS measured
- [ ] Error rate tracked
- [ ] Index lag monitored
- [ ] Latency SLOs defined and enforced
- [ ] Alerting configured for threshold breaches
- [ ] APM tool integrated (Telescope, New Relic)
- [ ] Search performance dashboard built
