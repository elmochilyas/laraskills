# 5-5 Eloquent Global Scopes - Decision Trees

## Global Scope Implementation: Trait vs Manual Registration

---

## Decision Context

Choosing how to apply tenant-scoping global scopes to Eloquent models — via a reusable trait or manual `addGlobalScope` registration on each model.

---

## Decision Criteria

* performance: global scope adds `WHERE tenant_id = ?` to every query — negligible overhead
* architectural: trait is DRY; manual registration is explicit
* maintainability: trait ensures consistent scoping; manual risks missing models
* security: unscoped model = cross-tenant data leak

---

## Decision Tree

How to apply tenant global scope?

↓

Many models need tenant scoping?

YES → Use TenantScoped trait

    ↓
    trait TenantScoped {
        protected static function booted(): void {
            static::addGlobalScope('tenant', fn($q) => 
                $q->where('tenant_id', tenant()->id)
            );
        }
    }
    
    ↓
    Usage: class Order extends Model { use TenantScoped; }
    One line per model — impossible to forget
    Easy to add to new models
    
    ↓
    Extend trait with:
    - scopeForTenant($query, $tenantId)
    - isTenantScoped() check
    - belongsToTenant() relationship

NO → Only 1-2 models need scoping?

    YES → Manual addGlobalScope in booted()
    
        ↓
        protected static function booted(): void {
            static::addGlobalScope('tenant', ...);
        }
        
        Acceptable for very few models
        Risk: new models may be missed

NO → Models that should NEVER be tenant-scoped?

    → Do NOT use the trait
    Global (shared) models: plans, countries, settings
    Document explicitly: "This model is intentionally not tenant-scoped"

---

## Recommended Default

**Default:** TenantScoped trait for all tenant-scoped models
**Reason:** Consistent, DRY, reduces the risk of forgetting to scope a new model. The trait makes intent explicit.

---

## withoutGlobalScope: When to Bypass Safely

---

## Decision Context

Using `withoutGlobalScope` to bypass tenant scoping for legitimate cross-tenant operations (admin reports, tenant migration, data export).

---

## Decision Criteria

* performance: bypassing scope removes WHERE clause — may return more rows
* architectural: every bypass is a potential data leak
* maintainability: log and audit every bypass
* security: bypass must be authorized (admin-only)

---

## Decision Tree

Need to bypass tenant global scope?

↓

Is the operation admin-only?

YES → Log and audit the bypass

    ↓
    Model::withoutGlobalScope('tenant')
        ->where('created_at', '>', now()->subDay())
        ->get();
    
    Must verify: current user is super-admin
    Must log: who bypassed, which model, why
    Must use: try-finally to restore scope
    
    ↓
    Acceptable uses:
    - Cross-tenant admin reports
    - Tenant data export (admin request)
    - Migration scripts (controlled execution)

NO → Regular user operation?

    YES → DO NOT bypass — find alternative
        
        ↓
        Need tenant's own data? Already scoped.
        Need related tenant data? Use relationship.
        Cross-tenant access by regular users = DATA LEAK

NO → Internal job or command?

    → Bypass with explicit tenant scoping
    Pass tenant_id to command argument
    Scope queries manually in command
    Document why bypass is necessary

---

## Recommended Default

**Default:** Never bypass global scope in user-facing code; bypass only in admin commands with logging
**Reason:** Each bypass is a potential cross-tenant data leak. Logging ensures accountability. Admin-only enforcement prevents accidental exposure.

---

## Related Rules

* Rule 5-12-1: Use withGlobalScope Guardrails
* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Eloquent Global Scopes for Tenant Isolation
