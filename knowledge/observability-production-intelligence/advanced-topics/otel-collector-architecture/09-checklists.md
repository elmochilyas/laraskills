# OTel Collector Production Hardening — Checklist

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** OpenTelemetry Ecosystem
- **Knowledge Unit:** OTel Collector Production Hardening
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] OpenTelemetry Collector binary installed
- [ ] Collector configuration file created
- [ ] OTLP receiver configured (gRPC or HTTP)
- [ ] Backend exporter configured (OTLP, Prometheus, etc.)
- [ ] Network connectivity from application servers to Collector

## Implementation Checklist
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

## Verification Checklist
- [ ] `memory_limiter` drops spans when memory exceeds threshold (prevents OOM)
- [ ] `batch` processor groups spans for efficient export
- [ ] Persistent queue survives Collector restarts
- [ ] Backpressure propagates through pipeline when backend is slow
- [ ] Health endpoint (`/:13133`) returns 200
- [ ] Collector's own metrics (`otelcol_dropped_spans`, `otelcol_exporter_send_failed_span_count`) available
- [ ] Agent mode per host + gateway mode cluster works correctly
- [ ] `sending_queue.queue_size` and `num_consumers` tuned for throughput
- [ ] `retry_on_failure` exponential backoff: 5s initial, 30s max, 300s max elapsed
- [ ] `attributes` processor adds environment, region, and data center tags

## Security Checklist
- [ ] Collector's health endpoint and pprof not exposed publicly
- [ ] OTLP receiver uses TLS when exposed over network
- [ ] Disk-backed queues are encrypted for sensitive span data
- [ ] Network policies restrict Collector access to application servers only
- [ ] Collector configuration uses env var substitution for backend credentials
- [ ] No sensitive data in Collector configuration files
- [ ] Collector has minimal network surface area

## Performance Checklist
- [ ] Collector processing overhead: 1-3% CPU for typical pipeline
- [ ] Batch processor configured with appropriate timeout (200ms default) and batch size
- [ ] Memory limiter set at 75% of available memory as soft limit
- [ ] OTLP gRPC exporters used (20-30% lower CPU than HTTP/protobuf)
- [ ] Tail sampling memory budget tuned (`decision_wait` × throughput)
- [ ] `memory_limiter` placed before `batch` processor in pipeline
- [ ] Persistent queue configured with appropriate queue size and consumer count

## Production Readiness Checklist
- [ ] Collector deployed as per-host agent + centralized gateway cluster
- [ ] Kubernetes: Collector runs as DaemonSet (agent) + Deployment (gateway)
- [ ] `health_check` configured for k8s liveness/readiness probes
- [ ] Collector's own metrics monitored and alerted on
- [ ] At least 2 Collector instances for redundancy (avoid SPOF)
- [ ] Graceful shutdown configured (SIGTERM/SIGINT → flush spans)
- [ ] No single Collector for all traffic
- [ ] `otelcol_dropped_spans` alert configured
- [ ] Multi-region: one Collector per region, aggregate at central Collector
- [ ] Disk space for persistent queue monitored (queue size limits configured)

## Common Mistakes to Avoid
- [ ] No memory limiter — Collector OOM under load, data loss
- [ ] Missing health check — silent Collector failures
- [ ] Not monitoring Collector metrics — silent span drops
- [ ] Single Collector for all traffic — single point of failure, no redundancy
- [ ] Overly aggressive tail sampling — GB memory consumed by span buffer
- [ ] No memory limiter — traffic spikes kill Collector process
- [ ] No health check — Collector down without detection
- [ ] Persistent queue without disk limits — disk fills up
