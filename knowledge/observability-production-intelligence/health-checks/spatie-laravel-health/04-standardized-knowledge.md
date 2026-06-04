# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 06-health-checks
**Knowledge Unit:** spatie-laravel-health
**Difficulty:** Intermediate
**Category:** Application Health
**Last Updated:** 2026-06-03

# Overview

Spatie Laravel Health is a structured health check package that provides a rich health check endpoint with component-level results, result history, scheduled checks, and notifications. It replaces ad-hoc health routes with a configurable, extensible system.

The package provides built-in checks for database, Redis, cache, queue, Horizon, Meilisearch, and more. Custom checks can be added for application-specific dependencies (third-party APIs, file storage, custom services).

Engineers should care because Spatie Laravel Health provides production-ready health checks out of the box — result history enables trend analysis, scheduled checks detect intermittent failures, and notifications alert teams before orchestrators restart pods.

# Core Concepts

**Check:** A single health check class that verifies one dependency. Each check has a name, target, and logic for determining healthy/unhealthy status.

**Result:** The output of a single check: status (ok, warning, failed), optional message, and optional metadata. Results are collected into the overall health response.

**Result Store:** Persists health check results for historical analysis. The package supports Eloquent, Redis, or other stores. Results are retained for a configurable period.

**Runner:** Executes checks. Supports synchronous execution (on HTTP request) and scheduled execution (via Laravel scheduler).

**Checks Command:** `php artisan health:check` runs all checks from the CLI. Useful for pre-deployment validation and debugging.

**Notification:** Sends alerts when a check fails. Supports Slack, Mail, Discord, and custom notification channels.

**Failure:** A check status of "failed" indicates the dependency is unreachable or misconfigured. This triggers:
- HTTP 503 on the health endpoint
- Notification (if configured)
- Result store entry

# When To Use

- **All production Laravel applications** needing structured health checks
- **Teams wanting result history** for troubleshooting intermittent failures
- **Applications requiring scheduled health checks** (not just endpoint-driven)

# When NOT To Use

- **Micro-check for process only** — a simple `/ping` route without dependency checks
- **Applications already using feature-specific health checks** with custom monitoring

# Best Practices

**Configure both endpoint and scheduled checks.** Endpoint checks provide real-time status for orchestrators. Scheduled checks provide historical data for trend analysis and can run more comprehensive tests without impacting request time.

**Set appropriate failure thresholds.** A check should not fail on the first timeout — use retry or allow 2-3 connection attempts before reporting failure. Prevent flapping.

**Use result store for debugging.** Enable the result store with Eloquent to track when and why health checks failed. Useful for post-incident analysis.

**Configure notifications for critical checks.** Database, queue, and cache failures warrant immediate notification. Less critical checks (optional API integrations) can degrade without alerting.

**Extend with custom checks.** Package your application-specific health logic into custom Check classes. Follow the same structure as built-in checks for consistency.

# Architecture Guidelines

The health endpoint should be registered at `/health` or `/healthz`. The package automatically handles routing and authentication (no auth required). Configure which checks run in the endpoint vs. scheduled checks.

Result store should use a lightweight persistence mechanism. Eloquent is fine but ensure the health_checks table is pruned regularly. Redis provides faster reads but loses history on restart.

Scheduled checks run via `php artisan health:schedule-check-checks` in the Laravel scheduler. Configure frequency based on check cost: database ping every minute, full integration check every 5 minutes.

# Performance Considerations

- **Endpoint check execution:** All checks run synchronously on each health endpoint request. Target <500ms total
- **Scheduled check execution:** Runs in the background via scheduler. No request-time impact
- **Result store writes:** Each chec creates a database/Redis write. High-frequency checks can cause write contention
- **Notification overhead:** Sending notifications on each failure floods channels. Use `stopped` failure mode or throttle notifications

# Security Considerations

- **Health results contain configuration.** Check messages can reveal server paths, connection details, or version numbers. Review check output for sensitive information
- **Result store access.** Ensure health check results are not exposed via other routes. Store access should be admin-only
- **Notification channels.** Health notifications may contain internal system information. Use encrypted/private channels

# Common Mistakes

**Running all checks on every health endpoint request.** Expensive checks (full integration tests, S3 connectivity) should be scheduled, not endpoint-driven. Use the `checks` configuration to separate endpoint vs scheduled checks.

**No result store pruning.** Health check results accumulate quickly. Without pruning, the `health_check_results` table grows unbounded and slows queries.

**Over-notification.** Sending Slack notifications on every check failure. A transient database timeout causes 3 notifications before the check retries. Use `stopped` failure mode or debounce notifications.

**Check exception not caught.** Custom checks that throw uncaught exceptions break the entire health endpoint. Always wrap custom check logic in try-catch and return a failed result.

# Anti-Patterns

**Health check as monitoring tool.** Health checks are for orchestration — they tell the orchestrator whether to route traffic. They are not a substitute for dedicated monitoring tools (uptime monitors, synthetic checks).

**Check that modifies state.** A health check that writes a ping timestamp to the database or creates a test record. Health checks must be read-only to avoid side effects under high load.

**Check timeout too short.** Setting a 100ms timeout on a database check. Under normal load, database queries can take 200-500ms. Short timeouts cause false failures.

**No custom checks for app-specific dependencies.** A Laravel application that depends on a third-party API should have a custom check for that API. Without it, the health endpoint reports "healthy" even when the application cannot function.

# Examples

**Custom check for external API:**
```php
class ExternalApiCheck extends Check
{
    public function run(): Result
    {
        try {
            Http::timeout(2)->get(config('services.external_api.health_url'));
            return Result::ok()->shortSummary('API reachable');
        } catch (\Exception $e) {
            return Result::failed()->shortSummary('API unreachable');
        }
    }
}
```

# Related Topics

**Prerequisites:**
- Laravel service providers and configuration

**Closely Related Topics:**
- Health Check Endpoint (basic health check concepts)
- Laravel Pulse (health as part of a larger dashboard)

**Advanced Follow-Up Topics:**
- Kubernetes probe configuration with Spatie health
- Circuit breaker integration

**Cross-Domain Connections:**
- DevOps & Infrastructure — orchestrator probe configuration

# AI Agent Notes

- Separate endpoint checks (fast) from scheduled checks (comprehensive)
- Use result store for troubleshooting (prune regularly)
- Notifications should use `stopped` mode to avoid alert fatigue
- Custom checks must catch exceptions and return Result::failed()
- Health checks must be read-only — no state modification
- Set realistic timeouts (500ms-2s) to avoid false failures
