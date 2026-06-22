# Anti-Patterns for Billing Alerts & Support Repair Flows

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Observability & Production Intelligence |
| Subdomain | Billing Observability |
| Knowledge Unit | Billing Alerts & Support Repair Flows |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-BAR-001 | No Audit Logging for Manual Repairs | High | Medium |
| AP-BAR-002 | Repair Commands Without Dry-Run | High | Medium |
| AP-BAR-003 | CLI-Only Repairs (No Admin UI) | Medium | High |
| AP-BAR-004 | One Authorization Level for All Repairs | High | Medium |
| AP-BAR-005 | Ignoring Stripe Rate Limits in Bulk Repairs | High | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-BWM-001 (Metrics Only in Stripe Dashboard) — from Billing Webhook Metrics
- AP-BWM-004 (No Subscription Drift Reconciliation) — from Billing Webhook Metrics

---

## AP-BAR-001: No Audit Logging for Manual Repairs

### Category
Security | Compliance | Operations

### Description
Performing manual billing repair actions (webhook replay, subscription sync, entitlement recalculation) without writing audit log entries. There is no record of who performed the repair, what was changed, why it was needed, or what the result was. When a customer disputes a charge or questions their subscription history, the team cannot reconstruct what happened.

### Why It Happens
- The repair command was created quickly during an incident and audit logging was an afterthought
- "It's an internal tool, we don't need audit logs" mentality
- No compliance requirement was perceived at the time
- The repair logic is in a controller method with no audit logging call

### Warning Signs
- No `billing_audit_logs` table in the database
- Repair commands and controllers that modify billing state without writing audit entries
- No way to answer "who changed this customer's subscription and why?"
- SOC2 or PCI-DSS audit findings about missing audit trails for manual billing changes
- Support staff perform repairs without documenting the reason

### Why Harmful
Manual billing repairs bypass the normal webhook-driven state transitions. Without audit logging, there is no record of who changed what and why. When a customer disputes a charge, the support team cannot verify whether a manual repair was performed. For SOC2, PCI-DSS, and internal compliance, all manual billing state modifications must be traceable to an authorized actor with a documented reason.

### Real-World Consequences
- A support agent force-syncs a customer's subscription from Stripe after the customer reports "my plan shows as free even though I paid." The sync corrects the issue. No audit log is written. Three months later, the customer disputes a charge, claiming they never had a paid subscription. The team investigates and finds the subscription was manually synced, but there's no record of who did it, when, or why. The dispute cannot be contested with evidence. The customer wins the chargeback.

### Preferred Alternative
Every manual billing repair action must write an audit log entry to a `billing_audit_logs` table with: `action` (repair type), `actor_id` (who performed it), `team_id` (affected team), `metadata` (reason, before/after state), and `result`. Logs must be queryable by both `team_id` (for customer investigations) and `actor_id` (for internal reviews).

### Refactoring Strategy
1. Create a `billing_audit_logs` migration with the fields described above.
2. Create a `BillingAuditLog` model.
3. Add audit logging to every repair command and controller method.
4. Ensure the `reason` field is required in the admin UI (support staff must explain why).
5. Create an audit log viewer in the support dashboard.

### Detection Checklist
- [ ] No `billing_audit_logs` table in the database
- [ ] Repair commands modify billing state without writing audit entries
- [ ] No way to answer "who changed this customer's subscription and why?"
- [ ] No `reason` field required for manual repairs
- [ ] No audit log viewer in the support dashboard

### Related Rules
- Audit Log Every Manual Repair Action

---

## AP-BAR-002: Repair Commands Without Dry-Run

### Category
Operations | Safety

### Description
Billing repair commands that modify state directly without a `--dry-run` option. The operator cannot preview what would change before committing. A mistaken bulk repair (wrong team ID, `--all-teams` flag) corrupts billing state for multiple customers with no preview.

### Why It Happens
- The repair command was created quickly during an incident
- The developer didn't think of adding `--dry-run`
- "It's a simple command, we know what it does" mentality
- No precedent for dry-run flags in existing commands

### Warning Signs
- Repair commands without a `--dry-run` flag
- No way to preview changes before executing
- A bulk repair (`--all-teams`) that modifies state immediately
- Support staff hesitant to run repair commands because they can't preview
- Past incidents where a repair command was run on the wrong team

### Why Harmful
Repair commands modify billing state — subscription statuses, entitlements, payment records. Running a repair on the wrong team, or a bulk repair with unintended scope, can corrupt billing state for multiple customers. Without `--dry-run`, the operator must trust their understanding of the command's behavior. In an incident scenario with time pressure, mistakes happen.

