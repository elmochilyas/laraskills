# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Maintenance Mode
**Generated:** 2026-06-03

---

# Decision Inventory

* Maintenance Mode vs Zero-Downtime Deployments
* Secret URL Bypass vs IP Allowlist Bypass
* File-Based Maintenance vs Database-Based Maintenance Checks
* Automated Deployment Scripts vs Manual Maintenance Mode Management

---

# Architecture-Level Decision Trees

---

## Decision 1: Maintenance Mode vs Zero-Downtime Deployments

---

## Decision Context

Whether to use `php artisan down` (traditional maintenance mode) or implement zero-downtime deployment strategies.

---

## Decision Criteria

* Whether the deployment involves breaking database schema changes
* Whether the application is load-balanced with rolling deployment capability
* Whether the deployment infrastructure supports hot-swapping

---

## Decision Tree

Does the deployment involve breaking database schema changes (column drops, table renames)?
↓
YES → Maintenance mode required — zero-downtime cannot handle breaking schema changes without complex migration strategies
NO → Does the deployment infrastructure support rolling updates (load balancer, multiple instances)?
    ↓
    YES → Can the schema change be performed without downtime?
        ↓
        YES → Zero-downtime is feasible — rolling updates + backward-compatible migrations
        NO → Maintenance mode required — schema change is incompatible with live traffic
    NO → Does the deployment involve queue worker restarts?
        ↓
        YES → Maintenance mode + queue drain — coordinate down with queue pause
        NO → Is the deployment simple (asset updates, non-breaking config)?
            ↓
            YES → No maintenance mode needed — zero-downtime is achievable with versioned assets
            NO → Maintenance mode — any deployment with risk of inconsistent state needs it
NO → Is the application behind a load balancer with multiple instances?
    ↓
    YES → Maintenance mode on all instances simultaneously — use orchestration (Forge, Envoyer, Ansible)
    NO → Maintenance mode on single server — simple `php artisan down` before deployment

---

## Rationale

Maintenance mode is for deployments that modify the database schema in breaking ways or where users seeing inconsistent state is unacceptable. Zero-downtime is for asset updates, non-breaking migrations (adding columns), and configuration changes. Many teams use both: zero-downtime for regular releases; maintenance mode for major schema changes.

---

## Recommended Default

**Default:** No maintenance mode for backward-compatible changes. Use maintenance mode for breaking schema changes, queue drains, and emergencies.
**Reason:** Unnecessary maintenance mode causes user frustration (503 errors) and is not needed for most incremental deployments.

---

## Risks Of Wrong Choice

* No maintenance mode on breaking migration: Users see database errors during migration; data inconsistency
* Maintenance mode for every deploy: Unnecessary downtime; erodes user trust with frequent 503s
* Maintenance mode on single server in load-balanced setup: Users randomly see 503 depending on which server handles the request
* Zero-downtime without backward-compatible migrations: Column dropped before deployment finishes — errors on old code instances

---

## Related Rules

* Enforce Automated Up/Down in Deployment Scripts
* Enforce Queue Drain Coordination with Maintenance Mode

---

## Related Skills

* Use php artisan down with --secret and --retry for Deployments
* Automate Maintenance Mode in Deployment Scripts

---

---

## Decision 2: Secret URL Bypass vs IP Allowlist Bypass

---

## Decision Context

Whether to use a secret URL (`--secret`) or IP allowlist (`--allow`) to bypass maintenance mode during deployment verification.

---

## Decision Criteria

* Whether the team has static IP addresses
* Whether developers need to verify the deployment
* Whether monitoring services need access

---

## Decision Tree

Do developers and team members have static IP addresses?
↓
YES → IP allowlist — `--allow=203.0.113.0`; no URL sharing needed; always works
NO → Secret URL — developers have dynamic IPs; secret URL provides access regardless of IP
    ↓
    YES → Are monitoring services (Pingdom, New Relic) involved?
        ↓
        YES → BOTH — secret URL for team; IP allowlist for monitoring services
        NO → Secret URL is sufficient — team accesses via secret link
    YES → Is the deployment verified by CI/CD (not humans)?
        ↓
        YES → Secret URL — CI can curl the secret URL to verify deployment
        NO → Secret URL — humans need access; dynamic IPs prevent allowlist
NO → Is the security concern around secret URL sharing?
    ↓
    YES → IP allowlist — if IPs are static, allowlist is more secure than a shared secret URL
    NO → Secret URL — generate unique secret per deployment with `--secret="deploy-$(date +%s)"`

---

## Rationale

Secret URLs (`/deploy-123456789`) set an encrypted cookie and are the primary bypass mechanism for dynamic-IP teams. IP allowlists are for monitoring services and teams with static IPs. Both can be combined. The secret URL is not authenticated — anyone with the URL can bypass. Treat it as a temporary password.

---

## Recommended Default

**Default:** Secret URL for team access. IP allowlist for monitoring services. BOTH together in production deployments.
**Reason:** Secret URL works with dynamic IPs. IP allowlist is more secure for static systems.

---

## Risks Of Wrong Choice

* No secret: Developers cannot access the site to verify deployment; must take the app out of maintenance to test
* Secret URL shared broadly: Anyone with the URL bypasses maintenance — temporary URL is still an exposure
* IP allowlist with dynamic IPs: Developer changes IP (coffee shop, home) — blocked; cannot access site
* No monitoring bypass: Monitoring service sees 503 — triggers false alert during planned maintenance

