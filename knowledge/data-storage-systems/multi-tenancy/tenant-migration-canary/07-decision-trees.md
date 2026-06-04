# 5-29 Tenant Migration Canary - Decision Trees

## Phased Rollout Rings

---

## Decision Context

Rolling out schema migrations to tenants in phases (canary rings) to limit blast radius and detect issues early.

---

## Decision Criteria

* performance: phased rollout extends total migration time
* architectural: canary ring must be representative of production
* maintainability: tenant ring assignment stored in central ledger
* security: security patches skip canary — apply to all immediately

---

## Decision Tree

Migration rollout strategy?

↓

Security-critical patch?

YES → Apply to all tenants immediately (skip canary)

    ↓
    Security patches override normal rollout
    Monitor error rates closely post-deploy

NO → Standard feature migration?

    YES → Phased rollout:
        
        ↓
        Ring 0 (Canary, 5%): internal/test tenants
        → Monitor 15 min for errors
        
        Ring 1 (20%): low-usage tenants
        → Monitor 15 min, check error rates
        
        Ring 2 (30%): medium-usage tenants
        → Monitor 15 min
        
        Ring 3 (45%): enterprise/high-value tenants last
        → Final monitoring period

NO → High-risk migration (data migration)?

    → Manual canary: 1-2 specific tenants
    Manual verification before any automated rollout
    Then Ring 0 → 1 → 2 → 3

---

## Recommended Default

**Default:** Ring 0 (5%) → Ring 1 (20%) → Ring 2 (30%) → Ring 3 (45%) with 15-min cooldown
**Reason:** Gradual rollout limits blast radius. 15-minute cooldown catches most errors before wider rollout.

---

## Rollback Triggers

---

## Decision Context

Determining when to halt a canary rollout and roll back the last ring — using automated error rate monitoring.

---

## Decision Criteria

* performance: monitoring must detect errors within seconds
* architectural: rollback must revert migrations per tenant
* maintainability: automated rollback reduces manual intervention
* security: rollback must not cause data inconsistency

---

## Decision Tree

When to halt and rollback?

↓

Error rate increased by >2% after last ring?

YES → HALT rollout — rollback last ring

    ↓
    Rollback tenants in the last ring only
    Previous rings are stable — leave them
    Investigate root cause before retrying

NO → Specific migration error on >1% of tenants?

    YES → HALT — rollback affected tenants
        
        ↓
        Individual failures may be tenant-specific
        Rollback only failed tenants
        Continue rollout to remaining when fixed

NO → No errors detected?

    → Continue to next ring
    Proceed with rollout
    Monitor post-rollout for 24 hours

---

## Recommended Default

**Default:** Auto-halt on >2% error rate increase; rollback only the affected ring
**Reason:** 2% threshold catches real issues without false positives from noise. Per-ring rollback preserves progress on stable tenants.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant Migration Canary
* Implement Schema Version Ledger
