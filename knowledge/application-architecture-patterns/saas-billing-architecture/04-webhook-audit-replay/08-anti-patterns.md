# Anti-Patterns: Webhook Audit Log, Replay & Reconciliation

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | SaaS Billing Architecture |
| Knowledge Unit | Webhook Audit Log, Replay & Reconciliation |
| Audience | Developers, Billing Engineers, Operations |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-WAR-01 | Mutating Event Payloads After Creation | Critical | Low | Low |
| AP-WAR-02 | Replaying Non-Idempotent Handlers | Critical | Medium | High |
| AP-WAR-03 | Auto-Repairing Plan Changes During Reconciliation | Critical | Medium | Low |
| AP-WAR-04 | Reconciliation Without Rate Limiting | High | Medium | Medium |
| AP-WAR-05 | Silent Repair With No Audit Trail | High | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **No Audit Log — Events Processed and Forgotten**: Webhooks are processed and state is updated with no record of the raw event that caused the change
- **Replay Before Verifying Idempotency**: Enabling the replay feature without first auditing all handlers for idempotent operations
- **Reconciliation as Primary Sync**: Treating reconciliation as the main synchronization mechanism instead of fixing broken webhook processing

---

## 1. Mutating Event Payloads After Creation

### Category
Data Integrity · Critical

### Description
Updating or "fixing" the `payload` column of a StripeEvent record after creation, destroying the integrity of the audit log by altering the original Stripe webhook data.

### Why It Happens
A webhook handler fails because the payload is "malformed" or contains unexpected data. The developer updates the payload to "fix" the data so the handler can process it. Or a support engineer manually edits a payload to correct a Stripe error. The intent is to get the event processed, but the method corrupts the audit trail.

### Warning Signs
- `$event->update(['payload' => [...]]);` anywhere in the codebase
- `$event->payload['data']['object']['status'] = 'active';` — array mutation before save
- StripeEvent records with payloads that don't match what Stripe's API would return
- Inability to reproduce processing bugs because the original payload was changed

### Why Harmful
The StripeEvent payload is the authoritative record of "what Stripe told us." If payloads can be modified after the fact, the audit log loses all credibility. Auditors cannot verify that processing was correct because the input record may have been altered. Debugging becomes impossible — "was the original payload different from what we see now?" is unanswerable. The entire audit system becomes untrustworthy.

### Real-World Consequences
- Billing discrepancy investigation: auditor asks to see the original webhook. The payload has been "fixed" — cannot prove what Stripe originally sent
- Compliance audit: auditor finds modified payloads and flags the entire billing audit system as unreliable
- Bug investigation: "why did this subscription get created with trial_days=0?" The original payload had trial_days=14, but someone "fixed" it after the bug was discovered
- Legal dispute: customer claims they were on a trial. Company shows the StripeEvent payload. Customer's attorney proves the payload was modified after creation.

### Preferred Alternative
The `payload` column is immutable after creation. If the original payload has an issue, create a new StripeEvent (or a separate note record) with the correction. Process the corrected data without mutating the original. The audit log preserves the original payload forever.

### Refactoring Strategy
1. Remove any code that modifies `payload` or `stripe_event_id` after creation
2. Add a database-level guard: use column permissions or an `UPDATE` trigger that prevents payload changes
3. Document the append-only constraint in code comments and team onboarding
4. If payload fixes are needed, create a separate `payload_corrections` table linked to the original event
5. Audit existing StripeEvent records for modified payloads (compare `created_at` vs `updated_at` for events where status is `processed`)

### Detection Checklist
- [ ] Is there any code that updates the `payload` column after the StripeEvent is created?
- [ ] Do `created_at` and `updated_at` timestamps differ for processed events?
- [ ] Can an auditor trust that the payload column contains the original Stripe data?
- [ ] Is the append-only constraint documented for the development team?
- [ ] Is there a separate mechanism for recording payload corrections?

### Related Rules/Skills/Trees
- Rule 1: The Audit Log Is Append-Only — Never Mutate Event Payloads
- Implement Webhook Audit Log, Replay & Reconciliation (06-skills.md)

---

## 2. Replaying Non-Idempotent Handlers

### Category
Data Integrity · Critical

