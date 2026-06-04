# Rules: Shared Database Tenant Scoping

## Add a tenant_id Column to Every Tenant-Scoped Table
---
## Category
Architecture
---
## Rule
Include a `tenant_id` foreign key column on every table that contains tenant-specific data. Never omit it from tables that should be tenant-scoped.
---
## Reason
Shared database multi-tenancy relies on row-level scoping. A table without `tenant_id` stores data that is visible to all tenants (global), or, worse, stores tenant data that is not scoped (data leak). Every tenant-scoped table must have a `tenant_id` column.
---
## Bad Example
```php
Schema::create('posts', function ($table) {
    $table->id();
    $table->string('title');
    // No tenant_id — data visible to all tenants
});
```
---
## Good Example
```php
Schema::create('posts', function ($table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
    $table->string('title');
});
```
---
## Exceptions
Global tables shared across all tenants (countries, currencies, config).
---
## Consequences Of Violation
Cross-tenant data leak, tenant data visible to all.
---

## Apply a Global Scope to Automatically Filter by tenant_id
---
## Category
Architecture
---
## Rule
Use Laravel global scopes to automatically add `where tenant_id = ?` to all queries on tenant-scoped models. Never rely on developers adding the scope manually.
---
## Reason
Without automatic scoping, a developer who forgets to add `->where('tenant_id', tenant()->id)` accidentally queries data for all tenants. Global scopes enforce tenant isolation at the query level — the developer cannot accidentally omit the scope.
---
## Bad Example
```php
// Manual scoping — easily forgotten
Post::where('tenant_id', tenant()->id)->get(); // One more developer forgets
```
---
## Good Example
```php
class TenantScope implements Scope {
    public function apply(Builder $builder, Model $model) {
        $builder->where('tenant_id', tenant()->id);
    }
}
class Post extends Model {
    protected static function booted(): void {
        static::addGlobalScope(new TenantScope);
    }
}
Post::all(); // Automatically scoped to current tenant
```
---
## Exceptions
Global models (countries, config) — exclude from tenant scope.
---
## Consequences Of Violation
Cross-tenant data queries, accidental data leaks.
---

## Set tenant_id Automatically on Model Creation
---
## Category
Architecture
---
## Rule
Use model events (creating) to automatically set `tenant_id` from the current tenant context. Remove `tenant_id` from `$fillable`.
---
## Reason
If `tenant_id` is in `$fillable`, a malicious user can send `tenant_id: 2` in a POST request and create data in another tenant's scope. Automatic assignment from the tenant context prevents this and frees developers from manually setting it.
---
## Bad Example
```php
protected $fillable = ['title', 'tenant_id']; // tenant_id can be set by user
Post::create($request->all()); // User can set tenant_id to another tenant
```
---
## Good Example
```php
class Post extends Model {
    protected $fillable = ['title']; // tenant_id not fillable
    protected static function booted(): void {
        static::creating(function ($post) {
            $post->tenant_id = tenant()->id;
        });
    }
}
```
---
## Exceptions
No common exceptions — `tenant_id` must never be fillable.
---
## Consequences Of Violation
Tenant-assignment attack, data created in wrong tenant.
---

## Create a Composite Unique Key Including tenant_id
---
## Category
Architecture
---
## Rule
Include `tenant_id` in all unique indexes and composite keys on tenant-scoped tables. Never have a unique constraint on a non-tenant column without `tenant_id`.
---
## Reason
A unique constraint on `email` in a shared database means only one user across all tenants can have a given email. Including `tenant_id` in the unique constraint (`UNIQUE(tenant_id, email)`) allows the same email in different tenants while preventing duplicates within a tenant.
---
## Bad Example
```php
Schema::create('users', function ($table) {
    $table->id();
    $table->string('email')->unique(); // Only one user across ALL tenants can have this email
});
```
---
## Good Example
```php
Schema::create('users', function ($table) {
    $table->id();
    $table->foreignId('tenant_id')->constrained();
    $table->string('email');
    $table->unique(['tenant_id', 'email']); // Unique per tenant
});
```
---
## Exceptions
No common exceptions — composite unique keys are essential for shared database multitenancy.
---
## Consequences Of Violation
Uniqueness constraint violated by different tenants, or global uniqueness enforced incorrectly.
---

## Test Tenant Data Isolation in Feature Tests
---
## Category
Testing
---
## Rule
Write feature tests that create data for two tenants and verify that each tenant cannot see the other's data.
---
## Reason
Tenant isolation is the single most critical security requirement in a shared-database multi-tenancy. A bug in scoping logic (global scope not applied, missing `tenant_id` on an eager load, raw query bypassing scope) can leak all tenants' data. Isolation tests are the primary defense.
---
## Bad Example
```php
// No tenant isolation tests — data leak may go undetected
```
---
## Good Example
```php
public function test_tenant_data_isolation(): void {
    $tenant1 = Tenant::factory()->create();
    $tenant2 = Tenant::factory()->create();
    tenancy()->set($tenant1);
    Post::factory()->create(['title' => 'Tenant1 Post']);
    tenancy()->set($tenant2);
    $posts = Post::all();
    $this->assertCount(0, $posts); // Tenant2 should not see Tenant1's post
}
```
---
## Exceptions
No common exceptions — tenant isolation tests are mandatory.
---
## Consequences Of Violation
Cross-tenant data leak undetected until breach.
---

## Consider the Performance Impact of tenant_id on Every Query
---
## Category
Performance
---
## Rule
Index the `tenant_id` column on every tenant-scoped table. Consider composite indexes with `tenant_id` as the leading column for common query patterns.
---
## Reason
Every tenant query filters by `tenant_id`. Without an index, the database performs a full table scan. With an index, the database narrows the scan to the tenant's rows. Composite indexes (`tenant_id, created_at`) optimize common filtering and sorting patterns.
---
## Bad Example
```php
Schema::table('posts', function ($table) {
    $table->foreignId('tenant_id')->constrained();
    // No index — full table scan on every tenant query
});
```
---
## Good Example
```php
Schema::table('posts', function ($table) {
    $table->foreignId('tenant_id')->constrained();
    $table->index('tenant_id');
    $table->index(['tenant_id', 'created_at']); // For "recent posts" queries
});
```
---
## Exceptions
Trivially small tables (under 1,000 rows per tenant) — index overhead may not be worth it.
---
## Consequences Of Violation
Slow queries as tenant data grows, poor scalability.
