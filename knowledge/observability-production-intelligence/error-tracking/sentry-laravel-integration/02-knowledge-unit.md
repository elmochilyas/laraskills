# Sentry Laravel Integration

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 02-error-tracking
- **Knowledge Unit:** sentry-laravel-integration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Sentry is the dominant error tracking platform for Laravel, providing automatic exception capture, performance tracing, profiling, release tracking, and session replay through the `sentry/sentry-laravel` package. Properly configured, Sentry eliminates the common debugging workflow of checking logs, finding stack traces, and matching them to releases — connecting all these dots automatically.

---

## Core Concepts

- **DSN (Data Source Name):** Authentication credential for sending events, format `https://public_key@o{org}.ingest.sentry.io/project/{id}`
- **Event:** A single occurrence — typically an exception, containing stack traces, breadcrumbs, request data, user context, tags, and extras
- **Transaction:** Named performance trace representing a unit of work (HTTP request, queue job, CLI command) containing spans
- **Span:** Timed operation within a transaction (database query, HTTP call, view render) with start/end times and operation names
- **Release:** Version identifier sent with every event enabling suspect commit identification and regression detection
- **Breadcrumb:** Timestamped event leading up to an error — HTTP request, navigation, database query, log entry

---

## Mental Models

- **Instrument Panel Model:** Sentry is the car's dashboard — it shows check engine lights (errors), fuel efficiency (performance), and odometer (release tracking) in one unified display
- **Scope Model:** Each request has a scope (user, tags, extras) that merges into every event. Think of scope as the context envelope that travels with each error report
- **Sampling Funnel Model:** Traces flow through a funnel — health endpoints are filtered out at the top, errors pass through at 100%, and healthy requests are sampled at the configured rate

---

## Internal Mechanics

Sentry integration follows a layered architecture: SDK initialization (service provider registers middleware, configures transport, sets up error handler) → error capture (global exception handler delegates to Sentry) → scope configuration (middleware attaches user context, request data, tags) → performance tracing (auto-instrumentation wraps request lifecycle as transaction) → queue tracing (each job is a separate transaction) → release tracking (`SENTRY_RELEASE` env var). The SDK integrates with Laravel's exception handling pipeline — if Sentry is unreachable, the application continues without crashing.

---

## Patterns

- **Dynamic Sampling with `traces_sampler`:** A callback function that makes per-request sampling decisions — always trace errors, sample healthy endpoints at lower rates, adjust based on traffic. Benefit: optimal cost/completeness balance. Tradeoff: requires custom logic in the sampler callback.
- **PII Redaction via `before_send`:** A callback that receives the event before transmission, stripping email, IP, and custom fields. Benefit: safety net for accidental PII capture. Tradeoff: may strip useful debugging data if too aggressive.
- **Selective Auto-Instrumentation:** Choose which components to instrument (queries, queue, cache, HTTP client) based on debugging needs. Benefit: reduces overhead. Tradeoff: uninstrumented components become blind spots.

---

## Architectural Decisions

**Use `traces_sampler` over `traces_sample_rate` for production.** A fixed rate samples all transactions uniformly. A callback allows prioritizing important transactions and excluding health checks.

**Configure `before_send` for PII redaction.** This is a non-negotiable security step. Without explicit redaction, Sentry captures whatever the application sends — including SQL bindings with PII and request payloads.

**Set environment explicitly.** Configure `environment` in `config/sentry.php` to match `APP_ENV`. Without it, staging and production errors mix in the same dashboard.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Automatic exception capture with rich context | SDK adds 5-10ms on cold boot | Acceptable overhead for production |
| Performance tracing identifies bottlenecks | Each auto-instrumented component adds 1-5ms per span | Enable selectively based on debugging needs |
| Release tracking correlates errors to deployments | Requires CI/CD pipeline integration | Must configure `SENTRY_RELEASE` |
| Profiling shows CPU/memory hotspots | ~5% CPU overhead on sampled transactions | Enable on-demand, not continuously |

---

## Performance Considerations

SDK initialization takes ~5-10ms on cold boot — use OpCache. Each auto-instrumented component adds 1-5ms per span; total impact 10-50ms per request. Breadcrumb collection is <1ms per breadcrumb with ~50KB for 200-item buffer. Queue tracing overhead scales with job count. Profiling adds ~5% CPU overhead — disable when not actively investigating.

---

## Production Considerations

DSN allows sending events but does not grant read access — still treat as confidential. Stack traces may include variable values and SQL bindings — implement `before_send`. Set `send_default_pii` to `false` to disable automatic IP capture. Session replay captures full user sessions — evaluate privacy implications before enabling.

---

## Common Mistakes

**Using `traces_sample_rate` instead of `traces_sampler`** — a fixed rate samples all transactions uniformly. Critical API endpoints and error traces may be missed.

**Not configuring `before_send`** — without explicit redaction, Sentry captures SQL bindings with PII, request payloads, and user data.

**Enabling session replay without privacy review** — captures full user sessions including keystrokes and mouse movements, with significant GDPR/CCPA implications.

**Missing environment configuration** — staging and production errors mix in the same dashboard without explicit `environment`.

---

## Failure Modes

**Sentry backend unreachable:** Application continues serving requests but errors are lost. Detection: zero errors reported for a period. Mitigation: configure fallback logging; monitor error report delivery.

**DSN exposure:** DSN committed to public repository. Detection: unknown errors appear from unauthorized senders. Mitigation: rotate DSN immediately; store in environment variables only.

**Span budget exhaustion:** High-traffic application hits Sentry's span quota. Detection: performance data stops appearing. Mitigation: configure aggressive sampling; exclude health endpoints.

---

## Ecosystem Usage

The `sentry/sentry-laravel` package provides auto-instrumentation for Eloquent queries, views, queues, cache, notifications, and HTTP client calls. It integrates with Laravel's exception handler via `report()` helper. The package supports Octane, Horizon, and Livewire.

---

## Related Knowledge Units

### Prerequisites
- Error Tracking Workflow (capture → group → triage → resolve → release lifecycle)

### Related Topics
- Flare & BugSnag Alternatives (comparison with other platforms)
- Log Context & Correlation (Sentry scope optimization)

### Advanced Follow-up Topics
- Span Sampling Strategies (Sentry traces_sampler configuration)
- Incident Management Workflows (Sentry alerts feeding incident response)

---

## Research Notes

Always use `traces_sampler` callback over `traces_sample_rate` for production. Configure `before_send` for PII redaction as a non-negotiable security step. Set `send_default_pii` to `false` in all environments. Health check endpoints must be excluded from transaction sampling. Queue job tracing is automatic — verify spans appear in dashboard. Profiling should be enable-on-demand, not always-on.
