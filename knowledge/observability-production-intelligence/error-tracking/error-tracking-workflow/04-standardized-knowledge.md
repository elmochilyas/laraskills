# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 02-error-tracking
**Knowledge Unit:** error-tracking-workflow
**Difficulty:** Intermediate
**Category:** Error Management Lifecycle
**Last Updated:** 2026-06-03

# Overview

Error tracking is a lifecycle process: capture → group → triage → resolve → release. Each stage requires specific tooling and team practices. Effective error tracking reduces mean time to resolution (MTTR) by providing rich context (stack trace, user, request data, breadcrumbs), grouping identical errors, linking to releases, and enabling regression detection.

The workflow integrates with ticketing systems, CI/CD pipelines, and communication tools. For Laravel teams, this typically centers on Sentry but the lifecycle is tool-agnostic — the same stages apply to Flare, Bugsnag, Rollbar, or any error tracking platform.

Engineers should care because unstructured error handling (checking log files manually, no error grouping, no release correlation) is the primary cause of slow incident response. An organized error tracking workflow can reduce MTTR from hours to minutes.

# Core Concepts

**Error Fingerprinting:** The mechanism by which an error tracking platform groups identical errors. Fingerprints are computed from stack traces, error types, and custom rules. Correct fingerprinting is essential — too broad and unrelated errors merge; too narrow and the same error appears as thousands of separate issues.

**Crash-Free Rate:** The percentage of user sessions that complete without an unhandled exception. Measured per release, per platform, and overall. A crash-free rate of 99.9% means 1 in 1000 sessions encounters an error.

**Suspect Commit:** Git-based identification of which code change likely introduced an error. Error tracking platforms integrate with VCS providers (GitHub, GitLab, Bitbucket) to correlate error appearance with commits and pull requests.

**Release Health:** A dashboard view showing error rates, crash-free rates, and adoption for each deployment. Releases are tracked via version identifiers (git SHA, semantic version, CI build number) sent with each error report.

**Source Maps:** Uploaded JavaScript source maps enable Sentry to de-minify stack traces from frontend errors. Essential for Laravel applications with Inertia, Livewire, or Vue/React frontends.

**Breadcrumbs:** Timestamped events leading up to an error — HTTP requests, database queries, user interactions, navigation events. Breadcrumbs provide the narrative context needed to understand what caused the error.

# When To Use

- **All production Laravel applications** with user-facing functionality
- **CI/CD pipelines** for automated regression detection
- **Team environments** where multiple developers need visibility into production errors
- **SLA-bound services** where MTTR tracking and improvement is required

# When NOT To Use

- **Internal tooling** with no user impact and low criticality
- **Development-only projects** — the overhead of workflow configuration exceeds benefit
- **Perfectly deterministic systems** with zero unknown failure modes (extremely rare)

# Best Practices

**Configure error fingerprinting early.** Default fingerprints group by error type and stack trace. Add custom rules for known multi-cause error types. Test fingerprinting with production data before relying on it.

**Link releases to commits.** Configure the error tracking SDK to send release versions. Integrate VCS to identify suspect commits automatically. This closes the loop from error → code change → developer.

**Set up breadcrumb auto-instrumentation.** Enable automatic breadcrumb collection for Eloquent queries, HTTP client calls, and user navigation. Breadcrumbs are the most valuable debugging context for understanding error sequences.

**Define severity mapping.** Map HTTP status codes, exception types, and log levels to error tracking severity. Ensure 5xx errors become errors, 4xx become warnings, and debug-level entries are filtered.

**Automate source map uploads.** For Laravel applications with frontend assets, add source map upload to the CI/CD pipeline. Without source maps, frontend errors show minified stack traces.

# Architecture Guidelines

The error tracking workflow spans multiple architectural layers:

1. **Capture layer:** SDK middleware, global exception handler, manual reporting calls
2. **Grouping layer:** Fingerprint rules, custom fingerprint resolvers
3. **Triage layer:** Issue assignment, severity classification, ticketing integration
4. **Resolution layer:** Release-commit linking, fix deployment, regression verification
5. **Retrospective layer:** Postmortem documentation, action item tracking

