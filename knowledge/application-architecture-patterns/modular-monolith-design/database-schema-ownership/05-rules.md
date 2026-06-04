# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Database schema ownership per module
Knowledge Unit ID: MMD-13
Difficulty Level: Advanced
Last Updated: 2026-06-02

---
## Rule Name
Every database table must have a clear owning module
---
## Category
Architecture
---
## Rule
Assign every database table to exactly one owning module. No table may be shared between modules or exist without a designated owner.
---
## Reason
Tables without ownership are a commons — anyone reads or writes, creating implicit coupling. Every module boundary violation starts with "it's just one query on a shared table."
---
## Bad Example
```php
// Table 'shared_settings' — no owning module
// Modules Billing, Catalog, Orders all read/write directly
// Schema change requires coordination with ALL modules
```
---
## Good Example
```php
// Table 'billing_invoices' — owned by Billing module
// Table 'catalog_products' — owned by Catalog module
// Table 'shared_settings' — owned by System module (explicit owner)
// Every table has a documented owner in the table registry
```
---
## Exceptions
Cross-cutting infrastructure tables (migrations table, job batches, cache, sessions) are owned by the application infrastructure, not any domain module.
---
## Consequences Of Violation
Schema ownership ambiguity; no module can evolve its tables independently; extraction blocked by shared tables.

---
## Rule Name
Use prefix naming convention for module tables
---
## Category
Code Organization
---
## Rule
Prefix every module-owned table with the module name and underscore (`billing_`, `catalog_`, `orders_`). This enables visual identification, automated enforcement, and database-level permission rules.
---
## Reason
Prefix naming makes table ownership obvious at a glance, enables prefix-based PHPStan enforcement, and works with any database engine. It is the simplest and most portable schema ownership strategy.
---
## Bad Example
```php
// No prefix — table ownership is ambiguous
Schema::create('invoices', function (Blueprint $table) { ... });
// Which module owns invoices? Need to check codebase to find out.
```
---
## Good Example
```php
// Prefix indicates module ownership
Schema::create('billing_invoices', function (Blueprint $table) { ... });
Schema::create('catalog_products', function (Blueprint $table) { ... });
Schema::create('orders_orders', function (Blueprint $table) { ... });
// Module prefix is immediately visible in the table name
```
---
## Exceptions
No common exceptions. Prefix naming is the recommended default for modular monoliths using single database.
---
## Consequences Of Violation
Ambiguous table ownership; cannot automate enforcement; extraction requires renaming tables.

---
## Rule Name
Never create cross-module foreign keys
---
## Category
Architecture
---
## Rule
Do not create foreign key constraints from a table in Module A to a table in Module B. Store the referenced ID as a plain integer/string without a database-level constraint.
---
## Reason
Cross-module foreign keys create schema-level coupling visible in the database — you cannot drop Module B's table without first removing Module A's foreign key. Schema evolution requires cross-module coordination.
---
## Bad Example
```php
// Cross-module foreign key — forbidden
Schema::create('billing_invoices', function (Blueprint $table) {
    $table->foreignId('catalog_product_id')
        ->constrained('catalog_products') // References Catalog module's table
        ->cascadeOnDelete();
    // Cannot drop catalog_products without modifying billing_invoices
});
```
---
## Good Example
```php
// Reference by ID without FK constraint
Schema::create('billing_invoices', function (Blueprint $table) {
    $table->unsignedBigInteger('product_id'); // Plain integer — no FK
    // $table->foreignId('product_id') — NO constrained()
    // Referential integrity managed by application code
});
```
---
## Exceptions
Cross-module foreign keys within the same database schema and prefix namespace (e.g., `billing_invoice_items` referencing `billing_invoices`) are fine because both tables have the same owning module.
---
## Consequences Of Violation
Schema evolution requires cross-module coordination; cannot drop a table without breaking foreign keys in other modules; extraction requires removing all cross-module FK constraints.

---
## Rule Name
Run migrations in dependency order
---
## Category
Reliability
---
## Rule
Ensure Module A's migrations run before Module B's migrations when Module B depends on Module A. Declare migration priority in `module.json` to enforce ordering.
---
## Reason
Module B's migration may reference Module A's tables (e.g., inserting seed data referencing a Module A table). If Module A's schema doesn't exist yet, migration fails.
---
## Bad Example
```php
// Module B migration needs Module A's table — but A runs after B
// Module B/migrations/2024_01_01_000002_create_order_items.php
Schema::table('orders_order_items', function (Blueprint $table) {
    $table->foreignId('billing_invoice_id');
    // billing_invoices table doesn't exist yet — migration fails
});
```
---
## Good Example
```php
// module.json priority ensures correct ordering
// Billing: { "priority": 10 } — runs first
// Orders: { "priority": 20 } — runs after Billing

// Or use explicit ordering in service provider:
// BillingServiceProvider::boot() loads migrations first
// OrdersServiceProvider::boot() loads migrations second
```
---
## Exceptions
No common exceptions. Migration ordering must be explicitly defined and tested.
---
## Consequences Of Violation
Deployment failures due to missing tables; emergency hotfixes required; deployment confidence erodes.

