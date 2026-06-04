# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 04-distributed-tracing
**Knowledge Unit:** opentelemetry-php-sdk
**Difficulty:** Advanced
**Category:** Distributed Tracing SDK
**Last Updated:** 2026-06-03

# Overview

The OpenTelemetry PHP SDK (stable since v1.0, early 2026) provides a vendor-neutral API for generating traces, metrics, and logs from Laravel applications. The SDK is composed of modular Composer packages: `API`, `Context`, `SDK`, and exporters. It supports automatic configuration via environment variables and manual instrumentation for fine-grained control.

OpenTelemetry is the industry standard for observability instrumentation. Adopting the PHP SDK allows Laravel teams to send telemetry data to any backend (Jaeger, Tempo, Datadog, New Relic) without vendor-specific SDKs. Combined with the OTel auto-instrumentation PHP extension, it enables zero-code observability.

Engineers should care because OpenTelemetry is the future of observability. Every major vendor (Datadog, New Relic, Grafana, AWS, Azure, GCP) supports OTel natively. Investing in OTel instrumentation avoids vendor lock-in and provides a single instrumentation API for traces, metrics, and logs.

# Core Concepts

**TracerProvider:** The entry point for trace instrumentation. Creates `Tracer` instances. Configured once per application with service name, sampler, span processor, and exporter.

**MeterProvider:** The entry point for metrics instrumentation. Creates `Meter` instances. Configured with readers and exporters for metric data.

**LoggerProvider:** The entry point for log instrumentation (OTel logging signal). Creates `Logger` instances. Less mature in PHP than traces and metrics.

**Span:** The fundamental unit of work in distributed tracing. Has a name, start/end timestamps, attributes, events, status, and a parent span context. Spans form a directed acyclic graph representing the work flow.

**Context:** The mechanism for propagating span context across process boundaries — HTTP headers (`traceparent`), queue message metadata, gRPC metadata. Context is immutable and propagated automatically by the SDK.

**OTLP (OpenTelemetry Protocol):** The wire format for exporting telemetry data. Supports gRPC (`:4317`) and HTTP/protobuf (`:4318`). OTLP is the standard export protocol for OTel.

**Sampler:** Determines whether a span should be recorded and exported. `AlwaysOnSampler` (record everything), `AlwaysOffSampler` (record nothing), `TraceIdRatioSampler` (record X% of traces), `ParentBasedSampler` (respect parent sampling decision).

**SpanProcessor:** Receives completed spans and decides what to do with them. `SimpleSpanProcessor` (export immediately — for development), `BatchSpanProcessor` (buffer and batch export — for production).

# When To Use

- **All new Laravel projects** — OTel is the industry standard; start with it from day one
- **Multi-service architectures** requiring cross-service trace correlation
- **Vendor-neutral observability strategy** — avoid locking into vendor-specific SDKs
- **Applications needing traces + metrics + logs from a single SDK**

# When NOT To Use

- **Applications already deeply integrated with a vendor SDK** — migration cost may exceed benefit; add OTel alongside for future-proofing
- **Extremely simple single-server applications** where a simpler APM tool suffices

# Best Practices

**Use BatchSpanProcessor in production.** `SimpleSpanProcessor` exports spans synchronously on every span end, adding latency. `BatchSpanProcessor` buffers and exports in batches on a background thread.

**Configure via environment variables.** OTel supports extensive environment variable configuration (`OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_TRACES_SAMPLER`). This separates configuration from code.

**Set meaningful span attributes.** Span attributes should enable correlation: `order_id`, `user_id`, `payment_id`. Avoid high-cardinality attributes (session IDs, timestamps).

**Use span status correctly.** Set `SpanStatus::OK` on success, `SpanStatus::ERROR` on failure with description. This enables error-rate dashboards from traces.

**Register provider in service provider.** Initialize `TracerProvider` and `MeterProvider` in a dedicated service provider `boot()` or `register()` method. Store as singleton for reuse.

# Architecture Guidelines

The OTel SDK follows a modular provider hierarchy:

```
TracerProvider (configured once)
  └── Tracer (created per domain/component)
       └── Span (per unit of work)
            ├── Attributes (key-value pairs)
            ├── Events (timestamped annotations)
            └── Status (OK/ERROR)

MeterProvider (configured once)
  └── Meter (created per domain)
       └── Instruments (Counter, Histogram, UpDownCounter)
```