### Description
Enabling webhook replay without first verifying that all handler classes use idempotent operations, resulting in duplicate records when events are replayed.

### Why It Happens
The replay functionality is built as a feature without considering the preconditions. A developer adds a "Replay" button to the admin panel. It works for the subscription handler (which happens to use `updateOrCreate`). Nobody checks the other 8 handlers. A support engineer replays an invoice event and creates duplicate payment records.

### Warning Signs
- Replay feature exists but no handler idempotency audit has been performed
- Handlers use `create()` or `insert()` instead of `updateOrCreate`/`upsert`
- No replay safety manifest documenting which event types are safe to replay
- Replay button enabled for all event types without discrimination

### Why Harmful
Replaying a non-idempotent handler is equivalent to processing a duplicate webhook without deduplication protection. A `subscription.created` handler using `create()` produces a duplicate subscription. An `invoice.payment_succeeded` handler using `create()` produces a duplicate payment record and sends a duplicate receipt. The replay system, intended as a safety net, becomes a data corruption tool.

### Real-World Consequences
- Support replays `invoice.payment_succeeded` for a failed event → duplicate payment record → customer's dashboard shows "paid twice" → customer disputes the charge
- Automated replay of 50 failed `subscription.created` events → 50 duplicate subscriptions → revenue reporting shows 50 phantom customers
- Monthly reconciliation triggers replay of all failed events → 200 duplicate records created before the ops team notices and stops it
- Development team disables replay entirely because "it's too dangerous" — legitimate need for replay goes unmet

### Preferred Alternative
Before enabling replay, audit every handler. Verify all handlers use `updateOrCreate`/`upsert`. Document idempotency status in a replay manifest. Only enable replay for event types with verified-idempotent handlers. Add architecture tests that flag `::create(` calls in handler classes.

### Refactoring Strategy
1. Audit every webhook handler for idempotent operations
2. Replace `create()` with `updateOrCreate()` where needed
3. Create a replay safety manifest (array mapping event type → safe to replay boolean)
4. In the replay service, check the manifest before allowing replay
5. Add a Pest architecture test: `expect('App\Billing\Handlers')->not->toUse('::create(');`
6. Test replay for every event type: replay twice, verify only one record exists

### Detection Checklist
- [ ] Has every webhook handler been audited for idempotency?
- [ ] Does a replay safety manifest exist and is it checked before replay?
- [ ] Are there architecture tests verifying handlers don't use `::create()`?
- [ ] Can each handler be called twice with the same payload without producing duplicates?
- [ ] Does the replay UI distinguish between safe-to-replay and not-safe events?

### Related Rules/Skills/Trees
- Rule 2: Replay Must Be Safe — All Handlers Must Be Idempotent Before Enabling Replay
- Rule 4 (Webhook Idempotency): All Webhook Handlers Must Use Idempotent Operations
- Implement Webhook Audit Log, Replay & Reconciliation (06-skills.md)
- Replay Safety Enforcement — Manual Verification vs Automated Handler Audit (07-decision-trees.md)

---

## 3. Auto-Repairing Plan Changes During Reconciliation

### Category
Data Integrity · Business Risk · Critical

### Description
Reconciliation logic that automatically updates a team's plan/price when drift is detected, silently changing what the customer is charged without their knowledge or consent.

### Why It Happens
The reconciliation code treats all drift equally: detect a difference, apply Stripe's value as the "correct" one. The developer sees plan drift as just another field mismatch to fix. They don't realize that changing the plan has financial implications. The code is a simple `$subscription->update(['plan_id' => ...])` — it works technically but is wrong ethically and operationally.

### Warning Signs
- Reconciliation repair loop iterates over all drift items and applies all Stripe values indiscriminately
- Plan field is listed alongside date fields in auto-repair logic
- No distinction between "safe" and "critical" drift in the repair code
- No DriftAlert or review queue for plan changes
- `if ($planDrift) { $subscription->update(['plan_id' => $newPlan->id]); }` in repair code

### Why Harmful
Changing a customer's plan changes what they're charged. A plan drift detected during reconciliation usually means someone changed the plan in the Stripe Dashboard — which is intentional. Auto-applying that change silently to the local database may switch a customer from Enterprise ($999/mo) to Starter ($29/mo) or the reverse, without their knowledge, consent, or notification. This creates billing disputes, revenue impact, and customer trust erosion.

