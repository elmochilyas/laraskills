# Skill: Architect Real-Time Dashboards with Metric Broadcasting

## Purpose
Design and implement real-time dashboards that push pre-aggregated metrics from backend to frontend via broadcasting, using timer-based dispatch and client-side data windowing.

## When To Use
- Operations monitoring (server metrics, queue throughput, error rates)
- Business intelligence dashboards (sales, customer activity)
- Live event monitoring (concurrent users, page views)
- System health dashboards with real-time metric visibility

## When NOT To Use
- Historical analysis (use time-series databases)
- Low-frequency updates where polling every 30+ seconds suffices
- Single-viewer dashboards without real-time requirements

## Prerequisites
- Broadcasting configured (queue worker, broadcast driver)
- Echo configured on the frontend
- Metric collection mechanism (daemon, queue job, or listener)

## Inputs
- Metric collection sources (application, infrastructure, queue)
- Pre-aggregation window size (typically 5-10 seconds)
- Dashboard channel authorization configuration

## Workflow
1. Decouple metric collection from the HTTP request lifecycle (use daemon or queue)
2. Set up a timer-based dispatch loop (e.g., every 5 seconds)
3. Pre-aggregate metrics before broadcasting (count, avg, p95, not raw events)
4. Create a dashboard event class with minimal payload (window summary)
5. Use private channels for dashboard data (scoped per user/team)
6. Subscribe on frontend via Echo using the dashboard channel
7. Implement client-side data windowing (rolling window of 100 data points)
8. Handle graceful degradation: show stale data with freshness indicator on disconnect
9. Implement access control: dashboard channels require authorization
10. Monitor broadcast frequency to ensure it aligns with human perception (1-5s)

## Validation Checklist
- [ ] Metric collection decoupled from HTTP request lifecycle
- [ ] Pre-aggregation implemented at appropriate intervals (5-10s)
- [ ] Dashboard channels use private or presence authorization
- [ ] Client implements data windowing to prevent memory growth
- [ ] Dashboard degrades gracefully when backend is unavailable
- [ ] Broadcast frequency aligned with human perception thresholds
- [ ] Incremental updates instead of full dataset broadcasts

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Broadcast system overwhelmed | Broadcasting individual events instead of aggregates | Aggregate over time windows |
| Chart memory grows unbounded | No client-side data windowing | Implement rolling window with `.shift()` |
| Dashboard blank on reconnect | No stale data fallback | Show last known data with freshness indicator |
| Metrics skewed | Collection inline in HTTP requests | Use dedicated daemon for metric collection |

## Decision Points
- **Aggregation window**: 5s is good for near-real-time; 10-15s for lower-frequency dashboards
- **Private vs Presence channels**: Use private for single-user dashboards; presence for shared team dashboards
- **Timer-based vs event-driven**: Timer-based produces predictable, throttled updates; event-driven can cause bursts

## Performance/Security Considerations
- Pre-aggregation reduces broadcast frequency and payload size by orders of magnitude
- Dashboard channels must be authorized—never expose system metrics on public channels
- Client-side data windowing prevents browser memory exhaustion
- Broadcast frequency should match human perception (1-5s); sub-second updates are wasted

## Related Rules (from 05-rules.md)
- Always Pre-Aggregate Metrics Before Broadcasting
- Always Use Timer-Based Metric Dispatch
- Always Implement Client-Side Data Windowing
- Always Separate Metric Collection from HTTP Request Lifecycle
- Always Use Private Channels for Dashboard Data
- Always Implement Graceful Degradation When Backend Is Unavailable

## Related Skills
- Set Up Real-Time Notifications with Broadcast + Database
- Monitor Reverb Metrics with Laravel Pulse

## Success Criteria
- Dashboard updates at consistent, human-perceivable intervals (1-5s)
- No broadcast system overload from raw metric events
- Client memory stays bounded with data windowing
- Dashboard shows data (stale if needed) even when broadcast is unavailable
