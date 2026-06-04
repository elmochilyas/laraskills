# 5-23 Multi Region Tenant Placement - Decision Trees

## Region Assignment at Provisioning

---

## Decision Context

Determining the optimal region for tenant data at signup time based on data residency requirements and latency optimization.

---

## Decision Criteria

* performance: nearest region = lowest latency
* architectural: region assignment is permanent for data residency
* maintainability: provisioning pipeline must be region-aware
* security: data must never leave assigned region

---

## Decision Tree

How to assign tenant region?

↓

Tenant has data residency requirement (GDPR, etc.)?

YES → Assign region based on legal requirement

    ↓
    EU customer → EU region (Frankfurt, Ireland)
    Brazil customer → Brazil region (São Paulo)
    California customer → US-West or specific US region
    
    ↓
    Detect via: IP geolocation, billing address, or explicit selection
    Enforce: block tenant provision in non-compliant region
    Audit: verify region assignment in compliance reports

NO → No residency requirement?

    YES → Assign nearest region for lowest latency
        
        ↓
        Geographically closest region to user
        Lowest network latency for API requests
        Can be optimized later with read replicas
        
    NO → Enterprise with multi-region requirement?
    
        → Provision in primary region + read replicas in other regions
        Primary in home region
        Read replicas near users
        Cross-region replication for reads only

---

## Recommended Default

**Default:** IP-based geolocation at signup → assign nearest region; override for compliance requirements
**Reason:** IP geolocation covers most users. Explicit override handles compliance requirements that IP may not capture.

---

## Regional Failover

---

## Decision Context

Handling region-level failures in multi-region tenant placement — failing over tenants to another region without violating data residency.

---

## Decision Criteria

* performance: cross-region failover adds latency during recovery
* architectural: data residency may prevent cross-region failover
* maintainability: automated failover vs manual per-region
* security: failover must respect data residency boundaries

---

## Decision Tree

Primary region fails — failover to another region?

↓

Data residency requirements allow failover to another region?

YES → Automated regional failover

    ↓
    Health checks detect region failure
    Route DNS to secondary region
    Promote read replicas to primary
    
    ↓
    Recovery time: 1-5 minutes (DNS + promotion)
    All tenants in failed region move together

NO → Data residency prohibits cross-region failover?

    YES → Regional active-passive within same geographic area
        
        ↓
        Same legal jurisdiction (EU → another EU region)
        Secondary region within same data residency zone
        Cross-region replication within allowed boundary
        
    NO → Single region per tenant?
    
        → Manual recovery only
        Restore from backups in same region
        No automated cross-region failover
        Higher recovery time (hours, not minutes)
        Accept: region failure = downtime until region recovers

---

## Recommended Default

**Default:** Regional active-passive within same data residency zone (e.g., EU-west-1 → EU-central-1)
**Reason:** Cross-region failover within the same legal jurisdiction preserves compliance while providing recovery capability.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Multi-Region Tenant Placement
* Implement Compliance-Driven Isolation
