# 5-22 Compliance Driven Isolation - Decision Trees

## Isolation Tier by Regulation

---

## Decision Context

Mapping tenant isolation level to the strictest applicable regulation (GDPR, HIPAA, SOC2, PCI-DSS) to ensure compliance without over-isolating non-sensitive tenants.

---

## Decision Criteria

* performance: higher isolation = higher cost (N databases, N connections)
* architectural: HIPAA/PCI require DB-per-tenant; GDPR can work with shared-table
* maintainability: compliance tier drives infrastructure provisioning
* security: strictest regulation sets the floor for isolation

---

## Decision Tree

Which regulation applies?

↓

HIPAA or PCI-DSS?

YES → Database-per-tenant (REQUIRED)

    ↓
    Full data isolation — no shared tables
    Per-tenant audit logging (all PHI access)
    BAA with cloud provider (HIPAA)
    Encryption at rest and in transit
    
    ↓
    Each tenant: dedicated DB, dedicated encryption keys
    Audit: all data access logged with tenant_id
    Backup: per-tenant, encrypted

NO → GDPR or SOC2?

    YES → Schema-per-tenant or DB-per-tenant
        
        ↓
        GDPR: right to deletion → DB-per-tenant makes this easy (drop database)
        SOC2: logical access controls → schema-per-tenant is sufficient
        
        ↓
        Schema-per-tenant (GDPR): SET search_path enables tenant isolation
        Audit logs for SOC2: log all data access with tenant context

NO → No specific compliance?

    → Shared-table with global scopes is sufficient
    Standard SaaS isolation practices
    Upgrade isolation if compliance requirements change

---

## Recommended Default

**Default:** HIPAA/PCI → DB-per-tenant; GDPR → DB-per-tenant; SOC2 → schema-per-tenant; none → shared-table
**Reason:** Compliance requirements determine isolation. Over-isolation increases cost unnecessarily. Under-isolation creates compliance risk.

---

## Data Residency by Region

---

## Decision Context

Ensuring tenant data resides in the correct geographic region to satisfy data residency laws (GDPR-EU, LGPD-Brazil, CCPA-California, PIPL-China).

---

## Decision Criteria

* performance: cross-region latency adds 50-200ms
* architectural: regional infrastructure is independent per region
* maintainability: region-aware provisioning pipeline
* security: data must never leave the assigned region

---

## Decision Tree

Tenant requires specific data residency?

YES → Assign region at provisioning time

    ↓
    Capture region: IP geolocation, billing address, or tenant selection
    Provision tenant DB in assigned region
    Block cross-region data transfer
    
    ↓
    Regional infrastructure per region:
    - Database cluster
    - S3 bucket (region-locked)
    - Cache cluster
    - Queue infrastructure

NO → Global tenant (no residency requirement)?

    YES → Assign to nearest or lowest-cost region
    
        ↓
    Route to region with lowest latency
    Can be moved between regions later if needed
    
    NO → Multi-region read replicas?
    
        → Primary in home region, read replicas in other regions
        Reads served locally; writes go to home region
        Accept: eventual consistency for cross-region reads

---

## Recommended Default

**Default:** Assign tenant to region at signup based on IP/billing address; never allow cross-region data movement
**Reason:** Data residency is a legal requirement. Movement after initial placement increases complexity and risk.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Compliance-Driven Isolation
* Implement Multi-Region Tenant Placement
