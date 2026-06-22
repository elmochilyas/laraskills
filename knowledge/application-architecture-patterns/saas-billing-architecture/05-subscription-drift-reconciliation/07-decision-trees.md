# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Subscription Drift Detection & Repair
**Generated:** 2026-06-22

---

# Decision Inventory

* Decision 1: Drift severity model — granular classification vs binary safe/unsafe
* Decision 2: Orphaned subscription handling — auto-cancel vs manual review vs alert-only
* Decision 3: Drift alerting strategy — per-drift alerts vs rate-based thresholds
* Decision 4: Reconciliation data freshness — cache-busting vs stale reads

---

# Architecture-Level Decision Trees

---

## Decision: Drift Severity Model — Granular Classification vs Binary Safe/Unsafe

---

### Decision Context

Determine whether drift items should be classified into fine-grained severity tiers (LOW, MEDIUM, CRITICAL) with different handling per tier, or a simple binary classification (safe to auto-repair vs requires review).

---

### Decision Criteria

* operational pragmatism: granular tiers enable precise handling; binary is simpler to implement and understand
* alert routing: CRITICAL drifts may need PagerDuty; MEDIUM drifts go to Slack; LOW drifts are auto-repaired silently
* product maturity: early-stage products benefit from binary simplicity; mature products need triage granularity
* team scale: larger ops teams can handle triage tiers; solo-ops needs binary simplicity

---

### Decision Tree

How many distinct types of drift does the system detect?
↓
< 5 types → Binary classification may be sufficient (safe vs review-needed)
    BUT: is there a meaningful difference between "trial_end date off by 2 seconds" and "plan changed to Enterprise"?
    YES → Granular classification justified even with few types

5-10 types → Granular classification recommended
    Map each drift field to a severity tier:
    LOW: trial_ends_at, current_period_start, current_period_end
    MEDIUM: stripe_status, cancel_at_period_end, canceled_at
    CRITICAL: plan/price_id, subscription_existence (orphaned)

How is the ops team structured?
Single on-call engineer → Binary classification (review-needed items get paged)
Dedicated billing ops team → Granular classification (LOW auto-repaired, MEDIUM Slack, CRITICAL PagerDuty)

What are the compliance requirements?
SOC2/PCI → Granular classification with documented handling per tier
No formal compliance → Binary classification acceptable

---

### Rationale

Granular severity classification provides meaningful operational triage. LOW-tier drifts (dates off by seconds) can be auto-repaired silently without alert fatigue. MEDIUM-tier drifts (status changes) get auto-repaired with a Slack notification. CRITICAL-tier drifts (plan changes) require human review before any action. This triage ensures the right level of attention for each type of drift.

---

### Recommended Default

**Default:** Three-tier severity model: LOW (auto-repair silently), MEDIUM (auto-repair with notification), CRITICAL (alert only, no auto-repair, create review ticket).

**Reason:** Aligns operational response with business risk. Date corrections are routine. Status transitions warrant awareness. Plan changes require human judgment. This prevents both alert fatigue (from treating everything as critical) and dangerous automation (from treating everything as safe).

---

### Risks Of Wrong Choice

Binary with everything "safe": plan changes auto-repaired, customer pricing changed without consent. Binary with everything "review": every minor date drift creates a review ticket, ops team overwhelmed, real issues buried in noise. Over-granular classification: 10 severity tiers, complex routing rules, ops team needs a flowchart to understand where a drift gets routed.

---

### Related Rules

- Rule 2: Classify Drift by Severity — Never Treat All Drift Equally
- Rule 3 (Audit): Auto-Repair Only Safe Fields — Never Auto-Repair Plan Changes

---

### Related Skills

- Detect and Repair Subscription Drift
- Implement Webhook Audit Log, Replay & Reconciliation

---

## Decision: Orphaned Subscription Handling — Auto-Cancel vs Manual Review vs Alert-Only

---

### Decision Context

Determine what action to take when reconciliation finds a subscription that exists locally (active/trialing/past_due) but is not found in Stripe — the subscription was likely deleted from the Stripe Dashboard.

---

### Decision Criteria

