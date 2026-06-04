# Decomposition: Sentry Laravel Integration

## Topic Overview
Sentry is the dominant error tracking platform for Laravel, providing automatic exception capture, performance tracing, profiling, release tracking, and session replay. The `sentry/sentry-laravel` package provides deep Laravel integration â€” auto-instrumentation of queries, views, queues, cache, notifications, and HTTP client calls. Configuration is primarily via `.env` and `config/sentry.php`, with DSN-based authentication and sampling controls.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
error-tracking/sentry-laravel-integration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Sentry Laravel Integration
- **Purpose:** Sentry is the dominant error tracking platform for Laravel, providing automatic exception capture, performance tracing, profiling, release tracking, and session replay. The `sentry/sentry-laravel` package provides deep Laravel integration â€” auto-instrumentation of queries, views, queues, cache, notifications, and HTTP client calls. Configuration is primarily via `.env` and `config/sentry.php`, with DSN-based authentication and sampling controls.
- **Difficulty:** Intermediate
- **Dependencies:
  - Error Tracking Workflow (capture â†’ group â†’ triage â†’ resolve â†’ release lifecycle)
  - Flare & BugSnag Alternatives (comparison with other error tracking platforms)
  - Log Context & Correlation (Sentry scope optimization)
  - Span Sampling Strategies (Sentry traces_sampler configuration)

## Dependency Graph
**Depends on:**
  - Error Tracking Workflow (capture â†’ group â†’ triage â†’ resolve â†’ release lifecycle)
  - Flare & BugSnag Alternatives (comparison with other error tracking platforms)
  - Log Context & Correlation (Sentry scope optimization)
  - Span Sampling Strategies (Sentry traces_sampler configuration)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - DSN (Data Source Name)
  - Event
  - Transaction
  - Span
  - Release
  - Breadcrumb
  - Scope

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization