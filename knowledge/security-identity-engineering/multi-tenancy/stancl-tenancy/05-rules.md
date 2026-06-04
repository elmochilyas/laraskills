# Rules: Stancl Tenancy Package

## Use the Package's Built-in Tenant Identification
---
## Category
Architecture
---
## Rule
Configure Stancl's tenancy identification via domain or subdomain in `config/tenancy.php`. Let the package resolve the tenant; do not implement custom identification logic.
---
## Reason
Stancl handles tenant identification, database connection switching, and cache prefixing automatically. Custom identification logic duplicates the package's functionality and may miss edge cases (central routes, tenant routes, identification middleware). The package's identification is battle-tested and well-documented.
---
## Bad Example
```php
// Custom tenant identification — duplicates package functionality
$tenant = Tenant::where('domain', request()->getHost())->first();
```
---
## Good Example
```php
// config/tenancy.php
'identification' => [
    'driver' => 'domain',
    'model' => Tenant::class,
],
```
---
## Exceptions
Custom identification logic for non-standard patterns (path-based tenancy) — still use the package's extensibility points.
---
## Consequences Of Violation
Duplicated logic, missed edge cases, bugs in tenant resolution.
---

## Use the Tenant Model's Events for Lifecycle Hooks
---
## Category
Architecture
---
## Rule
Override the `Tenant` model's lifecycle events (`creating`, `created`, `domainCreated`) for tenant provisioning. Use queues for slow operations (database creation, seeding).
---
## Reason
Stancl provides specific events for tenant lifecycle management. These events fire at the correct points and have access to the tenant object and its domains. Using `creating` hooks to create the tenant database ensures automated and consistent provisioning.
---
## Bad Example
```php
// Manual tenant creation outside the package's event system
public function registerTenant(Request $request) {
    $tenant = Tenant::create([...]);
    DB::statement("CREATE DATABASE tenant_{$tenant->id}");
}
```
---
## Good Example
```php
class Tenant extends BaseTenant {
    protected static function booted(): void {
        static::created(function ($tenant) {
            $tenant->domains()->create(['domain' => $tenant->domain]);
        });
    }
}
// TenancyServiceProvider handles database creation via the package's event
```
---
## Exceptions
No common exceptions — lifecycle events are the correct integration point.
---
## Consequences Of Violation
Inconsistent tenant setup, missing domains or databases.
---

## Initialize Tenancy Before Application Boot for Console Commands
---
## Category
Architecture
---
## Rule
Use Stancl's `tenant:run` and `tenant:artisan` commands to run Artisan commands in the context of specific tenants. Never manually set tenant context in command handles.
---
## Reason
Artisan commands run in the central context by default. Stancl provides `tenant:run` to execute commands per-tenant with proper initialization. Manual `tenancy()->initialize($tenant)` in command handles is fragile — it may run after the central boot sequence has already established a database connection.
---
## Bad Example
```php
public function handle() {
    tenancy()->initialize($this->argument('tenant')); // Manual init — fragile
}
```
---
## Good Example
```bash
# Run a command for a specific tenant
php artisan tenant:run "queue:work" --tenant=abc
# Or for all tenants
php artisan tenant:run "some:command" --tenants=all
```
---
## Exceptions
No common exceptions — use the package's tenant-aware command utilities.
---
## Consequences Of Violation
Commands run in wrong tenant context, or initialization failures.
---

## Use Tenant-Aware Cache, Queue, and Filesystem Prefixing
---
## Category
Architecture
---
## Rule
Enable Stancl's automatic cache prefixing, queue tagging, and filesystem tenant-scoping in `config/tenancy.php`. Never disable these without a storage isolation plan.
---
## Reason
Without prefixing, cached data from one tenant is served to another (cache poisoning). Queue jobs from one tenant leak into another tenant's queue. Files stored by one tenant overwrite or are visible to another. Stancl's automatic prefixing prevents these cross-tenant issues.
---
## Bad Example
```php
// config/tenancy.php
'cache' => ['tag_based' => false], // Global cache — cross-tenant cache poisoning
```
---
## Good Example
```php
// config/tenancy.php
'cache' => ['tag_based' => true], // Tenant-prefixed cache
'filesystem' => ['suffix' => 'tenant_'], // Tenant-differentiated paths
'queue' => ['tag_based' => true], // Tenant-tagged queues
```
---
## Exceptions
No common exceptions — these features prevent fundamental multi-tenancy bugs.
---
## Consequences Of Violation
Cross-tenant cache poisoning, queue leakage, file visibility.
---

## Use the Package's Migration System for Tenant Databases
---
## Category
Architecture
---
## Rule
Register tenant migration paths in `config/tenancy.php` under `migration_paths`. Use `php artisan tenants:migrate` to run migrations for all tenants.
---
## Reason
Stancl provides a dedicated migration system that runs tenant migrations across all tenant databases. Manual migration of tenant databases (iterating tenants and running migrate) is error-prone and slow. The package handles parallel execution and migration tracking.
---
## Bad Example
```php
// Manual iteration — slow, no parallel execution
Tenant::all()->each(fn ($t) => $t->run(function () {
    Artisan::call('migrate');
}));
```
---
## Good Example
```php
// config/tenancy.php
'migration_paths' => [
    database_path('migrations/tenant'),
];
```
```bash
php artisan tenants:migrate
```
---
## Exceptions
No common exceptions — use the package's migration system for scalability.
---
## Consequences Of Violation
Slow tenant migrations, inconsistent migration state.
---

## Test Tenant Isolation as Part of the Test Suite
---
## Category
Testing
---
## Rule
Use Stancl's `TenantTestCase` or `InitTenancy` trait in feature tests to write tenant-scoped tests. Test both central and tenant contexts.
---
## Reason
Stancl provides testing utilities that initialize tenancy for test methods. Without these, tests run in the central context and do not verify tenant isolation. Proper tenant-scoped tests catch misconfiguration in global scopes, cache prefixing, and queue tagging.
---
## Bad Example
```php
// Test without tenancy initialization — runs in central context
class PostTest extends TestCase {
    // Does not test tenant isolation
}
```
---
## Good Example
```php
class PostTest extends TestCase {
    use InitTenancy; // Initializes tenant context per test
    public function test_tenant_scoped_posts(): void {
        Post::factory()->create(['title' => 'Test']);
        $this->assertCount(1, Post::all());
    }
}
```
---
## Exceptions
No common exceptions — tenant-scoped testing is essential.
---
## Consequences Of Violation
Tenant isolation bugs undetected in tests.
