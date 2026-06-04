# Phase 5: Behavioral Rules — OTel Collector Production Hardening

## Always Configure memory_limiter Processor at 70% of Available RAM
---
## Reliability
---
Configure the `memory_limiter` processor at 70% of available Collector RAM with `spike_limit_mib` for burst traffic in every pipeline.
---
Without a memory limiter, a traffic spike causes the Collector to consume all available memory and crash (OOM), resulting in complete telemetry data loss from all services until the Collector process restarts.
```yaml
# Bad: No memory limiter — Collector OOM under load
processors:
  batch: { timeout: 5s, send_batch_size: 1024 }
```
```yaml
# Good: Memory limiter at 70% with spike allowance
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 716        # 70% of 1GB RAM
    spike_limit_mib: 102   # Allow burst up to 80%
  batch:
    timeout: 5s
    send_batch_size: 1024
```
---
Development environments with negligible traffic.
---
Collector OOM during traffic spikes; complete observability data loss.
---

## Never Deploy a Single Collector — Always Use at Least Two
---
## Scalability
---
Deploy at least two Collector instances — either as replicas behind a load balancer or as a per-host agent with a gateway cluster — to eliminate the Collector as a single point of failure.
---
A single Collector is a single point of failure for the entire observability pipeline. If it crashes, restarts for configuration update, or is taken down for maintenance, all telemetry data stops flowing from all services.
```yaml
# Bad: Single Collector — SPOF kills all telemetry
# Collector restarts for config change → 30s data loss from all services
```
```yaml
# Good: Redundant Collector deployment
# Option A: 2+ gateway Collectors behind load balancer
# Option B: Per-host agent + 2 gateway Collectors
deployment:
  replicas: 2            # Load balancer distributes across both
# If one fails: second handles all traffic (degraded but functional)
```
---
Development environments where Collector downtime is acceptable.
---
Complete observability data loss during any Collector failure or maintenance.
---

## Enable Persistent Queue With Disk-Backed Storage for Critical Data
---
## Reliability
---
Enable `sending_queue` with disk-backed storage on the Collector exporter so queued spans survive Collector restarts and backend outages.
---
Without persistent queues, spans queued for export are lost when the Collector restarts (deploy, config change, crash). With disk-backed persistence, unexported spans survive restart and are retried when the Collector comes back online.
```yaml
# Bad: In-memory queue — data lost on restart
exporters:
  otlp:
    endpoint: "backend:4317"
    sending_queue:
      enabled: true
      # Default: in-memory — lost on restart
```
```yaml
# Good: Disk-backed persistent queue
exporters:
  otlp:
    endpoint: "backend:4317"
    sending_queue:
      enabled: true
      queue_size: 5000
      storage: file_storage  # References extension below
extensions:
  file_storage:
    directory: /var/otel-collector/queue
```
---
Non-critical telemetry paths where data loss during restart is acceptable.
---
Span loss during Collector restarts; data gaps during maintenance windows.
---

## Monitor Collector's Own Metrics — Especially otelcol_dropped_spans
---
## Reliability
---
Configure monitoring and alerting on the Collector's self-metrics, specifically `otelcol_dropped_spans`, `otelcol_exporter_send_failed_span_count`, and queue length.
---
The Collector silently drops spans when queues are full, exporters fail, or memory limits are reached. Without monitoring the Collector's own metrics, the team has no visibility into whether telemetry data is being lost.
```yaml
# Bad: Collector metrics not monitored
# Collector silently drops 10% of spans under load — nobody knows
```
```yaml
# Good: Collector self-monitoring configured
# Scrape Collector's /metrics endpoint
exporters:
  prometheus:
    endpoint: 0.0.0.0:8889  # Expose for scraping
# Alert rules:
#   - Alert: CollectorDroppingSpans
#     expr: rate(otelcol_dropped_spans[5m]) > 0
#   - Alert: CollectorHighQueueBacklog
#     expr: otelcol_exporter_queue_size > 1000
```
---
No common exceptions.
---
Silent span drops; team believes observability is working when data is being silently lost.
---

## Configure retry_on_failure With Exponential Backoff for Exporter Resilience
---
## Reliability
---
Enable `retry_on_failure` with exponential backoff on all Collector exporters to gracefully handle backend outages without overwhelming the backend with retries.
---
Without retry configuration, a single exporter failure (backend is restarting) causes immediate span drops. With retries, the Collector backs off exponentially, giving the backend time to recover while queuing spans for later delivery.
```yaml
# Bad: No retry — single failure drops all spans
exporters:
  otlp:
    endpoint: "backend:4317"
```
```yaml
# Good: Retry with exponential backoff
exporters:
  otlp:
    endpoint: "backend:4317"
    retry_on_failure:
      enabled: true
      initial_interval: 5s     # First retry: 5 seconds
      max_interval: 30s        # Maximum between retries
      max_elapsed_time: 300s   # Total retry window: 5 minutes
    sending_queue:
      enabled: true
      queue_size: 5000         # Queue spans during retry period
```
---
Low-throughput pipelines where retry complexity is unnecessary.
---
Data loss during transient backend outages; aggressive retry storms overwhelming the backend.
---

## Handle SIGTERM/SIGINT Gracefully to Flush Pending Spans Before Exit
---
## Reliability
---
Configure the Collector process to handle SIGTERM and SIGINT signals by flushing pending spans to the persistent queue before exiting.
---
When Kubernetes terminates a Collector pod (rolling update, scale-down, preemption), the default behavior is immediate exit — all spans in memory that haven't been exported are lost.
```yaml
# Collector handles SIGTERM by default in recent versions
# Verify with Collector config:
service:
  telemetry:
    logs:
      # Export Collector's own logs to monitor shutdown behavior
# In k8s, set terminationGracePeriodSeconds long enough for flush:
# terminationGracePeriodSeconds: 60
```
```
# Bad: No graceful shutdown configuration
# Pod termination loses all in-memory spans
```
```
# Good: Graceful shutdown configured
# k8s Pod spec:
spec:
  terminationGracePeriodSeconds: 60  # Allow 60s for span flush
# Collector: SIGTERM → flush pending spans to queue → exit
```
---
No common exceptions.
---
Span loss during rolling updates, scale-downs, and pod terminations.
