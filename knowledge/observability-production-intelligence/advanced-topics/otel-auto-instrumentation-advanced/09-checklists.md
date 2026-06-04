# OTel Auto-Instrumentation — Checklist

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** OpenTelemetry Ecosystem
- **Knowledge Unit:** OTel Auto-Instrumentation
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] OTel PHP extension installed (`opentelemetry.so` loaded via `php.ini`)
- [ ] OTel SDK installed via Composer
- [ ] PSR-18 HTTP client installed (e.g., `guzzlehttp/guzzle`) for OTLP exporter
- [ ] OTel backend endpoint configured
- [ ] PHP version compatible with OTel extension version

## Implementation Checklist
- [ ] OTel PHP extension is installed and loaded (verify with `php -m`)
- [ ] SDK is installed via Composer alongside extension
- [ ] `OTEL_PHP_AUTOLOAD_ENABLED=true` is set in environment
- [ ] Instrumentation packages match installed libraries (Laravel, PDO, HTTP, etc.)
- [ ] PSR-18 HTTP client is installed for OTLP exporter
- [ ] Health check URLs are excluded via `OTEL_PHP_EXCLUDED_URLS`
- [ ] Extension version is pinned and matches PHP version
- [ ] Octane fiber compatibility is verified (extension v1.0+)
- [ ] No conflicting vendor agents are active
- [ ] Auto-instrumentation is tested in staging before production

## Verification Checklist
- [ ] `php -m | grep opentelemetry` shows extension loaded
- [ ] `OTEL_PHP_AUTOLOAD_ENABLED=true` is set in environment
- [ ] Extension registers pre/post hooks on class methods
- [ ] Laravel-specific instrumentation captures requests, queries, jobs, cache
- [ ] PDO instrumentation captures database queries
- [ ] PSR-18 HTTP client instrumentation captures outgoing HTTP calls
- [ ] Trace context propagates correctly (W3C Trace Context)
- [ ] Spans appear in OTel backend without code modifications
- [ ] `OTEL_PHP_EXCLUDED_URLS` excludes health check and metrics endpoints
- [ ] Extension + SDK + env vars produce zero-code telemetry

## Security Checklist
- [ ] Auto-instrumentation may capture sensitive data — configure redaction
- [ ] Extension requires `pecl` installation with build dependencies (managed in CI/CD)
- [ ] Extension loaded before application code — verify correct loading order
- [ ] No conflicts with vendor agents (New Relic, Datadog) — choose one
- [ ] Extension version matches PHP version — upgrade both together
- [ ] OTEL_PHP_EXCLUDED_URLS applied to sensitive endpoints
- [ ] Span attributes redacted for PII/sensitive fields

## Performance Checklist
- [ ] Extension overhead: ~2-4% per request with standard instrumentation
- [ ] Hook execution is in C (fast) — PHP callback is minimal
- [ ] Uninstrumented methods have zero overhead
- [ ] Batch span processing configured (`OTEL_BSP_SCHEDULE_DELAY`)
- [ ] Auto-instrumentation captures ~80% of useful spans without code changes
- [ ] Health check and metrics endpoints are excluded from tracing
- [ ] No vendor-specific agent overhead (OTel is lighter)

## Production Readiness Checklist
- [ ] Docker images built with pre-installed OTel extension
- [ ] Environment variables set at container runtime (not build time)
- [ ] OTel PHP Distro used for production over manual Composer + PECL
- [ ] Extension version pinned in Docker image or provisioning scripts
- [ ] Auto-instrumentation tested in staging with production traffic patterns
- [ ] Manual spans added for business logic (beyond auto-instrumentation 80%)
- [ ] No vendor agent conflicts in production
- [ ] SDK-only fallback path exists if extension installation is not possible

## Common Mistakes to Avoid
- [ ] Installing extension without SDK — hooks have no destination for spans
- [ ] Incorrect extension loading order — hooks don't fire
- [ ] Missing PSR-18 HTTP client — OTLP exporter fails silently
- [ ] Not setting `OTEL_PHP_AUTOLOAD_ENABLED` — no auto-configuration
- [ ] Extension conflict with vendor agents — crashes or missing spans
- [ ] Extension without SDK — hooks fire but nowhere to send data
- [ ] Not setting environment variables — extension + SDK + packages but no telemetry
- [ ] Manual instrumentation when auto suffices — unnecessary maintenance burden