### Real-World Consequences
- A support agent runs `php artisan billing:recalculate-entitlements --all-teams` to fix one team's entitlements. The `--all-teams` flag recalculates for all 500 teams. Without `--dry-run`, the agent couldn't preview. 50 teams that had custom entitlement overrides lose their overrides — the recalculation resets them to plan defaults. 50 customers lose access to features they paid for. The agent discovers the error when support tickets start arriving 2 hours later.

### Preferred Alternative
Every billing repair command that mutates state must support a `--dry-run` flag that reports what would change without making changes. The operator runs `--dry-run` first, verifies the output, then runs without the flag.

### Refactoring Strategy
1. Identify all repair commands that mutate billing state.
2. Add a `--dry-run` option to each command's signature.
3. In the `handle()` method, check `$this->option('dry-run')` and skip the actual mutation.
4. Output what would change: "Team 1: would set entitlements: ['reports', 'api']"
5. Document the `--dry-run` workflow in the runbook.

### Detection Checklist
- [ ] Repair commands without a `--dry-run` flag
- [ ] No way to preview changes before executing
- [ ] Bulk repair (`--all-teams`) that modifies state immediately
- [ ] Support staff hesitant to run repair commands
- [ ] Past incidents from running repairs on the wrong team

### Related Rules
- Always Provide a --dry-run Flag on Repair Commands

---

## AP-BAR-003: CLI-Only Repairs (No Admin UI)

### Category
Operations | Tooling

### Description
Billing repair actions available only as artisan CLI commands, with no admin UI. Support staff without SSH access cannot perform repairs — every billing issue must be escalated to engineering. This creates bottlenecks and delays customer resolution.

### Why It Happens
- The repair command was created by engineering for engineering use
- Building an admin UI feels like extra work for a "simple" repair
- No support dashboard exists in the application
- The team hasn't considered support staff as repair users

### Warning Signs
- Repair artisan commands exist but no admin UI controller exists
- Support staff escalate all billing issues to engineering
- No `BillingRepairController` in the codebase
- Support staff request SSH access to run repair commands
- Engineering is a bottleneck for routine billing repairs

### Why Harmful
During business hours, support staff handle customer billing issues — they should not need SSH access or engineering escalation for routine repairs like webhook replay or subscription sync. CLI-only repairs create a bottleneck: every billing issue must wait for an engineer with SSH access. Customer resolution time increases. Engineering spends time on routine repairs instead of feature development.

### Real-World Consequences
- A support agent receives a ticket at 10 AM: "Customer's subscription shows as cancelled even though they paid." The fix is a subscription sync — a 5-second artisan command. But the support agent doesn't have SSH access. They escalate to engineering. The engineer is in a meeting until 2 PM. The customer waits 4 hours for a 5-second fix. If an admin UI existed, the support agent would have fixed it in 30 seconds.

### Preferred Alternative
Every repair action must be available as both an artisan command (for on-call engineers) and an admin UI action (for support staff). The underlying repair logic should be in a shared Action class called by both the command and the controller. This ensures the right tool is available to the right person at the right time.

### Refactoring Strategy
1. Extract repair logic from existing artisan commands into shared Action classes.
2. Create a `BillingRepairController` with methods for each repair action.
3. Each controller method calls the shared Action and writes an audit log.
4. Gate each controller method behind appropriate authorization.
5. Add repair action buttons to the support dashboard.

### Detection Checklist
- [ ] Repair artisan commands exist but no admin UI controller
- [ ] Support staff escalate all billing issues to engineering
- [ ] No `BillingRepairController` in the codebase
- [ ] Support staff request SSH access to run repairs
- [ ] Engineering is a bottleneck for routine billing repairs

### Related Rules
- Every Repair Action Must Be Both an Artisan Command and an Admin UI Action

---

## AP-BAR-004: One Authorization Level for All Repairs

### Category
Security | Authorization

### Description
All billing repair actions gated behind a single authorization level (e.g., `can:access-admin`). A support agent with admin access can trigger all repairs, including potentially destructive ones like bulk entitlement recalculation. This violates the principle of least privilege.

### Why It Happens
- A single `admin` role was easier to implement than granular permissions
- "We trust our support staff" mentality
- No analysis of different repair blast radii
- The admin panel was built quickly with a single auth check

### Warning Signs
- All repair endpoints share the same middleware: `$this->middleware('can:access-admin')`
- No granular Gates for individual repair actions
- A support agent can recalculate entitlements for all teams
- No distinction between "can replay webhooks" and "can sync subscriptions"
- A new support agent has the same repair access as a senior engineer

### Why Harmful
Different repair actions have different blast radii. Replaying a single webhook affects one event. Force-syncing a subscription overwrites local state. Recalculating entitlements for all teams is a mass-update operation. Without granular authorization, a support agent with access to one repair can trigger all repairs — including potentially destructive ones. A new support agent can accidentally recalcalculate entitlements for all teams.

