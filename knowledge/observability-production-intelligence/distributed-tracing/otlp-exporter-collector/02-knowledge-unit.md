# OTLP Exporter & Collector Configuration

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 04-distributed-tracing
- **Knowledge Unit:** otlp-exporter-collector
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data. Deploying the Collector alongside Laravel applications decouples instrumentation from backend infrastructure, provides buffering/retry, enables tail-based sampling, and allows pipeline transformations without application redeployment. It is the most important infrastructure component in an OTel deployment.

---

## Core Concepts

- **Receiver:** Collector component that ingests telemetry data — `otlp` (gRPC :4317, HTTP :4318), `jaeger`, `prometheus`, `hostmetrics`
- **Processor:** Transforms telemetry data between receive and export — `batch`, `memory_limiter`, `filter`, `attributes`, `tail_sampling`
- **Exporter:** Sends processed data to a backend — `otlp`, `prometheus`, `logging`
- **Pipeline:** Directed path: Receiver(s) → Processor(s) → Exporter(s), one per signal type (traces, metrics, logs)
- **Tail-Based Sampling:** Sampling decisions made after entire trace is received — keeps errors, drops healthy traces

---

## Mental Models

- **Post Office Model:** The Collector is a central post office — applications drop mail (telemetry) at local collection boxes (sidecars), which get sorted and routed to final destinations (backends)
- **Circuit Breaker Model:** The Collector is a circuit breaker between your application and backends — it buffers during spikes, retries on failure, and prevents cascading failures
- **Water Treatment Model:** Telemetry data flows through treatment stages — screening (filter), settling (batch), chemical treatment (sampling), then released to destination

---

## Internal Mechanics

The Collector uses a YAML-defined pipeline architecture. OTLP receivers accept data via gRPC/HTTP. Processors transform data in sequence: memory_limiter prevents OOM, batch aggregates spans, filter drops unwanted data, attributes enriches/modifies. Exporters send processed data to backends. Pipelines are independent per signal type — trace data flows through the trace pipeline, metrics through the metrics pipeline. The Collector runs as a Go binary with configurable resource limits.

---

## Patterns

- **Sidecar + Gateway Architecture:** Each Kubernetes pod has a sidecar Collector for isolation; a gateway Collector provides cross-service tail sampling and multi-backend routing. Benefit: isolation with centralized processing. Tradeoff: more infrastructure to manage.
- **Memory Limiter with Ballast:** Configure memory_limiter processor with `check_interval`, `limit_mib`, and `spike_limit_mib`; add ballast (~200MB) to reduce GC pressure. Benefit: prevents OOM during traffic spikes. Tradeoff: higher baseline memory usage.
- **Multi-Backend Export:** Configure multiple exporters in the same pipeline to send traces to both self-hosted Tempo and SaaS Datadog. Benefit: redundancy and flexibility. Tradeoff: double export bandwidth.

---

## Architectural Decisions

**Deploy Collector as a sidecar or per-host agent.** A sidecar container runs alongside the application, receiving telemetry on localhost — lowest latency, no single point of failure.

**Configure memory limiter processor.** Without it, a traffic spike can OOM the Collector. Set `check_interval: 1s`, `limit_mib: 512`, `spike_limit_mib: 128`.

**Implement tail-based sampling in the Collector, not the SDK.** The Collector sees complete traces across services. Head sampling decides too early — a healthy span's trace may become an error downstream.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Decouples application from backend infrastructure | Additional infrastructure to deploy and monitor | Collector is the central nervous system of OTel |
| Tail-based sampling preserves error traces | Requires memory for trace buffering | 1000 concurrent traces × 10s ≈ 500MB buffer |
| Batching reduces export API calls by 10-100x | Adds 1-5s latency to telemetry availability | Acceptable for most use cases |

---

## Performance Considerations

Collector memory: 500MB-2GB per instance depending on throughput. Batch processor latency adds 1-5s between span creation and export. gRPC offers ~30% better throughput than HTTP/protobuf for OTLP. CPU: 1-2 cores per Collector for moderate throughput (10k spans/s). Ballast (~200MB) reduces GC pressure.

---

## Production Considerations

Collector must not be publicly exposed — listen on internal network or localhost only. Use TLS for SDK→Collector and Collector→Backend communication. Configure API key or mTLS for backend authentication. Restrict management API (pprof, zpages) to admin networks. Use `attributes` processor to redact PII before export.

---

## Common Mistakes

**No memory limiter** — the most common production Collector failure: OOM under traffic spike. Always configure `memory_limiter` processor.

**Direct SDK→Backend export** — skipping the Collector means no buffering, no tail sampling, no multi-backend routing, and tight coupling to backend infrastructure.

**Batch processor misconfiguration** — `send_batch_size` too large increases latency; `timeout` too short creates many small batches.

**Single Collector without HA** — a single gateway Collector is a single point of failure. Deploy with redundancy and load balancing.

---

## Failure Modes

**Collector OOM:** Traffic spike exceeds memory limit with no memory_limiter configured. Detection: Collector process killed; telemetry stops arriving at backend. Mitigation: always configure memory_limiter; monitor Collector memory.

**Backend unreachable:** Exporter cannot reach the backend. Detection: error logs in Collector; backpressure on exporters. Mitigation: Collector buffers and retries; configure fallback exporters.

**Configuration drift:** Collector YAML changes not version-controlled; misconfiguration causes data loss. Detection: telemetry stops appearing. Mitigation: store Collector config in version control; validate changes in staging.

---

## Ecosystem Usage

The OTel Collector is the standard data routing layer for Laravel applications using OpenTelemetry. Community distributions (OpenObserve, Grafana) provide pre-configured Collector builds. The Collector receives data from the PHP OTel SDK and exports to Prometheus, Tempo, Loki, Datadog, and other backends.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry PHP SDK (OTLP Exporter client-side config)

### Related Topics
- Span Sampling Strategies (tail sampling policies in Collector)
- OTel Auto-Instrumentation (Collector receives auto-instrumented traces)

### Advanced Follow-up Topics
- OTel Collector Production Hardening (advanced production deployment)
- OTel Ecosystem (community Collector components)

---

## Research Notes

Collector is a best practice for all production OTel deployments. Memory limiter processor is mandatory — configure before batch processor. Batch processor settings (5s/2048) are good starting points for most workloads. Tail sampling in Collector is more effective than head sampling in SDK. Sidecar deployment is the simplest, most resilient topology. Collector config YAML must be version-controlled.
