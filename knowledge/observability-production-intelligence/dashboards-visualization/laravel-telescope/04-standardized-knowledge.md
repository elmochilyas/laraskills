# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 07-dashboards-visualization
**Knowledge Unit:** laravel-telescope
**Difficulty:** Intermediate
**Category:** Debug & Development
**Last Updated:** 2026-06-03

# Overview

Laravel Telescope is a first-party debug assistant for the Laravel framework. It monitors and visualizes requests, exceptions, queries, queue jobs, mail, notifications, cache operations, scheduled tasks, and more during local development.

Telescope is designed for non-production environments (local, staging, development). It captures detailed information about every request and background task, storing it in a database for inspection. This makes it invaluable for debugging during development but unsuitable for production due to performance and storage concerns.

Engineers should care because Telescope provides unprecedented visibility into Laravel internals during development. Instead of adding `dd()` or `Log::debug()` calls, developers can open Telescope to inspect queries, jobs, mail, and requests for any recent interaction.

# Core Concepts

**Watcher:** A Telescope component that captures specific data. Built-in watchers cover requests, exceptions, database queries, queue jobs, mail, notifications, cache, scheduled tasks, and more.

**Entry:** A single recorded data point. Each request or background task generates multiple entries: the request entry itself, query entries for each database query, mail entries for sent emails, etc.

**Telescope Dashboard:** A web UI at `/telescope` that displays recorded entries. Developers can filter by type, search by content, and view detailed information for each entry.

**Tag:** An auto-generated or custom label on an entry. Telescope automatically tags entries by type, status code, action name, and more. Tags enable filtering and searching.

**Pruning:** Telescope automatically prunes old entries based on configured retention. By default, entries older than 24 hours are pruned. Retention is configurable.

**Batch:** Entries are grouped into batches for efficient storage. A batch typically corresponds to a single request or queued job. Batching minimizes database writes.

# When To Use

- **Local development** — the primary use case
- **Staging environments** for debugging pre-production issues
- **Development team debugging** — sharing Telescope links for collaboration

# When NOT To Use

- **Production environments** — Telescope stores every query, request, and event in the database. Performance impact is significant
- **High-traffic staging environments** — Telescope database grows quickly and slows down the application
- **API-first applications** — Telescope dashboard is a web UI, not an API

# Best Practices

**Only use Telescope in non-production environments.** The performance and storage characteristics make it unsuitable for production. Use Nightwatch, Pulse, or Grafana for production observability.

**Disable unused watchers.** Each enabled watcher adds overhead and storage. In development, enable only watchers relevant to the feature being built. In staging, enable all watchers for full visibility.

**Set appropriate pruning.** Default 24-hour retention is reasonable for local development. For staging, extend to 7 days if needed. Ensure the telescope_entries table does not grow unbounded.

**Use Telescope tags for organization.** Add custom tags to entries to group them by feature, sprint, or developer. This makes filtering easier in the dashboard.

**Leverage Telescope's dump watcher.** Instead of `dd()` which halts execution, use `Telescope::dump()` to inspect variables without stopping the request. The dump appears in the Telescope dashboard.

# Architecture Guidelines

Telescope stores all data in the application's database:
1. **Database tables:** `telescope_entries`, `telescope_entries_tags`, `telescope_monitoring`
2. **Entry storage:** Each recorded event creates a row in `telescope_entries`. Tags are stored separately for efficient filtering
3. **Batch storage:** Entries within a batch are stored in sequence. Batch IDs enable grouping by request or job.

The Telescope UI is a Livewire-powered dashboard. It queries the Telescope tables directly. With large datasets, dashboard queries can be slow.

# Performance Considerations

- **Storage per request:** Each request generates 5-20 entries depending on enabled watchers. Each entry is ~1KB of JSON. A development session with 100 requests generates ~1MB of Telescope data
- **Write overhead:** Each entry is a database INSERT. 100 queries per request = 100 INSERTs per request. Significant overhead for production traffic
- **Dashboard query performance:** Telescope dashboard queries the entries table. With 100K+ entries, dashboard page loads become slow
- **Memory usage:** Telescope collects data in memory during request lifecycle. For requests with 1000+ queries, memory usage can spike

# Security Considerations

- **Telescope reveals everything.** Email contents, query parameters, request payloads, exception stack traces, environment variables. This is by design for debugging, but must never be exposed in production
- **Dashboard authentication:** By default, Telescope is available only in local environment. For staging, configure gate authentication
- **Data exposure risk:** Do not expose Telescope data to non-developer audiences. The dashboard shows internal application details

# Common Mistakes

**Using Telescope in production.** The most common and most dangerous mistake. Telescope writes every query to the database, significantly increasing write load and database size. It also stores sensitive data visible in the dashboard.

**Enabling all watchers without consideration.** In a large application, enabling all watchers generates hundreds of entries per request. The database grows quickly and dashboard becomes slow.

**No pruning configuration.** Telescope's default 24-hour pruning removes data regularly. But if pruning fails (database permissions, cron not running), the telescope_entries table grows unbounded.

**Forgetting to disable Telescope before deployment.** Telescope registered in provider list and not excluded via environment configuration. Deploying to production with Telescope active causes immediate performance degradation.

# Anti-Patterns

**Production Telescope debugging.** Enabling Telescope temporarily in production to debug an issue. By the time Telescope is enabled and entries are collected, the production database is already under write strain. Use structured logging and distributed tracing instead.

**Telescope as API documentation.** Using Telescope's query log as the sole source of API request/response documentation. Telescope captures data but does not document contracts.

**Storing Telescope data indefinitely.** Keeping Telescope entries for months "just in case." Telescope is a debugging tool for recent activity. Old entries do not provide value and degrade dashboard performance.

# Examples

**Env configuration:**
```env
TELESCOPE_ENABLED=true
# In production, ensure this is NOT set or is false
```

# Related Topics

**Prerequisites:**
- Laravel service providers and configuration

**Closely Related Topics:**
- Laravel Pulse (production real-time dashboard)
- Laravel Debugbar (alternative debug toolbar)

**Advanced Follow-Up Topics:**
- Custom watcher development
- Telescope API and filtering

**Cross-Domain Connections:**
- Testing & Debugging — Telescope as primary debugging tool

# AI Agent Notes

- Development only — never enable in production
- Each request generates 5-20 entries, ~1KB each
- Default 24-hour pruning — ensure pruning cron runs
- Disable unused watchers to reduce overhead and storage
- Telescope reveals everything: queries, payloads, emails, env vars
- Use `Telescope::dump()` instead of `dd()` for non-blocking debugging
- Use custom tags for team debugging organization
