# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 02-error-tracking
**Knowledge Unit:** sentry-laravel-integration
**Difficulty:** Intermediate
**Category:** Error Tracking Platform Integration
**Last Updated:** 2026-06-03

# Overview

Sentry is the dominant error tracking platform for Laravel, providing automatic exception capture, performance tracing, profiling, release tracking, and session replay. The `sentry/sentry-laravel` package provides deep Laravel integration — auto-instrumentation of queries, views, queues, cache, notifications, and HTTP client calls.

Sentry's value for Laravel teams extends beyond error capture. Its performance tracing identifies slow database queries, N+1 patterns, and queue job bottlenecks. Release tracking ties errors to deployments. Profiling shows CPU/memory hotspots down to the function level. Breadcrumbs provide the request lifecycle narrative leading to each error.

Engineers should care because Sentry, properly configured, eliminates the most common Laravel debugging workflow: "check the logs, find a stack trace, try to match it to a release, wonder what the user was doing." Sentry connects all these dots automatically.

# Core Concepts

**DSN (Data Source Name):** The authentication credential for sending events to Sentry. Format: `https://public_key@o{org}.ingest.sentry.io/project/{id}`. The DSN contains the project ID and an authentication key. It identifies the project but does not grant admin access — it is safe to embed in client-side code if needed (though not recommended).

**Event:** A single occurrence sent to Sentry — typically an exception but can be a custom message. Events contain stack traces, breadcrumbs, request data, user context, tags, and extras.

**Transaction:** A named performance trace representing a unit of work — an HTTP request, a queue job, a CLI command. Transactions contain spans.

**Span:** A timed operation within a transaction — a database query, HTTP call, view render, cache operation. Spans have start/end times, operation names, and optional descriptions and tags.

**Release:** A version identifier sent with every event and transaction. Releases enable suspect commit identification, regression detection, and release health dashboards.

**Breadcrumb:** A timestamped event leading up to an error or transaction — HTTP request, navigation, database query, log entry, UI interaction. Breadcrumbs are stored with the event.

**Scope:** The contextual data attached to events — user, tags, extras, breadcrumbs. Scope is maintained per-request and merged into each event.

# When To Use

- **Every production Laravel application** — Sentry is the industry standard for error tracking
- **Performance-sensitive applications** needing transaction-level tracing
- **Teams practicing continuous deployment** needing release-to-error correlation
- **Applications requiring profiling** for CPU/memory optimization

# When NOT To Use

- **Development-only projects** — Sentry adds unnecessary overhead and noise
- **Applications with extreme DSN security requirements** — though DSN exposure risk is low
- **Environments where self-hosting is required but infrastructure is unavailable**

# Best Practices

**Configure DSN via environment variable only.** Never hardcode the DSN. Use `SENTRY_LARAVEL_DSN` in `.env`. This is the single most important security practice for Sentry integration.

**Use `traces_sampler` for dynamic sampling, not `traces_sample_rate`.** A callback function allows per-request sampling decisions: always trace errors, sample healthy endpoints at lower rates, and adjust based on traffic.

**Implement `before_send` callback for PII redaction.** The callback receives the event before transmission. Strip email, IP, and custom fields containing PII. This is the safety net for accidental PII capture.

**Set environment explicitly.** Configure `environment` in `config/sentry.php` to match `APP_ENV`. This separates staging errors from production errors in the dashboard.

**Enable auto-instrumentation selectively.** Choose which components to instrument (queries, queue, cache, HTTP client) based on debugging needs. Each instrumented component adds spans and breadcrumbs.

# Architecture Guidelines

Sentry integration follows a layered architecture:

1. **SDK initialization:** Service provider registers middleware, configures transport, sets up error handler
2. **Error capture:** Global exception handler delegates to Sentry. `report()` helper calls Sentry automatically
3. **Scope configuration:** Middleware attaches user context, request data, tags per request
4. **Performance tracing:** Auto-instrumentation wraps request lifecycle as a transaction, adds spans for each operation
5. **Queue tracing:** Each queue job becomes a separate transaction with spans for job execution
6. **Release tracking:** `SENTRY_RELEASE` env var tags every event with deployment version

The SDK integrates with Laravel's exception handling pipeline. If Sentry is unreachable, the application continues without crashing — errors are lost but the application serves requests normally.

