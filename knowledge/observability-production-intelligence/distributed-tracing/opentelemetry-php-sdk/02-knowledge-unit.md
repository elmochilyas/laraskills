# OpenTelemetry PHP SDK

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 04-distributed-tracing
- **Knowledge Unit:** opentelemetry-php-sdk
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

The OpenTelemetry PHP SDK (stable since v1.0, early 2026) provides a vendor-neutral API for generating traces, metrics, and logs from Laravel applications. It is the industry standard for observability instrumentation, allowing teams to send telemetry data to any backend (Jaeger, Tempo, Datadog, New Relic) without vendor-specific SDKs and avoiding vendor lock-in.

---

## Core Concepts

- **TracerProvider:** Entry point for trace instrumentation — creates `Tracer` instances, configured once per application with service name, sampler, span processor, and exporter
- **MeterProvider:** Entry point for metrics instrumentation — creates `Meter` instances with readers and exporters
- **Span:** Fundamental unit of work in distributed tracing — has name, timestamps, attributes, events, status, and parent span context
- **Context:** Mechanism for propagating span context across process boundaries via HTTP headers (`traceparent`), queue messages, and gRPC metadata
- **OTLP (OpenTelemetry Protocol):** Wire format for exporting telemetry data via gRPC (`:4317`) or HTTP/protobuf (`:4318`)
- **Sampler:** Determines whether a span is recorded — `AlwaysOnSampler`, `AlwaysOffSampler`, `TraceIdRatioSampler`, `ParentBasedSampler`

---

## Mental Models

- **Provider Hierarchy Model:** TracerProvider → Tracer → Span forms a containment hierarchy. One provider, multiple tracers per domain, many spans per request
- **Unified API Model:** OTel provides one API for traces, metrics, and logs — like a universal remote that controls all your observability devices instead of separate remotes for each
- **Vendor-Neutral Model:** OTel is the USB-C of observability — one cable (SDK) connects to any device (backend) through the right adapter (exporter)

---

## Internal Mechanics

The SDK follows a modular provider hierarchy: TracerProvider (configured once) → Tracer (created per domain) → Span (per unit of work) with attributes, events, and status. MeterProvider → Meter → Instruments (Counter, Histogram, UpDownCounter). SDK initialization happens in a service provider's `boot()` method, creating a singleton TracerProvider. Graceful shutdown on application termination flushes pending spans. The BatchSpanProcessor buffers spans and exports in batches on a background thread.

---

## Patterns

- **Environment-Variable Configuration:** Configure OTel via `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_TRACES_SAMPLER` etc. Benefit: separates configuration from code, deploy-time flexibility. Tradeoff: environment variables must be documented and consistent across environments.
- **Manual Span for Business Logic:** Create custom spans for business operations (checkout, payment, order processing) with domain-specific attributes. Benefit: traces reflect application semantics. Tradeoff: requires intentional instrumentation effort.
- **Graceful Shutdown Registration:** Register `Shutdown()` on application termination to flush pending spans. Benefit: prevents data loss on deployment. Tradeoff: requires service provider lifecycle management.

---

## Architectural Decisions

**Use BatchSpanProcessor in production.** SimpleSpanProcessor exports spans synchronously, adding latency. BatchSpanProcessor buffers and exports in batches on a background thread.

**Create TracerProvider once in service provider.** Creating a new TracerProvider per request adds initialization overhead. Create once, inject as dependency.

**Configure via environment variables over programmatic config** for deploy-time flexibility. Environment variables allow operations to change sampling rates, endpoints, and exporters without code changes.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Vendor-neutral — switch backends without code changes | SDK adds 3-7% request processing overhead | Acceptable for most applications |
| Unified API for traces, metrics, logs | Modular packages require careful selection | Only require needed packages |
| BatchSpanProcessor prevents request latency | Batch export adds 0-5s latency | Tune based on throughput requirements |

---

## Performance Considerations

BatchSpanProcessor default export interval 5000ms, buffer limit 2048 spans. Span creation overhead ~0.1ms per span. Export latency via batch adds 0-5s (configurable). Each active span holds ~1KB of data. SDK initialization takes 10-50ms on cold start depending on exporter configuration.

---

## Production Considerations

OTLP export must use TLS — never send plaintext telemetry. Review span attributes for PII and secrets. Configure API key or mTLS for OTLP endpoint authentication. Incoming `traceparent` headers must be validated to prevent injection.

---

## Common Mistakes

**Using SimpleSpanProcessor in production** — every span end triggers immediate export, adding 5-50ms per span to request latency. Always use `BatchSpanProcessor`.

**Missing graceful shutdown** — application terminates without flushing pending spans. Data loss on every deployment. Register `Shutdown()` on application termination.

**High-cardinality span attributes** — setting `user_id`, `session_id`, or `request_id` as span attributes causes storage explosion in backends.

**No sampling configuration** — default `AlwaysOnSampler` records 100% of spans. For high-traffic apps, this is prohibitively expensive.

---

## Failure Modes

**Exporter failure:** OTLP exporter cannot reach the backend. Detection: spans queued but not exported; backpressure on BatchSpanProcessor. Mitigation: configure retry logic; use Collector as buffer.

**SDK version mismatch:** Incompatible OTel package versions cause runtime errors. Detection: PHP errors on SDK initialization. Mitigation: pin all OTel packages to compatible versions; test upgrades in staging.

**Context propagation failure:** Span context not propagated across queue boundaries. Detection: queue job traces appear as separate traces. Mitigation: manually inject and extract span context in queue messages.

---

## Ecosystem Usage

The OTel PHP SDK is modular — only require the packages needed (api, sdk, exporter). The `open-telemetry/opentelemetry-auto-laravel` package provides auto-instrumentation for Laravel. Sentry and other vendors support OTel data ingestion, enabling OTel with vendor dashboards.

---

## Related Knowledge Units

### Prerequisites
- W3C Trace Context Propagation (distributed trace headers)

### Related Topics
- OTel Auto-Instrumentation (PHP extension + instrumentation packages)
- OTLP Exporter & Collector Configuration (export pipeline)

### Advanced Follow-up Topics
- Span Sampling Strategies (sampling configuration)
- OTel Metrics API (MeterProvider, instruments)

---

## Research Notes

BatchSpanProcessor is mandatory for production; never use SimpleSpanProcessor. Environment variable configuration is preferred over programmatic config. Span attributes must be low-cardinality. Register graceful shutdown to flush spans on deployment/restart. OTel PHP SDK is modular — only require the packages needed (api, sdk, exporter). The SDK is stable since v1.0 (2026) — production-ready.
