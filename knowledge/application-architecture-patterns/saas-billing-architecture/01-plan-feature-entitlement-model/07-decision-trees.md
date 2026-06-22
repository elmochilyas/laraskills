# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Plan, Feature & Entitlement Model
**Generated:** 2026-06-22

---

# Decision Inventory

* Decision 1: Feature storage — database table vs code-based enum
* Decision 2: Entitlement caching — TTL duration and invalidation strategy
* Decision 3: Usage tracking — synchronous vs asynchronous record writes
* Decision 4: Plan versioning — immutable plans vs mutable plans with versioning

---

# Architecture-Level Decision Trees

---

## Decision: Feature Storage — Database Table vs Code-Based Enum

---

### Decision Context

Choose where to define the application's feature catalog: as rows in a `features` database table or as a PHP enum/class constants.

---

### Decision Criteria

* operational considerations: database features are runtime-configurable without deploys; code-based features require a deploy to add or change
* architectural considerations: database features integrate naturally with pivot tables and dynamic queries; code-based features are simpler for small, stable feature sets
* security considerations: both approaches support whitelisting; database features need seeders to ensure consistency across environments
* maintainability considerations: database features require migration discipline; code-based features are version-controlled by default

---

### Decision Tree

Do you need non-engineers (product managers, support) to manage feature availability without a deploy?
↓
YES → Is the feature set expected to change frequently (monthly or more)?
    YES → Database features table (runtime-configurable, admin UI possible)
    NO → Do you already have a database-driven plan/feature pivot table?
        YES → Database features table (consistency with existing architecture)
        NO → Code-based enum may suffice for low-change-rate catalogs

NO → Is the feature catalog small and stable (< 20 features, changes annually)?
    YES → Code-based enum (simpler, no migration overhead, IDE autocomplete)
    NO → Is there a requirement to attach per-feature config or metadata?
        YES → Database features table (typed config, metadata columns)
        NO → Code-based enum if additional data can be stored in config files

How many features are expected over the application lifetime?
< 20 → Code-based enum is viable
20-50 → Database table recommended for manageability
> 50 → Database table required (too large for code-based management)

Do you need to query features dynamically (e.g., "show all features a plan includes")?
YES → Database table (SQL-queryable, integrates with pivot tables)
NO → Code-based enum (but consider future needs)

---

### Rationale

For most SaaS applications with paid plans, a database features table is the better choice. It allows the product team to manage features without code deploys, integrates naturally with plan-feature pivot tables, and supports per-feature configuration (limits, metadata). Code-based enums work for small, stable feature sets but become a deployment bottleneck as the product scales.

---

### Recommended Default

**Default:** Database features table with a seeded feature catalog.

**Reason:** The database table approach supports runtime configuration, admin UIs, pivot table joins, and per-feature metadata. Seeding ensures consistency across environments while retaining deploy-time control.

---

### Risks Of Wrong Choice

Code-based enum for dynamic product: every feature change requires a deploy, slowing product iteration. Database table without seeding: staging and production diverge, features appear/disappear unpredictably. Code-based for 100+ features: bloated enum file, no runtime management.

---

### Related Rules

- Rule 3: Feature Keys Are Internal Identifiers — Never Accept From User Input
- Rule 6: Plans Are Immutable After Release

---

### Related Skills

- Implement Plan, Feature & Entitlement Model

---

## Decision: Entitlement Caching — TTL Duration and Invalidation Strategy

---

### Decision Context

Determine the cache TTL for computed entitlement sets and the invalidation triggers that keep the cache fresh.

---

### Decision Criteria

* performance considerations: longer TTL reduces database load but increases staleness window
* reliability considerations: shorter TTL ensures fresher data but higher database query volume
* architectural considerations: invalidation must be triggered by every webhook and admin action
* security considerations: stale cache during a downgrade means a user retains paid features they shouldn't have

---

### Decision Tree

