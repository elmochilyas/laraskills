# OpenTelemetry Auto-Instrumentation

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 09-advanced-topics
- **Knowledge Unit:** otel-auto-instrumentation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

OpenTelemetry auto-instrumentation automatically generates telemetry data from popular frameworks and libraries without manual code changes. For PHP and Laravel, it hooks into PDO (database queries), Guzzle (HTTP client), Redis, Laravel framework events, and other common libraries, providing immediate observability value — traces for every HTTP request, database query, HTTP client call, and cache operation without writing a single line of instrumentation code.

---

## Core Concepts

- **Instrumentation Package:** PHP package hooking into a specific library or framework — `open-telemetry/instrumentation-laravel`, `instrumentation-pdo`, `instrumentation-guzzle`
- **Hook:** Mechanism by which an instrumentation package intercepts execution via function pre/post hooks or event listeners
- **Span Attribute Extraction:** Auto-instrumentation extracts relevant attributes from library context — PDO extracts `db.system`, `db.query.text`; Guzzle extracts `http.request.method`, `url.full`
- **Context Propagation:** Auto-instrumentation propagates trace context across library boundaries — Guzzle calls within a traced request automatically receive correct parent span context
- **Installation:** Composer packages — some require SDK registration, others self-register via autoloader

---

## Mental Models

- **Security Camera Model:** Auto-instrumentation is like security cameras in a building — they automatically record activity (spans) in common areas (libraries) without anyone having to operate the cameras. But they don't see what happens in private offices (business logic)
- **Spyglass Model:** Auto-instrumentation gives you a spyglass to see what libraries are doing — which queries PDO runs, which URLs Guzzle calls, which keys Redis accesses. It's automatic but limited to what the spyglass can see
- **Autopilot Model:** Auto-instrumentation is like a plane's autopilot — it handles routine instrumentation (libraries) so you can focus on the complex parts (business logic). But autopilot doesn't land the plane (instrument business logic requires manual work)

---

## Internal Mechanics

Auto-instrumentation packages use the OTel SDK's instrumentation API to hook into library entry points. When a PDO query executes, the instrumentation intercepts the call, creates a span with extracted attributes (`db.system`, `db.query.text`), executes the original query, and ends the span. Guzzle instrumentation wraps HTTP calls, extracting URL, method, status code, and injecting trace context into outgoing requests. The instrumentation registers with the global TracerProvider at SDK initialization and persists for the application's lifetime.

---

## Patterns

- **Auto + Manual Combination:** Use auto-instrumentation for libraries (PDO, Guzzle, Redis) and manual instrumentation for business logic (order processing, payment flow). Benefit: complete coverage with minimal effort. Tradeoff: manual instrumentation is still required for business logic.
- **Verbosity Review:** Review auto-instrumentation verbosity before production — some instrumentations create spans for every database query including health checks. Benefit: controlled overhead. Tradeoff: requires upfront review.
- **PHP Version Testing:** Test auto-instrumentation after PHP upgrades. Benefit: catches compatibility issues before production. Tradeoff: additional testing overhead.

---

## Architectural Decisions

**Install auto-instrumentation alongside manual instrumentation.** Auto-instrumentation covers libraries; manual instrumentation covers business logic. Both are needed for complete observability.

**Review auto-instrumentation verbosity.** Some instrumentations create spans for every database query. Configure sampling or filtering to reduce noise from health checks and high-frequency operations.

**Set resource attributes for proper identification.** Auto-instrumentation uses the global Resource. Ensure `service.name`, `service.version`, and `deployment.environment` are configured.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero-code instrumentation for libraries | Does not cover business logic | Manual instrumentation still needed |
| Consistent instrumentation across the team | 50-200KB memory per package | Acceptable — 10 packages add <2MB |
| Automatic context propagation | PHP-version-sensitive | Test after PHP upgrades |

---

## Performance Considerations

Each auto-instrumented span adds 1-10μs — 50 auto-spans per request adds 0.05-0.5ms, negligible. Function hooking adds marginal overhead even when no span is created — profile high-traffic paths (>1000 RPM). Each instrumentation package adds 50-200KB of loaded code — 10 packages add 0.5-2MB, acceptable.

---

## Production Considerations

PDO instrumentation captures SQL query text — review attribute settings for sensitive data leakage. Guzzle instrumentation captures full URLs including query parameters. Laravel auto-instrumentation may capture route parameters and request data — configure which data is recorded.

---

## Common Mistakes

**No manual instrumentation** — relying entirely on auto-instrumentation. Business logic (order processing, payment flow, user registration) is not instrumented because auto-instrumentation only covers libraries.

**Over-filtering auto-spans** — disabling all database query spans because health check queries are noisy. Instead, filter specific query patterns while keeping meaningful database spans.

**Not upgrading instrumentations** — running outdated packages that don't support the latest library versions. Instrumentation fails silently, creating observability gaps.

---

## Failure Modes

**Silent instrumentation failure:** Auto-instrumentation package doesn't load or register properly — no spans generated for that library. Detection: missing spans for PDO queries or Guzzle calls. Mitigation: verify instrumentation is registered; check SDK initialization logs.

**Instrumentation conflict:** Two packages hooking the same library cause span ordering issues. Detection: broken traces — mismatched parent/child spans. Mitigation: check compatibility before installing multiple instrumentation packages for the same library.

**Span attribute leakage:** Auto-instrumentation captures sensitive data in span attributes (SQL queries, URLs with PII). Detection: compliance audit finds PII in spans. Mitigation: review attribute configuration; configure attribute filtering.

---

## Ecosystem Usage

The OpenTelemetry PHP Contrib repository provides instrumentation packages for Laravel, Symfony, Guzzle, PDO, Redis, and more. Laravel auto-instrumentation covers HTTP requests, queue jobs, cache operations, and Eloquent queries. Auto-instrumentation works alongside the OTel Collector for data processing and export.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry SDK fundamentals (TracerProvider, MeterProvider)

### Related Topics
- OpenTelemetry Ecosystem (where auto-instrumentation fits)
- OTel Collector Production (processing auto-instrumentation data)

### Advanced Follow-up Topics
- Writing custom instrumentation packages
- Performance profiling with auto-instrumentation

---

## Research Notes

Auto-instrumentation covers libraries (PDO, Guzzle, Redis), not business logic. Combine auto + manual instrumentation for complete coverage. Review auto-instrumentation attributes for sensitive data leakage. Configure resource attributes: `service.name`, `service.version`, `deployment.environment`. Test after PHP upgrades — auto-instrumentation can be PHP-version-sensitive. Each auto-instrumentation adds 50-200KB memory and 1-10μs per span.
