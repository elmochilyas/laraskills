# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 09-advanced-topics
**Knowledge Unit:** otel-auto-instrumentation
**Difficulty:** Advanced
**Category:** OTel Instrumentation
**Last Updated:** 2026-06-03

# Overview

OpenTelemetry auto-instrumentation automatically generates telemetry data (spans, metrics, logs) from popular frameworks and libraries without manual code changes. For PHP and Laravel, auto-instrumentation hooks into PDO (database queries), Guzzle (HTTP client), Redis, Laravel framework events, and other common libraries.

Auto-instrumentation is achieved through the OpenTelemetry PHP SDK's instrumentation library system. Each instrumentation package registers itself to intercept specific function calls or hook into framework events. The instrumentation creates spans, records metrics, and adds context propagation automatically.

Engineers should care because auto-instrumentation provides immediate observability value. A Laravel application with auto-instrumentation produces traces for every HTTP request, database query, HTTP client call, and cache operation — without writing a single line of instrumentation code.

# Core Concepts

**Instrumentation Package:** A PHP package that hooks into a specific library or framework to generate telemetry. Examples: `open-telemetry/instrumentation-laravel`, `open-telemetry/instrumentation-pdo`, `open-telemetry/instrumentation-guzzle`.

**Hook:** The mechanism by which an instrumentation package intercepts execution. PHP auto-instrumentation uses the `OpenTelemetry\API\Instrumentation\AutoInstrumentation` interface, hooking into library entry points via function pre/post hooks or event listeners.

**Span Attribute Extraction:** Auto-instrumentation automatically extracts relevant attributes from the library context. PDO instrumentation extracts `db.system`, `db.query.text`, `db.connection_string`. Guzzle instrumentation extracts `http.request.method`, `url.full`, `http.response.status_code`.

**Context Propagation:** Auto-instrumentation automatically propagates trace context across library boundaries. A Guzzle HTTP call within a traced request automatically receives the correct parent span context.

**Installation:** Auto-instrumentation packages are installed via Composer. Some require registering the instrumentation with the SDK, while others self-register via Composer's autoloader.

# When To Use

- **Quickly adding observability** to existing Laravel applications
- **Covering common libraries** (PDO, Guzzle, Redis) without manual spans
- **Ensuring consistent instrumentation** across the team — auto-instrumentation applies the same patterns everywhere

# When NOT To Use

- **Custom application logic** that auto-instrumentation cannot cover
- **Performance-critical paths** where auto-instrumentation overhead is measurable
- **Libraries not covered by existing instrumentation packages**

# Best Practices

**Install auto-instrumentation alongside manual instrumentation.** Auto-instrumentation covers libraries; manual instrumentation covers business logic. Both are needed for complete observability.

**Review auto-instrumentation verbosity.** Some instrumentations create spans for every database query, including health check queries. Configure sampling or filtering to reduce noise.

**Test with the specific PHP version.** PHP auto-instrumentation can be sensitive to PHP version changes. Test after PHP upgrades before deploying to production.

**Set resource attributes for proper identification.** Auto-instrumentation uses the global Resource. Ensure `service.name`, `service.version`, and `deployment.environment` are configured.

# Architecture Guidelines

Auto-instrumentation works alongside manual instrumentation in the same SDK:

1. **Global TracerProvider/MeterProvider** configured once in application bootstrap
2. **Auto-instrumentation packages** register themselves with the providers
3. **Application code** may also create manual spans for business logic
4. **All telemetry** (auto + manual) is exported through the same exporter

Auto-instrumentation hooks are applied at SDK initialization. They persist for the application's lifetime. No runtime configuration changes are possible without restart.

# Performance Considerations

- **Per-span overhead:** Each auto-instrumented span adds 1-10μs. 50 auto-spans per request add 0.05-0.5ms. Negligible
- **Hook lookup overhead:** Function hooking adds marginal overhead even when no span is created. For high-traffic paths (>1000 RPM), profile auto-instrumentation overhead
- **Memory:** Each instrumentation package adds 50-200KB of loaded code. 10 packages add 0.5-2MB. Acceptable

# Security Considerations

- **Auto-instrumented span attributes:** PDO instrumentation captures SQL query text. Guzzle instrumentation captures full URLs including query parameters. Review auto-instrumentation attribute settings for sensitive data leakage. Configurable sanitization available
- **Request data:** Laravel auto-instrumentation may capture route parameters and request data. Configure which data is recorded

# Common Mistakes

**No manual instrumentation.** Relying entirely on auto-instrumentation. Business logic (order processing, payment flow, user registration) is not instrumented because auto-instrumentation only covers libraries.

**Over-filtering auto-spans.** Disabling all database query spans because health check queries are noisy. Instead, filter specific query patterns while keeping meaningful database spans.

**Not upgrading instrumentations.** Running outdated instrumentation packages that don't support the latest library versions. Instrumentation fails silently, creating observability gaps.

# Anti-Patterns

**Auto-instrumentation as complete solution.** Installing auto-instrumentation packages and considering observability "done." Business logic instrumentation is manual and requires intentional effort.

**Ignoring span attribute content.** Assuming auto-instrumentation only captures timing data. PDO instrumentation captures full SQL queries. Guzzle captures full URLs. Both may contain sensitive data.

**Instrumentation conflict.** Running multiple instrumentation packages that hook into the same library (e.g., two packages hooking PDO). Openspan/close span ordering issues create broken traces.

# Examples

**Installing auto-instrumentation:**
```bash
composer require open-telemetry/instrumentation-laravel
composer require open-telemetry/instrumentation-pdo
composer require open-telemetry/instrumentation-guzzle
```

# Related Topics

**Prerequisites:**
- OpenTelemetry SDK fundamentals (TracerProvider, MeterProvider)

**Closely Related Topics:**
- OpenTelemetry Ecosystem (where auto-instrumentation fits)
- OTel Collector Production (processing auto-instrumentation data)

**Advanced Follow-Up Topics:**
- Writing custom instrumentation packages
- Performance profiling with auto-instrumentation

**Cross-Domain Connections:**
- Framework-specific instrumentation patterns

# AI Agent Notes

- Auto-instrumentation covers libraries (PDO, Guzzle, Redis), not business logic
- Combine auto + manual instrumentation for complete coverage
- Review auto-instrumentation attributes for sensitive data leakage
- Configure resource attributes: `service.name`, `service.version`, `deployment.environment`
- Test after PHP upgrades — auto-instrumentation can be PHP-version-sensitive
- Each auto-instrumentation adds 50-200KB memory and 1-10μs per span
- Health checks create noisy spans — configure filtering
- Upgrade instrumentation packages alongside library upgrades