* business risk: auto-canceling could revoke access from a paying customer if Stripe API had a transient error
* revenue protection: not canceling leaves free access to paid features for indefinite periods
* operational capacity: manual review requires ops staff availability; auto-cancel is immediate
* customer trust: canceling a legitimate subscription damages trust; leaving free access damages revenue

---

### Decision Tree

Was the Stripe API `getSubscription()` call that failed a definitive "not found" error or a transient error (timeout, rate limit, 500)?
↓
DEFINITIVE "not found" (404 or equivalent) → Auto-cancel with alert
    ↓
    Is there a webhook event in the audit log confirming the subscription was deleted?
    YES → Auto-cancel with confidence (StripeEvent confirms the deletion)
    NO → Auto-cancel with alert (highest confidence: Stripe API confirms no subscription)

TRANSIENT error (timeout, 429, 5xx) → DO NOT cancel
    ↓
    Retry the API call with backoff (up to 3 retries)
    ↓
    After retries exhausted, still getting errors?
    YES → Create review ticket, do NOT cancel (could be a Stripe API outage)
    NO → Resolve normally (first call was a transient blip)

Can the ops team review orphaned subscriptions within 24 hours?
YES → Manual review with auto-cancel as fallback after 24h
NO → Auto-cancel with alert (cannot leave free access for extended periods)

What is the dollar value of an average subscription?
< $50/month → Auto-cancel with alert (revenue impact of free access is limited but real)
$50-500/month → Manual review preferred (revenue impact per subscription is significant)
> $500/month → Manual review required (high-value customers need human handling)

---

### Rationale

Auto-canceling is the appropriate default when Stripe API confirms the subscription doesn't exist. The risk of leaving free access outweighs the risk of incorrectly canceling. Transient API errors must never trigger cancellation. For the small percentage of cases where cancellation was incorrect, the customer will contact support and the subscription can be re-provisioned from Stripe.

---

### Recommended Default

**Default:** Auto-cancel orphaned subscriptions when Stripe returns a definitive "not found" response. Create a CRITICAL alert and DriftAlert record. Never cancel on transient API errors. For high-value subscriptions (> $500/month), add a manual review step.

**Reason:** Free access to paid features is revenue leakage. Stripe confirming the subscription doesn't exist is a strong signal. The customer can be re-provisioned if the cancellation was erroneous — but the revenue from free access can never be recovered.

---

### Risks Of Wrong Choice

Never canceling orphans: users get indefinite free access to paid features, discovered during quarterly audit, revenue leakage of thousands of dollars. Auto-canceling on transient errors: Stripe API has a 30-minute partial outage, reconciliation cancels 200 legitimate subscriptions, customers revolt. Manual review with no SLA: orphaned subscriptions sit in review queue for weeks, users enjoy free access.

---

### Related Rules

- Rule 4: Detect and Handle Orphaned Subscriptions
- Rule 1: Stripe Is Always the Source of Truth — Never Push Local Corrections to Stripe

---

### Related Skills

- Detect and Repair Subscription Drift
- Implement Webhook Audit Log, Replay & Reconciliation

---

## Decision: Drift Alerting Strategy — Per-Drift Alerts vs Rate-Based Thresholds

---

### Decision Context

Determine the alerting strategy for detected drift: alert on every individual drift item, or alert only when the drift rate exceeds a threshold.

---

### Decision Criteria

* alert fatigue: per-drift alerts can overwhelm ops teams; rate-based alerts reduce noise
* incident detection: per-drift ensures no drift goes unnoticed; rate-based may miss isolated but important drifts
* operational maturity: mature systems with stable webhook processing should have near-zero drift rate
* team size: large teams can triage per-drift; small teams need signal compression

---

### Decision Tree

What is the expected baseline drift rate for a healthy system?
↓
< 0.1% of subscriptions per cycle → Per-drift alerts on CRITICAL only; rate-based for MEDIUM and LOW
    0.1-1% → Per-drift for CRITICAL; rate-based for MEDIUM; no alert for LOW
    > 1% → This is a systemic issue. Alert on the rate anomaly AND investigate webhook pipeline.

What type of drift is it?
CRITICAL → Always alert per-drift (plan changes, orphans — each one matters)
MEDIUM → Alert if count > threshold (e.g., > 5 status drifts per cycle)
LOW → Never alert individually (dates shifting by seconds is expected); track rate for trends