Each layer should be independently configurable. The SDK handles capture and initial grouping; the error tracking platform handles triage through retrospective.

# Performance Considerations

- **Error capture overhead:** SDK initialization and event creation typically < 10ms. Batch reporting for error bursts reduces per-event cost.
- **Breadcrumb buffer:** Configure maximum breadcrumbs (Sentry default: 200). Each breadcrumb holds request data, query string, and timing. Monitor memory usage.
- **Performance tracing vs error capture:** These use separate sampling rates. Performance tracing can be sampled independently of error capture.
- **Source map upload:** Minified source maps can be 500KB-2MB. Upload once per deployment, not per error report.

# Security Considerations

- **PII in error payloads:** Stack traces may include variable values with PII. Configure data scrubbing (`before_send` callback) to remove sensitive fields.
- **DSN protection:** The Error Tracking DSN is a semi-sensitive credential. Store in environment variables, not in code. DSN exposure allows anyone to send errors to your project.
- **User context:** Attaching user context (ID, email) to error reports aids debugging but creates PII liability. Strip email/IP by default; attach only when necessary.
- **Access control:** Error tracking dashboards contain production stack traces and user data. Restrict access to engineering team members.

# Common Mistakes

**Not fingerprinting custom errors.** Custom exception classes with dynamic messages (containing user input) cause every occurrence to appear as a separate issue. Implement fingerprint rules to group by exception class, not message.

**Missing release tracking.** Error tracking without release information cannot answer "was this error introduced by the last deployment?" Team wastes time debugging errors that were already fixed in a pending release.

**Over-collecting breadcrumbs.** Enabling breadcrumbs for every database query, cache hit, and log entry. The signal-to-noise ratio collapses, and the 200-breadcrumb buffer fills with noise before the meaningful events occur.

**No source maps for frontend errors.** Frontend errors show `e.min.js:1:2345` — a minified file with no line mapping. Debugging is impossible without source maps.

# Anti-Patterns

**Silent error swallowing:** Catching exceptions with empty `catch` blocks that neither handle the error nor report it. The application appears to work correctly while silently degrading.

**Over-broad fingerprint rules:** Merging all `ErrorException` instances into a single issue. Thousands of different errors appear as one issue — no one knows which to fix first.

**Release marked resolved prematurely:** Closing an error issue in Sentry before verifying the fix is deployed. The same error reoccurs in the next release cycle.

**Ignoring error tracking until incident:** Only checking error tracking when something breaks. Without baseline awareness, teams cannot distinguish between a normal error rate and a spike.

# Examples

**Fingerprint configuration for dynamic errors:**
```php
\Sentry\configureScope(function (\Sentry\State\Scope $scope): void {
    $scope->setFingerprint([
        'validation-exception',
        $exception->getField(),
    ]);
});
```

**Release tracking via CI:**
```yaml
# .github/workflows/deploy.yml
- name: Deploy
  run: |
    php artisan deploy --release=${{ github.sha }}
    # Sentry automatically captures SENTRY_RELEASE
```

# Related Topics

**Prerequisites:**
- Sentry Laravel Integration (primary tool implementing this workflow)

**Closely Related Topics:**
- Flare & BugSnag Alternatives (alternative workflows)
- Log Context & Correlation (rich error context)

**Advanced Follow-Up Topics:**
- Incident Management Workflows (incident escalation from error tracking)
- Notification Routing & Escalation (alert routing from error spikes)

**Cross-Domain Connections:**
- DevOps & Infrastructure — CI/CD release tracking integration

# AI Agent Notes

- Error fingerprinting must be configured early and tested with production data
- Always link releases to VCS commits for suspect commit identification
- Breadcrumb auto-instrumentation should cover queries, HTTP calls, and user navigation
- Source map upload must be automated in CI/CD for frontend error debugging
- DSN must be stored in environment variables, never committed
- Crash-free rate targets should be set per release and monitored
