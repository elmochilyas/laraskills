# Laravel Telescope

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 07-dashboards-visualization
- **Knowledge Unit:** laravel-telescope
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Telescope is a first-party debug assistant for Laravel development. It monitors and visualizes requests, exceptions, queries, queue jobs, mail, notifications, cache operations, and scheduled tasks during local development. Telescope provides unprecedented visibility into Laravel internals — instead of adding `dd()` or `Log::debug()` calls, developers open Telescope to inspect queries, jobs, mail, and requests for any recent interaction.

---

## Core Concepts

- **Watcher:** A Telescope component capturing specific data — requests, exceptions, database queries, queue jobs, mail, notifications, cache, scheduled tasks
- **Entry:** A single recorded data point — each request generates the request entry plus entries for queries, mail, etc.
- **Telescope Dashboard:** Web UI at `/telescope` displaying entries with filtering by type and search
- **Tag:** Auto-generated or custom label on entries enabling filtering and searching
- **Pruning:** Automatic removal of old entries — default 24-hour retention, configurable
- **Batch:** Entries grouped for efficient storage — typically corresponding to a single request or job

---

## Mental Models

- **DVR for Development Model:** Telescope is a DVR recording everything that happens during development — you can rewind and review any request, query, or job
- **X-Ray Vision Model:** Telescope gives you x-ray vision into Laravel internals — you see the queries behind every page, the jobs behind every dispatch, the mail behind every send
- **Do Not Use in Production Model:** Telescope in production is like leaving a recording studio running 24/7 — the tapes fill up immediately and the equipment overheats

---

## Internal Mechanics

Telescope stores all data in the application's database in three tables: `telescope_entries`, `telescope_entries_tags`, `telescope_monitoring`. Each recorded event creates a row in `telescope_entries` containing the serialized data as JSON. Tags are stored separately for efficient filtering. Entries within a batch are stored in sequence, with batch IDs enabling grouping by request or job. The Telescope UI is a Livewire-powered dashboard that queries these tables directly. Pruning runs automatically to delete entries older than the configured retention period.

---

## Patterns

- **Selective Watcher Enablement:** Enable only watchers relevant to the feature being built in development. Benefit: reduces overhead and database growth. Tradeoff: may miss unexpected behavior in disabled watchers.
- **Custom Tagging:** Add custom tags to entries for team organization — by feature, sprint, or developer. Benefit: easier filtering in shared development environments. Tradeoff: additional configuration.
- **Telescope::dump() Instead of dd():** Use `Telescope::dump()` to inspect variables without halting execution. Benefit: non-blocking debugging; continue to see full request result. Tradeoff: output appears in Telescope dashboard, not inline.

---

## Architectural Decisions

**Only use Telescope in non-production environments.** The performance and storage characteristics make it unsuitable for production. Each request generates 5-20 entries, each entry is ~1KB JSON, and each entry is a database INSERT.

**Disable unused watchers.** Each enabled watcher adds overhead and storage. In development, enable only relevant watchers. In staging, enable all for full visibility.

**Set appropriate pruning.** Default 24-hour retention is reasonable for local development. Extend to 7 days for staging if needed. Ensure pruning cron runs.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Complete visibility into request lifecycle | 5-20 database INSERTs per request | Unsuitable for production — performance impact significant |
| Non-blocking debugging via `dump()` | Telescope dashboard reveals everything — queries, payloads, env vars | Never expose to non-developer audiences |
| Custom tags enable team filterering | Telescope tables grow quickly | Default 24-hour pruning prevents unbounded growth |

---

## Performance Considerations

Each request generates 5-20 entries depending on enabled watchers. Each entry is ~1KB of JSON. A development session with 100 requests generates ~1MB of Telescope data. Each entry is a database INSERT — 100 queries per request = 100 INSERTs. With 100K+ entries, dashboard page loads become slow. Telescope collects data in memory during request lifecycle — for requests with 1000+ queries, memory usage can spike.

---

## Production Considerations

Telescope reveals everything — email contents, query parameters, request payloads, exception stack traces, environment variables. This is by design for debugging but must never be exposed in production. By default, Telescope is available only in local environment. For staging, configure gate authentication.

---

## Common Mistakes

**Using Telescope in production** — the most dangerous mistake. Writes every query to the database, significantly increasing write load and database size. Stores sensitive data visible in the dashboard.

**Enabling all watchers without consideration** — in large applications, enabling all watchers generates hundreds of entries per request. Database grows quickly, dashboard becomes slow.

**No pruning configuration** — default 24-hour pruning removes data regularly. But if pruning fails (permissions, cron), the table grows unbounded.

**Forgetting to disable Telescope before deployment** — deployed to production with Telescope active causes immediate performance degradation.

---

## Failure Modes

**Telescope database growth:** Pruning fails or is not configured — `telescope_entries` table grows unbounded. Detection: database storage alarms; slow queries. Mitigation: configure pruning; monitor table size.

**Development performance degradation:** Too many watchers on a large application cause slow request processing. Detection: development server feels sluggish. Mitigation: disable unused watchers; only enable relevant ones.

**Accidental production deployment:** Telescope enabled in production due to configuration oversight. Detection: database load spikes; sensitive data exposed. Mitigation: exclude Telescope from production via environment detection in service provider.

---

## Ecosystem Usage

Telescope is a first-party Laravel package designed for development and staging environments. It complements Laravel Pulse (production real-time dashboard) and Laravel Debugbar (alternative debug toolbar). Telescope watchers can be extended for custom application-specific debugging.

---

## Related Knowledge Units

### Prerequisites
- Laravel service providers and configuration

### Related Topics
- Laravel Pulse (production real-time dashboard)
- Laravel Debugbar (alternative debug toolbar)

### Advanced Follow-up Topics
- Custom watcher development
- Telescope API and filtering

---

## Research Notes

Development only — never enable in production. Each request generates 5-20 entries, ~1KB each. Default 24-hour pruning — ensure pruning cron runs. Disable unused watchers to reduce overhead and storage. Telescope reveals everything: queries, payloads, emails, env vars. Use `Telescope::dump()` instead of `dd()` for non-blocking debugging.
