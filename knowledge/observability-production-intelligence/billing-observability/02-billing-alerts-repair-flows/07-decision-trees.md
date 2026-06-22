# Decision Trees for Billing Alerts & Support Repair Flows

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Observability & Production Intelligence |
| Subdomain | Billing Observability |
| Knowledge Unit | Billing Alerts & Support Repair Flows |
| Related KUs | Billing webhook metrics, Alerting & incident response, Error tracking |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-BAR-001 | What repair action is appropriate for this billing incident? | P0 |
| DT-BAR-002 | Should this repair be available to support staff or engineering only? | P0 |
| DT-BAR-003 | Should this bulk repair run synchronously or be queued? | P1 |
| DT-BAR-004 | Is a dry-run needed before executing this repair? | P1 |

---

## DT-BAR-001: What Repair Action Is Appropriate for This Billing Incident?

### Decision Context
Different billing incidents require different repair actions. Replaying a webhook, force-syncing a subscription, recalculating entitlements, and retrying a failed job are distinct operations with different blast radii. Choosing the wrong repair can compound the incident.

### Decision Criteria
- What is the root cause of the billing incident?
- Is a single webhook unprocessed, or is the entire subscription out of sync?
- Are entitlements wrong, or is the subscription status wrong?
- Is the issue isolated to one team or affecting multiple teams?

### Decision Tree

```
What is the root cause of the billing incident?
├── Single webhook not processed or needs reprocessing
│   └── REPAIR: Manual webhook replay (php artisan billing:replay-webhook {stripeEventId})
├── Subscription status doesn't match Stripe
│   └── REPAIR: Subscription force-sync (php artisan billing:sync-subscription {teamId})
├── Feature access doesn't match plan + subscription
│   └── REPAIR: Entitlement recalculation (php artisan billing:recalculate-entitlements {teamId})
├── Queued job failed and needs retry
│   └── REPAIR: Failed job retry (php artisan queue:retry {jobId})
├── Multiple teams affected by drift
│   └── REPAIR: Bulk reconciliation (php artisan billing:reconcile --all-teams)
└── Unknown root cause
    └── INVESTIGATE FIRST. Do not repair blindly. Check metrics, logs, and Sentry.
```

### Rationale
Each repair action addresses a specific failure mode. Webhook replay re-processes a single event. Subscription sync overwrites local state from Stripe's API. Entitlement recalculation rebuilds the feature access map from plan + subscription + usage. Failed job retry re-executes a job that previously failed. Using the wrong repair (e.g., replaying a webhook when the subscription is fundamentally out of sync) doesn't fix the root cause.

### Recommended Default
**Investigate the root cause before repairing. Choose the repair action that addresses the specific failure mode. When in doubt, start with `--dry-run` to preview the changes.**

### Risks Of Wrong Choice
- **Wrong repair action**: Doesn't fix the root cause. May compound the issue by overwriting correct state with incorrect state.
- **Repairing without investigation**: Masks the root cause. The issue recurs because the underlying bug isn't fixed.

### Related Rules
- Every Repair Action Must Be Both an Artisan Command and an Admin UI Action

---

## DT-BAR-002: Should This Repair Be Available to Support Staff or Engineering Only?

### Decision Context
Different repair actions have different blast radii. Replaying a single webhook affects one event. Force-syncing a subscription overwrites local state. Recalculating entitlements for all teams is a mass update. Authorization levels should match the blast radius.

### Decision Criteria
- Does the repair affect a single team or multiple teams?
- Can the repair be reversed if done incorrectly?
- Does the repair call the Stripe API (rate limit concerns)?
- What's the training level of the support team?

### Decision Tree

```
Does the repair affect a single team?
├── NO (affects multiple teams or all teams) → ENGINEERING ONLY. Requires senior authorization.
│   └── Examples: billing:recalculate-entitlements --all-teams, billing:reconcile --all-teams
├── YES → Can the repair be reversed if done incorrectly?
    ├── NO → ENGINEERING ONLY. Irreversible repairs need senior oversight.
    │   └── Examples: force-deleting a subscription, overwriting payment history
    ├── YES → Does the repair call the Stripe API?
        ├── YES → SENIOR SUPPORT or ENGINEERING. API calls have rate limit implications.
        │   └── Examples: billing:sync-subscription (fetches from Stripe API)
        └── NO → SUPPORT STAFF. Low blast radius, reversible, no API concerns.
            └── Examples: billing:replay-webhook (re-dispatches an already-stored event)
```

