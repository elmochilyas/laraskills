# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 07-dashboards-visualization
**Knowledge Unit:** laravel-nightwatch
**Difficulty:** Intermediate
**Category:** Dashboard & Monitoring
**Last Updated:** 2026-06-03

# Overview

Laravel Nightwatch is a first-party, self-hosted observability dashboard for Laravel applications, introduced in the Laravel ecosystem. It provides real-time monitoring of application health, performance, errors, and deployments with a UI designed specifically for Laravel developers.

Nightwatch focuses on Laravel-native concepts: queues, horizon, octane, livewire, and artisan commands. It understands Laravel's abstractions (jobs, listeners, mailables, notifications) and surfaces them in a developer-friendly interface.

Engineers should care because Nightwatch provides Laravel-specific observability without the complexity of general-purpose tools like Grafana. A Laravel team can get production observability running in an afternoon, while a Grafana/Prometheus stack takes weeks to configure properly.

# Core Concepts

**Dashboard:** The main Nightwatch UI showing application overview: request rate, error rate, queue depth, and recent deployments. Top-level health at a glance.

**Transactions:** Nightwatch's name for HTTP requests, queued jobs, scheduled tasks, and artisan commands. Each transaction has duration, status, and metadata.

**Watchers:** Data collectors that capture specific aspects of the application. Built-in watchers cover HTTP requests, queue jobs, cache operations, database queries, mail, notifications, and custom events.

**Deployments:** Nightwatch tracks deployments via version markers. Performance changes are automatically correlated with deployment events.

**Alerting:** Nightwatch includes built-in alert rules for high error rate, slow response time, failed jobs, and queue backpressure. Alerts can notify via Slack, email, or webhook.

**Retention:** Configurable data retention period. Nightwatch stores transaction details, query logs, and event data for a configurable duration (default 7 days).

# When To Use

- **Laravel-first teams** who want observability without managing Prometheus/Loki/Grafana
- **Small to medium applications** where a general-purpose observability stack is overkill
- **Teams that prioritize developer experience** — Nightwatch speaks Laravel, not PromQL

# When NOT To Use

- **Large, multi-service platforms** already invested in OpenTelemetry and Grafana
- **Teams needing custom PromQL queries** for complex aggregations
- **Applications needing metric-based autoscaling** (Kubernetes HPA based on custom metrics)

# Best Practices

**Use watchers selectively.** Enable only the watchers that provide actionable data. Database query watcher is useful; mail watcher may not be. Each watcher adds overhead.

**Configure retention aligned with debugging needs.** 7 days default is reasonable. For compliance-heavy environments, extend to 30 days. For high-traffic apps, reduce to 3 days to save storage.

**Integrate with deployment pipeline.** Send deployment events via Nightwatch API or CLI. This enables deployment-correlation in the dashboard.

**Set up alerts for critical issues.** Configure Nightwatch alerts for error rate >5%, p95 latency >1000ms, and queue failures. These cover the most common production issues.

**Review watcher overhead in staging.** Each watcher adds instrumentation overhead. Test in staging with expected production traffic to ensure overhead is acceptable (<5% request time increase).

# Architecture Guidelines

Nightwatch runs as a standalone service alongside the Laravel application. It consists of:
1. **Nightwatch SDK:** PHP package installed in the Laravel app, collects data and sends to the Nightwatch server
2. **Nightwatch Server:** Receives, processes, and stores observability data
3. **Nightwatch Dashboard:** Web UI for visualizing data

Data flow: Laravel app → Nightwatch SDK → Nightwatch Server (ingest API) → Storage → Dashboard queries.

The SDK sends data in batches asynchronously to avoid blocking requests. Configure batch size and flush interval based on traffic.

# Performance Considerations

- **SDK overhead:** ~1-5ms per request depending on enabled watchers. Negligible for most applications
- **Network bandwidth:** SDK sends data to Nightwatch server asynchronously. ~1-5KB per request worth of observability data
- **Server storage:** Nightwatch server stores transaction details and query logs. Estimate 10-100MB per day per 100K requests
- **Database indexing:** Nightwatch uses its own database. Ensure adequate indexing for query patterns in the dashboard

# Security Considerations

- **SDK payload contains request data.** URL, headers, and input data are sent to Nightwatch server. Configure input sanitization or exclusion for sensitive fields
- **Network encryption:** Communication between SDK and server should use HTTPS. Internal TLS is recommended
- **Access control:** Nightwatch dashboard should require authentication. Restrict access to developers and ops team
- **User data exposure:** Nightwatch captures user IDs and email addresses by default. Review privacy policy and configure redaction if needed

# Common Mistakes

**Enabling all watchers without review.** Every watcher adds overhead and storage. Enable only watchers that provide actionable insight.

**No PII redaction.** Nightwatch captures request input, headers, and user data by default. For applications handling sensitive data, configure input redaction in the SDK.

**Default retention without capacity planning.** Default 7-day retention can consume unexpected storage for high-traffic apps. Calculate expected storage before deploying.

**Ignoring watcher overhead.** Running 15 watchers on every request. Profile watcher overhead in staging before production rollout.

# Anti-Patterns

**Nightwatch as only observability tool.** Nightwatch is Laravel-focused and does not replace infrastructure monitoring (server CPU, memory, disk). Use Nightwatch for application-level observability alongside infrastructure monitoring.

**No alert configuration.** Deploying Nightwatch without configuring any alerts. The dashboard is only useful when someone is looking at it — alerts surface issues between monitoring sessions.

**Storing everything forever.** Keeping all transaction data indefinitely. Storage grows unbounded and Nightwatch server performance degrades. Configure retention and prune regularly.

# Examples

**SDK configuration:**
```php
'watchers' => [
    Watcher\HttpRequestWatcher::class,
    Watcher\QueryWatcher::class,
    Watcher\QueueJobWatcher::class,
],
'ingest' => [
    'url' => env('NIGHTWATCH_SERVER'),
    'api_key' => env('NIGHTWATCH_API_KEY'),
],
```

# Related Topics

**Prerequisites:**
- Laravel service providers and configuration

**Closely Related Topics:**
- Laravel Pulse (real-time dashboard, complementary to Nightwatch)
- Error Tracking (Nightwatch includes error tracking)

**Advanced Follow-Up Topics:**
- Custom watcher development
- Nightwatch API for custom integrations

**Cross-Domain Connections:**
- DevOps & Infrastructure — Nightwatch server deployment

# AI Agent Notes

- First-party Laravel observability tool, simpler than Grafana/OTel stack
- Watchers add per-request overhead — enable selectively
- Configure PII redaction for sensitive applications
- Nightwatch is application-level only — still need infrastructure monitoring
- Default 7-day retention, adjust based on traffic and compliance needs
- Alerts: error rate >5%, p95 >1000ms, queue failures
