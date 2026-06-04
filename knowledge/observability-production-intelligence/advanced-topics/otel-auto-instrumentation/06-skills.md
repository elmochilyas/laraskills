# Skill: Set Up OpenTelemetry Auto-Instrumentation for Laravel
## Purpose
Set up OpenTelemetry auto-instrumentation for Laravel applications using OpenTelemetry PHP auto-instrumentation extension or OTEL PHP SDK hooks to automatically capture spans for HTTP requests, database queries, cache operations, and queue jobs without manual code changes.
## When To Use
- Large Laravel codebases where manual instrumentation is impractical
- Teams wanting zero-code observability instrumentation
- Comprehensive span coverage without developer effort
## When NOT To Use
- Small applications where manual instrumentation is manageable
- Need for custom business-specific span attributes
- Environments where PHP extensions cannot be installed
## Prerequisites
- PHP extensions: opentelemetry (pecl or source build)
- OpenTelemetry SDK packages installed
- Root/sudo access for PHP extension installation
## Inputs
- OpenTelemetry extension configuration (INI settings)
- Auto-instrumentation SDK packages for each component
## Workflow
1. Install OpenTelemetry PHP extension: `pecl install opentelemetry` or build from source
2. Install auto-instrumentation packages per component:
   - `open-telemetry/opentelemetry-auto-php` (base instrumentation)
   - `open-telemetry/opentelemetry-auto-laravel` (Laravel-specific hooks)
   - `open-telemetry/opentelemetry-auto-psr18` (HTTP client)
   - `open-telemetry/opentelemetry-auto-pdo` (database)
   - `open-telemetry/opentelemetry-auto-redis` (cache)
3. Configure extension in `php.ini`: `extension=opentelemetry.so`, `otel.service.name=my-app`, `otel.traces.exporter=otlp`
4. Create `start.php` bootstrap file to pre-load auto-instrumentation before Laravel
5. Configure OTLP exporter endpoint and TLS in environment variables
6. Set up sampling: `otel.traces.sampler=traceidratio`, `otel.traces.sampler.arg=0.1`
7. Verify auto-instrumentation captures spans: HTTP request, query execution, cache get/set, queue job processing
8. Add manual instrumentation where auto-instrumentation misses business context
## Validation Checklist
- [ ] OpenTelemetry PHP extension installed and loaded (`php -m | grep opentelemery`)
- [ ] Auto-instrumentation packages installed for Laravel, HTTP client, PDO, Redis
- [ ] `otel.service.name` and exporter configured correctly
- [ ] `start.php` bootstrap file pre-loads auto-instrumentation
- [ ] OTLP exporter endpoint configured with TLS
- [ ] Sampling configured for production traffic volume
- [ ] HTTP spans captured: request method, URL, status code, duration
- [ ] Database spans captured: query, duration, affected rows
- [ ] Cache spans captured: operation, key, hit/miss
- [ ] Queue job spans captured: job class, queue name, duration
## Common Failures
- **Extension not loading:** Version mismatch with PHP, missing dependencies (ext-curl, ext-grpc).
- **No Laravel-specific spans:** `open-telemetry/opentelemetry-auto-laravel` not installed.
- **Double instrumentation:** Manual + auto creating duplicate spans for same operation.
- **Missing DB spans:** PDO auto-instrumentation requires PDO class hooks (may not work with custom DB drivers).
- **Performance impact:** All operations instrumented by default — configure sampling to reduce overhead.
## Decision Points
- **Auto vs manual instrumentation:** Auto for broad coverage with minimal effort; manual for business-specific traces.
- **Extension vs SDK-only:** Extension for deep hooks (PDO, curl); SDK-only for lighter instrumentation without extension.
- **Full auto vs selective:** Full auto for development/staging; selective with sampling for production.
## Performance Considerations
- Auto-instrumentation adds 3-10% CPU overhead
- All DB queries get spans — configure sampling for production
- Cache operations add spans — use lower sampling for high-cache apps
- Extension-level hooks avoid HTTP-level overhead
## Security Considerations
- Auto-instrumentation captures all SQL — may log sensitive data
- Configure attribute length limits to avoid capturing large payloads
- Ensure `otel.experimental.thread-safe=false` on CLI (jobs running in parallel)
## Related Skills
- OpenTelemetry PHP SDK (distributed-tracing)
- OpenTelemetry Collector Production (advanced-topics)
- Structured JSON Logging (logging)
- Span Sampling Strategies (distributed-tracing)
## Success Criteria
- Auto-instrumentation captures spans for HTTP, DB, cache, and queue operations
- Laravel-specific hooks generate meaningful span names and attributes
- Sampling controls overhead in production
- Manual instrumentation fills gaps where auto-instrumentation is insufficient
- No duplicate spans from manual + auto instrumentation