### Real-World Consequences
- Finance team changes a customer's plan in Stripe Dashboard from Pro to Enterprise for an upsell
- Reconciliation runs 20 minutes later, detects "drift" (planPro vs planEnterprise), auto-repairs back to Pro
- Customer is now on the wrong plan. Finance doesn't know their change was silently reverted
- OR: Support changes a plan in Stripe to Starter as a retention discount
- Reconciliation auto-repairs back to Pro → customer is overcharged → chargeback → customer churns
- Regulatory: changing a customer's billed amount without consent may violate consumer protection laws

### Preferred Alternative
Plan drift is always CRITICAL severity. Reconciliation must alert on plan drift (create a DriftAlert record, send to Slack/email) but never auto-repair it. A human reviews the drift, determines whether Stripe or local state is authoritative, and manually resolves it.

### Refactoring Strategy
1. Classify drift items by severity: LOW (dates), MEDIUM (status), CRITICAL (plan, orphaned)
2. Auto-repair loop processes only items with `safeForAutoRepair = true`
3. Plan drift items create a DriftAlert record with status `pending_review`
4. Add a manual review UI or CLI for resolving plan drift alerts
5. Document the procedure: who reviews plan drift, how they decide, what they do

### Detection Checklist
- [ ] Does the repair loop distinguish between safe and critical drift?
- [ ] Is plan drift excluded from auto-repair?
- [ ] Does plan drift trigger an alert and create a reviewable record?
- [ ] Is there a documented procedure for handling plan drift alerts?
- [ ] Would a Stripe Dashboard plan change be auto-reverted by reconciliation?

### Related Rules/Skills/Trees
- Rule 3: Auto-Repair Only Safe Fields — Never Auto-Repair Plan Changes
- Rule 2 (Drift): Classify Drift by Severity — Never Treat All Drift Equally
- Detect and Repair Subscription Drift (06-skills.md)
- Reconciliation Auto-Repair Scope — Safe Fields Only vs Extended Repair (07-decision-trees.md)

---

## 4. Reconciliation Without Rate Limiting

### Category
Performance · Reliability

### Description
Running reconciliation jobs that query Stripe API for every active subscription without inserting delays between calls, causing Stripe to return HTTP 429 (Too Many Requests) errors and the reconciliation to fail mid-batch.

### Why It Happens
During development, the developer tests reconciliation with a handful of subscriptions. It runs in milliseconds. Stripe's test mode has higher rate limits. The rate limiting code is omitted as "premature optimization." When deployed to production with thousands of subscriptions, the un-rate-limited loop hits Stripe's live mode limit (~25 req/sec) within 1-2 seconds.

### Warning Signs
- `foreach ($teams as $team) { $gateway->getSubscription($team); }` with no delay between iterations
- No `usleep()` or `sleep()` between Stripe API calls in the reconciliation loop
- Stripe API logs showing clusters of 429 errors during reconciliation windows
- Reconciliation job fails partway through with `ApiErrorException` HTTP 429
- Some subscriptions are reconciled, others are not — inconsistent coverage

### Why Harmful
When Stripe returns 429, the reconciliation loop fails for that team and all subsequent teams until the error is handled. If the loop breaks on first error, most subscriptions are never reconciled. If the loop continues without backoff, more 429 errors follow. The result: partial reconciliation, unknown coverage, and a reconciliation system that can't be trusted to catch all drift.

### Real-World Consequences
- 5,000 active subscriptions, reconciliation runs nightly
- First 25 calls succeed, call 26 returns 429
- Loop breaks on exception — 4,975 subscriptions not reconciled
- Drift accumulates for weeks on the unreconciled subscriptions
- Customer reports "my plan shows wrong features" — support manually fixes, doesn't check if drift caused it
- Ops team assumes "reconciliation ran successfully" because the job didn't error (the 429 was caught and swallowed)

### Preferred Alternative
Insert a delay between Stripe API calls: `usleep(50000)` (50ms = ~20 calls/sec). Catch 429 errors and implement exponential backoff. Use a queue with concurrency limiting instead of a synchronous loop for large subscription counts. Log and alert when rate limiting occurs.