---
## Rule Name
Document table ownership in a table registry
---
## Category
Maintainability
---
## Rule
Maintain a registry listing every database table, its owning module, and contact information for the owning team. Keep the registry in the repository as a versioned document.
---
## Reason
Without a table registry, new developers must guess which module owns which table. Schema changes require finding the right owner — a registry makes this instant.
---
## Bad Example
```php
// No table ownership documentation
// "Who owns the 'promotions' table?"
// 10-minute Slack investigation
```
---
## Good Example
```php
// docs/table-registry.md or config/tables.php
return [
    'billing_invoices'        => ['module' => 'Billing', 'owner' => '@billing-team'],
    'billing_payments'        => ['module' => 'Billing', 'owner' => '@billing-team'],
    'catalog_products'        => ['module' => 'Catalog', 'owner' => '@catalog-team'],
    'catalog_categories'      => ['module' => 'Catalog', 'owner' => '@catalog-team'],
    'orders_orders'           => ['module' => 'Orders',  'owner' => '@orders-team'],
    'orders_order_items'      => ['module' => 'Orders',  'owner' => '@orders-team'],
];
```
---
## Exceptions
Very small teams (<5 engineers) may use a simpler convention (prefix-based) but should still document exceptions.
---
## Consequences Of Violation
Schema ownership ambiguity; changes require investigation to find owners; extraction blocked by unknown dependencies.

---
## Rule Name
Use database-level permissions to enforce schema ownership
---
## Category
Security
---
## Rule
Create separate database users per module with access restricted to the module's table prefix. The application connects with per-module credentials or manages connections per query.
---
## Reason
Code-level enforcement (PHPStan) is bypassable (raw SQL, DB::statement, etc.). Database-level permissions provide defense-in-depth — even a direct query attempt is rejected at the database level.
---
## Bad Example
```php
// Single user with access to ALL tables
'mysql' => [
    'username' => 'monolith_user', // SELECT, INSERT, UPDATE, DELETE on ALL tables
]
// Nothing prevents a module from querying any table
```
---
## Good Example
```php
// Per-module database users
'mysql_billing' => [
    'database' => 'monolith',
    'username' => 'billing_user', // GRANT SELECT, INSERT, UPDATE, DELETE ON billing_* TO billing_user
],
'mysql_catalog' => [
    'database' => 'monolith',
    'username' => 'catalog_user', // GRANT SELECT, INSERT, UPDATE, DELETE ON catalog_* TO catalog_user
],

// Each module's service provider uses its own connection
Config::set('database.connections.module', config('database.mysql_billing'));
```
---
## Exceptions
MySQL/PostgreSQL shared hosting environments may not support per-user grants. In this case, strict enforcement relies on code-level checks (PHPStan) and review processes.
---
## Consequences Of Violation
Cross-module database access can bypass code-level enforcement; accidental cross-module queries succeed; defense-in-depth is absent.

---
## Rule Name
Clean up orphan tables from disabled modules
---
## Category
Maintainability
---
## Rule
When a module is disabled or removed, drop its database tables as part of the cleanup. Orphan tables left behind become sources of confusion and wasted storage.
---
## Reason
Orphan tables retain stale data, confuse developers who see them in the database, and may interfere with future schema migrations or table name reuse.
---
## Bad Example
```php
// LegacyAnalytics module removed 2 years ago
// Tables still exist: legacy_analytics_events, legacy_analytics_reports
// New developer: "Are these tables still used?" — 2-hour investigation
```
---
## Good Example
```php
// Module removal checklist includes table cleanup
// 1. Create migration to drop module tables
// 2. Run migration in deployment
// 3. Document table removal in table registry
// 4. Verify no remaining references
```
---
## Exceptions
Tables that need to be retained for legal/compliance reasons after module removal must be documented and explicitly excluded from the cleanup plan.
---
## Consequences Of Violation
Stale data accumulates; developer confusion; potential future migration conflicts; wasted storage.