---

## Related Rules

* Enforce Automated Up/Down in Deployment Scripts
* Enforce Queue Drain Coordination with Maintenance Mode

---

## Related Skills

* Use php artisan down with --secret and --retry for Deployments
* Automate Maintenance Mode in Deployment Scripts

---

---

## Decision 3: File-Based Maintenance vs Database-Based Maintenance Checks

---

## Decision Context

Whether to use Laravel's default file-based maintenance mode (`storage/framework/down`) or implement a database-based alternative.

---

## Decision Criteria

* Whether the application runs on a single server or multiple servers
* Whether centralized maintenance mode management is needed
* Whether the database connection is more reliable than the filesystem

---

## Decision Tree

Is the application running on a single server?
↓
YES → File-based — Laravel's default; simple, fast, no database dependency
NO → Is the application on multiple servers behind a load balancer?
    ↓
    YES → Can orchestration tools (Forge, Envoyer, Ansible) synchronize the down file?
        ↓
        YES → File-based + orchestration — each server checks its own file; orchestration manages simultaneous operations
        NO → Consider database-based — centralized state management across servers without external orchestration
    YES → Is the database connection more reliable than the filesystem?
        ↓
        YES → Database-based — but this creates a circular dependency: if the database is down, maintenance mode can't be detected
        NO → File-based — filesystem is simpler and avoids circular dependency
NO → Does the application need centralized maintenance mode management?
    ↓
    YES → Database-based — a single database row can manage state for all servers
    NO → File-based — per-server state is sufficient

---

## Rationale

Laravel's file-based approach is intentionally simple. The filesystem is always available (no circular dependency). In multi-server deployments, orchestration tools can manage the down file on each server. Database-based maintenance mode creates a circular dependency — if the database is down for maintenance, you can't check the database for maintenance mode.

---

## Recommended Default

**Default:** File-based maintenance mode (Laravel default) for single-server and orchestrated multi-server deployments.
**Reason:** File-based has no circular dependency, is fast (~0.01ms), and works reliably. Database-based creates circular dependency risk.

---

## Risks Of Wrong Choice

* File-based without orchestration on multi-server: Only one server goes down; users randomly see 503 or app depending on which server handles the request
* Database-based during database migration: Maintenance mode check fails (DB is changing); app stays up during DB migration
* Database-based when database is unreachable: Cannot enable maintenance mode because DB is down — can't fix DB without disabling maintenance
* File-based with shared filesystem (NFS): NFS latency adds delay to every request's down-file check

---

## Related Rules

* Enforce Automated Up/Down in Deployment Scripts
* Enforce Queue Drain Coordination with Maintenance Mode

---

## Related Skills

* Use php artisan down with --secret and --retry for Deployments
* Automate Maintenance Mode in Deployment Scripts

---

---

## Decision 4: Automated Deployment Scripts vs Manual Maintenance Mode Management

---

## Decision Context

Whether to automate `php artisan down`/`up` in deployment scripts or manage maintenance mode manually via SSH.

---

## Decision Criteria

* Whether the team uses CI/CD deployment pipelines
* Whether the deployment is frequent
* Whether the team has multiple engineers deploying

---

## Decision Tree

Does the team use CI/CD for deployments?
↓
YES → ALWAYS automate — CI/CD pipeline includes down/up as standard steps
NO → Are deployments frequent (multiple times per day/week)?
    ↓
    YES → AUTOMATE — manual management is error-prone at frequency
    NO → Is there more than one engineer who deploys?
        ↓
        YES → AUTOMATE — multiple people increase the chance of forgetting a step
        NO → Manual is acceptable but risky — a single forgotten `php artisan up` takes the app down until noticed
NO → Does the deployment script handle rollback?
    ↓
    YES → Automate — include `php artisan up` in both success and failure paths
    NO → Is there a monitoring alert for extended maintenance mode?
        ↓
        YES → Manual is risky but has safety net — alert catches forgotten up
        NO → AUTOMATE — no safety net means forgotten up takes the app down indefinitely

---

## Rationale

The most common maintenance mode mistake is forgetting `php artisan up` after deployment. Automation eliminates this risk. The deployment script should: (1) pause queue workers, (2) enable maintenance mode, (3) deploy, (4) run migrations, (5) clear caches, (6) disable maintenance mode, (7) resume queue workers. The `up` command must run even if steps 3-5 fail (rollback).

---

## Recommended Default

**Default:** ALWAYS automate `php artisan up`/`down` in deployment scripts. Never manage maintenance mode manually.
**Reason:** Manual management is the primary cause of deployment downtime (forgotten `up`). Automation is reliable and auditable.

---

## Risks Of Wrong Choice

* Manual `php artisan up`: Developer SSHes in, deploys, forgets `up` — app shows 503 until someone notices
* Manual without rollback: Deployment fails; script exits; `php artisan up` never runs — app stays down
* Automated `up` in success path only: Deployment fails after `down` but before `up` — rollback path missing; app stays down
* No queue drain before down: Workers process jobs with half-deployed code — data corruption
* No queue resume after up: Workers remain paused; jobs never processed

---

## Related Rules

* Enforce Automated Up/Down in Deployment Scripts
* Enforce Queue Drain Coordination with Maintenance Mode

---

## Related Skills

* Use php artisan down with --secret and --retry for Deployments
* Automate Maintenance Mode in Deployment Scripts