### Refactoring Strategy
1. Add `usleep(50000)` between Stripe API calls in the reconciliation loop
2. Wrap API calls in try-catch for `ApiErrorException`
3. On 429: log warning, sleep 5 seconds, retry up to 3 times
4. Move reconciliation to a queued job for better retry and concurrency control
5. Monitor Stripe API rate limit usage via Stripe dashboard and set alerts
6. Test rate limiting behavior in staging with a realistic subscription count

### Detection Checklist
- [ ] Is there a delay between Stripe API calls in the reconciliation loop?
- [ ] Does reconciliation handle 429 errors with backoff and retry?
- [ ] What is the maximum number of Stripe API calls reconciliation makes per minute?
- [ ] Are Stripe rate limit errors monitored and alerted?
- [ ] Does reconciliation successfully complete for the full subscription base?

### Related Rules/Skills/Trees
- Rule 5: Rate-Limit Reconciliation API Calls to Avoid Stripe 429 Errors
- Implement Webhook Audit Log, Replay & Reconciliation (06-skills.md)
- Reconciliation Scheduling — Single-Server vs Sharded by Team (07-decision-trees.md)

---

## 5. Silent Repair With No Audit Trail

### Category
Compliance · Operations

### Description
Reconciliation repairs subscription state without logging what was changed, the before/after values, or who initiated the repair, making it impossible to audit or investigate billing state changes.

### Why It Happens
The repair code updates the subscription record and moves on. Adding audit logging feels like boilerplate. The developer assumes "we can always check the database logs" or "we'll add logging later." The repair happens silently, and the state change is indistinguishable from a normal webhook update.

### Warning Signs
- `$subscription->update([...])` in repair code with no preceding or following log statement
- No RepairAudit or DriftRepairLog table in the database
- Cannot answer "why did team X's subscription status change on Tuesday at 3am?"
- Billing audits require database diffing or log archaeology to trace state changes
- Reconciliation runs nightly but there's no record of what it did

### Why Harmful
Without audit trails, reconciliation changes are invisible. When a customer disputes a billing change, you cannot prove whether the change came from a webhook, a direct Stripe Dashboard action, or a reconciliation repair. SOC2 and PCI-DSS auditors require audit trails for all state changes — silent repairs fail this requirement. Debugging a cascade failure becomes impossible because one silent repair triggered another change that triggered another.

### Real-World Consequences
- SOC2 audit: auditor asks "explain this subscription status change" — no audit record exists, cannot explain
- Customer complains "my subscription was canceled overnight" — investigation shows reconciliation auto-repaired a status from active to canceled based on a Stripe API glitch, but there's no log of the repair
- Bug: reconciliation incorrectly marks 200 subscriptions as canceled. Without audit logs, identifying which subscriptions were affected requires a full database backup comparison
- Compliance penalty: failed audit because billing state changes have no audit trail

### Preferred Alternative
Every repair action must log: team ID, Stripe subscription ID, field changed, old value, new value, actor (system:reconciliation or user ID), and timestamp. Store in a `repair_audits` table. Send critical repairs to a dedicated Slack channel. The audit trail must be immutable (append-only).

### Refactoring Strategy
1. Create a RepairAudit model and migration with fields for team_id, subscription_id, field, old_value, new_value, actor, timestamp
2. Add audit logging before every repair operation
3. Log at both the application level (Laravel log channel) and database level (RepairAudit table)
4. Create an admin UI for viewing repair history by team and date
5. Add monitoring: alert if repair count exceeds threshold (indicates systemic issue)

### Detection Checklist
- [ ] Does every repair operation log before/after values?
- [ ] Is there a RepairAudit table or equivalent in the database?
- [ ] Can you trace a subscription state change to its source (webhook, reconciliation, manual)?
- [ ] Do repair logs include actor identity?
- [ ] Are repair logs immutable after creation?

### Related Rules/Skills/Trees
- Rule 4: Log Every Reconciliation Repair With Before/After State
- Rule 1 (Audit): The Audit Log Is Append-Only — Never Mutate Event Payloads
- Implement Webhook Audit Log, Replay & Reconciliation (06-skills.md)
