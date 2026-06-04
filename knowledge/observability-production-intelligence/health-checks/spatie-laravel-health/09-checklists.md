# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 06-health-checks
**Knowledge Unit:** spatie-laravel-health
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Spatie Laravel Health package installed and configured (870+ GitHub stars)
- [ ] Fluent API understood for registering health checks
- [ ] Checks registered for database, Redis, queue, disk, CPU
- [ ] Result store configured (database or JSON file)
- [ ] Notifications configured (mail, Slack, Discord)
- [ ] Scheduled Artisan command running health checks on interval

---

# Architecture Checklist

- [ ] Check registry configured with all application dependencies
- [ ] Result store decision: database for history, JSON for simplicity
- [ ] Notification channels mapped to severity (warning vs failure)
- [ ] Scheduled command frequency balanced with check overhead
- [ ] Health check endpoint exposed for orchestrator integration
- [ ] Dashboard enabled for team visibility into health status

---

# Implementation Checklist

- [ ] Package installed: `spatie/laravel-health`
- [ ] Config published: `php artisan vendor:publish --tag=health-config`
- [ ] Checks registered in `HealthCheckServiceProvider` or `config/health.php`
- [ ] Database check configured: connection test, query time threshold
- [ ] Redis check configured: ping, memory usage threshold
- [ ] Disk check configured: available space percentage threshold

---

# Performance Checklist

- [ ] Check execution time measured per dependency
- [ ] Scheduled command frequency balanced (every minute vs every 5 minutes)
- [ ] Database result store write overhead assessed
- [ ] CPU check overhead evaluated on high-utilization servers
- [ ] Concurrent check execution evaluated to reduce total run time
- [ ] Cache result store considered for high-frequency check environments

---

# Security Checklist

- [ ] Health dashboard access restricted via middleware (auth + admin)
- [ ] Check results not exposing sensitive connection details
- [ ] Disk check threshold not revealing exact filesystem layout
- [ ] Notification webhook URLs stored in config, not hardcoded
- [ ] Health endpoint not publicly accessible
- [ ] Check failure does not leak database credentials in error message

---

# Reliability Checklist

- [ ] Single check failure does not prevent other checks from running
- [ ] Result store failure returns warning, not exception
- [ ] Notification delivery failure logged, does not crash check run
- [ ] Scheduled command retries on failure
- [ ] Check timeout configured per dependency
- [ ] Consecutive failure count tracked before notification

---

# Testing Checklist

- [ ] Unit test: custom check returns expected Result object
- [ ] Unit test: check failure triggers notification
- [ ] Integration test: scheduled command runs and stores results
- [ ] Integration test: dashboard displays current health status
- [ ] Failure test: dependency down returns `failed` status
- [ ] Stress test: concurrent check execution does not race

---

# Maintainability Checklist

- [ ] Custom checks placed in `App\Health\Checks` namespace
- [ ] Check registration centralized in `config/health.php`
- [ ] Notification channel configuration documented
- [ ] Scheduled command frequency documented in deployment runbook
- [ ] Result store cleanup strategy configured (pruning old results)
- [ ] Team trained on adding new checks

---

# Anti-Pattern Prevention Checklist

- [ ] Checks not overly aggressive causing false positives
- [ ] Notification not sent on every transient failure (debounce)
- [ ] Dashboard not used as primary monitoring (complementary)
- [ ] Result store not unbounded growth (pruning enabled)
- [ ] Check timeout not longer than scheduled interval
- [ ] Not checking every single dependency (only critical paths)

---

# Production Readiness Checklist

- [ ] Health check dashboard added to team monitoring rotation
- [ ] Alerting configured for check failure notifications
- [ ] Result store pruning verified (automatic old result cleanup)
- [ ] Check execution time baseline captured
- [ ] Health endpoint integrated with Kubernetes probes
- [ ] Runbook includes health check failure investigation steps

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: check registry, result store, notifications, scheduled command, endpoint, dashboard
- [ ] Security requirements satisfied: dashboard access restricted, results not leaking details, webhook URLs protected
- [ ] Performance requirements satisfied: execution time measured, interval balanced, store overhead assessed
- [ ] Testing requirements satisfied: custom check returns Result, notification triggered, command runs, dashboard displays
- [ ] Anti-pattern checks passed: no false-positive aggressive checks, notifications debounced, pruning active
- [ ] Production readiness verified: dashboard in rotation, alerts set, baseline captured, probes integrated

---

# Related References

- Health Check Endpoint Design (Laravel 11+ built-in `/up` endpoint)
- Notification Routing & Escalation (health check notification channels)