How frequently do billing state changes occur (subscription upgrades, downgrades, cancellations)?
↓
FREQUENT (hundreds/hour) → Consider shorter TTL (1-2 minutes) with aggressive invalidation
    ↓
    Are you using Redis for caching?
    YES → Use tags for bulk invalidation: `Cache::tags(['entitlements'])->flush()`
    NO → Use key-based invalidation: `Cache::forget("entitlements:team:{$team->id}")`

INFREQUENT (dozens/hour) → Longer TTL acceptable (5 minutes)
    ↓
    Is there a compliance requirement for near-real-time access changes?
    YES → Shorter TTL (1 minute) or event-driven invalidation
    NO → 5-minute TTL with webhook-driven invalidation is sufficient

What is the query cost of entitlement computation?
LOW (< 5 queries, < 10ms) → Shorter TTL acceptable (even 30 seconds)
HIGH (5-10 queries, joins, aggregations) → Longer TTL preferred (5+ minutes) with webhook invalidation

Do you need to support manual cache busting for support operations?
YES → Implement an admin endpoint and `invalidateCache(Team $team)` method
NO → Webhook-driven invalidation alone may be sufficient

---

### Rationale

A 5-minute TTL strikes the right balance for most SaaS applications. It reduces database load significantly (from per-request to per-5-minutes) while limiting the maximum staleness to 5 minutes. Webhook-driven invalidation further tightens freshness — a subscription upgrade takes effect within seconds, not minutes.

---

### Recommended Default

**Default:** 5-minute TTL with cache invalidation triggered by every webhook that changes subscription state and every admin action that modifies overrides.

**Reason:** Provides strong database offloading while maintaining near-real-time freshness through event-driven invalidation. The 5-minute window covers the gap between webhook delivery and cache refresh.

---

### Risks Of Wrong Choice

TTL too long (30+ minutes): user upgrades but doesn't get features for 30 minutes — frustration and support tickets. TTL too short (10 seconds): entitlement computation runs constantly, negating the benefit of caching entirely. No invalidation: webhook delivers an upgrade, user waits 5 minutes, cache still stale.

---

### Related Rules

- Rule 4: Cache Entitlements With Invalidation on Every Billing State Change
- Rule 1: Separate Billing State From Entitlement Decisions

---

### Related Skills

- Implement Plan, Feature & Entitlement Model
- Implement Stripe Webhook Idempotency & Event Deduplication

---

## Decision: Usage Tracking — Synchronous vs Asynchronous Record Writes

---

### Decision Context

Choose whether usage records (API call counts, storage consumed, team members added) are written synchronously during the feature access path or asynchronously via a queued job.

---

### Decision Criteria

* performance considerations: synchronous writes add database latency to every feature usage; async writes are fire-and-forget
* accuracy considerations: synchronous writes are always accurate; async writes have eventual consistency (queue lag)
* architectural considerations: sync writes keep state immediately consistent; async writes require reconciliation logic
* reliability considerations: queue failures lose usage data; sync writes are durable with database transactions

---

### Decision Tree

Is real-time usage accuracy critical for billing (e.g., per-use charges, not just limits)?
↓
YES → Is the write latency acceptable (< 50ms per usage record)?
    YES → Synchronous writes in the same transaction as the feature operation
    NO → Async with periodic reconciliation to catch dropped records

NO → Is the usage volume high (thousands of events per second)?
    YES → Asynchronous writes via dedicated queue (decouple usage tracking from feature access)
        ↓
        Use Redis queue with Horizon for high-throughput usage recording
        Implement a reconciliation job to catch dropped records
    NO → Is the usage data critical for immediate enforcement (deny access on next request)?
        YES → Synchronous writes (ensure the count is accurate on next check)
        NO → Asynchronous writes with eventual consistency acceptable

Is there a risk of queue backlog causing stale usage data for hours?
YES → Synchronous writes for critical limits; async for non-critical tracking
NO → Async is safe with proper queue monitoring