The SDK should be initialized early in the application lifecycle (service provider `boot()`) and configured to shut down gracefully on application termination to flush pending spans.

# Performance Considerations

- **BatchSpanProcessor:** Default export interval 5000ms, buffer limit 2048 spans. Tune based on throughput
- **Span creation overhead:** ~0.1ms per span for creation and attribute setting
- **Export latency:** Batch export adds 0-5s latency (configurable). Does not block request processing
- **Memory:** Each active span holds ~1KB of data. Concurrent spans × active span count = memory budget
- **SDK initialization:** 10-50ms on cold start depending on exporter configuration

# Security Considerations

- **OTLP export encryption:** Must use TLS for export to Collector or backend. Never send plaintext telemetry
- **Span attribute sanitization:** Review attributes for PII and secrets. Attribute values appear in traces
- **Exporter authentication:** Configure API key or mTLS for OTLP endpoint authentication
- **Context propagation headers:** Incoming `traceparent` headers must be validated to prevent injection

# Common Mistakes

**Using SimpleSpanProcessor in production.** Every span end triggers an immediate export. Adds 5-50ms per span to request latency. Always use `BatchSpanProcessor`.

**Missing graceful shutdown.** Application terminates without flushing pending spans. Data loss on every deployment. Register `Shutdown()` on application termination.

**High-cardinality span attributes.** Setting `user_id`, `session_id`, or `request_id` as span attributes. Backends index all attributes — high-cardinality attributes cause storage explosion.

**No sampling configuration.** Default `AlwaysOnSampler` records 100% of spans. For high-traffic apps, this is prohibitively expensive. Configure `TraceIdRatioSampler` with appropriate rate.

**Directly instantiating TracerProvider per request.** Creating a new `TracerProvider` on every request adds initialization overhead. Create once in service provider, inject as dependency.

# Anti-Patterns

**Vendor-specific SDK alongside OTel:** Running vendor SDK and OTel simultaneously creates duplicate spans. Choose one approach — ideally OTel with vendor backend.

**No context propagation across queue boundaries:** Queue jobs execute in separate processes without parent trace context. Manually inject and extract span context in queue messages.

**OTel for logs only:** Using OTel only for log export while using a separate vendor SDK for traces and metrics. OTel is a unified API — use it for all three signals.

# Examples

**TracerProvider setup in service provider:**
```php
public function boot(): void
{
    $tracerProvider = TracerProviderBuilder::create()
        ->addSpanProcessor(new BatchSpanProcessor(
            new OtlpExporter()
        ))
        ->setSampler(new TraceIdRatioSampler(0.1))
        ->build();
    
    $this->app->instance(TracerProvider::class, $tracerProvider);
}
```

**Manual span creation:**
```php
$tracer = app(TracerProvider::class)->getTracer('checkout');
$span = $tracer->spanBuilder('process.payment')->startSpan();
$span->setAttribute('order_id', $order->id);
// ... business logic ...
$span->setStatus(SpanStatus::OK);
$span->end();
```

# Related Topics

**Prerequisites:**
- W3C Trace Context Propagation (distributed trace headers)

**Closely Related Topics:**
- OTel Auto-Instrumentation (PHP extension + Composer instrumentation packages)
- OTLP Exporter & Collector Configuration (export pipeline)

**Advanced Follow-Up Topics:**
- Span Sampling Strategies (sampling configuration)
- OTel Metrics API (MeterProvider, instruments)

**Cross-Domain Connections:**
- Async & Distributed Systems — trace context propagation through queues

# AI Agent Notes

- `BatchSpanProcessor` is mandatory for production; never use `SimpleSpanProcessor`
- Environment variable configuration is preferred over programmatic config for deploy-time flexibility
- Span attributes must be low-cardinality — user IDs are acceptable, session tokens are not
- Register graceful shutdown to flush spans on deployment/restart
- OTel PHP SDK is modular — only require the packages needed (api, sdk, exporter)
- The SDK is stable since v1.0 (2026) — production-ready
- Auto-instrumentation via PHP extension is the future but manual instrumentation gives more control
