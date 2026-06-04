# 5-28 Deployment Stamp Pattern - Decision Trees

## Full Stack Stamp vs Shared Infrastructure

---

## Decision Context

Choosing between provisioning a full independent stack (stamp) per tenant group or sharing infrastructure across all tenants.

---

## Decision Criteria

* performance: dedicated stamps eliminate noisy neighbor
* architectural: each stamp is independently deployable and scalable
* maintainability: stamp provisioning via IaC (Terraform, Pulumi)
* security: stamps provide infrastructure-level isolation

---

## Decision Tree

Should you use deployment stamps?

↓

Enterprise tenant requiring dedicated SLA and isolation?

YES → Dedicated stamp per enterprise tenant

    ↓
    Full stack: app servers + DB + cache + queue + LB
    Independent deployment — tenant upgrades don't affect others
    Tenant-specific scaling, backup, monitoring
    
    ↓
    Cost: highest per tenant
    Isolation: maximum (infrastructure-level)
    Provisioning: Terraform modules (hours)

NO → Medium tenants sharing infrastructure?

    YES → Shared stamp for tenant group
        
        ↓
    Group tenants into stamps (50-100 per stamp)
    Each stamp has independent infrastructure
    Tenants within stamp share resources
    
    ↓
    Cost: moderate
    Resilient: one stamp failure doesn't affect others
    Scaling: add more stamps as needed

NO → Free/small tenants?

    → Single shared infrastructure for all
    Lowest cost per tenant
    No stamp overhead
    Accept: noisy neighbor within shared infra

---

## Recommended Default

**Default:** Dedicated stamps for enterprise tenants; shared stamps for medium; single infra for free/small
**Reason:** Cost should align with tenant value. Enterprise tenants pay for full isolation. Free tenants subsidize each other.

---

## Stamp Capacity Planning

---

## Decision Context

Determining how many tenants can share a single stamp and when to split tenants across additional stamps.

---

## Decision Criteria

* performance: stamp capacity = max tenants before performance degrades
* architectural: stamps are independent failure domains
* maintainability: splitting a stamp requires tenant migration
* security: stamp isolation prevents cross-tenant blast radius

---

## Decision Tree

How many tenants per stamp?

↓

Expected load per tenant?

↓

High (1000+ req/min, large data)?

YES → 10-20 tenants per stamp

    ↓
    Each tenant consumes significant resources
    Fewer tenants per stamp prevents overload
    Scale: add stamps as tenants grow

NO → Medium (100-1000 req/min)?

    YES → 50-100 tenants per stamp
        
        ↓
        Balanced resource usage
        Monitor: CPU, IOPS, connection count
        Split when aggregate exceeds 80% of stamp capacity

NO → Low (< 100 req/min)?

    → 100-500 tenants per stamp
    Low per-tenant resource usage
    Watch: storage growth over time
    Split on storage, not compute

---

## Recommended Default

**Default:** 50-100 tenants per stamp for medium workloads; adjust based on monitoring
**Reason:** 50-100 provides good density while maintaining headroom. Monitor capacity and split proactively.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Deployment Stamp Pattern
* Implement Per-Tenant Scaling
