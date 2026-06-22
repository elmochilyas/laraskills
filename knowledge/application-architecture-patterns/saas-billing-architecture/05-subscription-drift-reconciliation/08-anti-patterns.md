# Anti-Patterns: Subscription Drift Detection & Repair

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | SaaS Billing Architecture |
| Knowledge Unit | Subscription Drift Detection & Repair |
| Audience | Developers, Billing Engineers, Operations |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-SDR-01 | Pushing Local State to Stripe During Reconciliation | Critical | Low | Low |
| AP-SDR-02 | Zero Clock Skew Tolerance on Date Comparisons | High | High | Low |
| AP-SDR-03 | Treating All Drift as Equal Severity | High | High | Medium |
| AP-SDR-04 | Ignoring Orphaned Subscriptions | Critical | Medium | Low |
| AP-SDR-05 | Reconciliation as Primary Sync Instead of Safety Net | High | Medium | High |

---

## Repository-Wide Anti-Patterns

- **No Automated Reconciliation**: Relying entirely on manual checks or customer reports to discover billing state drift
- **Reconciliation Without Webhook Fixes**: Running reconciliation hourly to paper over webhook processing bugs that should be fixed at the source
- **All-Drift-Alerts**: Alerting on every drift item across all severity levels, causing alert fatigue and ignored billing alerts

---

## 1. Pushing Local State to Stripe During Reconciliation

### Category
Data Integrity · Business Risk · Critical

### Description
Reconciliation logic that updates Stripe subscription data (via the Stripe API) to match local state when drift is detected, reversing the correct direction of truth (Stripe → local, never local → Stripe).

### Why It Happens
"Fixing drift" naturally suggests bringing the two systems into agreement. The developer may reason: "if they disagree, one must be wrong — but which one?" Without the cardinal rule that Stripe is always authoritative, the code might arbitrarily choose to push local state to Stripe. This is especially likely if the developer tests with a local database that has the "correct" state and Stripe test mode that has "incorrect" state.

### Warning Signs
- `$stripe->subscriptions->update(...)` or `$gateway->updateSubscription(...)` in reconciliation code
- Stripe API mutation calls within drift repair methods
- Logic that writes to both local database AND Stripe during reconciliation
- "Sync both directions" comments in reconciliation code

### Why Harmful
Pushing local state to Stripe modifies the customer's actual billing arrangement — their plan, their status, their payment terms — based on a local cache that is known to be stale (that's why drift exists). This can change what the customer is charged, cancel their subscription, or alter their payment method. The local cache is authoritative; Stripe is definitive. Defective local state must not overwrite correct Stripe state.

### Real-World Consequences
- Webhook processing bug sets 200 subscriptions to `canceled` locally. Reconciliation "fixes the drift" by canceling those 200 subscriptions in Stripe. Customers are billed nothing, lose access, and flood support.
- Local database restored from a backup (24 hours stale). Reconciliation runs, detects "drift" (Stripe shows plan upgraded 12 hours ago), pushes old plan back to Stripe. Customer downgraded without consent.
- Developer tests reconciliation in staging with `--auto-repair`. Pushes test data to Stripe test mode. Later, accidentally runs against production Stripe with the test configuration.

### Preferred Alternative
Stripe is always the source of truth. Reconciliation only updates local state to match Stripe. Never make Stripe API mutation calls during reconciliation. If Stripe's state appears wrong, a human investigates and manually corrects Stripe via the Dashboard — never via automated reconciliation.

### Refactoring Strategy
1. Audit reconciliation code for any Stripe API mutation calls
2. Remove or disable all Stripe-update code paths in reconciliation
3. Add a comment asserting the directional rule at the top of reconciliation classes
4. Add a code review checklist item: "Does this PR modify Stripe state during reconciliation?"
5. Test: set up deliberate drift, run reconciliation, verify Stripe state is unchanged

### Detection Checklist
- [ ] Are there any Stripe API mutation calls (`update`, `cancel`, `create`) in reconciliation code?
- [ ] Does reconciliation ever call `$stripe->...` or `$gateway->...` with mutation operations?
- [ ] Is the rule "Stripe is source of truth — update local, never push to Stripe" documented?
- [ ] Can reconciliation accidentally modify live Stripe data?
- [ ] Is there a code review check for Stripe mutations in reconciliation PRs?