### Rationale
The principle of least privilege applies to repair actions. A support agent who can replay webhooks but not force-sync subscriptions is safer than one who can do everything. Granular authorization ensures the right person performs the right repair with the right level of oversight.

### Recommended Default
**Webhook replay: support staff. Subscription sync: senior support. Entitlement recalc (single team): senior support. Entitlement recalc (all teams): engineering only. Match authorization to blast radius.**

### Risks Of Wrong Choice
- **Too permissive**: Support staff trigger destructive repairs. A new agent recalculates entitlements for all teams. Billing state corrupted.
- **Too restrictive**: Support staff can't help customers with routine billing issues. Every issue escalates to engineering. Response time increases.

### Related Rules
- Gate Every Repair Endpoint Behind Explicit Authorization

---

## DT-BAR-003: Should This Bulk Repair Run Synchronously or Be Queued?

### Decision Context
Bulk repair operations (e.g., `--all-teams` flag) make multiple Stripe API calls. Running synchronously in a single process risks Stripe rate limits (429 errors) and long execution times. Queuing individual syncs as separate jobs spreads the load over time.

### Decision Criteria
- How many teams/records does the bulk repair affect?
- Does each operation call the Stripe API?
- What's the acceptable completion time for the repair?
- Is the Stripe API quota shared with customer-facing operations?

### Decision Tree

```
How many records does the bulk repair affect?
├── < 25 → SYNCHRONOUS is acceptable. 25 API calls complete in under 1 second.
├── 25-100 → SYNCHRONOUS with staggered sleep. 100 calls at 25/sec = 4 seconds.
├── 100-1,000 → QUEUE INDIVIDUAL JOBS. Dispatch each sync as a separate job with sleep between batches.
└── > 1,000 → QUEUE with rate limiting. Dispatch in batches of 25, sleep 1 second between batches.
    └── Monitor Stripe API quota to avoid impacting customer-facing operations.
```

### Rationale
Stripe's rate limits (100/sec reads, 25/sec writes in live mode) are generous but not unlimited. A bulk repair that makes 1,000 API calls in a tight loop hits 429 errors, causing the Stripe SDK to retry with exponential backoff — the repair takes 15+ minutes instead of 40 seconds. Queuing individual syncs spreads the load and doesn't block the CLI process.

### Recommended Default
**For <100 records: synchronous with staggered sleep. For >100 records: queue individual jobs. Always monitor Stripe API quota during bulk operations.**

### Risks Of Wrong Choice
- **Synchronous for large bulk operations**: 429 errors from Stripe. Repair takes 15+ minutes. Customer-facing API calls (checkout, payment updates) get rate-limited.
- **Queued for small operations**: Overhead of job dispatch and worker processing for 10 records. Slower than synchronous.

### Related Rules
- Respect Stripe API Rate Limits in Bulk Repair Operations

---

## DT-BAR-004: Is a Dry-Run Needed Before Executing This Repair?

### Decision Context
Repairs that mutate billing state (subscription status, entitlements, payment records) are potentially irreversible. A `--dry-run` flag reports what would change without making changes. The decision determines whether to require dry-run before execution.

### Decision Criteria
- Does the repair mutate billing state?
- Is the repair reversible if done incorrectly?
- Does the repair affect a single team or multiple teams?
- Has the operator verified the expected changes?

### Decision Tree

```
Does the repair mutate billing state?
├── NO → No dry-run needed. Read-only reports and audits are safe.
├── YES → Is the repair reversible?
    ├── NO → DRY-RUN MANDATORY. Operator must verify before executing.
    ├── YES → Does the repair affect multiple teams?
        ├── YES → DRY-RUN RECOMMENDED. Bulk operations have wider blast radius.
        └── NO → DRY-RUN OPTIONAL but recommended for safety.
```

### Rationale
A dry-run lets the operator see exactly which teams would be affected and what changes would be made before committing. For irreversible repairs (overwriting subscription status, deleting payment records), dry-run is mandatory. For reversible single-team repairs, it's optional but a cheap safety measure.

### Recommended Default
**Default to requiring `--dry-run` for all state-mutating repairs. Make it optional only for trivially reversible single-record operations.**

### Risks Of Wrong Choice
- **No dry-run on irreversible repair**: Mistaken repair corrupts billing state. Cannot be undone. Manual Stripe reconciliation required.
- **Dry-run on read-only operation**: Unnecessary overhead. No harm but adds a step.

### Related Rules
- Always Provide a --dry-run Flag on Repair Commands
