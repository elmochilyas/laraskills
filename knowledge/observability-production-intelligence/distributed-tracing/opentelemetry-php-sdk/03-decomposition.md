# Decomposition: OpenTelemetry PHP SDK

## Topic Overview
The OpenTelemetry PHP SDK (stable since v1.0, early 2026) provides a vendor-neutral API for generating traces, metrics, and logs from Laravel applications. The SDK is composed of modular Composer packages: `API`, `Context`, `SDK`, and exporters. It supports automatic configuration via environment variables (`OTEL_PHP_AUTOLOAD_ENABLED=true`) and manual instrumentation for fine-grained control. Combined with the OTel auto-instrumentation PHP extension, it enables zero-code observability.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
distributed-tracing/opentelemetry-php-sdk/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### OpenTelemetry PHP SDK
- **Purpose:** The OpenTelemetry PHP SDK (stable since v1.0, early 2026) provides a vendor-neutral API for generating traces, metrics, and logs from Laravel applications. The SDK is composed of modular Composer packages: `API`, `Context`, `SDK`, and exporters. It supports automatic configuration via environment variables (`OTEL_PHP_AUTOLOAD_ENABLED=true`) and manual instrumentation for fine-grained control. Combined with the OTel auto-instrumentation PHP extension, it enables zero-code observability.
- **Difficulty:** Advanced
- **Dependencies:
  - OTel Auto-Instrumentation (PHP extension + Composer instrumentation packages)
  - W3C Trace Context Propagation (distributed trace headers)
  - OTLP Exporter & Collector Configuration (export pipeline)
  - Span Sampling Strategies (sampling configuration)
  - OTel Metrics API (MeterProvider, instruments)
  - Community Packages (keepsuit, overtrue wrappers)

## Dependency Graph
**Depends on:**
  - OTel Auto-Instrumentation (PHP extension + Composer instrumentation packages)
  - W3C Trace Context Propagation (distributed trace headers)
  - OTLP Exporter & Collector Configuration (export pipeline)
  - Span Sampling Strategies (sampling configuration)
  - OTel Metrics API (MeterProvider, instruments)
  - Community Packages (keepsuit, overtrue wrappers)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - TracerProvider
  - MeterProvider
  - LoggerProvider
  - Span
  - Context
  - OTLP (OpenTelemetry Protocol)
  - Sampler
  - SpanProcessor

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