### Related Rules/Skills/Trees
- Rule 1: Stripe Is Always the Source of Truth — Never Push Local Corrections to Stripe
- Rule 3 (Audit): Auto-Repair Only Safe Fields — Never Auto-Repair Plan Changes
- Detect and Repair Subscription Drift (06-skills.md)

---

## 2. Zero Clock Skew Tolerance on Date Comparisons

### Category
Reliability · Alert Fatigue

### Description
Comparing dates between local state and Stripe using exact equality instead of allowing a small tolerance, flagging subscriptions with dates differing by 1-2 seconds as "drift" on every reconciliation cycle.

### Why It Happens
Date comparison is straightforward: `if ($localDate != $stripeDate) { ... }`. The developer compares timestamps directly without considering clock skew, timestamp precision differences, or the time gap between Stripe generating a timestamp and the webhook delivering it. The comparison works for most cases but fails at the margins.

### Warning Signs
- `$localSub->current_period_end != $stripeSub->currentPeriodEnd` (strict equality)
- Reconciliation reports hundreds of "drift" items for date fields every cycle
- Same teams flagged for date drift every cycle because the 1-second difference never resolves
- Ops team ignores reconciliation output because "it's always just date drift"

### Why Harmful
Strict equality on timestamps produces false-positive drift for almost every subscription. Two systems recording the same event with timestamps 1-3 seconds apart is normal behavior in distributed systems — it's not drift. Flagging this as drift creates noise that buries real issues. Ops teams learn to ignore reconciliation alerts because 95% are false-positive date diffs.

### Real-World Consequences
- 10,000 subscriptions, 9,500 have date timestamps differing by 1-3 seconds
- Reconciliation reports 9,500 "drifts" every cycle
- Ops team: "reconciliation is noise, ignore it"
- Real drift (50 subscriptions with wrong status) is never noticed because nobody reads the reconciliation output
- When asked "why didn't you catch the subscription status drift?", the answer is "reconciliation always shows thousands of false positives"

### Preferred Alternative
Apply a 5-second tolerance to all date comparisons. `abs($localTimestamp - $stripeTimestamp) > 5` means drift. Differences of 5 seconds or less are treated as equivalent. This eliminates clock skew noise while preserving drift detection for meaningful date discrepancies.

### Refactoring Strategy
1. Create a helper method: `datesAreDrifted($local, $stripe, $toleranceSeconds = 5): bool`
2. Replace all strict date equality checks with the helper
3. Log when drift is detected to confirm it's real drift, not clock skew
4. Run reconciliation in dry-run mode and verify date drift counts drop by 95%+
5. Document the tolerance choice for future maintainers

### Detection Checklist
- [ ] Are date comparisons using strict equality (`==`, `!=`, `===`, `!==`)?
- [ ] Is there a clock skew tolerance applied to date comparisons?
- [ ] What percentage of detected drifts are date drifts? (Should be < 5%)
- [ ] Are the same teams flagged for date drift every cycle?
- [ ] Has the tolerance value (5 seconds) been reviewed against actual clock skew data?

### Related Rules/Skills/Trees
- Rule 3: Use Clock Skew Tolerance on Date Comparisons
- Detect and Repair Subscription Drift (06-skills.md)

---

## 3. Treating All Drift as Equal Severity

### Category
Architecture · Business Risk

### Description
Detecting drift between local and Stripe state but applying the same handling (auto-repair, alert, or ignore) to all types of drift regardless of their business impact.

### Why It Happens
Drift detection code iterates over fields and treats each mismatch identically. The code is "clean" — one loop, one handling strategy. The developer hasn't classified fields by business impact because the schema looks uniform. The first version of reconciliation handles everything the same way because "drift is drift."

### Warning Signs
- Single repair loop that applies the same action to all drift items
- No severity classification in DriftItem or equivalent objects
- Plan changes auto-repaired alongside date corrections
- Same alert level for "trial_end off by 2 seconds" and "plan changed from Starter to Enterprise"

### Why Harmful
Different types of drift have vastly different business implications. A trial_end date off by 5 seconds affects nothing. A plan change from Starter to Enterprise changes what the customer pays. Treating both equally means either: (a) everything is auto-repaired (dangerous — plan changes), or (b) everything requires manual review (overwhelming — thousands of trivial date diffs). Both outcomes are bad.

