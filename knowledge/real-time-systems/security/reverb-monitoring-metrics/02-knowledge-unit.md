# Metadata
Domain: Real-Time Systems
Subdomain: Security
Knowledge Unit: Reverb Monitoring Metrics
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Monitoring Reverb requires tracking connection metrics (active connections, connection rate, peak concurrency), message metrics (messages per second, message size distribution, broadcast events per second), error metrics (auth failures, disconnection reasons, protocol errors), and resource metrics (memory usage, CPU load, event loop lag, file descriptor count). Laravel Pulse provides a first-party Reverb monitoring card showing active connections over time. Reverb exposes a `/apps/{appId}/connections` endpoint for programmatic connection counts. For deeper monitoring, Prometheus metrics can be collected via the Soketi-style approach or custom metric collectors. Key thresholds to alert on: connection drop rate >10% in 1 minute, auth endpoint P95 latency >200ms, memory usage >80% of PHP limit, and event loop lag >500ms.

## Core Concepts
Monitoring Reverb requires observing both the WebSocket server itself and the supporting infrastructure (Redis pub/sub, queue workers, auth endpoint). WebSocket servers are long-running processes that accumulate state (connections, subscriptions). Unlike HTTP servers, where every request is logged, WebSocket connections persist and their lifecycle events must be explicitly tracked. The primary monitoring data sources are: Reverb's internal metrics, Laravel Pulse, PHP process metrics, Redis pub/sub stats, and Nginx connection metrics.

## Mental Models
Monitoring a WebSocket server is like monitoring a nuclear reactor—you need to know the temperature (connections), pressure (message rate), control rod position (config settings), and coolant flow (Redis throughput) at all times. A sudden change in any metric signals a problem before it becomes critical.

## Internal Mechanics
Reverb maintains in-memory state for active connections. The Pulse Reverb card periodically queries `/apps/{appId}/connections` to get connection counts. The `pulse:check` daemon must run on the Reverb server for this data to be collected. The `reverb:status` command shows current connection count, memory, and uptime from the CLI. PHP's memory usage and file descriptor counts are OS-level metrics. Redis pub/sub metrics (`info clients`, `info stats`) show subscriber counts and message throughput. Nginx metrics (from `stub_status` or access logs) show proxied WebSocket connections and upgrade rate.

## Patterns
- **Laravel Pulse integration**: Built-in Reverb monitoring card with connection time series
- **`/apps/{appId}/connections` endpoint**: HTTP endpoint for programmatic connection count polling
- **`reverb:status` CLI command**: Quick health check from command line
- **PHP process monitoring**: PHP memory, CPU, and open file descriptors via OS tools (top, htop, /proc)
- **Redis monitoring**: Pub/sub subscriber count, message rate, memory usage
- **Nginx connection monitoring**: Active connections, accepted connections, handled connections
- **Alerting on connection anomalies**: Sudden drops indicate crashes; sudden increases indicate reconnection storms

## Architectural Decisions
- **Pulse for first-party monitoring**: Laravel's built-in dashboard for Reverb connection metrics
- **No built-in Prometheus exporter**: Unlike Soketi (which exposes `/metrics` in Prometheus format), Reverb requires custom integration or Pulse
- **External endpoint for connection data**: `/apps/{appId}/connections` enables integration with external monitoring systems

## Tradeoffs
- **Pulse vs. Prometheus**: Pulse is simpler but less flexible; Prometheus requires additional setup but enables historical querying and alerting
- **Polling frequency vs. accuracy**: Polling `/apps/{appId}/connections` too frequently adds load; too infrequently misses spikes
- **Metric granularity**: Reverb provides aggregate connection counts, not per-channel or per-client metrics without custom instrumentation
- **Monitoring daemon resource usage**: `pulse:check` and any custom metric collectors consume server resources

## Performance Considerations
- `/apps/{appId}/connections` endpoint is lightweight; poll every 5-10s without significant impact
- Pulse's Redis storage for metrics adds minimal overhead
- Custom Prometheus metric collection should use pull (scrape) over push to avoid additional Reverb load
- Event loop lag monitoring: inject a periodic timer that measures timestamp offset (if >500ms, the event loop is blocked)
- Monitoring should not significantly impact the monitored system; <1% overhead target

## Production Considerations
- Set up Laravel Pulse on the Reverb server with the Reverb card enabled
- Configure `pulse:check` daemon to run on the Reverb server (or one server in a fleet)
- Implement external monitoring (Pingdom, Better Uptime, Datadog) that probes the WebSocket endpoint
- Monitor Redis connection count—Reverb instances show as connected clients
- Set up log aggregation for Reverb logs (stdout from Supervisor) to detect error patterns
- Create dashboards for: active connections (current + trend), messages per second, auth failures, reconnection rate
- Set alerts for: connection drop >10% in 1min, PHP memory >80% limit, event loop lag >500ms, Redis subscriber count change

## Common Mistakes
- Only monitoring HTTP application metrics, ignoring WebSocket-specific metrics
- Not running `pulse:check` on the Reverb server (Pulse shows no Reverb data)
- Polling `/apps/{appId}/connections` from external monitoring without authentication
- Not distinguishing between unique clients and total connections (one client may have multiple tabs/connections)
- Assuming connection count is the only metric that matters (ignore message rate, auth failures, memory)
- Not monitoring Redis pub/sub subscriber count (indicator of Reverb-to-Redis connectivity)

## Failure Modes
- **Monitoring blind spot**: Metrics collector stops collecting; Reverb issues go undetected until user complaints
- **False alert during deployment**: Connection count drops during rolling restart; alert triggers unnecessarily
- **Metric accumulation**: Pulse metric storage grows without pruning; performance degrades
- **Monitoring infrastructure failure**: Redis used for Pulse storage goes down; monitoring data lost
- **Metric misinterpretation**: High connection count interpreted as success when it's actually a reconnection storm

## Ecosystem Usage
- Laravel Pulse (built-in Reverb monitoring card)
- Prometheus + Grafana (custom metric collection from Reverb endpoints)
- Datadog / New Relic / CloudWatch (infrastructure-level monitoring)
- Laravel Forge monitoring dashboard (server-level metrics)
- Laravel Cloud dashboard (managed Reverb metrics)

## Related Knowledge Units
- K05: Reverb Connection Lifecycle & State Management
- K21: Laravel Pulse Monitoring
- K34: Redis Dependency & Failure Modes
- K27: Supervisor & Production Process Management

## Research Notes
As of 2026, Reverb monitoring is primarily done through Laravel Pulse. Custom Prometheus integration requires building a middleware or periodic job that exports Reverb metrics. The `/apps/{appId}/connections` endpoint is unauthenticated by default (protected only by Reverb's allowed_origins). Soketi provides richer built-in metrics (Prometheus endpoint) compared to Reverb. For production Reverb deployments, at minimum monitor: active connections, memory usage, and auth failure rate. The Laravel Pulse Reverb card shows a connection time series over the last hour.
