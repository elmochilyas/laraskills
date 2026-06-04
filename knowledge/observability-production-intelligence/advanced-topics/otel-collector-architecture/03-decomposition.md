# Decomposition: OTel Collector Production Hardening

## Topic Overview
The OpenTelemetry Collector is the backbone of production OTel pipelines. Without proper hardening, it becomes a single point of failure â€” dropping spans on overflow, OOM under load, or losing data during restarts. Production hardening covers resource limits, buffering, retry policies, backpressure propagation, high availability, and monitoring the Collector itself. Deploying the Collector as a per-host agent with a centralized gateway is the recommended pattern for Laravel deployments.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opentelemetry-ecosystem/otel-collector-production/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### OTel Collector Production Hardening
- **Purpose:** The OpenTelemetry Collector is the backbone of production OTel pipelines. Without proper hardening, it becomes a single point of failure â€” dropping spans on overflow, OOM under load, or losing data during restarts. Production hardening covers resource limits, buffering, retry policies, backpressure propagation, high availability, and monitoring the Collector itself. Deploying the Collector as a per-host agent with a centralized gateway is the recommended pattern for Laravel deployments.
- **Difficulty:** Advanced
- **Dependencies:
  - OTLP Exporter & Collector Configuration (basic Collector setup)
  - OTel Auto-Instrumentation (Collector receives auto-instrumented data)
  - Span Sampling Strategies (tail sampling in Collector)
  - OpenTelemetry PHP SDK (SDK-side exporter config)

## Dependency Graph
**Depends on:**
  - OTLP Exporter & Collector Configuration (basic Collector setup)
  - OTel Auto-Instrumentation (Collector receives auto-instrumented data)
  - Span Sampling Strategies (tail sampling in Collector)
  - OpenTelemetry PHP SDK (SDK-side exporter config)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Agent mode
  - Gateway mode
  - Memory limiter
  - Batch processor
  - Backpressure
  - Persistent queue
  - Scaling

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