### Real-World Consequences
- Everything auto-repaired: plan change silently applied, customer charged $999 instead of $29. Chargeback. Customer churns.
- Everything manual review: 500 date drifts create 500 review tickets every hour. Ops team ignores them all. Real plan drift sits unnoticed in the queue.
- Same alert severity: PagerDuty fires at 3am for "current_period_end off by 3 seconds." Engineer acknowledges, goes back to sleep. Next alert is "plan changed to Enterprise" — also acknowledged because engineer assumes it's another trivial alert.

### Preferred Alternative
Classify drift by severity. LOW (dates): auto-repair silently, metrics only. MEDIUM (status, cancel_at): auto-repair with notification. CRITICAL (plan, orphaned): alert immediately, create review ticket, never auto-repair. Different severities get different handling, different alert channels, different SLAs.

### Refactoring Strategy
1. Define a DriftSeverity enum (LOW, MEDIUM, CRITICAL) or equivalent
2. Map each detectable field to a severity tier
3. Split the repair loop by severity: only auto-repair LOW and MEDIUM
4. Route CRITICAL items to a review queue or alerting system
5. Document the severity classification and the handling per tier
6. Review severity assignments quarterly based on operational experience

### Detection Checklist
- [ ] Does the drift detection code classify items by severity?
- [ ] Are different severities handled differently?
- [ ] Is plan drift classified as CRITICAL and never auto-repaired?
- [ ] Is date drift classified as LOW and auto-repaired silently?
- [ ] Would the ops team know which drifts need immediate attention?

### Related Rules/Skills/Trees
- Rule 2: Classify Drift by Severity — Never Treat All Drift Equally
- Rule 3 (Audit): Auto-Repair Only Safe Fields — Never Auto-Repair Plan Changes
- Drift Severity Model — Granular Classification vs Binary Safe/Unsafe (07-decision-trees.md)

---

## 4. Ignoring Orphaned Subscriptions

### Category
Data Integrity · Revenue Leakage · Critical

### Description
When reconciliation finds a subscription that exists locally but not in Stripe, silently skipping it or logging it without taking corrective action, allowing users indefinite free access to paid features.

### Why It Happens
The reconciliation code queries Stripe for each subscription. When `getSubscription()` throws an exception for a "not found" response, the catch block logs a warning and calls `continue`. The developer reasons: "it's a rare edge case, we'll investigate later." The orphaned subscription persists because there's no automated cleanup. Later never comes.

### Warning Signs
- Catch blocks in reconciliation that log a warning and skip the team
- "Subscription not found in Stripe" warnings in logs that repeat for the same team every cycle
- Teams with local subscription status `active` but Stripe shows no subscription
- No code path that updates local subscription status to `canceled` when Stripe returns 404

### Why Harmful
An orphaned subscription means the application thinks the user is paying, but Stripe says they're not. The user gets full access to paid features without being charged. This is revenue leakage. It also corrupts analytics — the user appears as a paying customer in revenue reports but generates no revenue. The longer it persists, the more revenue is lost and the harder it becomes to correct (the user has come to expect free access).

### Real-World Consequences
- Customer cancels in Stripe Dashboard. The `customer.subscription.deleted` webhook was missed due to a deployment during the event.
- Local subscription remains `active`. Customer retains full feature access.
- Three months later, finance notices this customer hasn't been billed. Revenue leakage of $299 × 3 = $897.
- Customer has built workflows on premium features. Re-billing or revoking access is now a customer relations problem, not just a technical fix.
- SOC2 audit: "How do you ensure only paying customers have access?" The orphaned subscriptions are evidence of a control failure.

### Preferred Alternative
During reconciliation, when Stripe confirms a subscription doesn't exist, update the local subscription to `canceled` with `ended_at = now()`. Log a CRITICAL alert. Invalidate the entitlement cache to revoke feature access. Create a DriftAlert for ops review. Never silently skip — an orphan is a revenue-leakage incident.

### Refactoring Strategy
1. Distinguish transient API errors from definitive "not found" responses
2. On definitive "not found": update local subscription to `canceled`, log CRITICAL alert, invalidate entitlements
3. On transient error: retry with backoff, create review ticket if retries exhausted
4. Create a dedicated CleanupOrphanedSubscriptions job for batch processing
5. Track orphan rate as a metric and alert on anomalies

