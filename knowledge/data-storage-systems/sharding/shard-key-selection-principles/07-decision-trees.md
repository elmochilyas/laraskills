# 6-1 Shard Key Selection Principles - Decision Trees

## Shard Key Selection: User ID vs Tenant ID vs Date

---

## Decision Context

Choosing the shard key that determines data distribution, query locality, and scalability.

---

## Decision Criteria

* performance: shard key determines query locality vs fan-out
* architectural: irreversibly chosen at shard setup
* maintainability: changing shard key after production is extremely expensive
* security: tenant isolation

---

## Decision Tree

Selecting a shard key?

↓

Is there a high-cardinality column present in most queries?

YES → Use that column as shard key

    ↓
    user_id: Good for user-facing apps
    - High cardinality
    - Most queries include user_id
    - Even distribution
    
    tenant_id: Good for multi-tenant SaaS
    - All queries scoped to tenant
    - Data collocation per tenant

NO → Is there a natural composite key?

    YES → Composite shard key: (tenant_id, user_id)
        
        ↓
        Queries with tenant_id target single shard
        Within a tenant, data is collocated
        
    NO → Avoid date-only keys
        
        ↓
        created_at alone → HOT SHARD
        All today's writes go to one shard
        
        → Use hash of user_id or combine date + hash

---

## Recommended Default

**Default:** `user_id` or `tenant_id` as shard key
**Reason:** High cardinality, even distribution, present in most queries. Date-only keys create hot shards.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Select Optimal Shard Key for Distribution