### Real-World Consequences
- A new support agent with admin access tries to fix a single team's feature access. They mistakenly run `billing:recalculate-entitlements --all-teams` instead of specifying a team ID. All 500 teams' entitlements are recalculated. 50 teams with custom overrides lose them. The agent had access to the bulk operation because all repairs shared one authorization level. If granular authorization existed, the agent would only have access to single-team repairs, not bulk operations.

### Preferred Alternative
Gate each repair action behind a specific Gate: `repair-webhooks` (support agents), `repair-subscriptions` (senior support), `repair-entitlements` (engineering only). Different repair actions have different authorization requirements based on their blast radius.

### Refactoring Strategy
1. List all repair actions and their blast radii.
2. Define granular Gates: `repair-webhooks`, `repair-subscriptions`, `repair-entitlements`.
3. Replace the single `can:access-admin` middleware with per-action Gate checks.
4. Assign Gates to roles: support agent → `repair-webhooks`, senior support → `repair-webhooks` + `repair-subscriptions`, engineering → all.
5. Test that a support agent cannot access engineering-only repairs.

### Detection Checklist
- [ ] All repair endpoints share the same middleware (`can:access-admin`)
- [ ] No granular Gates for individual repair actions
- [ ] Support agents can trigger bulk operations
- [ ] No distinction between repair action authorization levels
- [ ] New support agents have same repair access as senior engineers

### Related Rules
- Gate Every Repair Endpoint Behind Explicit Authorization

---

## AP-BAR-005: Ignoring Stripe Rate Limits in Bulk Repairs

### Category
Operations | External API Safety

### Description
Bulk repair operations (e.g., `--all-teams` flag) that make Stripe API calls in a tight loop without staggering. Exceeding Stripe's rate limits (100/sec reads, 25/sec writes in live mode) causes 429 errors, SDK retries with exponential backoff, and partial repair failures.

### Why It Happens
- The developer didn't consider Stripe rate limits
- "It's only 500 API calls, that's nothing" — but at 25/sec writes, 500 calls = 20 seconds if staggered, or 429 errors if not
- No awareness that repair operations share API quota with customer-facing operations
- The bulk repair was tested with 10 teams in staging (no rate limit issues) and deployed with 500 teams in production

### Warning Signs
- Bulk repair commands that call Stripe API in a `->each()` loop without `sleep()`
- 429 errors from Stripe during bulk repair operations
- Bulk repairs that take 15+ minutes due to SDK retry backoff
- Customer-facing Stripe operations (checkout, payment updates) failing with 429 during bulk repairs
- No staggering or queueing in bulk repair logic

### Why Harmful
Exceeding Stripe's rate limits causes 429 responses. The Stripe SDK automatically retries with exponential backoff — a bulk operation intended to take 30 seconds instead takes 10+ minutes. Some API calls may still fail permanently after exhausting retries. Additionally, rate-limited repair requests consume the same API quota as customer-facing operations (checkout, payment method updates), causing legitimate customer operations to fail.

### Real-World Consequences
- An engineer runs `php artisan billing:sync-subscription --all-teams` for 500 teams. The command calls `$stripe->subscriptions->retrieve()` for each team in a tight loop. After 100 calls (1 second), Stripe returns 429 for the remaining 400. The SDK retries with backoff: 1s, 2s, 4s, 8s... The repair takes 15 minutes. During those 15 minutes, 3 customers trying to update their payment methods get 429 errors. One customer's checkout fails. The repair completes but 12 teams' syncs failed permanently after exhausting retries.

### Preferred Alternative
Stagger API calls in bulk repair operations. For <100 records, use `sleep(1)` between batches of 25. For >100 records, queue individual syncs as separate jobs with natural staggering from queue processing. Use Stripe SDK's built-in retry mechanism for occasional 429s. Monitor Stripe API quota during bulk operations.

### Refactoring Strategy
1. Identify bulk repair commands that call Stripe API in a loop.
2. Add `sleep(1)` between batches of 25 (for synchronous commands).
3. For large bulk operations, dispatch individual sync jobs to the `billing` queue.
4. Monitor Stripe API error rate during bulk operations.
5. Document the expected completion time for bulk repairs so operators know if it's taking too long.

### Detection Checklist
- [ ] Bulk repair commands call Stripe API in a tight loop without staggering
- [ ] 429 errors from Stripe during bulk repairs
- [ ] Bulk repairs take 15+ minutes due to SDK retry backoff
- [ ] Customer-facing Stripe operations fail with 429 during bulk repairs
- [ ] No staggering or queueing in bulk repair logic

### Related Rules
- Respect Stripe API Rate Limits in Bulk Repair Operations
