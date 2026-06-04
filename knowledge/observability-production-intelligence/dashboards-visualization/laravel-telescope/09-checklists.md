# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 07-dashboards-visualization
**Knowledge Unit:** laravel-telescope
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Laravel Telescope installed as debug assistant for local development
- [ ] Explicit non-production use policy documented
- [ ] Watchers configured: requests, queries, jobs, events, mail, cache, logs
- [ ] Telescope database storage IOPS and growth understood
- [ ] Pruning strategy configured to prevent storage bloat
- [ ] Filtering configured to exclude noise (health checks, static assets)

---

# Architecture Checklist

- [ ] Watcher registration: enabled only for relevant monitoring targets
- [ ] Entry storage: database-backed, planned for local/staging only
- [ ] Tag strategy defined for searchable entry metadata
- [ ] Pruning scheduled to run daily via `telescope:prune` command
- [ ] Filtering configured via `Telescope::filter()` callback
- [ ] Authorization gate enforced: `Telescope::auth()`

---

# Implementation Checklist

- [ ] Package installed: `laravel/telescope`
- [ ] Service provider registered and migrations published
- [ ] Telescope installed: `php artisan telescope:install`
- [ ] Watchers enabled in `config/telescope.php` as needed
- [ ] Pruning schedule set in `App\Console\Kernel`: `$schedule->command('telescope:prune --hours=48')->daily()`
- [ ] Authorization gate configured to restrict access to developers

---

# Performance Checklist

- [ ] Telescope not installed in production (IOPS and storage impact)
- [ ] Watcher query overhead in development evaluated
- [ ] Storage growth monitored: entries per request, pruning effectiveness
- [ ] Filtering configured to skip high-frequency low-value events
- [ ] Database index on `telescope_entries` table reviewed
- [ ] Pruning retention set to balance debugging history vs storage

---

# Security Checklist

- [ ] Telescope `auth` callback configured to restrict access
- [ ] Telescope UI not exposed in production (assert via env check)
- [ ] Entry data reviewed for PII in requests and query bindings
- [ ] Mail watcher not capturing email content with sensitive data
- [ ] Cache watcher not logging cache values containing tokens
- [ ] Log watcher not storing full exception stack traces with secrets

---

# Reliability Checklist

- [ ] Telescope disabled in production via `TELESCOPE_ENABLED=false`
- [ ] Watcher entry recording failure does not crash request
- [ ] `telescope:prune` command failure does not block other scheduled tasks
- [ ] Large entry batch on import/seed handled gracefully
- [ ] Telescope dashboard available during DB migration
- [ ] Watcher exclusion rule for `telescope` entries (avoid recursion)

---

# Testing Checklist

- [ ] Unit test: watcher captures expected entry type
- [ ] Unit test: prune command removes entries older than retention
- [ ] Integration test: Telescope dashboard accessible by authorized user
- [ ] Integration test: unauthorized user receives 403
- [ ] Filter test: excluded paths do not create entries
- [ ] Performance test: watcher overhead within acceptable range for dev

---

# Maintainability Checklist

- [ ] Telescope watcher configuration documented per environment
- [ ] Pruning schedule documented and monitored for effectiveness
- [ ] Custom watcher placed in `App\Telescope\Watchers` if needed
- [ ] Tag naming convention documented for searchability
- [ ] Authorization gate documented in security ADR
- [ ] Team trained on using Telescope for debugging workflows

---

# Anti-Pattern Prevention Checklist

- [ ] Telescope not installed in production environments
- [ ] Watchers not all enabled by default without considering storage
- [ ] Pruning not disabled (storage would grow unbounded)
- [ ] Telescope not used as replacement for production monitoring tools
- [ ] Authorization not bypassed for convenience
- [ ] Entries not kept longer than necessary (clear daily at minimum)

---

# Production Readiness Checklist

- [ ] `TELESCOPE_ENABLED=false` confirmed in `.env.production`
- [ ] Telescope config excludes production env in `config/telescope.php`
- [ ] Developer onboarding docs include Telescope setup steps
- [ ] Telescope database migration reviewed for staging
- [ ] Authorization gate configured for staging environment
- [ ] Pruning automated and monitored via scheduled task logs

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: watchers selected, storage configured, tags defined, pruning scheduled, filtering active
- [ ] Security requirements satisfied: auth callback set, production disabled, PII reviewed
- [ ] Performance requirements satisfied: production disabled, storage growth monitored, filtering tuned
- [ ] Testing requirements satisfied: watchers capture data, pruning works, auth enforced, filters effective
- [ ] Anti-pattern checks passed: not in production, storage pruned, not replacing prod monitoring
- [ ] Production readiness verified: env disabled confirmed, onboarding docs ready, migration reviewed, pruning automated

---

# Related References

- Laravel Pulse (production counterpart to Telescope)
- Laravel Nightwatch (hosted production alternative)
- N+1 Query Detection (Telescope QueryWatcher detects N+1)
