# Rules: Log Context & Correlation

## Rule LCC-01: Use Context facade for request-scoped metadata
**Condition:** When storing metadata that should appear on every log entry within a request lifecycle.
**Action:** Use `Illuminate\Log\Context\Context::add()` instead of global state, static properties, or `Log::shareContext()`.
**Consequence:** Correct scope isolation in queue workers, automatic serialization, compatibility with Laravel 11+ logging internals.

## Rule LCC-02: Inject trace IDs via Monolog processors
**Condition:** When correlating logs with distributed traces.
**Action:** Create a custom Monolog processor that extracts the current OpenTelemetry trace ID from the OTel context and adds it as `$record['extra']['trace_id']`.
**Consequence:** Every log entry carries its trace ID, enabling search-by-trace in log aggregators.
**Exception:** If the application does not use OpenTelemetry, inject the correlation ID instead.

## Rule LCC-03: Propagate context to queued jobs explicitly
**Condition:** When dispatching a queued job from a context-rich request lifecycle.
**Action:** Use `Context::dehydrate()` before dispatch and `Context::hydrate()` at job execution start. Implement queue middleware to automate this.
**Consequence:** Context survives serialization and deserialization across process boundaries.
**Violation:** Correlating logs from queued jobs requires painful manual joins — or is impossible.

## Rule LCC-04: Limit context to high-value fields
**Condition:** When configuring the Context facade data set.
**Action:** Include only fields that are necessary for debugging: correlation ID, user ID, request path, trace ID, session ID. Limit to 10-15 fields.
**Consequence:** Controlled log storage costs, faster ingestion, meaningful search results.
**Violation:** 50+ field context arrays increase per-entry size by 300-500% with marginal debugging value.

## Rule LCC-05: Keep PSR-3 context for call-site-specific metadata
**Condition:** When adding metadata that is relevant only to a single log call.
**Action:** Pass the metadata as the `$context` array parameter on `Log::info()`, `Log::error()`, etc. Do not add it to the Context facade.
**Consequence:** PSR-3 context is explicit about what data belongs to what log line. The Context facade remains reserved for ambient request metadata.

## Rule LCC-06: Validate incoming traceparent headers
**Condition:** When accepting W3C traceparent headers from upstream services.
**Action:** Validate header format (hex, version=00, 32-char trace ID, 16-char span ID, 2-char flags) before using it. Discard malformed headers and start a fresh trace.
**Consequence:** Prevents header injection attacks and malformed context propagation.

## Rule LCC-07: Configure Sentry before_send for context redaction
**Condition:** When bridging Laravel Context facade data to Sentry scope.
**Action:** Implement `before_send` callback in `config/sentry.php` to redact PII fields from error events before transmission.
**Consequence:** Error reports carry correlation context without leaking sensitive data.

## Rule LCC-08: Never construct traceparent manually
**Condition:** When propagating trace context to downstream services.
**Action:** Use OpenTelemetry SDK's `Propagator` to inject trace context into HTTP headers. Never build `traceparent` strings via string concatenation.
**Consequence:** Guarantees correct format, proper trace flags propagation, and compatibility with W3C specification.
**Violation:** Manually constructed headers may omit required fields or use incorrect format, breaking distributed trace integrity.

## Rule LCC-09: Measure context serialization overhead in high-traffic routes
**Condition:** When deploying context enrichment to endpoints handling >1000 req/s.
**Action:** Benchmark `Context::dehydrate()` duration. Profile with Blackfire or XHProf to quantify serialization cost. Set context data size limits.
**Consequence:** Prevents observability infrastructure from degrading application performance.

## Rule LCC-10: Correlate every execution path — not just HTTP
**Condition:** When implementing log correlation.
**Action:** Ensure queue jobs, scheduled commands, broadcast events, and console commands all initialize and propagate correlation context.
**Consequence:** Complete observability coverage across all execution modes. No blind spots in async paths.
