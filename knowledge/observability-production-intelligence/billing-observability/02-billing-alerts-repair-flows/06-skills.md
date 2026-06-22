# Skill: Billing Alerts & Support Repair Flows

## Purpose
Translate billing monitoring metrics into actionable alerts with documented response procedures, and provide operations teams and support staff with safe, auditable, dual-interface (CLI + admin UI) repair tools for billing incidents. Ensure every repair action is logged, authorized, and rate-limit-aware.

## When To Use
- In every production Laravel SaaS with Stripe webhook processing
- When operations and support teams need standardized incident response procedures
- When subscription state correctness is critical to revenue
- After setting up billing metrics and before going live with paid subscriptions
- When building a support admin panel for billing health visibility and repair actions

## When NOT To Use
- During initial development before webhook handling is implemented
- For applications without billing or subscription management
- For non-production environments (manual Telescope/Sentry inspection is sufficient)

## Prerequisites
- Understanding of billing webhook metrics (what to alert on)
- Familiarity with Laravel Artisan commands and their design patterns
- Knowledge of authorization (Gates, Policies) for admin actions
- Understanding of audit logging for compliance
- Familiarity with Stripe API rate limits (100/sec reads, 25/sec writes)

## Inputs
- The billing alert types that need response procedures (webhook failure, drift, queue backlog)
- The repair actions that need to be available (webhook replay, subscription sync, entitlement recalculation)
- The support team roles and their authorization levels
- The Stripe API rate limits and available quota for repair operations
- The audit logging requirements (SOC2, PCI-DSS compliance)

## Workflow
1. **Document alert runbooks** — For each billing alert type (webhook delivery failure, processing failure rate, subscription drift, queue backlog, failed billing jobs, payment failure spike), document the detection criteria, response steps, and escalation procedure.
2. **Implement repair artisan commands** — Create `billing:replay-webhook`, `billing:sync-subscription`, `billing:recalculate-entitlements`, each with `--dry-run` flag. Use shared Action classes for the repair logic.
3. **Implement admin UI repair actions** — Create a `BillingRepairController` with methods for each repair action, calling the same shared Action classes. Gate each action behind specific authorization.
4. **Implement audit logging** — Every manual repair action writes to `billing_audit_logs` with `action`, `actor_id`, `team_id`, `metadata` (reason, before/after state), and `result`. Make logs queryable by `team_id` and `actor_id`.
5. **Gate every repair endpoint behind explicit authorization** — Different repair actions have different blast radii. A support agent may replay webhooks but not recalculate entitlements. Use granular Gates: `repair-webhooks`, `repair-subscriptions`, `repair-entitlements`.
6. **Respect Stripe API rate limits in bulk operations** — For `--all-teams` flags, stagger API calls with `sleep()` between batches. Queue individual syncs as separate jobs. Use Stripe SDK's built-in retry for 429 responses.
7. **Build a support dashboard** — Show recent webhook events, subscription statuses, drift reports, and repair action buttons. Include an audit log viewer for recent manual repairs.
8. **Test repair flows in staging** — Verify each repair action works correctly, the `--dry-run` flag reports without changing, and audit logs are written.

## Validation Checklist
- [ ] Alert runbooks documented for all six billing alert types
- [ ] Manual webhook replay command exists (`php artisan billing:replay-webhook`)
- [ ] Subscription force-sync command exists (`php artisan billing:sync-subscription`)
- [ ] Entitlement recalculation command exists with `--dry-run` flag
- [ ] Failed job recovery available via both Horizon UI and artisan command
- [ ] Every repair action available as both artisan command and admin UI action
- [ ] Audit log table exists and records every manual repair action
- [ ] All repair endpoints have explicit authorization (Gate/Policy) checks
- [ ] Rate limit awareness built into bulk operations (staggered API calls)
- [ ] Support dashboard shows recent events, subscription statuses, and drift reports
- [ ] Incident response runbook documented and accessible to on-call team

## Common Failures
- Repair commands without `--dry-run` — a mistaken bulk repair corrupts billing state
- No audit logging for manual repairs — cannot reconstruct what happened during an incident
- Repair logic only in controllers, not in artisan commands — support staff can't run repairs
- One authorization level for all repairs — support agents can trigger destructive operations
- Ignoring Stripe rate limits in bulk repair — 429 errors cause partial repair failures

## Decision Points
- **Which repairs need CLI vs. UI?** — All repairs need both. CLI for on-call engineers, UI for support staff
- **Which repairs need `--dry-run`?** — Any repair that mutates state. Read-only reports don't need it
- **What authorization level for each repair?** — Calibrate to blast radius: webhook replay (support), subscription sync (senior support), entitlement recalc (engineering)
- **How to handle bulk operations?** — Stagger API calls, queue individual syncs, respect rate limits

## Performance Considerations
- Bulk repair operations should queue individual syncs as separate jobs rather than processing in a loop
- Stripe API rate limits: 100/sec reads, 25/sec writes (live mode). Stagger to stay within limits.
- Audit log table grows with every repair action — index by `team_id` and `actor_id` for query performance
- Support dashboard queries should be lightweight — use cached values refreshed by scheduled jobs

## Security Considerations
- Every repair endpoint must have explicit authorization (Gate or Policy)
- Audit logs must record `actor_id` for compliance — untraceable billing changes are a compliance finding
- Repair commands should not be accessible via HTTP (only artisan CLI and authorized admin UI)
- The `billing_audit_logs` table contains sensitive billing state — restrict access
- Rate-limit repair endpoints to prevent abuse

## Related Rules (from 05-rules.md)
- Every Repair Action Must Be Both an Artisan Command and an Admin UI Action
- Always Provide a --dry-run Flag on Repair Commands
- Audit Log Every Manual Repair Action
- Gate Every Repair Endpoint Behind Explicit Authorization
- Respect Stripe API Rate Limits in Bulk Repair Operations

## Related Skills
- Billing webhook metrics (the metrics that trigger alerts)
- Webhook queue design (the pipeline being repaired)
- Team-scoped Spatie Permission (authorization for repair actions)

## Success Criteria
- Every billing alert has a documented runbook with response steps
- Support staff can repair common billing issues without engineering escalation
- Every manual repair is auditable — who, what, why, and result
- Repair actions are authorized at the appropriate level for their blast radius
- Bulk operations respect Stripe API rate limits and don't cause 429 errors
- The support dashboard provides billing health visibility and repair access in one place
