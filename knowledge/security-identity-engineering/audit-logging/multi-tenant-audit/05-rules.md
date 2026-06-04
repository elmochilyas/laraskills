# Rules: Multi-Tenant Audit Logging

## Scope Audit Logs by Tenant ID
---
## Category
Architecture
---
## Rule
Include a `tenant_id` column on every audit log entry. Filter all audit log queries by the current tenant.
---
## Reason
In a multi-tenant application, audit logs from all tenants are stored in the same table. Without tenant scoping, a tenant admin can see audit events from other tenants. Tenant-scoped queries ensure each tenant only sees their own audit data.
---
## Bad Example
```php
Activity::all(); // Returns audit entries for all tenants — data leak
```
---
## Good Example
```php
Activity::where('tenant_id', tenant()->id)->get(); // Scoped to current tenant
```
---
## Exceptions
Platform-wide audit views for super-admins — filter by tenant_id explicitly.
---
## Consequences Of Violation
Audit log data leak between tenants, cross-tenant visibility.
---

## Set tenant_id Automatically via Middleware or Model Events
---
## Category
Architecture
---
## Rule
Automatically populate `tenant_id` on audit log entries using a global scope, model event observer, or middleware. Never rely on developers remembering to set it manually.
---
## Reason
Manual `tenant_id` assignment in every controller/log call is error-prone. A developer may forget to set it, resulting in entries without tenant context. Automatic population (via middleware setting a context value or a model event applying the current tenant) ensures consistent scoping.
---
## Bad Example
```php
// Manual tenant_id — easily forgotten
activity()->withProperty('tenant_id', $request->user()->tenant_id)->log('user_created');
```
---
## Good Example
```php
// Middleware sets tenant context
class TenantContextMiddleware {
    public function handle($request, $next) {
        activity()->withProperty('tenant_id', tenant()->id);
        return $next($request);
    }
}
```
---
## Exceptions
No common exceptions — automatic tenant scoping is essential.
---
## Consequences Of Violation
Inconsistent tenant scoping, entries missing tenant context.
---

## Log Tenant-Specific Events Separately From Cross-Tenant Events
---
## Category
Architecture
---
## Rule
Mark audit events as either `tenant` (visible to tenant admin) or `platform` (visible only to platform super-admins). Never expose platform-level audit entries to tenant users.
---
## Reason
Tenant admins should see audit logs for their tenant's resources. Platform-level events (tenant created, subscription changed, platform config updated) should only be visible to super-admins. Mixing these exposes sensitive operational data to tenants.
---
## Bad Example
```php
// All events in one scope — tenant admins see platform events
```
---
## Good Example
```php
// Platform events — not tenant-scoped, not visible to tenant users
activity()->withProperty('scope', 'platform')->log('tenant_subscription_changed');
// Tenant events — tenant-scoped, visible to tenant admin
activity()->withProperty('scope', 'tenant')->log('user_created');
```
---
## Exceptions
No common exceptions — separation of scope is required for data isolation.
---
## Consequences Of Violation
Tenant users see sensitive platform operations.
---

## Implement Tenant-Level Audit Log Retention Policies
---
## Category
Architecture
---
## Rule
Allow per-tenant audit log retention policies (e.g., tenant A retains 1 year, tenant B retains 3 years). Enforce the policy during log cleanup.
---
## Reason
Different tenants have different compliance requirements (PCI, HIPAA, SOC2). A one-size-fits-all retention policy either retains too long (storage waste, cost) or not long enough (compliance violation). Per-tenant policies align with each tenant's obligations.
---
## Bad Example
```php
// Global retention — all tenants treated the same
Activity::where('created_at', '<', now()->subYear())->delete();
```
---
## Good Example
```php
// Per-tenant retention
$tenants = Tenant::all();
foreach ($tenants as $tenant) {
    $cutoff = now()->subMonths($tenant->audit_retention_months);
    Activity::where('tenant_id', $tenant->id)
        ->where('created_at', '<', $cutoff)
        ->delete();
}
```
---
## Exceptions
No common exceptions — retention policies must be per-tenant to meet varying compliance needs.
---
## Consequences Of Violation
Compliance violation for tenants requiring longer retention.
---

## Index the Audit Log Table by (tenant_id, created_at)
---
## Category
Performance
---
## Rule
Create a composite index on `(tenant_id, created_at)` in the audit log table. This optimizes the most common query pattern: fetching recent audit entries for a specific tenant.
---
## Reason
Tenant-scoped audit queries filter by `tenant_id` and order by `created_at`. Without a composite index, the database scans the entire table. With the index, lookups are efficient even with millions of entries across many tenants.
---
## Bad Example
```php
Schema::create('activity_log', function ($table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    // No index — full table scan on tenant queries
});
```
---
## Good Example
```php
Schema::create('activity_log', function ($table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    $table->timestamp('created_at');
    $table->index(['tenant_id', 'created_at']); // Composite index
});
```
---
## Exceptions
No common exceptions — composite indexing is essential for multi-tenant audit performance.
---
## Consequences Of Violation
Slow audit log queries as the table grows across tenants.
---

## Encrypt Cross-Tenant Audit Data in Transit
---
## Category
Security
---
## Rule
If audit logs are shipped to a centralized logging service, encrypt the stream and include tenant_id as a metadata field. Never allow one tenant to see another tenant's audit data in centralized logs.
---
## Reason
Centralized logging services (ELK, Datadog, Splunk) aggregate logs from multiple tenants. Without tenant-scoped access controls in the logging service, a tenant admin viewing logs may see entries from other tenants. Tagging logs with tenant_id enables access control in the logging platform.
---
## Bad Example
```php
// Audit logs shipped without tenant context
Log::channel('audit')->info('User created', $logData);
```
---
## Good Example
```php
// Audit logs shipped with tenant context for centralized access control
Log::channel('audit')->info('User created', array_merge($logData, [
    'tenant_id' => tenant()->id,
]));
```
---
## Exceptions
No common exceptions — centralized logging must preserve tenant isolation.
---
## Consequences Of Violation
Cross-tenant data exposure in centralized logging platform.
