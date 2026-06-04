# Decomposition: Real Time Dashboard Architecture

## Topic Overview
Real-time dashboards require continuous data flow from backend systems to frontend visualization components. The architecture typically involves metric collection (from Laravel, Redis, queue workers), data aggregation (pre-computed metrics for real-time display), event broadcasting (pushing aggregated data to connected clients), and frontend rendering (charts, gauges, tables updating without page refresh). Laravel Pulse is the canonical example—a first-party real-time dashboard that uses Re...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
real-time-notifications/K20-real-time-dashboard-architecture/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Real Time Dashboard Architecture
- **Purpose:** Real-time dashboards require continuous data flow from backend systems to frontend visualization components. The architecture typically involves metric collection (from Laravel, Redis, queue workers), data aggregation (pre-computed metrics for real-time display), event broadcasting (pushing aggregated data to connected clients), and frontend rendering (charts, gauges, tables updating without page refresh). Laravel Pulse is the canonical example—a first-party real-time dashboard that uses Re...
- **Difficulty:** Advanced
- **Dependencies:
  - K19: Real-Time Notifications (Broadcast + Database)
  - K37: Reverb Monitoring Metrics
  - K21: Laravel Pulse Monitoring
  - K11: Public/Private/Presence Channel Patterns

## Dependency Graph
**Depends on:**
  - K19: Real-Time Notifications (Broadcast + Database)
  - K37: Reverb Monitoring Metrics
  - K21: Laravel Pulse Monitoring
  - K11: Public/Private/Presence Channel Patterns

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Timer-based metric dispatch**: Aggregate data over a window (e.g., 5s), broadcast the window summary, not individual events**Dedicated dashboard channel**: Private channel per user/team for dashboard-specific data**Pre-aggregated payloads**: Send pre-aggregated metrics (count, avg, p95) rather than raw events**Chart data accumulation**: Client maintains a rolling window of data points; new broadcasts append to the window**Throttled updates**: Dashboard updates at human-perceivable rates (1-5s); sub-second updates are wasted rendering**Separate metric collection from HTTP request lifecycle**: Metrics aggregated from queues/daemons, not inline in requests**Pre-aggregation reduces broadcast frequency**: Broadcasting raw events would overwhelm the system; aggregate first**Dedicated daemon for metric processing**: Laravel Pulse's `pulse:check` runs separately from web workers**In-memory metric buffer (Pulse uses Redis)**: Metrics stored in Redis with TTL for rolling window calculations**Aggregation granularity vs. freshness**: Shorter aggregation windows (1s) provide fresher data but more broadcasts; longer windows (10s) reduce load but show stale metrics**Broadcast frequency vs. bandwidth**: 1 broadcast per second per dashboard is sustainable for most deployments; sub-second is overkill**Client-side vs. server-side aggregation**: Client-side reduces server load but requires more JavaScript processing and inconsistent data views**Custom vs. Pulse**: Custom dashboards provide flexibility but require building the collection, aggregation, and display pipelineBroadcast frequency should match human perception thresholds (200ms for animations, 1-5s for dashboard updates)Pre-aggregation reduces per-broadcast payload size and frequencyDashboard channels should be private; presence channels add overhead (join/leave tracking per viewer)Many viewers subscribing to the same channel: fan-out cost is O(n) per broadcastRedis for metric storage: avoid complex data structures that increase memory usage (use simple counters/hashes)Run the metric collection daemon on the Reverb server (or a dedicated metrics server)Set up separate queue for metric collection to avoid starving application queuesImplement data retention for historical dashboard views (time-series database or Redis with TTL)Use caching for expensive metric calculationsMonitor dashboard broadcast volume separately from application broadcast volumeDesign dashboard to degrade gracefully when backend is unavailable (show stale data, not spinner)Implement access control: dashboard channels should require authorizationBroadcasting every individual metric change instead of aggregating (overwhelms the broadcast system)Using presence channels for dashboard viewers when private channels suffice (unnecessary overhead)Sending full metric datasets on every broadcast instead of incremental updatesNot pre-aggregating metrics on the server, forcing clients to compute averages/percentilesRefreshing dashboard on page navigation instead of using persistent Echo subscriptionsPolling for dashboard data instead of using real-time broadcasting (defeats the purpose)**Metric collection daemon crash**: Dashboard freezes; no new data broadcast; clients show stale metrics**Broadcast channel overload**: Too many dashboard broadcasts compete with application broadcasts; both delayed**Client memory growth**: Accumulated chart data over hours causes browser memory pressure; implement data windowing**Redis metric buffer full**: TTL not configured; metric keys accumulate indefinitely**Thundering herd on dashboard load**: Many clients load dashboard simultaneously; all fetch historical data from APILaravel Pulse: built-in real-time application monitoring dashboardCustom admin dashboards: order volume, user registrations, revenue in real-timeOperations dashboards: server metrics, queue throughput, error rates, deployment monitoringBusiness intelligence dashboards: sales performance, customer activity, product usageLive event monitoring: concurrent users, page views, feature adoptionK19: Real-Time Notifications (Broadcast + Database)K37: Reverb Monitoring MetricsK21: Laravel Pulse MonitoringK11: Public/Private/Presence Channel Patterns

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