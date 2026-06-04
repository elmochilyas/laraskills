# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Error Tracking Integration
**Generated:** 2026-06-03

---

# Decision Inventory

* External Error Tracker Selection (Sentry vs Flare vs Bugsnag vs Custom)
* Log Driver Selection (single vs daily vs slack vs syslog vs stack)
* Breadcrumb and Context Enrichment Strategy

---

# Architecture-Level Decision Trees

---

## Decision 1: External Error Tracker Selection (Sentry vs Flare vs Bugsnag vs Custom)

---

## Decision Context

Which external error tracking service to integrate for production error monitoring, alerting, and debugging.

---

## Decision Criteria

* Whether the team needs real-time alerting (PagerDuty, Slack, email) vs batch review
* Whether the application needs performance monitoring alongside error tracking (APM integration)
* Whether the team needs deployment tracking and release health dashboards
* Whether the budget allows for paid error tracking services
* Whether data sovereignty requires self-hosted or on-premise solutions

---

## Decision Tree

Does the team require APM (application performance monitoring) alongside error tracking?
↓
YES → Is budget available for a premium solution?
    YES → Use Sentry — best APM + error tracking integration, release health, and deployment tracking
    NO → Use Flare — free tier for small teams with good Laravel-specific features
NO → Is self-hosting required for data sovereignty or compliance?
    YES → Use Sentry self-hosted or a custom solution with log aggregation (ELK, Graylog)
    NO → Does the team need real-time alerting (Slack, PagerDuty, email) for production errors?
        YES → Use Sentry or Bugsnag — both have strong alerting and notification features
        NO → Use Flare — Laravel-native, simple setup, good enough for small teams

---

## Rationale

Sentry is the most comprehensive solution with error tracking, APM, release health, and deployment tracking. Flare is Laravel-native and simpler for smaller teams. Bugsnag has strong stability and alerting features. Self-hosted solutions are necessary for compliance but require significant operational overhead.

---

## Recommended Default

**Default:** Use Sentry for production applications with a budget. Use Flare for small teams and side projects that need Laravel-native simplicity.
**Reason:** Sentry provides the broadest feature set for production monitoring. Flare is the easiest to set up for Laravel applications.

---

## Risks Of Wrong Choice

* No error tracker: Production errors are invisible until users report them
* Self-hosted without ops capacity: Tracker goes down, errors are missed, maintenance burden
* Wrong tracker for team size: Enterprise solution for a side project — unnecessary cost and complexity
* No data sovereignty check: Data stored in jurisdiction that violates compliance requirements

---

## Related Rules

* Error Tracker Integration
* Centralized Exception Reporting

---

## Related Skills

* Error Tracker Integration (Sentry, Flare, Bugsnag)
* Configure Production Logging and Error Tracking

---

---

## Decision 2: Log Driver Selection (single vs daily vs slack vs syslog vs stack)

---

## Decision Context

Which Monolog log driver to use for production logging, balancing disk usage, log accessibility, and operational overhead.

---

## Decision Criteria

* Whether the application is in production (needs rotation) or development (simplicity preferred)
* Whether the team relies on log aggregation tools (ELK, Datadog, Papertrail) or direct file access
* Whether the team needs real-time notification for specific log levels (CRITICAL → Slack)
* Whether compliance requires immutable log storage (security events → syslog)

---

## Decision Tree

Is the application in production?
↓
YES → Does the team use log aggregation (ELK, Datadog, Papertrail, Logtail)?
    YES → Use `daily` driver for file fallback, configure aggregation agent to read files — best of both worlds
    NO → Use `daily` driver — automatic rotation, configurable retention period, manageable file sizes
NO → Is this a local development environment?
    YES → Use `single` driver — simplicity, single file, no rotation needed
    NO → Use `daily` driver — staging/pre-production needs rotation like production

---

## Rationale

`single` driver is fine for development where log files stay small. `daily` is required for production to prevent disk exhaustion from unbounded log growth. The `stack` driver enables sending to multiple channels simultaneously (file + Slack + syslog).

---

## Recommended Default

**Default:** Use `daily` driver for production with 30-day retention. Use `single` for local development. Use `stack` when multiple outputs are needed.
**Reason:** `daily` prevents disk exhaustion while maintaining readable per-day files. `stack` enables flexible multi-channel routing.

---

## Risks Of Wrong Choice

* `single` in production: Log file grows to gigabytes over time, fills disk, crashes application
* `daily` with 0 days: No files are retained — logs lost after current day
* No `stack` for Slack alerts: Critical errors only show in files — no real-time notification
* All channels at debug level: Slack channel overwhelmed with DEBUG messages

---

## Related Rules

* Log Channel Configuration
* Production Log Level Configuration

---

## Related Skills

* Log Channel Configuration
* Configure Production Logging and Error Tracking

---

---

## Decision 3: Breadcrumb and Context Enrichment Strategy

---

## Decision Context

What contextual data to attach to exception reports to make them debuggable without exposing sensitive information.

---

## Decision Criteria

* Whether the error tracker supports breadcrumbs (Sentry, Flare) for request lifecycle events
* Whether the application needs SQL query context for debugging database errors
* Whether the application processes queue jobs that need job-specific context
* Whether the application handles sensitive data that must not appear in breadcrumbs

---

## Decision Tree

Does the error tracker support breadcrumb enrichment?
↓
YES → Are SQL queries helpful for debugging database-related errors?
    YES → Enable SQL query breadcrumbs — include query and bindings (Sentry: `sql_queries: true, sql_bindings: true`)
    NO → Enable only request lifecycle breadcrumbs (route, middleware, controller)
NO → Does the application process queue jobs?
    YES → Add job-specific context — job ID, class, attempt count, queue name
    NO → Is the context enrichment within the exception handler sufficient?
        YES → Override `context()` method on handler — user_id, url, method, ip, request_id
        NO → Implement custom breadcrumb listener — attach domain-specific breadcrumbs manually

---

## Rationale

Breadcrumbs provide the request "movie" leading up to an error, while context provides the "snapshot." SQL breadcrumbs are invaluable for debugging database-related errors but can expose sensitive data in bindings. Queue context is essential for debugging job failures.

---

## Recommended Default

**Default:** Enable SQL query breadcrumbs with bindings in non-production environments only. Always override `context()` on the handler with user_id, url, method, ip, request_id.
**Reason:** SQL breadcrumbs provide the most value for debugging. Handler context provides consistent baseline enrichment. SQL bindings can contain PII — restrict in production.

---

## Risks Of Wrong Choice

* No breadcrumbs: Error report has no context — can't trace what led to the failure
* SQL bindings in breadcrumbs with PII: Customer data leaked to error tracker — compliance violation
* Excessive breadcrumbs: Error reports are huge, slow to load, expensive to store
* No queue context: Job failures are untraceable — no way to find the affected job or payload

---

## Related Rules

* Exception Log Context
* Error Tracker Breadcrumb Configuration

---

## Related Skills

* Breadcrumb and Context Enrichment
* Configure Production Logging and Error Tracking
