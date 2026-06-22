# Metadata
**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering / Billing Webhook Queues
**Knowledge Unit:** Billing Queue Topology and Separation by Concern
**Generated:** 2026-06-22

# Quick Checklist (10-20 derived items)
- [ ] `webhooks` queue exists with dedicated 1-2 workers, isolated from all other work
- [ ] `billing` queue exists for invoice generation, subscription sync, and reconciliation
- [ ] `notifications` queue exists, separate from webhooks and billing
- [ ] `default` queue exists for miscellaneous jobs
- [ ] `#[Queue]` attribute present on all job classes declaring their queue
- [ ] Webhook jobs never dispatched to `notifications` or `billing` queues
- [ ] Notification jobs never dispatched to `webhooks` queue
- [ ] Per-queue retry configuration matches job type characteristics
- [ ] `balance=simple` or `balance=false` for critical queues (webhooks)
- [ ] Queue depth monitoring configured per queue, not just aggregate

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Queue naming**: lowercase, descriptive — `webhooks`, `billing`, `notifications`, `default`
- **Supervisor naming**: `{queue}-supervisor` — one supervisor per critical queue
- **Worker allocation**: webhooks: 1-2, billing: 1-3, notifications: 2-5, default: 3-10
- **Balance strategy**: `simple` for webhooks/billing, `auto` for notifications/default
- **Environment configuration**: dev/staging uses reduced workers (all queues share 1-2 workers)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] `config/horizon.php` has dedicated supervisors for webhooks, billing, notifications, default
- [ ] Each supervisor has appropriate `tries`, `timeout`, `retry_after`, `sleep`
- [ ] `#[Queue('webhooks')]` attribute on `ProcessStripeWebhook`
- [ ] `#[Queue('billing')]` attribute on `SyncSubscription`, `GenerateInvoice`
- [ ] `#[Queue('notifications')]` attribute on `SendWelcomeEmail`, `SendOrderConfirmation`
- [ ] Runtime `->onQueue()` calls match the `#[Queue]` attribute declarations
- [ ] Dev/staging Horizon config uses consolidated supervisors with reduced workers

# Performance Checklist
- Each Horizon worker consumes ~20-50MB RAM — size servers for total worker count
- `sleep=3` or higher on low-traffic queues reduces polling CPU overhead
- Monitor queue depth per queue — growing webhooks queue means workers can't keep up
- Redis memory: a backlog of 10,000 notification jobs is cheap (~10MB); 10,000 billing jobs with large payloads may consume significantly more

# Security Checklist
- [ ] Queue names visible in Horizon dashboard — don't embed sensitive information in queue names
- [ ] Horizon dashboard behind authentication in production via `Horizon::auth()`
- [ ] Redis connection for queues uses dedicated instance or separate database number
- [ ] Failed jobs table access restricted — contains serialized model data

# Reliability Checklist
- [ ] Webhooks queue has guaranteed minimum workers (`minProcesses=1`)
- [ ] `balance=simple` ensures webhooks workers aren't stolen by notification backlogs
- [ ] Per-queue retry configuration prevents premature failure and unnecessary retries
- [ ] Queue depth alerts configured per queue (webhooks depth > 10 = alert)
- [ ] Backup queue worker commands documented for fallback when Horizon is unavailable

# Testing Checklist
- [ ] Test that webhook jobs route to `webhooks` queue regardless of dispatch location
- [ ] Test that notification jobs route to `notifications` queue, never `webhooks`
- [ ] Test queue separation: notification backlog does not delay webhook processing
- [ ] Test per-queue retry behavior: webhook jobs retry 5x, notification jobs retry 3x
- [ ] Test dev/staging configuration uses consolidated workers correctly

# Maintainability Checklist
- [ ] Queue topology documented in project README or operations runbook
- [ ] Worker count rationale documented (why 2 webhook workers, not 1 or 5)
- [ ] Adding a new queue follows documented process: update horizon config, add supervisor, add monitoring
- [ ] Supervisor configuration under version control

# Anti-Pattern Prevention Checklist
- [ ] Prevent: Everything on `default` queue (single queue congestion)
- [ ] Prevent: Notifications on webhooks queue (marketing emails blocking billing)
- [ ] Prevent: Billing on notifications queue (subscription sync behind emails)
- [ ] Prevent: One supervisor for all queues with `balance=auto` (critical queue starvation)
- [ ] Prevent: Queue per micro-domain (user-emails, order-emails) — group by concern, not domain

# Production Readiness Checklist
- [ ] Horizon running in production with all supervisors active
- [ ] Webhooks supervisor: `maxProcesses=2`, `minProcesses=1`, `balance=simple`
- [ ] Billing supervisor: `maxProcesses=3`, `minProcesses=1`, `balance=auto`
- [ ] Notifications supervisor: `maxProcesses=5`, `minProcesses=2`, `balance=auto`
- [ ] Default supervisor: `maxProcesses=10`, `minProcesses=3`, `balance=auto`
- [ ] Queue depth monitoring configured for all queues
- [ ] Alerts configured: webhooks queue depth > 10, billing queue depth > 100
- [ ] Horizon dashboard accessible to operations team with authentication

# Final Approval Checklist
- [ ] Architecture review completed (queue topology matches job volume and priority)
- [ ] Security review completed (Horizon auth, Redis isolation, queue name safety)
- [ ] Performance impact assessed (worker memory footprint, polling overhead)
- [ ] Testing coverage adequate (queue routing, per-queue retry, dev/staging config)
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Rules/Skills/Trees/Anti-Patterns
## Rules
- Separate Webhooks Queue from Notifications Queue
- Declare Queue in Job Class via Attribute, Not Only at Dispatch Time
- Use balance=simple or balance=false for Critical Queues, Not balance=auto
- Calibrate Queue Topology to Application Scale
- Per-Queue Retry Configuration Must Match Job Type Characteristics
## Anti-Patterns
- Everything on default
- Notifications on webhooks queue
- Billing on notifications queue
- One supervisor for all queues with balance=auto
- Queue per micro-domain
