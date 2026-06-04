# Metadata
Domain: Real-Time Systems
Subdomain: Real-Time Notifications
Knowledge Unit: Real-Time Dashboard Architecture
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Real-time dashboards require continuous data flow from backend systems to frontend visualization components. The architecture typically involves metric collection (from Laravel, Redis, queue workers), data aggregation (pre-computed metrics for real-time display), event broadcasting (pushing aggregated data to connected clients), and frontend rendering (charts, gauges, tables updating without page refresh). Laravel Pulse is the canonical example—a first-party real-time dashboard that uses Reverb broadcasting to push system metrics (requests, queue throughput, memory usage) to the monitoring interface. Building custom real-time dashboards follows the same pattern: collect metrics, aggregate at appropriate intervals, broadcast via events, and subscribe via Echo on the frontend.

## Core Concepts
A real-time dashboard architecture has three layers: **data collection** (metrics gathered from application, infrastructure, and queue systems), **processing** (aggregation, transformation, filtering—often on a timer), and **delivery** (broadcasting aggregated data to dashboard clients). The delivery layer uses the standard broadcasting system: events are dispatched periodically (not per-action) to rate-limited channels. Dashboards typically use private channels per user/team, with presence channels for multi-viewer shared dashboards. Frontend libraries like Chart.js, ApexCharts, or Recharts update from Echo event data rather than polling.

## Mental Models
A real-time dashboard is a window into the application's vital signs. The application generates metrics (heart rate, blood pressure), the backend aggregates them (AI interprets the raw data), and broadcasting pushes the interpreted data to the display (Echo updates the monitor).

## Internal Mechanics
The backend typically runs a scheduled command or a dedicated daemon that collects metrics at fixed intervals (e.g., every 5 seconds). This could be from Laravel's internal metrics, Redis INFO, queue worker stats, or external monitoring APIs. The collected data is aggregated (average, sum, rate per second) and dispatched as a broadcast event on a dashboard-specific channel. Echo on the frontend subscribes to the channel and updates chart data series. Laravel Pulse uses a `pulse:check` daemon that runs on the Reverb server and broadcasts via the Pulse broadcast channel to the Pulse dashboard.

## Patterns
- **Timer-based metric dispatch**: Aggregate data over a window (e.g., 5s), broadcast the window summary, not individual events
- **Dedicated dashboard channel**: Private channel per user/team for dashboard-specific data
- **Pre-aggregated payloads**: Send pre-aggregated metrics (count, avg, p95) rather than raw events
- **Chart data accumulation**: Client maintains a rolling window of data points; new broadcasts append to the window
- **Throttled updates**: Dashboard updates at human-perceivable rates (1-5s); sub-second updates are wasted rendering

## Architectural Decisions
- **Separate metric collection from HTTP request lifecycle**: Metrics aggregated from queues/daemons, not inline in requests
- **Pre-aggregation reduces broadcast frequency**: Broadcasting raw events would overwhelm the system; aggregate first
- **Dedicated daemon for metric processing**: Laravel Pulse's `pulse:check` runs separately from web workers
- **In-memory metric buffer (Pulse uses Redis)**: Metrics stored in Redis with TTL for rolling window calculations

## Tradeoffs
- **Aggregation granularity vs. freshness**: Shorter aggregation windows (1s) provide fresher data but more broadcasts; longer windows (10s) reduce load but show stale metrics
- **Broadcast frequency vs. bandwidth**: 1 broadcast per second per dashboard is sustainable for most deployments; sub-second is overkill
- **Client-side vs. server-side aggregation**: Client-side reduces server load but requires more JavaScript processing and inconsistent data views
- **Custom vs. Pulse**: Custom dashboards provide flexibility but require building the collection, aggregation, and display pipeline

## Performance Considerations
- Broadcast frequency should match human perception thresholds (200ms for animations, 1-5s for dashboard updates)
- Pre-aggregation reduces per-broadcast payload size and frequency
- Dashboard channels should be private; presence channels add overhead (join/leave tracking per viewer)
- Many viewers subscribing to the same channel: fan-out cost is O(n) per broadcast
- Redis for metric storage: avoid complex data structures that increase memory usage (use simple counters/hashes)

## Production Considerations
- Run the metric collection daemon on the Reverb server (or a dedicated metrics server)
- Set up separate queue for metric collection to avoid starving application queues
- Implement data retention for historical dashboard views (time-series database or Redis with TTL)
- Use caching for expensive metric calculations
- Monitor dashboard broadcast volume separately from application broadcast volume
- Design dashboard to degrade gracefully when backend is unavailable (show stale data, not spinner)
- Implement access control: dashboard channels should require authorization

## Common Mistakes
- Broadcasting every individual metric change instead of aggregating (overwhelms the broadcast system)
- Using presence channels for dashboard viewers when private channels suffice (unnecessary overhead)
- Sending full metric datasets on every broadcast instead of incremental updates
- Not pre-aggregating metrics on the server, forcing clients to compute averages/percentiles
- Refreshing dashboard on page navigation instead of using persistent Echo subscriptions
- Polling for dashboard data instead of using real-time broadcasting (defeats the purpose)

## Failure Modes
- **Metric collection daemon crash**: Dashboard freezes; no new data broadcast; clients show stale metrics
- **Broadcast channel overload**: Too many dashboard broadcasts compete with application broadcasts; both delayed
- **Client memory growth**: Accumulated chart data over hours causes browser memory pressure; implement data windowing
- **Redis metric buffer full**: TTL not configured; metric keys accumulate indefinitely
- **Thundering herd on dashboard load**: Many clients load dashboard simultaneously; all fetch historical data from API

## Ecosystem Usage
- Laravel Pulse: built-in real-time application monitoring dashboard
- Custom admin dashboards: order volume, user registrations, revenue in real-time
- Operations dashboards: server metrics, queue throughput, error rates, deployment monitoring
- Business intelligence dashboards: sales performance, customer activity, product usage
- Live event monitoring: concurrent users, page views, feature adoption

## Related Knowledge Units
- K19: Real-Time Notifications (Broadcast + Database)
- K37: Reverb Monitoring Metrics
- K21: Laravel Pulse Monitoring
- K11: Public/Private/Presence Channel Patterns

## Research Notes
Laravel Pulse is the canonical implementation of a real-time dashboard in the Laravel ecosystem. It uses a dedicated `pulse:check` daemon that collects metrics from the application's cache, queue, and database, aggregates them, and broadcasts to the Pulse dashboard. The Pulse architecture demonstrates the pre-aggregation pattern: metrics are collected and aggregated in Redis, then broadcast as pre-computed summaries. For custom dashboards, the same pattern applies: collect, aggregate, broadcast, and render. The frontend chart library choice (Chart.js, ApexCharts, Recharts) should support data updates without full re-renders. The broadcast payload should include enough context for incremental updates (appending to time series, updating counters) without requiring full state sync.
