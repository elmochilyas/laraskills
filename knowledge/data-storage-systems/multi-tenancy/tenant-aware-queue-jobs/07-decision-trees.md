# 5-7 Tenant Aware Queue Jobs - Decision Trees

## Tenant Context Serialization Strategy

---

## Decision Context

Ensuring queue jobs execute in the correct tenant context by serializing the tenant ID into the job payload and rebinding context on job execution.

---

## Decision Criteria

* performance: serialization adds negligible overhead
* architectural: tenant ID must survive serialization across queue drivers (Redis, SQS, DB)
* maintainability: base class with rebind method prevents forgetting
* security: forgetting to rebind = cross-tenant data leak

---

## Decision Tree

How to ensure queue jobs run in correct tenant context?

↓

Single tenant per job execution?

YES → Serialize tenant ID in job property

    ↓
    class ProcessOrder implements ShouldQueue {
        public $tenantId;
        
        public function __construct($order) {
            $this->tenantId = tenant()->id;
        }
        
        public function handle() {
            $this->rebindTenantContext($this->tenantId);
            // business logic
        }
    }
    
    ↓
    Tenant ID serialized with job payload
    On handle(): rebind context before anything else
    Use TenantAwareJob base class for consistency

NO → Multiple tenants per job (batch)?

    YES → Job receives tenant ID list
    
        ↓
        public $tenantIds = [];
        handle() loops through tenant IDs
        Rebinds context per tenant in loop
        
        ↓
        Parallel processing per tenant:
        Dispatch individual tenant jobs instead
        Better isolation, error handling, retry

NO → Global (non-tenant) job?

    → No tenant context needed
    Never serializes tenant context
    Uses default/central connection

---

## Recommended Default

**Default:** Serialize tenant ID in public property on base class; rebind in handle() before business logic
**Reason:** Base class ensures consistent rebinding. Serializing in constructor guarantees tenant ID is captured at dispatch time, not execution time.

---

## Horizon Tenant Tagging

---

## Decision Context

Tagging Horizon queue jobs with tenant ID for per-tenant monitoring, alerting, and capacity management.

---

## Decision Criteria

* performance: Horizon tags are in-memory — negligible overhead
* architectural: tags enable per-tenant metrics and filtering
* maintainability: add tenant tag in base job class
* security: tag should include tenant ID for audit trail

---

## Decision Tree

Should you tag Horizon jobs with tenant ID?

↓

Need to monitor queue load per tenant?

YES → Add tenant tag in base job class

    ↓
    class TenantAwareJob implements ShouldQueue {
        public $tenantId;
        
        public function __construct() {
            $this->tenantId = tenant()->id;
        }
        
        public function tags(): array {
            return ['tenant:'.$this->tenantId, get_class($this)];
        }
    }
    
    ↓
    Horizon dashboard: filter by tenant tag
    Monitoring: track queue time per tenant
    Alerting: detect noisy tenant flooding queue

NO → Need per-tenant queue isolation?

    YES → Separate queue per tenant
        
        ↓
        tenant-{id}-high, tenant-{id}-default
        Each tenant has dedicated queue
        Noisy tenant can't starve others
        
        ↓
        More complex — N queues to monitor
        Use for high-value tenants only

NO → Single queue for all tenants?

    → No tenant tags (all jobs look the same)
    Accept: can't identify which tenant is causing queue backlog
    Accept: noisy tenant affects all others

---

## Recommended Default

**Default:** Tenant tags on all tenant-aware jobs; separate queues for high-value tenants
**Reason:** Tags enable monitoring without operational complexity. Separate queues provide isolation when needed.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant-Aware Queue Jobs
* Implement Cross-Tenant Data Leak Prevention
