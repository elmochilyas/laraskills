# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Plan-Aware Throttling for SaaS APIs
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Plan Resolution Source | How to determine the user's plan per request | security, architectural |
| 2 | Limit Change on Plan Upgrade | How to handle limits when a user upgrades | fairness, architectural |
| 3 | Burst vs Sustained Limit Per Plan | Traffic shaping differentiated by plan | architectural |

---

# Architecture-Level Decision Trees

---

## Plan Resolution Source

---

## Decision Context

How to determine the user's subscription plan on each API request — from the authenticated user, API key metadata, JWT claim, or a request header.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is the plan information available from the authenticated user's model (e.g., `$user->plan`)?
↓
YES → Resolve from user model (server-side, trustworthy)
NO → Is the plan encoded in the API key metadata?
    YES → Resolve from API key's metadata (server-side, trustworthy)
    NO → Is the plan in a JWT claim?
        YES → Verify JWT signature, then read claim (trustworthy after verification)
        NO → Is the plan in a request header?
            YES → NEVER trust client-provided headers (spoofable) — resolve server-side

Is the user authenticated?
↓
YES → Plan resolved from subscription/profile data
NO → Default to free/strictest plan (unauthenticated users get minimum)

Does plan resolution require a database query?
↓
YES → Cache the result (avoid per-request DB queries)
NO → Config-based resolution (fastest, no caching needed)

---

## Rationale

Plan information must always be resolved server-side from trusted sources (authenticated user model, API key metadata, verified JWT). Client-provided plan headers are trivially spoofable — a user on the free plan could send `X-Plan: enterprise` and bypass limits. Defaulting to the strictest plan for unauthenticated users prevents bypass via anonymous access.

---

## Recommended Default

**Default:** Resolve plan from `$user->subscription?->plan` (authenticated) or `'free'` (unauthenticated); cache the plan-to-limits mapping
**Reason:** The authenticated user model provides trustworthy plan information without additional round trips. Caching the plan limits avoids per-request database lookups. Unauthenticated users get the most restrictive plan by default.

---

## Risks Of Wrong Choice

- Client-provided plan header: users can spoof higher-tier plans
- No caching of plan resolution: per-request database query for every API call
- Unauthenticated users get high limits: API abuse via anonymous access
- Plan in URL parameter: users can modify and bypass

---

## Related Rules

- Define Rate Limits in a Config File, Not Hardcoded (05-rules.md)
- Apply the Strictest Limit When No Plan Is Assigned (05-rules.md)
- Cache Plan Limits to Avoid Repeated Config Reads (05-rules.md)

---

## Related Skills

- Implement Plan-Aware Throttling for Tiered API Access (06-skills.md)

---

## Limit Change on Plan Upgrade

---

## Decision Context

How to adjust rate limit counters when a user upgrades their plan mid-billing-cycle.

---

## Decision Criteria

* fairness
* architectural

---

## Decision Tree

Does the user upgrade from a lower plan to a higher plan?
↓
YES → Pro-rate remaining requests (do not reset to zero)
NO → Downgrade?
    YES → Evaluate: if user exceeds new lower limit, allow current cycle to finish, then enforce

Is there a database of current usage counters?
↓
YES → Calculate pro-rated remaining limit based on time elapsed
NO → Reset to zero on plan change (simple but unfair)

What is the upgrade scenario?
↓
Mid-cycle upgrade (most common) → Pro-rate: remaining = (old_limit - used) / old_limit * new_limit
New cycle with new plan → Reset to full new plan limit (clean slate)

Is this a real-time or batch process?
↓
Real-time → Update rate limit counters immediately on plan change
Batch → Apply at next cycle start (simpler, may have brief unfair access)

---

## Rationale

Resetting usage to zero on upgrade gives the user the full new plan's limit on top of what they already used on the old plan — allowing them to exceed fair resource allocation. Pro-rating ensures the remaining portion of the cycle is split proportionally between old and new plan limits. Most SaaS platforms accept some imprecision here; exact pro-ration is rarely necessary.

---

## Recommended Default

**Default:** Pro-rate remaining requests on upgrade (fair); allow current cycle to finish on downgrade before enforcing lower limits
**Reason:** Pro-rating prevents users from consuming more than their fair share when upgrading mid-cycle. Letting downgraded users finish their current cycle provides a good UX — they paid for the cycle, let them use it. New cycles start with the new plan's limits.

---

## Risks Of Wrong Choice

- Reset on upgrade: user gets full new limit + already consumed old limit (overage)
- Reset on downgrade: user's API calls start failing immediately after downgrade (bad UX)
- No tracking: plan changes have no effect until next billing cycle
- Complex pro-ration algorithm: may introduce bugs, rarely worth the precision

---

## Related Rules

- Pro-Rate Remaining Requests When Upgrading During the Cycle (05-rules.md)
- Return Plan Quota Headers in API Responses (05-rules.md)

---

## Related Skills

- Implement Plan-Aware Throttling for Tiered API Access (06-skills.md)

---

## Burst vs Sustained Limit Per Plan

---

## Decision Context

Configuring both burst (short-term spike tolerance) and sustained (long-term average) rate limits per subscription plan.

---

## Decision Criteria

* architectural

---

## Decision Tree

Does the plan need to accommodate traffic spikes (e.g., data import, batch processing)?
↓
YES → Configure burst capacity higher than sustained rate
NO → Sustained rate only (simple, uniform limits)

What is the plan tier?
↓
Free → Low burst (may spike briefly but limited) + low sustained rate
Pro → Moderate burst + moderate sustained rate
Enterprise → High burst + high sustained rate (spiky traffic patterns)

Is the application using token bucket algorithm?
↓
YES → Token bucket naturally provides burst (capacity) + sustained (refill rate)
NO → Pair `Limit::perSecond()` (burst cap) with `Limit::perMinute()` (sustained)

Are there downstream services that could be overwhelmed by bursts?
↓
YES → Set burst limits to match downstream service capacity
NO → Burst limits are less critical

---

## Rationale

Burst capacity allows short-term traffic spikes without immediate throttling, while sustained limits prevent long-term abuse. Different plan tiers should have different burst allowances — free users get low burst tolerance, enterprise users get high burst tolerance. Token bucket is the natural algorithm for this pattern (capacity = burst, refill = sustained rate).

---

## Recommended Default

**Default:** Free: low burst (10/min) + low sustained (100/hr); Pro: moderate burst (50/min) + moderate sustained (1000/hr); Enterprise: high burst (500/min) + high sustained (10000/hr)
**Reason:** Burst capacity lets users handle legitimate traffic spikes (batch uploads, data export) without hitting rate limits. Free-tier users with burst needs should be directed to upgrade. Enterprise users with spiky traffic patterns need the highest burst allowances.

---

## Risks Of Wrong Choice

- Same burst for all plans: free users can spike same as enterprise (resource contention)
- No burst capacity: every small spike triggers rate limits (poor UX)
- Very high burst on free plan: resource exhaustion by burst traffic
- Token bucket capacity wrong: sustained rate incorrectly applied as burst threshold

---

## Related Rules

- Define Rate Limits in a Config File, Not Hardcoded (05-rules.md)
- Return Plan Quota Headers in API Responses (05-rules.md)

---

## Related Skills

- Implement Plan-Aware Throttling for Tiered API Access (06-skills.md)