Do you want to be woken up at 3am for drift?
Plans changing → YES (PagerDuty, critical alert)
Statuses changing → Maybe (Slack during business hours)
Dates off by 2 seconds → NO (this is normal clock skew)

---

### Rationale

A hybrid approach works best: per-drift alerts for CRITICAL severity (each one requires action), rate-based alerts for MEDIUM (individual status drifts are resolved by auto-repair; a spike indicates a systemic issue), no alerts for LOW (date drifts are so common and harmless they should be metrics only). This prevents alert fatigue while ensuring critical issues get immediate attention.

---

### Recommended Default

**Default:** Per-drift alerts for CRITICAL (PagerDuty or equivalent). Rate-based alerts for MEDIUM (Slack when > 5 in a cycle). Metrics-only for LOW (dashboard graphs, no alerts). Drift rate > 1% of total subscriptions triggers a systemic alert regardless of severity distribution.

**Reason:** Every plan change or orphaned subscription needs human review. Individual status drifts self-heal via auto-repair but a spike indicates webhook problems. Date drifts are noise. The systemic threshold catches "something is broken" independent of individual alerts.

---

### Risks Of Wrong Choice

Per-drift on everything: 2,000 "trial_ends_at drift of 2 seconds" alerts per cycle, ops team mutes the alert channel, real plan drift alert is missed. Rate-based only: a single critical plan drift doesn't trigger the threshold, goes unnoticed for days. No systemic threshold: webhook processing failed 4 hours ago, drift accumulating, no alert because individual drifts are MEDIUM and auto-repairing.

---

### Related Rules

- Rule 5: Reconciliation Is a Safety Net — Fix Webhook Processing First
- Rule 2: Classify Drift by Severity — Never Treat All Drift Equally

---

### Related Skills

- Detect and Repair Subscription Drift
- Implement Webhook Audit Log, Replay & Reconciliation

---

## Decision: Reconciliation Data Freshness — Cache-Busting vs Stale Reads

---

### Decision Context

Determine whether reconciliation should bypass entitlement caches and direct Stripe subscription caches to get the freshest possible data, or work with cached data to avoid additional load.

---

### Decision Criteria

* accuracy: cache-busting ensures detection compares against the most recent state
* performance: stale reads are faster but may miss recent changes
* consistency: cache-busting provides a consistent snapshot at the time of reconciliation
* resource usage: cache-busting may trigger expensive entitlement recomputation

---

### Decision Tree

Where does the reconciliation get local subscription state?
↓
From the database directly (not through caches) → Always use direct DB reads for reconciliation
    ↓
    Is entitlement data part of the reconciliation comparison?
    NO → Use direct DB reads for subscription state, skip entitlement caches
    YES → Compare entitlement-relevant fields from DB, not from computed entitlement cache

Does the EntitlementService cache affect reconciliation?
YES → Invalidate entitlement cache AFTER repair (so next access uses fresh data), not during detection
NO → No cache-busting needed

Where does the reconciliation get Stripe state?
From BillingGateway (which may cache internally) → Use fresh reads (gateway should provide this)
From a local cache of Stripe state → Bypass cache for reconciliation (compare canonical Stripe data)

---

### Rationale

Reconciliation should work with direct database reads for local state and fresh Stripe API reads for remote state. Caches exist for performance on the user-facing hot path — reconciliation is a background job where accuracy matters more than latency. After repair, invalidate caches so the next user request picks up the corrected state.

---

### Recommended Default

**Default:** Direct database reads for local subscription state. Fresh Stripe API reads via BillingGateway (no Stripe-side caching). Invalidate entitlement cache after repair, not during detection.

**Reason:** Reconciliation is about accuracy, not speed. Direct reads eliminate the risk of detecting stale drift that was already resolved. Cache invalidation after repair ensures users see the corrected state on their next request.

---

### Risks Of Wrong Choice

Using cached data: reconciliation reads a stale subscription status that was fixed 3 minutes ago, detects "drift" that doesn't exist, auto-repairs to the same value (no-op but wasted work). Invalidating cache during detection: triggers expensive entitlement recomputation for every subscription being reconciled, slowing the reconciliation job significantly. Not invalidating after repair: user continues to see stale data until the cache naturally expires.
