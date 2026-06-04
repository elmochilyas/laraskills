# OpenTelemetry Collector Production

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 09-advanced-topics
- **Knowledge Unit:** otel-collector-production
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data. In production, it runs as a sidecar (per application instance) or gateway (shared cluster-level service), handling batching, retries, filtering, sampling, enrichment, and multi-backend export. It is the central nervous system of the OpenTelemetry architecture and is not optional for production deployments.

---

## Core Concepts

- **Pipeline:** Directed graph of receivers → processors → exporters, one per signal type (traces, metrics, logs)
- **Receiver:** Entry point for telemetry — OTLP (gRPC :4317, HTTP :4318), Prometheus, Jaeger, Zipkin, Kafka
- **Processor:** Data transformation step — `batch`, `memory_limiter`, `filter`, `attributes`, `tail_sampling`
- **Exporter:** Destination for processed data — OTLP, Prometheus, Datadog, AWS X-Ray, GCP Cloud Trace
- **Gateway vs Sidecar:** Sidecar (one per pod) for isolation; Gateway (shared) for centralized processing. Most deployments use both
- **Memory Limiter:** Processor preventing OOM during traffic spikes — `soft_limit` starts dropping, `hard_limit` stops accepting

---

## Mental Models

- **Airport Control Tower Model:** The Collector is an airport control tower — it receives all incoming flights (telemetry), sequences them (processors), and directs them to the correct gates (exporters). Without the tower, each plane would have to coordinate directly with its destination
- **Circuit Breaker Box Model:** The Collector is the circuit breaker box — it distributes power (telemetry data) to different circuits (backends), fuses blow (memory limiter) to prevent overload, and transformers convert voltage (processors) as needed
- **Post Office Distribution Center Model:** Sidecar Collectors are local post offices (one per neighborhood), Gateway Collector is the central distribution center (regional). Local offices handle basic sorting; the center handles cross-region routing and special handling

---

## Internal Mechanics

The Collector runs as a Go binary with YAML-defined pipeline configuration. OTLP receivers listen on configured ports. Processors execute in declaration order: memory_limiter checks memory usage and drops data if limits exceeded; batch aggregates spans for efficient export; filter drops unwanted spans; attributes enriches or modifies; tail_sampling makes retention decisions. Exporters send processed data to destinations. Kubernetes resources per Collector: 100MB RAM request, 200MB limit, 0.1 CPU request, 0.5 CPU limit.

---

## Patterns

- **Sidecar + Gateway Architecture:** Each pod has a sidecar Collector for basic processing (batching, memory limiting); a Gateway Collector provides cross-service tail sampling and multi-backend export. Benefit: isolation + centralized processing. Tradeoff: more infrastructure.
- **Memory Limiter with Graceful Degradation:** Configure `memory_limiter` to drop data instead of crashing. Benefit: Collector stays alive during traffic spikes. Tradeoff: data loss during spikes — recoverable from application buffers.
- **Health Check + Metrics:** Enable Collector health check extension for orchestration probes and Prometheus metrics for Collector monitoring. Benefit: understand Collector health. Tradeoff: additional monitoring configuration.

---

## Architectural Decisions

**Run the Collector as a sidecar for each application instance.** This provides telemetry data isolation, prevents one application's data from affecting another, and simplifies configuration. Use a gateway Collector for cross-service processing.

**Configure memory limiter processor.** Set `memory_limiter` with `check_interval: 1s`, `limit_mib: 200`, `spike_limit_mib: 128`. Always set memory limits in production.

**Use batch processor with appropriate settings.** Configure `batch` with `timeout: 200ms` and `send_batch_size: 8192`. Batching reduces export overhead by 10-100x.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Decouples instrumentation from backend infrastructure | Additional infrastructure to deploy and monitor | Essential for production OTel |
| Sidecar + Gateway provides isolation + centralization | More complex deployment topology | Standard pattern for Kubernetes |
| Memory limiter prevents OOM | Some data loss during spikes | Acceptable — application should handle retry |

---

## Performance Considerations

Single Collector handles 10,000-50,000 spans/second. Memory: 50-200MB base + 1-2MB per 1000 spans/sec buffered. Batch efficiency: reduces export API calls by 10-100x; 100ms batch timeout adds 100ms latency — acceptable for most use cases. Processor overhead: attribute/filter processors add 1-5% CPU; sampling adds 5-10% CPU.

---

## Production Considerations

Configure TLS for OTLP receiver — sidecar → Gateway communication should use mTLS. Collector's OTLP receiver should only accept data from known sources via network policies or mTLS. Backend API keys stored in Collector config — use environment variables or secrets management (Vault, Kubernetes Secrets). Enable Collector audit log for configuration changes and access attempts.

---

## Common Mistakes

**No memory limiter** — Collector runs without memory limit. During a telemetry spike (deployment, incident), the Collector uses all available memory and is OOM-killed, causing complete telemetry loss.

**Direct SDK-to-backend export** — each application exports directly without Collector. Backend URL change requires updating every application. No batching, filtering, or sampling.

**No Collector monitoring** — Collector metrics not collected. When telemetry stops arriving at the backend, operators cannot determine whether the application, Collector, or backend is the problem.

**Collector config in application repo** — Collector configuration should be managed independently as infrastructure configuration.

---

## Failure Modes

**Collector OOM:** Traffic spike exceeds memory with no memory_limiter. Detection: Collector process killed; telemetry stops. Mitigation: always configure memory_limiter; monitor Collector memory; set resource limits.

**Backend unreachable:** Exporter cannot reach the backend. Detection: error logs in Collector; backpressure. Mitigation: Collector buffers and retries; configure fallback exporters; monitor export health.

**Configuration drift:** Collector YAML changes not version-controlled; misconfiguration causes data loss. Detection: telemetry stops appearing. Mitigation: store config in version control; validate changes in staging; use CI for config validation.

---

## Ecosystem Usage

The OTel Collector is the standard data routing layer for Laravel OTel deployments. Community distributions (Grafana, OpenObserve) provide pre-configured builds. The Collector receives data from the PHP OTel SDK and exports to Prometheus, Tempo, Loki, Datadog, and other backends. Kubernetes operators (OpenTelemetry Operator) automate Collector deployment.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry Ecosystem (Collector role in architecture)

### Related Topics
- OTel Auto-Instrumentation (data source for Collector)
- Distributed Tracing (spans flow through Collector)

### Advanced Follow-up Topics
- Tail-based sampling in Collector
- Collector operator for Kubernetes

---

## Research Notes

Collector is not optional — always deploy with OTel. Sidecar + Gateway architecture for production. Configure memory_limiter to prevent OOM during data spikes. Use batch processor for export efficiency. Pin Collector version — test upgrades. Monitor Collector itself with metrics + health check. Collector config is infrastructure, separate from application config. Enable TLS for OTLP communication. Configure fallback exporters for backend resilience.