### Detection Checklist
- [ ] Does reconciliation handle the case where Stripe returns "subscription not found"?
- [ ] Are orphaned subscriptions marked as canceled locally?
- [ ] Is there a distinction between transient API errors and definitive "not found"?
- [ ] Are there teams with local `active` status but no corresponding Stripe subscription?
- [ ] Is the orphan rate monitored and alerted?

### Related Rules/Skills/Trees
- Rule 4: Detect and Handle Orphaned Subscriptions
- Rule 1: Stripe Is Always the Source of Truth — Never Push Local Corrections to Stripe
- Detect and Repair Subscription Drift (06-skills.md)
- Orphaned Subscription Handling — Auto-Cancel vs Manual Review vs Alert-Only (07-decision-trees.md)

---

## 5. Reconciliation as Primary Sync Instead of Safety Net

### Category
Architecture · Operations

### Description
Using the periodic reconciliation job as the primary mechanism for synchronizing subscription state, tolerating known webhook processing failures because "reconciliation will fix it later."

### Why It Happens
Webhook processing has a bug that's hard to fix. Reconciliation runs hourly and patches the symptoms. The team prioritizes new features over fixing the webhook pipeline because "reconciliation handles it." Over time, reconciliation becomes the de facto sync mechanism, running more frequently to cover for worsening webhook reliability.

### Warning Signs
- Drift rate is consistently > 1% of subscriptions per cycle
- Known webhook processing bugs documented as "mitigated by reconciliation"
- Reconciliation frequency increased from daily to hourly to every 15 minutes
- Team discusses "reconciliation latency" as a user-facing concern (it shouldn't be user-facing)
- Webhook processing errors in logs are acknowledged but not investigated

### Why Harmful
Reconciliation is periodic (hourly at best). Webhooks are real-time (seconds). When reconciliation becomes the primary sync, users experience up to an hour of stale billing state. A customer upgrades to Pro but doesn't get Pro features for 55 minutes until reconciliation runs. Past-due subscriptions aren't detected until the next reconciliation cycle. The user experience degrades while the team builds dependency on a safety net.

### Real-World Consequences
- Customer upgrades from Starter to Pro ($29 → $99). Payment is processed. Webhook fails silently.
- Customer doesn't get Pro features. Support ticket: "I paid for Pro but it says I'm on Starter."
- Reconciliation runs 50 minutes later, fixes the drift. Customer had 50 minutes of degraded experience after paying.
- Customer cancels and demands a refund: "I paid and your system didn't work."
- Root cause (webhook failure) is never fixed because "reconciliation handled it" — until reconciliation itself fails during a Stripe API incident.

### Preferred Alternative
Reconciliation is a safety net, not a primary sync mechanism. Webhook processing is the primary sync — it should be monitored, reliable, and immediately fixed when broken. Reconciliation detects what webhooks miss (rare). If drift rate consistently exceeds 1%, investigate and fix webhook processing as a P1 incident.

### Refactoring Strategy
1. Monitor drift rate per reconciliation cycle
2. Set an alert threshold: if drift rate > 1%, escalate to investigate webhook pipeline
3. Fix the root cause of webhook failures (not just the symptoms)
4. Treat reconciliation frequency increases as a signal that webhook reliability is degrading
5. Document: "Reconciliation latency is NOT a user-facing metric. If users notice drift, webhooks are broken."

### Detection Checklist
- [ ] Is the drift rate consistently below 1% of active subscriptions?
- [ ] Are webhook processing failures investigated and fixed, not just papered over?
- [ ] Is reconciliation frequency stable (not being increased to compensate for failures)?
- [ ] Do users ever report "my plan didn't update after I changed it"?
- [ ] Is the team aware that reconciliation is a safety net, not a primary sync?

### Related Rules/Skills/Trees
- Rule 5: Reconciliation Is a Safety Net — Fix Webhook Processing First
- Implement Stripe Webhook Idempotency & Event Deduplication (06-skills.md)
- Drift Alerting Strategy — Per-Drift Alerts vs Rate-Based Thresholds (07-decision-trees.md)
