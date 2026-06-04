# ECC Anti-Patterns — OTel Collector Production Hardening

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Observability & Production Intelligence |
| **Subdomain** | OpenTelemetry Ecosystem |
| **Knowledge Unit** | OTel Collector Production Hardening |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Memory Limiter Configured
2. Single Collector Deployed
3. No Health Check Endpoint
4. Collector Self-Metrics Not Monitored
5. No Persistent Queue — Data Loss on Restart

---

## Repository-Wide Anti-Patterns

- Massive Configuration Files
- Overengineering

---

## Anti-Pattern 1: No Memory Limiter Configured

### Category
Reliability

### Description
Running the OTel Collector without a `memory_limiter` processor, allowing traffic spikes to consume all available memory and crash the Collector (OOM), causing complete telemetry data loss.

### Warning Signs
- Collector configuration has no `memory_limiter` processor in pipeline
- Collector process OOMs under traffic spikes
- Telemetry data gaps coincide with traffic peaks
- Collector restarts frequently under normal load

### Why It Is Harmful
Without a memory limiter, a traffic spike causes the Collector to consume all available RAM and crash. When the Collector OOMs, all telemetry data in its pipeline (queued spans, batched exports) is lost. The Collector must be restarted, creating another data gap.

### Real-World Consequences
A Black Friday traffic spike increases telemetry volume 10x. The Collector has no memory limiter. It consumes all 2GB RAM and crashes. All 10 services' traces, metrics, and logs are lost for 15 minutes until the Collector auto-restarts. Queue backlog causes another OOM on restart.

### Preferred Alternative
Always configure `memory_limiter` processor at 70% of available RAM with `spike_limit_mib` for burst traffic.

### Refactoring Strategy
1. Add `memory_limiter` processor to Collector pipeline
2. Set `limit_mib` to 70% of available RAM
3. Set `spike_limit_mib` to 15% of limit for burst
4. Place `memory_limiter` BEFORE `batch` processor in pipeline

### Detection Checklist
- [ ] No `memory_limiter` processor configured
- [ ] Collector OOM under load
- [ ] Telemetry data gaps during traffic spikes

### Related Rules
- (Rule: Always configure memory_limiter processor at 70% of available RAM)

### Related Skills
- (Related: Harden OpenTelemetry Collector for Production)

---

## Anti-Pattern 2: Single Collector Deployed

### Category
Scalability

### Description
Deploying a single OTel Collector instance for all telemetry traffic, creating a single point of failure where any Collector failure, restart, or maintenance causes complete observability data loss.

### Warning Signs
- Single Collector instance handling all traffic
- No load balancer or redundancy configured
- Collector restart for config change drops all telemetry
- Single point of failure exposed during maintenance

### Why It Is Harmful
A single Collector is a single point of failure for the entire observability pipeline. If it crashes, restarts for configuration update, or is taken down for maintenance, all telemetry data stops flowing from all services.

### Real-World Consequences
A Collector config change requires a restart. The single Collector restarts, taking 30 seconds. During those 30 seconds, all 15 production services' telemetry is lost. A critical incident occurs during the restart window — no trace data available.

### Preferred Alternative
Deploy at least two Collector instances — either as replicas behind a load balancer or as per-host agents with a gateway cluster.

### Refactoring Strategy
1. Deploy second Collector instance
2. Configure load balancer (or DNS round-robin) in front of Collectors
3. Set up per-host agent Collectors forwarding to gateway cluster
4. Verify: if one Collector fails, the other handles traffic

### Detection Checklist
- [ ] Single Collector deployment
- [ ] No redundancy configured
- [ ] Collector restart causes data loss

### Related Rules
- (Rule: Never deploy a single Collector — always use at least two)

### Related Skills
- (Related: Harden OpenTelemetry Collector for Production — high availability section)

---

## Anti-Pattern 3: No Health Check Endpoint

### Category
Reliability

### Description
Not configuring the `health_check` extension on the Collector, making it impossible to detect Collector failures through Kubernetes liveness/readiness probes or external monitoring.

### Warning Signs
- Collector configuration has no `extensions` section with `health_check`
- No monitoring probe for Collector availability
- Collector down for hours before discovery
- No liveness/readiness probes in k8s deployment

### Why It Is Harmful
Without a health check endpoint, Collector failures are silent. The Collector can be down for hours (OOM, config error, network issue) before anyone notices. In Kubernetes, the platform cannot automatically restart an unhealthy Collector.

