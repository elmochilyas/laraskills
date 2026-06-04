# Spatie Laravel Health

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 06-health-checks
- **Knowledge Unit:** spatie-laravel-health
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Spatie Laravel Health is a structured health check package providing a rich health endpoint with component-level results, result history, scheduled checks, and notifications. It replaces ad-hoc health routes with a configurable, extensible system featuring built-in checks for database, Redis, cache, queue, and more.

---

## Core Concepts

- **Check:** A single health check class verifying one dependency — each has a name, target, and healthy/unhealthy determination logic
- **Result:** Output of a single check — status (ok, warning, failed), optional message, and metadata
- **Result Store:** Persists health check results for historical analysis — supports Eloquent, Redis, or other stores
- **Runner:** Executes checks — supports synchronous (on HTTP request) and scheduled (via Laravel scheduler) execution
- **Checks Command:** `php artisan health:check` runs all checks from CLI for pre-deployment validation
- **Notification:** Sends alerts when a check fails — supports Slack, Mail, Discord, and custom channels

---

## Mental Models

- **Garage Inspection Model:** Each check is a mechanic inspecting one system — tire pressure (database), fluid levels (cache), brakes (queue). The check engine light (notification) turns on when any fails
- **Black Box Model:** The health endpoint is a black box with colored lights — orchestrators only care about green (200) or red (503), but developers can open the box to see individual component status
- **Flight Recorder Model:** Result store is the flight recorder — it logs every check result so you can analyze trends and diagnose intermittent failures

---

## Internal Mechanics

When a health check request arrives, the Runner executes all configured checks synchronously. Each Check class implements a `run()` method that returns a `Result` object with status and optional message. Results are collected into an array, passed through the Result Store (if configured) for persistence, and then transformed into the HTTP response JSON. Scheduled checks run via `php artisan health:schedule-check-checks` in the Laravel scheduler, executing checks and triggering notifications asynchronously.

---

## Patterns

- **Endpoint + Scheduled Checks:** Endpoint checks provide real-time status for orchestrators. Scheduled checks provide historical data and comprehensive tests. Benefit: real-time data + trend analysis. Tradeoff: more checks to maintain.
- **Check Failure Thresholds:** A check should not fail on the first timeout — allow 2-3 connection attempts before reporting failure. Benefit: prevents flapping from transient issues. Tradeoff: delayed failure detection.
- **Custom Check Classes:** Package application-specific health logic into custom Check classes following the same structure as built-in checks. Benefit: consistent interface for all health verification. Tradeoff: requires development effort.

---

## Architectural Decisions

**Configure both endpoint and scheduled checks.** Endpoint checks for orchestration, scheduled checks for historical data and comprehensive analysis. Separate fast checks from expensive checks.

**Use result store with pruning.** Enable the Eloquent result store for troubleshooting but configure regular pruning of old records. Result store without pruning grows unbounded and slows queries.

**Configure notifications with `stopped` failure mode.** Send notification only when a check transitions to "failed" (not on every failure). Prevents alert fatigue from transient blips.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Structured health checks with component-level results | All checks run synchronously on each request | Target <500ms total response time |
| Result history enables trend analysis | Database/Redis writes on every check | High-frequency checks cause write contention |
| Notifications alert teams before orchestrator kills pods | Too many notifications cause alert fatigue | Use `stopped` failure mode |

---

## Performance Considerations

Endpoint checks execute all checks synchronously — target <500ms total. Scheduled checks run in background via scheduler — no request-time impact. Each check creates a database/Redis write — high-frequency checks can cause write contention. Notifications on each failure flood channels — use `stopped` failure mode or throttle.

---

## Production Considerations

Health results may reveal server paths, connection details, or version numbers — review check output for sensitive info. Ensure result store is not exposed via other routes. Health notifications may contain internal system information — use encrypted/private channels.

---

## Common Mistakes

**Running all checks on every health endpoint request** — expensive checks (full integration tests, S3 connectivity) should be scheduled, not endpoint-driven. Use configuration to separate endpoint vs scheduled checks.

**No result store pruning** — health check results accumulate quickly. Without pruning, the table grows unbounded and slows queries.

**Over-notification** — sending Slack notifications on every check failure. A transient database timeout causes 3 notifications before retry. Use `stopped` failure mode.

**Check exception not caught** — custom checks that throw uncaught exceptions break the entire health endpoint. Always wrap in try-catch and return a failed result.

---

## Failure Modes

**Result store database contention:** High check frequency causes write contention on the health_check_results table. Detection: slow health check responses. Mitigation: use cache store (Redis) instead of database; reduce check frequency.

**Notification storm:** Transient failure causes repeated notifications. Detection: Slack/Discord flooded with health alerts. Mitigation: use `stopped` failure mode (notify only on transition); throttle notifications.

**Custom check exception:** Uncaught exception in custom check breaks the entire health endpoint. Detection: health endpoint returns 500. Mitigation: always wrap custom check logic in try-catch.

---

## Ecosystem Usage

Spatie Laravel Health provides built-in checks for database, Redis, cache, queue, Horizon, Meilisearch, and more. Custom checks extend `Spatie\Health\Checks\Check`. The package integrates with Laravel's scheduler for periodic checks. Result stores use Eloquent or Redis for persistence.

---

## Related Knowledge Units

### Prerequisites
- Laravel service providers and configuration

### Related Topics
- Health Check Endpoint (basic health check concepts)
- Laravel Pulse (health as part of a larger dashboard)

### Advanced Follow-up Topics
- Kubernetes probe configuration with Spatie health
- Circuit breaker integration

---

## Research Notes

Separate endpoint checks (fast) from scheduled checks (comprehensive). Use result store for troubleshooting — prune regularly. Notifications should use `stopped` mode to avoid alert fatigue. Custom checks must catch exceptions and return `Result::failed()`. Health checks must be read-only — no state modification. Set realistic timeouts (500ms-2s) to avoid false failures.
