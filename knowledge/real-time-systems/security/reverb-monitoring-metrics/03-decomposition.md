# Decomposition: Reverb Monitoring Metrics

## Topic Overview
Monitoring Reverb requires tracking connection metrics (active connections, connection rate, peak concurrency), message metrics (messages per second, message size distribution, broadcast events per second), error metrics (auth failures, disconnection reasons, protocol errors), and resource metrics (memory usage, CPU load, event loop lag, file descriptor count). Laravel Pulse provides a first-party Reverb monitoring card showing active connections over time. Reverb exposes a `/apps/{appId}/con...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
security/K37-reverb-monitoring-metrics/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Reverb Monitoring Metrics
- **Purpose:** Monitoring Reverb requires tracking connection metrics (active connections, connection rate, peak concurrency), message metrics (messages per second, message size distribution, broadcast events per second), error metrics (auth failures, disconnection reasons, protocol errors), and resource metrics (memory usage, CPU load, event loop lag, file descriptor count). Laravel Pulse provides a first-party Reverb monitoring card showing active connections over time. Reverb exposes a `/apps/{appId}/con...
- **Difficulty:** Intermediate
- **Dependencies:
  - K05: Reverb Connection Lifecycle & State Management
  - K21: Laravel Pulse Monitoring
  - K34: Redis Dependency & Failure Modes
  - K27: Supervisor & Production Process Management

## Dependency Graph
**Depends on:**
  - K05: Reverb Connection Lifecycle & State Management
  - K21: Laravel Pulse Monitoring
  - K34: Redis Dependency & Failure Modes
  - K27: Supervisor & Production Process Management

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Laravel Pulse integration**: Built-in Reverb monitoring card with connection time series**`/apps/{appId}/connections` endpoint**: HTTP endpoint for programmatic connection count polling**`reverb:status` CLI command**: Quick health check from command line**PHP process monitoring**: PHP memory, CPU, and open file descriptors via OS tools (top, htop, /proc)**Redis monitoring**: Pub/sub subscriber count, message rate, memory usage**Nginx connection monitoring**: Active connections, accepted connections, handled connections**Alerting on connection anomalies**: Sudden drops indicate crashes; sudden increases indicate reconnection storms**Pulse for first-party monitoring**: Laravel's built-in dashboard for Reverb connection metrics**No built-in Prometheus exporter**: Unlike Soketi (which exposes `/metrics` in Prometheus format), Reverb requires custom integration or Pulse**External endpoint for connection data**: `/apps/{appId}/connections` enables integration with external monitoring systems**Pulse vs. Prometheus**: Pulse is simpler but less flexible; Prometheus requires additional setup but enables historical querying and alerting**Polling frequency vs. accuracy**: Polling `/apps/{appId}/connections` too frequently adds load; too infrequently misses spikes**Metric granularity**: Reverb provides aggregate connection counts, not per-channel or per-client metrics without custom instrumentation**Monitoring daemon resource usage**: `pulse:check` and any custom metric collectors consume server resources`/apps/{appId}/connections` endpoint is lightweight; poll every 5-10s without significant impactPulse's Redis storage for metrics adds minimal overheadCustom Prometheus metric collection should use pull (scrape) over push to avoid additional Reverb loadEvent loop lag monitoring: inject a periodic timer that measures timestamp offset (if >500ms, the event loop is blocked)Monitoring should not significantly impact the monitored system; <1% overhead targetSet up Laravel Pulse on the Reverb server with the Reverb card enabledConfigure `pulse:check` daemon to run on the Reverb server (or one server in a fleet)Implement external monitoring (Pingdom, Better Uptime, Datadog) that probes the WebSocket endpointMonitor Redis connection count—Reverb instances show as connected clientsSet up log aggregation for Reverb logs (stdout from Supervisor) to detect error patternsCreate dashboards for: active connections (current + trend), messages per second, auth failures, reconnection rateSet alerts for: connection drop >10% in 1min, PHP memory >80% limit, event loop lag >500ms, Redis subscriber count changeOnly monitoring HTTP application metrics, ignoring WebSocket-specific metricsNot running `pulse:check` on the Reverb server (Pulse shows no Reverb data)Polling `/apps/{appId}/connections` from external monitoring without authenticationNot distinguishing between unique clients and total connections (one client may have multiple tabs/connections)Assuming connection count is the only metric that matters (ignore message rate, auth failures, memory)Not monitoring Redis pub/sub subscriber count (indicator of Reverb-to-Redis connectivity)**Monitoring blind spot**: Metrics collector stops collecting; Reverb issues go undetected until user complaints**False alert during deployment**: Connection count drops during rolling restart; alert triggers unnecessarily**Metric accumulation**: Pulse metric storage grows without pruning; performance degrades**Monitoring infrastructure failure**: Redis used for Pulse storage goes down; monitoring data lost**Metric misinterpretation**: High connection count interpreted as success when it's actually a reconnection stormLaravel Pulse (built-in Reverb monitoring card)Prometheus + Grafana (custom metric collection from Reverb endpoints)Datadog / New Relic / CloudWatch (infrastructure-level monitoring)Laravel Forge monitoring dashboard (server-level metrics)Laravel Cloud dashboard (managed Reverb metrics)K05: Reverb Connection Lifecycle & State ManagementK21: Laravel Pulse MonitoringK34: Redis Dependency & Failure ModesK27: Supervisor & Production Process Management

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