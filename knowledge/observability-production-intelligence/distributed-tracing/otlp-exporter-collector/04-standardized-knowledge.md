# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 04-distributed-tracing
**Knowledge Unit:** otlp-exporter-collector
**Difficulty:** Advanced
**Category:** OTel Export Pipeline
**Last Updated:** 2026-06-03

# Overview

The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data. Deploying the Collector alongside Laravel applications is a production best practice — it decouples application instrumentation from backend infrastructure, provides buffering/retry, enables tail-based sampling, and allows pipeline transformations without application redeployment.

The OTLP exporter in the PHP SDK sends data to the Collector via gRPC or HTTP/protobuf. The Collector then processes the data (batch, filter, sample, transform) and exports to one or more backends (Jaeger, Tempo, Prometheus, Datadog, Loki).

Engineers should care because the Collector is the most important infrastructure component in an OTel deployment. It provides resilience (buffering, retry), cost control (sampling, filtering), and flexibility (multi-backend export) that the PHP SDK alone cannot provide.

# Core Concepts

**Receiver:** The Collector component that ingests telemetry data. Common receivers: `otlp` (gRPC port 4317, HTTP port 4318), `jaeger` (legacy Jaeger protocol), `prometheus` (scrape endpoint), `hostmetrics` (system metrics).

**Processor:** The Collector component that transforms telemetry data between receive and export. Common processors: `batch` (buffer and batch), `memory_limiter` (prevent OOM), `filter` (drop unwanted data), `attributes` (add/update/delete attributes), `tail_sampling` (sampling based on trace completeness).

**Exporter:** The Collector component that sends processed data to a backend. Common exporters: `otlp` (to another Collector or backend), `prometheus` (expose metrics endpoint), `logging` (debug output).

**Pipeline:** A directed path through the Collector: Receiver(s) → Processor(s) → Exporter(s). Each pipeline handles one signal type (traces, metrics, logs). Pipelines are independent — trace data flows through the trace pipeline, metrics through the metrics pipeline.

**Extension:** Additional Collector capabilities not part of pipelines: health check, pprof profiling, zpages debugging.

**Tail-Based Sampling:** Sampling decisions made after the entire trace is received. Unlike head-based sampling (decide at trace start), tail-based sampling can keep all traces containing errors while dropping healthy ones. This requires buffering traces in the Collector.

# When To Use

- **Every production OTel deployment** — the Collector is a best practice, not optional
- **Multi-backend strategies** — send traces to both Jaeger (self-hosted) and Datadog (SaaS) simultaneously
- **Cost control** — filtering and sampling in the Collector reduces backend ingestion volume
- **Resilience requirements** — buffering and retry protect against backend outages

# When NOT To Use

- **Development environments** — direct export from SDK to backend is acceptable
- **Extremely simple deployments** — single service, low traffic, no resilience requirements

# Best Practices

**Deploy Collector as a sidecar or per-host agent.** A sidecar container runs alongside the application container, receiving telemetry on localhost. This avoids network configuration and ensures low-latency export.

**Configure memory limiter processor.** Without it, a traffic spike can OOM the Collector. Set `check_interval`, `limit_mib`, and `spike_limit_mib`.

**Use batch processor for throughput.** Batch spans before export: `timeout: 5s`, `send_batch_size: 2048`, `send_batch_max_size: 4096`.

**Implement tail-based sampling in the Collector, not the SDK.** The Collector sees complete traces across services. Head sampling in the SDK decides too early — a healthy span's trace may become an error later in downstream services.

**Enable Collector health check.** Expose health check endpoint for orchestration probes. Add to monitoring dashboards.

# Architecture Guidelines

Collector deployment topology options:

1. **Sidecar (per-pod):** One Collector per application instance. Simplest, lowest latency, no single point of failure
2. **Gateway (per-cluster):** Centralized Collector receiving from all sidecars. Adds resilience tier but creates single point of failure
3. **DaemonSet (per-node):** One Collector per Kubernetes node. Shares node-level telemetry across pods

The recommended pattern: Sidecar for low-latency export + Gateway for cross-service tail sampling and multi-backend routing.

# Performance Considerations

- **Collector memory:** 500MB-2GB per instance depending on throughput. Tail sampling requires more memory for trace buffering
- **Batch processor latency:** Adds 1-5s latency between span creation and export (configurable)
- **gRPC vs HTTP:** gRPC offers ~30% better throughput than HTTP/protobuf for OTLP
- **CPU:** 1-2 cores per Collector instance for moderate throughput (10k spans/s)
- **Memory limiter ballast:** Configure ballast size (~200MB) to reduce GC pressure in Go runtime

# Security Considerations

- **Collector not publicly exposed:** Listen on internal network or localhost only
- **TLS for SDK→Collector:** Encrypt telemetry in transit between PHP application and Collector
- **Collector→Backend TLS:** Encrypt export traffic. Authenticate via API key or mTLS
- **Collector API access:** Restrict management API (pprof, zpages) to admin networks
- **Sensitive data filtering:** Use `attributes` processor to redact PII attributes before export

# Common Mistakes

**No memory limiter.** The most common production Collector failure — OOM under traffic spike. Always configure `memory_limiter` processor.

**Direct SDK→Backend export.** Skipping the Collector means no buffering, no tail sampling, no multi-backend routing, and tight coupling to backend infrastructure.

**Batch processor misconfiguration.** `send_batch_size` too large (increases latency), `timeout` too long (data delayed), or too short (many small batches).

**Single Collector without HA.** A single gateway Collector is a single point of failure. Deploy with redundancy and load balancing.

**No graceful shutdown.** Collector terminated mid-flush loses queued spans. Configure `sigterm` handling to flush before exit.

# Anti-Patterns

**Collector as a monolithic black box:** Deploying a single huge Collector config that handles all signals, all services, and all backends. Break into focused pipelines per signal type or per service group.

**No tail sampling in high-volume deployments:** Running at 100% head sampling because the Collector only passes through. Implement tail sampling in the Collector to drop healthy traces while keeping errors.

**Collector config stored outside version control:** Collector YAML defines critical data flow. Store in repository alongside application code. Version and review changes.

# Examples

**Collector config with memory limiter and batch:**
```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128
  batch:
    timeout: 5s
    send_batch_size: 2048
exporters:
  otlp:
    endpoint: "tempo.example.com:4317"
    tls:
      insecure: false
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp]
```

# Related Topics

**Prerequisites:**
- OpenTelemetry PHP SDK (OTLP Exporter client-side config)

**Closely Related Topics:**
- Span Sampling Strategies (tail sampling policies in Collector)
- OTel Auto-Instrumentation (Collector receives auto-instrumented traces)

**Advanced Follow-Up Topics:**
- OTel Collector Production Hardening (advanced production deployment)
- OTel Ecosystem (community Collector components)

**Cross-Domain Connections:**
- DevOps & Infrastructure — Collector deployment in Kubernetes

# AI Agent Notes

- Collector is a best practice for all production OTel deployments
- Memory limiter processor is mandatory — configure before batch processor
- Batch processor settings (5s/2048) are good starting points for most workloads
- Tail sampling in Collector is more effective than head sampling in SDK
- Sidecar deployment is the simplest, most resilient topology
- Collector config YAML must be version-controlled
- Never expose Collector receivers to the public internet
