# OTel Collector Production Hardening

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** OpenTelemetry Ecosystem
- **Knowledge Unit:** OTel Collector Production Hardening
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

The OpenTelemetry Collector is the backbone of production OTel pipelines. Without proper hardening, it becomes a single point of failure — dropping spans on overflow, OOM under load, or losing data during restarts. Production hardening covers resource limits, buffering, retry policies, backpressure propagation, high availability, and monitoring the Collector itself. Deploying the Collector as a per-host agent with a centralized gateway is the recommended pattern for Laravel deployments.

---

## Core Concepts

- **Agent mode:** Collector per host, lightweight, forwards to backend
- **Gateway mode:** Centralized Collector cluster, aggregates from agents
- **Memory limiter:** Processor that drops spans when memory exceeds threshold; prevents OOM
- **Batch processor:** Groups spans for efficient export; reduces backend request count
- **Backpressure:** When backend is slow, backpressure propagates through pipeline to SDK to application
- **Persistent queue:** Disk-backed buffering that survives Collector restarts
- **Scaling:** Collector can be scaled horizontally behind a load balancer

---

## Mental Models

- **Circuit Breaker Model:** The memory limiter is like a circuit breaker — when current (memory) exceeds safe levels, it trips (drops spans) to prevent a fire (OOM crash)
- **Airport Baggage Model:** The Collector is like an airport baggage handling system — bags (spans) arrive from many flights (applications), are sorted (processed), and loaded onto departing planes (exporters). If a plane is delayed, bags wait in a queue
- **Firewall Model:** The Collector acts as a firewall for observability data — it filters out noise (sampling, filtering), enriches with context (attributes), and manages connections to multiple destinations

---

## Internal Mechanics

The Collector runs as a standalone process (Go binary) that receives OTLP data from SDKs, processes it through a configurable pipeline (receivers → processors → exporters), and sends it to one or more backends. The `memory_limiter` processor monitors RSS and drops spans when approaching the limit. The `batch` processor groups spans into larger payloads for efficient export. The `sending_queue` provides disk-backed buffering for reliability.

---

## Patterns

- **Two-Tier Deployment:** Agent Collector per host + Gateway Collector cluster. Benefit: isolation at edge, centralized processing. Tradeoff: more infrastructure to manage.
- **Memory Limiter Before Batch:** Place `memory_limiter` before `batch` processor to prevent OOM before batching. Benefit: protection against traffic spikes. Tradeoff: may drop spans during spikes.
- **Persistent Queue for Critical Data:** Enable `sending_queue` with disk-backed storage for critical telemetry. Benefit: survives Collector restarts. Tradeoff: disk space consumption.

---

## Architectural Decisions

**Deploy two-tier architecture: Agent Collector per host + Gateway Collector cluster.** Agent provides per-instance buffering; gateway provides cross-instance aggregation and multi-backend export.

**Set `memory_limiter` at 70% of available RAM with `spike_limit_mib` for burst traffic.** Prevents OOM during data spikes while accommodating normal traffic.

**Configure `retry_on_failure` with exponential backoff (5s initial, 30s max, 300s max elapsed).** Backend failures don't cause data loss.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Collector prevents data loss during backend failures | Additional infrastructure to deploy | Essential for production observability |
| Batching reduces export API calls by 10-100x | Adds latency (100ms batch timeout) | Acceptable for most use cases |
| Memory limiter prevents OOM | Drops spans during traffic spikes | Better than losing all spans |

---

## Performance Considerations

Collector processing overhead is 1-3% CPU for typical pipeline; scales linearly with throughput. Batch processor configurable timeout (default 200ms) and batch size; larger batches reduce export cost. Memory limiter recommended at 75% of available memory as soft limit. OTLP gRPC exporters are 20-30% lower CPU than HTTP/protobuf for equivalent throughput.

---

## Production Considerations

Collector's health endpoint and pprof should not be exposed publicly. OTLP receiver must use TLS if exposed over network. Collector may buffer sensitive span data; encrypt disk-backed queues. Use network policies to restrict Collector access to application servers only. Collector configuration may contain backend credentials; use environment variable substitution.

---

## Common Mistakes

**No memory limiter** — Collector OOM under load, complete data loss until restart.

**Missing health check** — silent Collector failures go undetected.

**Not monitoring Collector metrics** — `otelcol_dropped_spans` not tracked; silent data loss.

**Single Collector for all traffic** — single point of failure with no redundancy.

**Overly aggressive tail sampling** — long `decision_wait` + high throughput consumes GB of memory.

---

## Failure Modes

**Collector OOM during traffic spike:** No memory limiter configured. Detection: Collector process killed; telemetry stops. Mitigation: always configure memory_limiter; monitor memory usage.

**Backend outage causes data loss:** No persistent queue or retry configured. Detection: spans missing from backend. Mitigation: enable `sending_queue` with retry_on_failure.

**Collector version incompatibility:** Collector upgrade breaks pipeline configuration. Detection: Collector fails to start. Mitigation: pin Collector version; test upgrades in staging.

---

## Ecosystem Usage

The Collector sits between OTel SDKs and observability backends in the OTel architecture. For Laravel deployments, the sidecar Collector per host receives OTLP data from the PHP SDK, applies basic processing (batching, memory limiting), and forwards to a central Gateway Collector that aggregates and exports to backends like Prometheus, Grafana Tempo, and Loki.

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

Two-tier deployment (agent + gateway) is the recommended production pattern. Memory limiter prevents OOM; set at 70% of available RAM. Persistent queue survives restarts; configure disk-backed storage for critical data. Collector can be scaled horizontally behind a load balancer.
