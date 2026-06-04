# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Lifecycle & Governance
**Knowledge Unit:** Breaking Change Process
**Generated:** 2026-06-03

---

# Decision Inventory

* RFC approval process (CAB review vs lightweight team review)
* Rollout strategy (big-bang vs progressive rollout)

---

# Architecture-Level Decision Trees

## RFC Approval Process — CAB Review vs Lightweight Team Review

## Decision Context
What level of review is required for a breaking change? Arises when proposing a breaking API change.

## Decision Criteria
* consumer count — more consumers = more formal review
* impact severity — breaking behavior vs breaking schema
* urgency — emergency security fixes bypass standard process
* org structure — single team vs cross-team coordination

## Decision Tree
Does the change affect external consumers or multiple teams?
↓
YES → Formal CAB review (RFC + impact analysis + migration plan + approval)
NO → Internal-only, single team → Lightweight team review

## Recommended Default
**Default:** Formal CAB review for any external consumer-facing breaking change
**Reason:** External consumer impact requires cross-functional coordination and formal migration planning.

## Risks Of Wrong Choice
No CAB for external change: consumers not properly notified, migration incomplete.

## Rollout Strategy — Big-Bang vs Progressive Rollout

## Decision Context
How should the breaking change be deployed to consumers?

## Decision Tree
Can the breaking change be deployed alongside old behavior (version coexistence)?
↓
YES → Progressive rollout (1% → 5% → 25% → 100% over weeks)
NO → Old behavior cannot coexist → Big-bang with extended migration window

## Recommended Default
**Default:** Progressive rollout with version coexistence
**Reason:** Enables rollback, catches issues early, minimizes consumer disruption.

## Risks Of Wrong Choice
Big-bang with no rollback: any issue affects all consumers simultaneously.
