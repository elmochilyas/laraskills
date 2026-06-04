# Anti-Patterns: OpenTelemetry PHP SDK

## AP-OSDK-01: SimpleSpanProcessor in Production
Span exported synchronously on every span end. Adds 5-50ms per span to request latency. Always use BatchSpanProcessor in production.

## AP-OSDK-02: No Graceful Shutdown
Application terminates without flushing spans. Data loss on every deployment. Register TracerProvider::shutdown() on termination.

## AP-OSDK-03: High-Cardinality Attributes
Using session ID, email, or timestamps as span attributes. Backends index all attribute values — unbounded cardinality causes storage explosion and slow queries.

## AP-OSDK-04: Per-Request TracerProvider Creation
Creating new SDK instances on each request. Initialization overhead (10-50ms) accumulates. Create once as singleton in service provider.
