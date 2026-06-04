# Standardized Knowledge: OTel Collector Production Hardening

## Metadata
| Attribute | Value |
|---|---|
| Domain | Observability & Production Intelligence |
| Subdomain | OpenTelemetry Ecosystem |
| Knowledge Unit | OTel Collector Production Hardening |
| Difficulty | Advanced |
| Maturity | Mature |
| Last Updated | 2026-06-02 |

## Overview
The OpenTelemetry Collector is the backbone of production OTel pipelines. Without proper hardening, it becomes a single point of failure — dropping spans on overflow, OOM under load, or losing data during restarts. Production hardening covers resource limits, buffering, retry policies, backpressure propagation, high availability, and monitoring the Collector itself. Deploying the Collector as a per-host agent with a centralized gateway is the recommended pattern for Laravel deployments.

## Core Concepts
- **Agent mode**: Collector per host, lightweight, forwards to backend
- **Gateway mode**: Centralized Collector cluster, aggregates from agents
- **Memory limiter**: Processor that drops spans when memory exceeds threshold; prevents OOM
- **Batch processor**: Groups spans for efficient export; reduces backend request count
- **Backpressure**: When backend is slow, backpressure propagates through pipeline → SDK → application
- **Persistent queue**: Disk-backed buffering that survives Collector restarts
- **Scaling**: Collector can be scaled horizontally behind a load balancer

## When To Use
- Production OTel deployments handling significant telemetry volume
- Multi-service architectures needing centralized telemetry processing
- Environments requiring high availability for observability pipeline
- Teams that cannot tolerate data loss during Collector restarts
- Kubernetes deployments where Collector runs as DaemonSet + Deployment

## When NOT To Use
- Development environments (simple direct export is fine)
- Low-traffic applications where Collector overhead isn't justified
- Teams without capacity to manage additional infrastructure
- When using managed OTel services (Honeycomb, Grafana Cloud Alloy)

## Best Practices
- Deploy two-tier architecture: Agent Collector per host + Gateway Collector cluster
- Set `memory_limiter` at 70% of available RAM; allow `spike_limit_mib` for burst traffic
- Enable persistent queue (`sending_queue`) with disk-backed storage for critical data
- Configure `health_check` extension for k8s liveness/readiness probes
- Monitor Collector's own metrics: `otelcol_dropped_spans`, `otelcol_exporter_send_failed_span_count`
- Handle SIGTERM/SIGINT to flush queued spans before exit
- Deploy at least 2 Collectors for redundancy (avoid single point of failure)

## Architecture Guidelines
- Agent mode per host for buffering; gateway mode cluster for aggregation and export
- Use `memory_limiter` before `batch` processsor to prevent OOM before batching
- Set `sending_queue.queue_size` and `num_consumers` based on throughput expectations
- Configure `retry_on_failure` with exponential backoff (5s initial, 30s max, 300s max elapsed)
- Use `attributes` processor to add environment, region, and data center tags
- For multi-region, deploy one Collector per region; aggregate at central Collector

## Performance Considerations
- Collector processing overhead: 1-3% CPU for typical pipeline; scales linearly with throughput
- Batch processor: configurable timeout (default 200ms) and batch size; larger batches reduce export cost
- Memory limiter: recommended 75% of available memory as soft limit
- OTLP gRPC exporters are 20-30% lower CPU than HTTP/protobuf for equivalent throughput
- Tail sampling memory: span count × average size × decision_wait; can be GB for high throughput

## Security Considerations
- Collector's health endpoint and pprof should not be exposed publicly
- OTLP receiver must use TLS if exposed over network
- Collector may buffer sensitive span data; encrypt disk-backed queues
- Use network policies to restrict Collector access to application servers only
- Collector configuration may contain backend credentials; use environment variable substitution

## Common Mistakes
| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| No memory limiter | Missing processor config | Collector OOM under load, data loss | Always configure memory_limiter |
| Missing health check | Skipping extensions | Silent Collector failures | Always add health_check |
| Not monitoring Collector metrics | Assuming it works | Silent span drops | Monitor otelcol_dropped_spans |
| Single Collector for all traffic | Single instance deployment | SPOF, no redundancy | Deploy >= 2 Collectors |
| Overly aggressive tail sampling | Long decision_wait × high throughput | GB memory consumed by span buffer | Tune decision_wait to throughput |

## Anti-Patterns
- **No memory limiter**: Traffic spikes kill the Collector process, causing complete data loss until restart.
- **Single Collector**: A single Collector is a single point of failure. Always deploy at least 2.
- **No health check**: Collector can be down without detection. Always expose health endpoint.
- **No Collector metrics monitoring**: Collector silently drops spans without alerting. Monitor `otelcol_dropped_spans`.
- **Persistent queue without disk limits**: Disk-backed queues can fill the disk. Configure queue size limits.

## Examples
```yaml
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128
  batch:
    timeout: 5s
    send_batch_size: 1024
    send_batch_max_size: 2048
exporters:
  otlp:
    endpoint: "otel-gateway:4317"
    tls:
      insecure: false
    sending_queue:
      enabled: true
      num_consumers: 10
      queue_size: 5000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
      max_elapsed_time: 300s
extensions:
  health_check:
    endpoint: 0.0.0.0:13133
```

## Related Topics
- OTLP Exporter & Collector Configuration (basic Collector setup)
- OTel Auto-Instrumentation (Collector receives auto-instrumented data)
- Span Sampling Strategies (tail sampling in Collector)
- OpenTelemetry PHP SDK (SDK-side exporter config)

## AI Agent Notes
- Two-tier deployment (agent + gateway) is the recommended production pattern
- Memory limiter prevents OOM; set at 70% of available RAM
- Persistent queue survives restarts; configure disk-backed storage for critical data
- Collector can be scaled horizontally behind a load balancer

## Verification
- [ ] `memory_limiter` processor is configured (70% of available RAM)
- [ ] Two-tier deployment: agent per host + gateway cluster
- [ ] `health_check` extension is configured for probes
- [ ] Collector's own metrics are monitored (dropped spans, queue length)
- [ ] At least 2 Collector instances are deployed for redundancy
- [ ] Persistent queue (`sending_queue`) is enabled with disk-backed storage
- [ ] `retry_on_failure` is configured with exponential backoff
- [ ] OTLP receiver uses TLS in production
- [ ] Collector configuration uses env var substitution for credentials
- [ ] Graceful shutdown handles SIGTERM/SIGINT for pending span flush
