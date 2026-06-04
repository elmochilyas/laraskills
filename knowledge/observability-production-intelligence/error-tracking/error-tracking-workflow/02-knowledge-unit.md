# Error Tracking Workflow

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 02-error-tracking
- **Knowledge Unit:** error-tracking-workflow
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Error tracking is a lifecycle process — capture, group, triage, resolve, release — that reduces Mean Time To Resolution (MTTR) by providing rich context, grouping identical errors, linking to releases, and enabling regression detection. An organized error tracking workflow can reduce incident response from hours to minutes.

---

## Core Concepts

- **Error Fingerprinting:** Mechanism grouping identical errors via stack traces, error types, and custom rules — too broad merges unrelated errors, too narrow creates thousands of separate issues
- **Crash-Free Rate:** Percentage of user sessions completing without unhandled exceptions, measured per release and overall
- **Suspect Commit:** Git-based identification of which code change likely introduced an error, leveraging VCS integration
- **Release Health:** Dashboard showing error rates, crash-free rates, and adoption for each deployment via version identifiers
- **Source Maps:** Uploaded JavaScript source maps enabling de-minified stack traces for frontend errors (Inertia, Livewire, Vue/React)
- **Breadcrumbs:** Timestamped events (HTTP requests, DB queries, user interactions) leading up to an error

---

## Mental Models

- **Assembly Line Model:** Errors flow through a factory: capture (raw materials) → group (sort by type) → triage (assign priority) → resolve (fix) → release (ship)
- **Feedback Loop Model:** Each error is a signal in a closed loop: error appears → developer is notified → fix is deployed → monitoring confirms resolution → next error
- **Triage Model:** Like emergency room: SEV1 is code blue (immediate response), SEV4 is routine checkup (next sprint)

---

## Internal Mechanics

The workflow spans five architectural layers: capture layer (SDK middleware, global exception handler, manual reporting) → grouping layer (fingerprint rules, custom resolvers) → triage layer (issue assignment, severity, ticketing) → resolution layer (release-commit linking, fix deployment, regression verification) → retrospective layer (postmortem, action items). Each layer is independently configurable — the SDK handles capture and grouping; the platform handles triage through retrospective.

---

## Patterns

- **Breadcrumb Auto-Instrumentation:** Enable automatic breadcrumb collection for Eloquent queries, HTTP client calls, and user navigation. Benefit: richest debugging context. Tradeoff: signal-to-noise ratio depends on careful configuration.
- **Release-Linked Error Tracking:** Configure error tracking SDK to send release versions and integrate VCS for suspect commit identification. Benefit: closes the loop from error to code change to developer. Tradeoff: requires CI/CD integration.
- **Severity Mapping:** Map HTTP status codes, exception types, and log levels to error severity. Benefit: consistent prioritization. Tradeoff: requires upfront agreement and periodic review.

---

## Architectural Decisions

**Configure error fingerprinting early.** Default fingerprints group by error type and stack trace. Add custom rules for known multi-cause error types. Test with production data before relying on it.

**Automate source map uploads.** For Laravel applications with frontend assets, add source map upload to CI/CD pipeline. Without source maps, frontend errors show minified stack traces that are impossible to debug.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Rich error context reduces debugging time | SDK initialization adds ~5-10ms on cold boot | Acceptable overhead for production |
| Release correlation identifies regressions | Requires CI/CD pipeline changes | Must configure release tracking early |
| Breadcrumbs provide request lifecycle narrative | 200-item buffer fills with noise if over-collected | Enable breadcrumbs selectively |

---

## Performance Considerations

SDK initialization and event creation typically <10ms. Batch reporting for error bursts reduces per-event cost. Configure maximum breadcrumbs (Sentry default: 200) — each holds request data and timing. Performance tracing uses separate sampling rates from error capture. Source maps (500KB-2MB) upload once per deployment.

---

## Production Considerations

Stack traces may include variable values with PII — configure data scrubbing (`before_send` callback). DSN is a semi-sensitive credential — store in environment variables. Attaching user context aids debugging but creates PII liability — strip email/IP by default. Error tracking dashboards contain production stack traces — restrict access to engineering.

---

## Common Mistakes

**Not fingerprinting custom errors** — dynamic exception messages cause every occurrence to appear as a separate issue. Implement fingerprint rules by exception class, not message.

**Missing release tracking** — without release information, teams cannot answer "was this error introduced by the last deployment?" Time is wasted on already-fixed errors.

**Over-collecting breadcrumbs** — enabling breadcrumbs for every database query and cache hit fills the buffer with noise before meaningful events occur.

**No source maps for frontend errors** — minified stack traces show `e.min.js:1:2345`, making debugging impossible.

---

## Failure Modes

**Error tracking platform unreachable:** SDK cannot reach the platform — errors are lost locally. Detection: zero errors reported for a period. Mitigation: buffer events locally or fall back to file-based error logging.

**Fingerprint explosion:** Dynamic error messages create thousands of unique fingerprints. Detection: issue list shows hundreds of near-identical errors. Mitigation: implement custom fingerprint rules grouping by exception class, not message.

**Breadcrumb buffer saturation:** Too many breadcrumbs push out relevant ones before error occurs. Detection: error context shows only generic breadcrumbs. Mitigation: configure breadcrumb types and limits carefully.

---

## Ecosystem Usage

Sentry is the dominant platform for this workflow in the Laravel ecosystem. The `sentry/sentry-laravel` package provides deep integration. Flare (Spatie) offers Laravel-native alternatives with solution-based debugging. Error tracking workflows integrate with CI/CD pipelines and ticketing systems.

---

## Related Knowledge Units

### Prerequisites
- Sentry Laravel Integration (primary tool implementing this workflow)

### Related Topics
- Flare & BugSnag Alternatives (alternative workflows)
- Log Context & Correlation (rich error context)

### Advanced Follow-up Topics
- Incident Management Workflows (incident escalation from error tracking)
- Notification Routing & Escalation (alert routing from error spikes)

---

## Research Notes

Error fingerprinting must be configured early and tested with production data. Always link releases to VCS commits for suspect commit identification. Breadcrumb auto-instrumentation should cover queries, HTTP calls, and user navigation. Source map upload must be automated in CI/CD for frontend error debugging. DSN must be stored in environment variables, never committed.
