# Decomposition: OTLP Exporter & Collector Configuration

## Topic Overview
The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data. Deploying the Collector alongside Laravel applications is a production best practice â€” it decouples application instrumentation from backend infrastructure, provides buffering/retry, enables tail-based sampling, and allows pipeline transformations without application redeployment. The OTLP exporter in the PHP SDK sends data to the Collector via gRPC or HTTP/protobuf.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
distributed-tracing/otlp-exporter-collector/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### OTLP Exporter & Collector Configuration
- **Purpose:** The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data. Deploying the Collector alongside Laravel applications is a production best practice â€” it decouples application instrumentation from backend infrastructure, provides buffering/retry, enables tail-based sampling, and allows pipeline transformations without application redeployment. The OTLP exporter in the PHP SDK sends data to the Collector via gRPC or HTTP/protobuf.
- **Difficulty:** Advanced
- **Dependencies:
  - OpenTelemetry PHP SDK (OTLP Exporter client-side config)
  - Span Sampling Strategies (tail sampling policies in Collector)
  - OTel Auto-Instrumentation (Collector receives auto-instrumented traces)
  - OTel Collector Production Hardening (advanced production deployment)

## Dependency Graph
**Depends on:**
  - OpenTelemetry PHP SDK (OTLP Exporter client-side config)
  - Span Sampling Strategies (tail sampling policies in Collector)
  - OTel Auto-Instrumentation (Collector receives auto-instrumented traces)
  - OTel Collector Production Hardening (advanced production deployment)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - OTLP (OpenTelemetry Protocol)
  - Collector pipeline
  - Receiver
  - Processor
  - Exporter
  - Extension

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