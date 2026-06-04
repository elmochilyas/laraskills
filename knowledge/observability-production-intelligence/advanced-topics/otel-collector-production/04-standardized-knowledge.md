# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 09-advanced-topics
**Knowledge Unit:** otel-collector-production
**Difficulty:** Advanced
**Category:** OTel Collector
**Last Updated:** 2026-06-03

# Overview

The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data. In production, the Collector runs as a sidecar (alongside each application instance) or as a gateway (shared cluster-level service). It handles batching, retries, filtering, sampling, enrichment, and multi-backend export.

The Collector is the central nervous system of the OpenTelemetry architecture. It decouples application instrumentation from backend storage and processing. Without a Collector, each application must handle batching, retries, and backend-specific export logic individually.

Engineers should care because the Collector simplifies application code, improves reliability, and enables backend flexibility. A properly configured Collector handles data spikes, network failures, and backend migrations — the application does not need to know about any of them.

# Core Concepts

**Pipeline:** A directed graph of receivers → processors → exporters. Each pipeline handles one telemetry signal type (traces, metrics, logs). Pipelines are configured in the Collector config YAML.

**Receiver:** The entry point for telemetry data into the Collector. The OTLP receiver (`otlp`) accepts data via gRPC or HTTP. Other receivers accept data from specific sources (Prometheus, Jaeger, Zipkin, Kafka).

**Processor:** A data transformation step in the pipeline. Common processors: `batch` (aggregate data before export), `memory_limiter` (prevent OOM), `filter` (drop unwanted data), `attributes` (add/modify/delete attributes), `sampling` (tail-based sampling).

**Exporter:** The destination for processed telemetry data. OTLP exporter sends to any OTLP-compatible backend. Specific exporters send to Prometheus, Datadog, AWS X-Ray, GCP Cloud Trace, and others.

**Extension:** A Collector component that provides capabilities outside the pipeline. Examples: `health_check` (HTTP health endpoint), `pprof` (profiling endpoint), `zpages` (debug UI).

**Gateway vs Sidecar:** Collector deployment modes. Sidecar (one Collector per pod) provides isolation and simpler configuration. Gateway (shared Collector) provides centralized processing and cost efficiency. Most production deployments use both: sidecars for initial processing, gateway for central routing.

# When To Use

- **All production OTel deployments** — the Collector is not optional
- **Multi-backend observability** — send to Prometheus + Datadog + S3 archive simultaneously
- **High-traffic applications** — batching and sampling reduce backend load

# When NOT To Use

- **Development environments** where the OTel SDK can export directly
- **Single-instance applications** with minimal telemetry volume

# Best Practices

**Run the Collector as a sidecar for each application instance.** This provides telemetry data isolation, prevents one application's data from affecting another, and simplifies configuration. Use gateway Collector for cross-service processing (sampling decisions, multi-backend export).

**Configure memory limiter processor.** Set `memory_limiter` to prevent the Collector from exhausting memory during data spikes. Use `soft_limit` (start dropping data) and `hard_limit` (stop accepting data). Always set memory limits in production.

**Use batch processor.** Configure `batch` with `timeout: 200ms` and `send_batch_size: 8192`. Batching reduces export overhead by 10-100x compared to per-span exports.

**Set up health check and metrics.** Enable the `health_check` extension for Collector health monitoring. Enable `prometheus` exporter on a separate port for Collector metrics monitoring. Monitor Collector in Grafana.

**Pin Collector version.** OTel Collector changes rapidly. Pin to a specific version in deployment configuration. Test upgrades in staging before production.

# Architecture Guidelines

Production deployment architecture:

1. **Sidecar Collector** per Kubernetes pod: receives OTLP from application, applies basic processing (batching, memory limiting), exports to Gateway
2. **Gateway Collector** per cluster: receives OTLP from sidecars, applies advanced processing (tail-based sampling, multi-backend export, attribute enrichment), exports to backends

Kubernetes resources per Collector: 100MB RAM request, 200MB limit, 0.1 CPU request, 0.5 CPU limit. Adjust based on telemetry volume.

# Performance Considerations

- **Collector throughput:** A single Collector instance handles 10,000-50,000 spans/second. At higher volumes, scale horizontally with load-balanced gateway collectors
- **Memory usage:** 50-200MB base + 1-2MB per 1000 spans/sec buffered. Memory limiter prevents OOM
- **Batch efficiency:** Batching reduces export API calls by 10-100x. 100ms batch timeout adds 100ms latency to telemetry availability — acceptable for most use cases
- **Processor overhead:** Attribute processors and filters add 1-5% CPU. Sampling processors add 5-10% CPU. The `batch` processor reduces CPU overall by reducing export calls

# Security Considerations

- **OTLP encryption:** Configure TLS for OTLP receiver. Sidecar → Gateway communication should use mTLS
- **Collector access:** Collector's OTLP receiver should only accept data from known sources. Use network policies or mTLS
- **Exporter credentials:** Backend API keys and tokens stored in Collector config. Use environment variables or secrets management (Vault, Kubernetes Secrets)
- **Audit logging:** Enable Collector audit log to track configuration changes and access attempts

# Common Mistakes

**No memory limiter.** Collector runs without memory limit. During a telemetry spike (deployment, incident), the Collector uses all available memory and is OOM-killed, causing complete telemetry loss.

**Direct SDK-to-backend export.** Each application exports directly to the backend without Collector. Backend URL change requires updating every application. No batching, filtering, or sampling.

**No Collector monitoring.** Collector metrics are not collected. When telemetry stops arriving at the backend, operators cannot determine whether the application, Collector, or backend is the problem.

**Collector config in application repo.** Collector configuration is tightly coupled to application deployment. Collector config should be managed independently as infrastructure configuration.

# Anti-Patterns

**Monolithic Collector config.** A single Collector configuration file with all receivers, processors, exporters, and pipelines. Changes require restarting all Collectors. Use separate config files per deployment mode (sidecar vs. gateway).

**Collector as a thin proxy.** Collector runs with no processors — just receiver → exporter. Batching, filtering, and sampling features are unused. The Collector adds latency without benefit.

**No fallback exporter.** Single exporter target. Backend maintenance causes telemetry data to be dropped because there is no secondary target.

# Examples

**Sidecar Collector config:**
```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 200
  batch:
    timeout: 200ms
exporters:
  otlp:
    endpoint: gateway-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    traces: [otlp, memory_limiter, batch, otlp]
```

# Related Topics

**Prerequisites:**
- OpenTelemetry Ecosystem (Collector role in architecture)

**Closely Related Topics:**
- OTel Auto-Instrumentation (data source for Collector)
- Distributed Tracing (spans flow through Collector)

**Advanced Follow-Up Topics:**
- Tail-based sampling in Collector
- Collector operator for Kubernetes

**Cross-Domain Connections:**
- Infrastructure & DevOps — Collector deployment with Kubernetes

# AI Agent Notes

- Collector is not optional — always deploy with OTel
- Sidecar + Gateway architecture for production
- Configure memory_limiter to prevent OOM during data spikes
- Use batch processor for export efficiency
- Pin Collector version — test upgrades
- Monitor Collector itself with metrics + health check
- Collector config is infrastructure, separate from application config
- Enable TLS for OTLP communication
- Configure fallback exporters for backend resilience
