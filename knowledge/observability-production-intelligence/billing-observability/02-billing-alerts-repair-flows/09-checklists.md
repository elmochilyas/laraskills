# Metadata
**Domain:** Observability & Production Intelligence
**Subdomain:** Billing Observability
**Knowledge Unit:** Billing Alerts & Support Repair Flows
**Generated:** 2026-06-22

# Quick Checklist (10-20 derived items)
- [ ] Alert runbooks documented for all six billing alert types
- [ ] Manual webhook replay command exists (`php artisan billing:replay-webhook`)
- [ ] Subscription force-sync command exists (`php artisan billing:sync-subscription`)
- [ ] Entitlement recalculation command exists with `--dry-run` flag
- [ ] Failed job recovery available via both Horizon UI and artisan command
- [ ] Audit log table exists and records every manual repair action
- [ ] Support dashboard shows recent events, subscription statuses, and drift reports
- [ ] All repair endpoints have authorization (Gate/Policy) checks
- [ ] Rate limit awareness built into bulk operations
- [ ] Incident response runbook documented and accessible to on-call team

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Alert definitions**: Six alert types with clear detection criteria and response procedures
- **Repair actions**: Four repair flows (webhook replay, subscription sync, entitlement recalc, job retry)
- **Access layer**: CLI (artisan commands) for engineers + admin UI (controllers) for support staff
- **Safety layer**: `--dry-run` on all mutating commands, authorization on all repair endpoints
- **Audit layer**: Every manual repair logged with actor, action, team, reason, result
- **Rate limit layer**: Staggered API calls respecting Stripe's 25/sec write and 100/sec read limits

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] `billing:replay-webhook {stripeEventId}` command with `--force` and `--sync` options
- [ ] `billing:sync-subscription {teamId}` command with `--all` option
- [ ] `billing:recalculate-entitlements {teamId?}` command with `--all-teams` and `--dry-run`
- [ ] `BillingRepairController` with `replayWebhook`, `syncSubscription`, `retryFailedJob` methods
- [ ] `SyncSubscriptionAction` shared between command and controller
- [ ] `RecalculateEntitlementsAction` shared between command and controller
- [ ] `billing_audit_logs` table with `action`, `actor_id`, `team_id`, `metadata` (JSON), `result` (JSON)
- [ ] Support dashboard view with filterable event list, subscription statuses, drift reports
- [ ] Repair action buttons gated behind individual Gate/Policy checks

# Performance Checklist
- Bulk operations (`--all-teams`) must stagger Stripe API calls to stay under rate limits
- Queue bulk repairs as individual jobs to spread load over time
- Cache Stripe API responses where possible to avoid redundant calls
- Stripe PHP SDK auto-retries on rate limit responses — keep operations under the limit to avoid SDK backoff

# Security Checklist
- [ ] Every repair endpoint has explicit authorization — different permissions per repair action
- [ ] Audit log entries include actor_id, action, team_id, reason, and result
- [ ] Repair commands never expose sensitive Stripe API responses in command output
- [ ] Support dashboard behind authentication and authorization
- [ ] Audit logs queryable by team_id (support investigations) and actor_id (compliance reviews)

# Reliability Checklist
- [ ] `--dry-run` flag on all mutating repair commands prevents irreversible mistakes
- [ ] Bulk operations chunked and staggered to respect Stripe rate limits
- [ ] Rollback procedure documented for each repair action
- [ ] Alert routing to on-call engineer configured with escalation policy
- [ ] Incident response runbook accessible off-platform (wiki, shared doc) in case the app is down

# Testing Checklist
- [ ] Test each artisan command with valid and invalid inputs
- [ ] Test `--dry-run` reports changes without making them
- [ ] Test webhook replay respects idempotency (no duplicate processing)
- [ ] Test subscription sync updates database from Stripe API correctly
- [ ] Test entitlement recalculation resolves plan + subscription + usage correctly
- [ ] Test authorization gates on repair endpoints (support agent vs. admin permissions)
- [ ] Test audit log entries are created for every repair action
- [ ] Test rate limit staggering for bulk operations

# Maintainability Checklist
- [ ] Artisan command signatures follow consistent pattern: `billing:{action} {teamId}` or `{stripeEventId}`
- [ ] Shared Action classes between commands and controllers prevent logic duplication
- [ ] Alert runbooks updated after every billing system change
- [ ] Support dashboard UI updated when new repair actions are added

# Anti-Pattern Prevention Checklist
- [ ] Prevent: No audit logging for manual repairs (untraceable billing changes)
- [ ] Prevent: Repair commands without dry-run (irreversible mistakes on production data)
- [ ] Prevent: Ignoring Stripe rate limits in repair flows (429 errors, partial failures)
- [ ] Prevent: Repair logic in controllers only (no CLI access for on-call engineers)
- [ ] Prevent: No authorization on repair endpoints (any admin can trigger any repair)

# Production Readiness Checklist
- [ ] Alert runbooks documented and accessible to on-call team
- [ ] All repair artisan commands tested in staging
- [ ] Support dashboard deployed and accessible to support staff
- [ ] Audit logging active for all manual repair actions
- [ ] Authorization gates configured per repair action type
- [ ] Rate limit staggering implemented for bulk operations
- [ ] Incident response runbook covers all six alert types
- [ ] Drill/test of repair flows completed before going live with paid subscriptions

# Final Approval Checklist
- [ ] Architecture review completed (alert types, repair flows, CLI/UI duality)
- [ ] Security review completed (authorization, audit logging, output sanitization)
- [ ] Performance impact assessed (rate limiting, bulk operation staggering)
- [ ] Testing coverage adequate (commands, authorization, audit, dry-run)
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Rules/Skills/Trees/Anti-Patterns
## Rules
- Every Repair Action Must Be Both an Artisan Command and an Admin UI Action
- Always Provide a --dry-run Flag on Repair Commands
- Audit Log Every Manual Repair Action
- Gate Every Repair Endpoint Behind Explicit Authorization
- Respect Stripe API Rate Limits in Bulk Repair Operations
## Anti-Patterns
- No audit logging for manual repairs
- Repair commands without dry-run
- Ignoring Stripe rate limits in repair flows
- Repair logic in controllers only
- No authorization on repair endpoints