---

### Rationale

Asynchronous writes are preferred for most usage tracking scenarios. They decouple the feature access hot path from the tracking write path, preventing usage recording from adding latency to user operations. Periodic reconciliation catches dropped records. Synchronous writes should be reserved for billing-critical metering where accuracy directly affects revenue.

---

### Recommended Default

**Default:** Asynchronous usage record writes via queued job with a periodic reconciliation job to catch dropped records.

**Reason:** Protects the feature access hot path from tracking latency. Reconciliation provides a safety net. Most usage data is for limit enforcement, not billing accuracy, so eventual consistency is acceptable.

---

### Risks Of Wrong Choice

Synchronous for high-volume: feature access latency degrades, user experience suffers. Asynchronous without reconciliation: dropped queue jobs cause under-counting, users exceed limits without enforcement. Async for billing-critical metering: customers undercharged or overcharged due to stale counts.

---

### Related Rules

- Rule 2: Entitlement Computation Must Be a Pure Function of Local State
- Rule 4: Cache Entitlements With Invalidation on Every Billing State Change

---

### Related Skills

- Implement Plan, Feature & Entitlement Model
- Handle Billing Failure States, Trials, Grace Periods & Downgrades

---

## Decision: Plan Versioning — Immutable Plans vs Mutable Plans with Versioning

---

### Decision Context

Choose whether plans are immutable after creation (new features require a new plan row) or mutable with a plan_version table to track changes over time.

---

### Decision Criteria

* data integrity considerations: immutable plans preserve historical accuracy; mutable plans lose the record of what a customer was promised
* operational considerations: immutable plans require migration of existing subscriptions; mutable plans allow in-place editing
* compliance considerations: immutable plans provide clear audit trail for billing disputes
* maintainability considerations: immutable plans create more plan rows over time; mutable plans require version tracking infrastructure

---

### Decision Tree

Do you expect to change plan features after launch (adding features, changing limits, adjusting trial days)?
↓
YES → How frequently do you expect to change plans?
    MONTHLY or more → How many active subscriptions use each plan?
        < 100 → Immutable plans with manual migration (simpler, safer)
        100-1,000 → Immutable plans with automated migration job
        > 1,000 → Consider mutable plans with PlanVersion tracking (migration overhead too high)
    QUARTERLY or less → Immutable plans (deprecate old, create new, migrate)
    ↓
    Do you need to answer "what features did customer X have on date Y" for compliance?
    YES → Immutable plans (version history is inherent in plan row history)
    NO → Either approach works, but immutable is still simpler

NO → Do you expect to eventually change plans?
    YES → Start with immutable plans now (easy to adopt, hard to retrofit)
    NO → Either approach works (if you're truly certain plans will never change)

Is there a revenue reporting requirement that depends on plan definitions?
YES → Immutable plans (revenue by plan remains meaningful over time)
NO → Mutable plans with PlanVersion can satisfy reporting needs but adds complexity

---

### Rationale

Immutable plans are the safer default. They preserve the historical record of what each plan included at the time a customer subscribed, which is essential for billing disputes, revenue reporting, and compliance. The additional operational overhead (creating new plan rows and migrating subscriptions) is modest compared to the risk of losing historical plan definition accuracy.

---

### Recommended Default

**Default:** Immutable plans. Deprecate old plans with `is_active = false` and soft-delete. Create new plan rows for feature changes. Migrate active subscriptions to new plans via a scheduled job.

**Reason:** Preserves historical accuracy for billing disputes, compliance, and revenue reporting. The operational cost of creating new plan rows is acceptable for most SaaS products.

---

### Risks Of Wrong Choice

Mutable plans without versioning: cannot answer "what did this customer's plan include when they subscribed?" Revenue reporting is unreliable because plan definitions changed mid-cycle. Billing disputes cannot be resolved. Immutable plans with poor migration: subscriptions stuck on deprecated plans indefinitely.
