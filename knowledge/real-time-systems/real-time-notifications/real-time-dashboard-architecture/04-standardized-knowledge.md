# Standardized Knowledge: Real-Time Dashboard Architecture

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Real-Time Notifications |
| Knowledge Unit ID | K20 |
| Title | Real-Time Dashboard Architecture |
| Difficulty | Advanced |
| Dependencies | K19, K37, K21, K11 |

## Overview
Real-time dashboards require continuous data flow from backend systems to frontend visualization components. The architecture involves metric collection, data aggregation (pre-computed metrics for real-time display), event broadcasting (pushing aggregated data to connected clients), and frontend rendering (charts, gauges, tables updating without page refresh). Laravel Pulse is the canonical example—a first-party real-time dashboard that uses Reverb broadcasting to push system metrics to the monitoring interface. Custom dashboards follow the same pattern: collect metrics, aggregate at appropriate intervals, broadcast via events, and subscribe via Echo.

## Core Concepts
- Three layers: **data collection** (metrics from application, infrastructure, queue systems), **processing** (aggregation, transformation, filtering on a timer), **delivery** (broadcasting aggregated data to dashboard clients)
- Events are dispatched periodically (not per-action) to rate-limited channels
- Dashboards use private channels per user/team, with presence channels for multi-viewer shared dashboards
- Frontend libraries (Chart.js, ApexCharts, Recharts) update from Echo event data rather than polling

## When To Use
- Operations monitoring (server metrics, queue throughput, error rates)
- Business intelligence (sales performance, customer activity, product usage)
- Live event monitoring (concurrent users, page views, feature adoption)
- System health dashboards with real-time metric visibility

## When NOT To Use
- Historical analysis (use time-series databases and query tools, not real-time dashboards)
- Low-frequency updates (polling every 30+ seconds is simpler and sufficient)
- Single-viewer dashboards without real-time requirements

## Best Practices (Why)
- **Pre-aggregate before broadcasting**: Broadcast window summaries (count, avg, p95), not individual events—reduces broadcast frequency and payload size
- **Use timer-based metric dispatch**: Aggregate over a window (e.g., 5s), broadcast the window summary—avoids overwhelming the broadcast system
- **Implement throttled updates**: Dashboard updates at human-perceivable rates (1-5s); sub-second updates are wasted rendering
- **Maintain chart data accumulation on client**: Client maintains a rolling window of data points; new broadcasts append without full re-render
- **Use dedicated dashboard channels**: Private channel per user/team for dashboard-specific data

## Architecture Guidelines
- Separate metric collection from the HTTP request lifecycle—use queues or daemons, not inline in requests
- Run a dedicated daemon for metric processing (Laravel Pulse uses `pulse:check`)
- Use in-memory metric buffers (Pulse uses Redis with TTL) for rolling window calculations
- Design dashboards to degrade gracefully when the backend is unavailable (show stale data, not a spinner)
- Implement access control: dashboard channels require authorization

## Performance Considerations
- Broadcast frequency should match human perception thresholds (200ms for animations, 1-5s for dashboard updates)
- Pre-aggregation reduces per-broadcast payload size and frequency
- Dashboard channels should be private; presence channels add join/leave tracking overhead
- Fan-out cost is O(n) per broadcast for many viewers on the same channel
- Use Redis for metric storage but avoid complex data structures—use simple counters/hashes

## Security Considerations
- Dashboard channels must be authorized—do not expose system metrics to unauthenticated users
- Use private channels per user/team to scope dashboard data access
- Broadcast payloads may contain sensitive operational data; validate what gets broadcast
- The metric collection daemon should run with minimal privileges

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Broadcasting individual events | Every metric change triggers a broadcast | Not understanding aggregation patterns | Overwhelms the broadcast system | Aggregate over time windows, broadcast summaries |
| Using presence channels unnecessarily | Presence channels for every dashboard viewer | Assuming presence is needed | Unnecessary join/leave overhead | Use private channels unless multi-user collaboration is required |
| Full dataset on every broadcast | Sending entire metric history each time | Simplicity over incremental design | Large payloads, wasted bandwidth | Send incremental updates; client appends to rolling window |
| Client-side aggregation of raw metrics | Forcing clients to compute averages/percentiles | Not pre-aggregating on the server | Inconsistent data views, extra JS processing | Pre-aggregate on the server |
| Polling instead of broadcasting | Using fetch intervals for dashboard data | Familiarity with HTTP polling | Defeats the real-time purpose | Use Echo broadcasting for push-based updates |

## Anti-Patterns
- **Dashboard refreshes on page navigation**: Breaks the persistent Echo subscription; use a persistent layout component
- **No data windowing on client**: Accumulated chart data over hours causes browser memory pressure
- **Sub-second broadcast intervals**: Human perception cannot utilize updates faster than ~200ms; wastes resources
- **Mixing dashboard broadcast traffic with application broadcast traffic**: Can cause contention; use separate channels or a dedicated queue

## Examples

### Pulse-style metric collection daemon (pseudocode)
```php
// In a scheduled command or daemon loop
public function handle()
{
    while (true) {
        $metrics = [
            'requests_per_second' => $this->getRequestRate(),
            'queue_throughput' => $this->getQueueThroughput(),
            'memory_usage' => memory_get_usage(true),
            'cpu_load' => sys_getloadavg()[0],
        ];

        broadcast(new DashboardMetricsUpdated($metrics));

        sleep(5); // 5-second aggregation window
    }
}
```

### Echo listener for dashboard updates
```javascript
Echo.private(`dashboard.team.${teamId}`)
    .listen('DashboardMetricsUpdated', (event) => {
        chartData.value.push({
            time: Date.now(),
            ...event.metrics,
        });
        // Keep rolling window of last 100 data points
        if (chartData.value.length > 100) {
            chartData.value.shift();
        }
    });
```

## Related Topics
- K19: Real-Time Notifications (Broadcast + Database)
- K37: Reverb Monitoring Metrics
- K21: Laravel Pulse Monitoring
- K11: Public/Private/Presence Channel Patterns

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Laravel Pulse is the canonical implementation; its architecture demonstrates the full pattern
- The key insight: aggregate first, broadcast second—never broadcast raw metric events
- Frontend chart libraries should support data updates without full re-renders

## Verification
- [ ] Metric collection decoupled from HTTP request lifecycle (daemon or queue)
- [ ] Pre-aggregation implemented at appropriate intervals (5-10s)
- [ ] Dashboard channels use private or presence authorization
- [ ] Client implements data windowing to prevent memory growth
- [ ] Dashboard degrades gracefully when backend is unavailable
- [ ] Broadcast frequency aligned with human perception thresholds
- [ ] Incremental updates instead of full dataset broadcasts
- [ ] Access control enforced on dashboard channels