### Real-World Consequences
A Collector config error causes it to fail on startup. The Kubernetes pod shows CrashLoopBackOff but without health checks, the deployment doesn't alert. 6 hours later, a developer notices the dashboard has no data. 6 hours of telemetry lost.

### Preferred Alternative
Always configure the `health_check` extension with a dedicated endpoint for probes and monitoring.

### Refactoring Strategy
1. Add `health_check` extension to Collector configuration
2. Set endpoint: `0.0.0.0:13133`
3. Configure k8s liveness/readiness probes to use `/health`
4. Set up external monitoring on the health endpoint

### Detection Checklist
- [ ] No `health_check` extension configured
- [ ] No k8s probes for Collector
- [ ] Collector failures go undetected

### Related Rules
- (Implied: always add health_check extension — from anti-patterns in knowledge)

### Related Skills
- (Related: Harden OpenTelemetry Collector for Production — health monitoring)

---

## Anti-Pattern 4: Collector Self-Metrics Not Monitored

### Category
Observability

### Description
Not monitoring the Collector's own metrics (`otelcol_dropped_spans`, `otelcol_exporter_send_failed_span_count`), allowing silent span drops to go undetected.

### Warning Signs
- Collector's `/metrics` endpoint not scraped
- No dashboard for Collector health
- No alerts on dropped spans or queue backlogs
- Team assumes all spans are delivered but has no visibility

### Why It Is Harmful
The Collector silently drops spans when queues are full, exporters fail, or memory limits are reached. Without monitoring the Collector's own metrics, the team has no visibility into whether telemetry data is being lost. The dashboard may show "no data" but the team blames monitoring gaps — not Collector drops.

### Real-World Consequences
A backend exporter failure causes the Collector to queue spans. The queue fills up, and the Collector starts dropping spans. `otelcol_dropped_spans` shows 1,000 spans/second dropped. But nobody is monitoring Collector metrics. The team investigates "why is the dashboard missing data for the last hour?" for 2 hours.

### Preferred Alternative
Scrape Collector's `/metrics` endpoint into Prometheus. Create alerts on dropped spans, queue length, and memory usage.

### Refactoring Strategy
1. Enable Collector's Prometheus metrics exporter on port 8889
2. Configure Prometheus to scrape Collector metrics
3. Create alert: `rate(otelcol_dropped_spans[5m]) > 0`
4. Create alert: `otelcol_exporter_queue_size > 1000`
5. Add Collector health dashboard in Grafana

### Detection Checklist
- [ ] Collector metrics not scraped
- [ ] No dropped spans alert
- [ ] No Collector health dashboard
- [ ] Silent span drops undetected

### Related Rules
- (Rule: Monitor Collector's own metrics — especially otelcol_dropped_spans)

### Related Skills
- (Related: Harden OpenTelemetry Collector for Production — self-monitoring section)

---

## Anti-Pattern 5: No Persistent Queue — Data Loss on Restart

### Category
Reliability

### Description
Using an in-memory `sending_queue` without disk-backed persistence, causing all queued but unexported spans to be lost when the Collector restarts.

### Warning Signs
- `sending_queue` configured without `storage: file_storage`
- Spans missing from backend after Collector deployments
- Data gaps correlate with Collector restarts
- No `file_storage` extension configured

### Why It Is Harmful
Without persistent queues, spans queued for export are stored in memory. When the Collector restarts (deploy, config change, crash, scale-down), all in-memory spans are lost. Over weeks of rolling updates, this accumulates significant data loss.

### Real-World Consequences
A Kubernetes rolling update replaces all 3 Collector pods. Each pod receives SIGTERM and has 30 seconds to flush. The in-memory queue has 5,000 spans queued. Only 500 flush before termination. 4,500 spans lost per pod = 13,500 spans lost per rolling update. This happens every deployment.

### Preferred Alternative
Enable `sending_queue` with disk-backed `file_storage` extension so queued spans survive restarts.

### Refactoring Strategy
1. Add `file_storage` extension with dedicated directory
2. Configure `sending_queue.storage: file_storage`
3. Set `queue_size` and `num_consumers` based on throughput
4. Monitor disk usage of queue directory
5. Set `terminationGracePeriodSeconds: 60` in k8s for graceful shutdown

### Detection Checklist
- [ ] In-memory queue without disk persistence
- [ ] Span loss after Collector restarts
- [ ] Data gaps correlate with deployments
- [ ] No `file_storage` extension configured

### Related Rules
- (Rule: Enable persistent queue with disk-backed storage for critical data)

### Related Skills
- (Related: Harden OpenTelemetry Collector for Production — queue configuration)