# Performance Considerations

- **SDK initialization:** ~5-10ms on cold boot. Use OpCache to cache compiled SDK files
- **Transaction overhead:** Each auto-instrumented component adds 1-5ms per span. Total impact: 10-50ms per request depending on span count
- **Breadcrumb collection:** < 1ms per breadcrumb. Memory proportional to breadcrumb buffer (default 200 items, ~50KB)
- **Queue tracing:** Each queued job creates a separate transaction. Overhead scales with job count, not request count
- **Profiling overhead:** ~5% CPU overhead on sampled transactions — disable if not actively investigating performance issues

# Security Considerations

- **DSN exposure risk:** DSN allows sending events to your project but does not grant read access. Still, treat DSN as confidential — store in environment variables
- **PII in events:** Stack traces may include variable values, SQL bindings, and request data. Implement `before_send` to redact
- **User context:** Attaching user ID to events aids debugging but creates PII. Attach email only when explicitly needed
- **IP address handling:** Set `send_default_pii` to `false` to disable automatic IP capture
- **Session replay:** Replays capture full user sessions — evaluate privacy implications before enabling

# Common Mistakes

**Using `traces_sample_rate` instead of `traces_sampler`.** A fixed rate (e.g., `0.1`) samples all transactions uniformly. Critical API endpoints and error traces may be missed. Use `traces_sampler` to prioritize important transactions.

**Not configuring `before_send`.** Without explicit redaction, Sentry captures whatever the application sends — potentially including SQL bindings with PII, request payloads, and user data.

**Enabling session replay without privacy review.** Session replay captures full user sessions including keystrokes and mouse movements. This has significant privacy implications under GDPR/CCPA.

**Missing environment configuration.** Without explicit `environment`, all environments' events mix in the same dashboard. Staging errors look identical to production errors.

**Auto-instrumenting everything without review.** Every auto-instrumented component adds span overhead. Enable only what you actively use for debugging.

# Anti-Patterns

**Profiling in production without measuring cost:** Enabling profiling on all sampled transactions adds 5% CPU overhead. Profile selectively during investigation periods, not continuously.

**No sampling for high-traffic endpoints:** If `/health` and `/status` endpoints generate traces at the same rate as API endpoints, 30%+ of span budget is wasted on health checks. Create a `traces_sampler` that returns 0 for health endpoints.

**Breadcrumb over-collection:** Enabling all breadcrumb types (including cache hits, log debug entries, and config access) fills the 200-item buffer with noise. Useful breadcrumbs are pushed out before the error occurs.

**Sentry as primary logger:** Using Sentry for informational logs ("user logged in", "cache refreshed"). Sentry is for errors and performance — not general-purpose logging. Use structured logging for informational events.

# Examples

**Dynamic sampling with traces_sampler:**
```php
'traces_sampler' => function (\Sentry\Tracing\SamplingContext $context): float {
    if ($context->getTransactionContext()->getName() === 'GET /health') {
        return 0.0;
    }
    if ($context->getParentSampled() === true) {
        return 1.0;
    }
    return 0.1;
},
```

**PII redaction via before_send:**
```php
'before_send' => function (\Sentry\Event $event): ?\Sentry\Event {
    $event->setTags(array_diff_key($event->getTags(), ['email' => '', 'ip' => '']));
    return $event;
},
```

# Related Topics

**Prerequisites:**
- Error Tracking Workflow (capture → group → triage → resolve → release lifecycle)

**Closely Related Topics:**
- Flare & BugSnag Alternatives (comparison with other platforms)
- Log Context & Correlation (Sentry scope optimization)

**Advanced Follow-Up Topics:**
- Span Sampling Strategies (Sentry traces_sampler configuration)
- Incident Management Workflows (Sentry alerts feeding incident response)

**Cross-Domain Connections:**
- DevOps & Infrastructure — CI/CD release tracking integration

# AI Agent Notes

- Always use `traces_sampler` callback over `traces_sample_rate` for production
- Configure `before_send` for PII redaction as a non-negotiable security step
- Set `send_default_pii` to `false` in all environments
- Health check endpoints must be excluded from transaction sampling
- Queue job tracing is automatic — verify spans appear in dashboard
- Profiling should be enable-on-demand, not always-on
- DSN is not a secret but should still be environment-managed
