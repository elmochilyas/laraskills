# Rules: OpenTelemetry PHP SDK

## Rule OSDK-01: Use BatchSpanProcessor in production, never SimpleSpanProcessor
**Condition:** When configuring the OTel PHP SDK for production.
**Action:** Configure `BatchSpanProcessor` with appropriate export interval (default 5000ms) and buffer size (default 2048). Never use `SimpleSpanProcessor`.
**Consequence:** Spans are exported asynchronously in batches. Request latency is not impacted by span export.

## Rule OSDK-02: Register graceful shutdown for TracerProvider
**Condition:** When initializing SDK in service provider.
**Action:** Register `$tracerProvider->shutdown()` on application termination via `register_shutdown_function()` or Laravel's `terminating` event.
**Consequence:** Pending spans are flushed before the process exits. Zero data loss on normal termination.

## Rule OSDK-03: Set OTEL_SERVICE_NAME environment variable
**Condition:** When deploying OTel SDK in any environment.
**Action:** Set `OTEL_SERVICE_NAME` to the application's service name. This tags all telemetry with the service identifier.
**Consequence:** Telemetry data is correctly attributed to the service in all backends.

## Rule OSDK-04: Use environment variable configuration over programmatic
**Condition:** When configuring SDK parameters that may change between environments.
**Action:** Use `OTEL_*` environment variables for exporter endpoint, sampling rate, and propagation format. Reserve programmatic configuration for fixed pipeline components.
**Consequence:** Deploy-time configuration without code changes.

## Rule OSDK-05: Avoid high-cardinality span attributes
**Condition:** When adding attributes to spans.
**Action:** Do not set attributes with unbounded cardinality (session IDs, email addresses, timestamps). Use only low-to-moderate cardinality attributes (order_id, user_id, service version).
**Consequence:** Backend storage and indexing costs remain controlled. Query performance is predictable.

## Rule OSDK-06: Configure sampling via TraceIdRatioSampler for production
**Condition:** When deploying SDK to production with significant traffic (>100 req/s).
**Action:** Use `TraceIdRatioSampler(rate)` with rate appropriate for traffic volume (0.1 for high traffic, 0.5 for moderate). Wrap with `ParentBasedSampler`.
**Consequence:** Span volume controlled. Costs predictable.

## Rule OSDK-07: Initialize SDK once, never per-request
**Condition:** When setting up TracerProvider and MeterProvider.
**Action:** Create SDK components in service provider `boot()` as singletons. Inject via dependency injection or static accessor.
**Consequence:** No repeated initialization overhead. Consistent configuration across request lifecycle.
