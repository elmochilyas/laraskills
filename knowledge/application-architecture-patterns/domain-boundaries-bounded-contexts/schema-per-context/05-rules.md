# Rule: Prefix all table names with the owning context identifier
---
## Category
Code Organization
---
## Rule
Use context-based table prefix naming (e.g., `billing_invoices`, `identity_users`) as the default schema organization strategy for multi-context Laravel applications.
---
## Reason
Prefix naming makes context ownership visible at the database level. Any developer seeing `billing_invoices` immediately knows which context owns it. It works with any database engine.
---
## Bad Example
```php
// No prefix — ownership invisible
Schema::create('invoices', function (Blueprint $table) { /* ... */ });
Schema::create('users', function (Blueprint $table) { /* ... */ });
// Which context owns what? Unknown without external docs
```
---
## Good Example
```php
// Prefix naming — ownership immediately visible
Schema::create('billing_invoices', function (Blueprint $table) { /* ... */ });
Schema::create('identity_users', function (Blueprint $table) { /* ... */ });
Schema::create('catalog_products', function (Blueprint $table) { /* ... */ });
```
---
## Exceptions
PostgreSQL schema-per-context or database-per-context strategies with equivalent tooling enforcement.
---
## Consequences Of Violation
Context ownership at database level is invisible; cross-context queries are undetectable; governance is impossible.

# Rule: Store migrations in context-specific directories
---
## Category
Code Organization
---
## Rule
Place database migrations for each context in a directory within that context's module, not in the global `database/migrations/` directory.
---
## Reason
Colocated migrations keep schema changes with the owning context's code. Developers working on a context find all relevant migrations in one place, and service providers can auto-load only that context's migrations.
---
## Bad Example
```php
// All migrations in one global directory
// database/migrations/2026_01_01_create_users_table.php
// database/migrations/2026_01_02_create_invoices_table.php
// database/migrations/2026_01_03_create_products_table.php
```
---
## Good Example
```php
// Migrations in context-specific directories
// app/Domains/Identity/Database/Migrations/2026_01_01_create_users_table.php
// app/Domains/Billing/Database/Migrations/2026_01_02_create_invoices_table.php
// app/Domains/Catalog/Database/Migrations/2026_01_03_create_products_table.php

// Context service provider auto-loads its migrations
class IdentityServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');
    }
}
```
---
## Exceptions
Single-context applications — the global migrations directory suffices.
---
## Consequences Of Violation
Migrations from all contexts intermix; developers cannot easily find all changes relevant to one context.

# Rule: Govern prefix uniqueness across all contexts
---
## Category
Architecture
---
## Rule
Maintain a prefix registry ensuring each context uses a unique, non-overlapping table prefix.
---
## Reason
Duplicate prefixes create ambiguity — two contexts using `billing_` would make ownership unclear. A registry prevents conflicts and provides a single source of truth for prefix assignments.
---
## Bad Example
```php
// Two contexts accidentally using the same prefix
// Billing uses 'billing_'
// Reports also uses 'billing_' — conflicts
```
---
## Good Example
```php
// Prefix registry documented in configuration
class ContextPrefixRegistry
{
    public array $prefixes = [
        'identity' => 'identity_',
        'billing'  => 'billing_',
        'catalog'  => 'catalog_',
        'reporting' => 'reporting_',
    ];

    public function assertUnique(string $prefix, string $context): void
    {
        if (in_array($prefix, $this->prefixes, true)
            && array_search($prefix, $this->prefixes, true) !== $context) {
            throw new PrefixConflictException("Prefix $prefix already assigned");
        }
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Ambiguous table ownership; two contexts may unintentionally share the same prefix.

# Rule: Never create cross-context foreign keys
---
## Category
Architecture
---
## Rule
Do not define foreign key constraints between tables owned by different contexts.
---
## Reason
Cross-context foreign keys create database-level coupling. If the owning context needs to change its primary key, archive old records, or split its database, FK constraints from other contexts prevent it.
---
## Bad Example
```php
Schema::create('billing_invoices', function (Blueprint $table) {
    $table->foreignId('user_id')
        ->constrained('identity_users'); // cross-context FK
});
```
---
## Good Example
```php
Schema::create('billing_invoices', function (Blueprint $table) {
    $table->unsignedInteger('identity_user_id');
    // No FK — reference by convention
});

Schema::create('billing_payments', function (Blueprint $table) {
    $table->foreignId('invoice_id')
        ->constrained('billing_invoices'); // within-context FK — allowed
});
```
---
## Exceptions
When contexts are guaranteed to remain in the same database forever and extraction is not planned.
---
## Consequences Of Violation
Owning context cannot evolve its schema independently; extracting to microservice requires removing all cross-context FKs first.

# Rule: Enforce context prefix ownership with automated checks
---
## Category
Testing
---
## Rule
Use automated static analysis (PHPStan, custom linters) to enforce that each table prefix maps to its owning context and no cross-context FKs exist.
---
## Reason
Manual enforcement of prefix conventions is unreliable as the codebase grows. Automated checks catch violations at CI time before they merge.
---
## Bad Example
```php
// No enforcement — violations discovered months later in production
// Developer accidentally creates 'identity_orders' table without prefix registry check
```
---
## Good Example
```php
// PHPStan custom rule enforcing prefix conventions
class ContextPrefixRule implements Rule
{
    public function processNode(Node $node): array
    {
        // Detect Schema::create('table_name', ...)
        // Verify table_name starts with a registered context prefix
        // Report error if table has no prefix or uses unregistered prefix
        return $errors;
    }
}
```
---
## Exceptions
Single-context applications — no prefix enforcement needed.
---
## Consequences Of Violation
Inconsistent prefixing creeps in; ownership becomes ambiguous over time.

# Rule: Use schema-per-context (PostgreSQL) when microservice extraction is planned
---
## Category
Architecture
---
## Rule
Use PostgreSQL schema-per-context (`CREATE SCHEMA billing`) when microservice extraction is planned and stronger isolation is desired without separate database servers.
---
## Reason
Schema-per-context provides stronger isolation than prefix naming — schemas are independent namespaces with separate permission boundaries. Extracting to a microservice requires only pointing the new service to its schema.
---
## Bad Example
```php
// Prefix naming used despite microservice extraction planned in 6 months
// Extraction requires renaming all tables or using views, adding risk
```
---
## Good Example
```php
// PostgreSQL schema-per-context in config/database.php
'connections' => [
    'billing' => [
        'driver' => 'pgsql',
        'schema' => 'billing',
    ],
    'catalog' => [
        'driver' => 'pgsql',
        'schema' => 'catalog',
    ],
],

Schema::connection('billing')->create('invoices', function (Blueprint $table) { /* ... */ });
```
---
## Exceptions
MySQL-only environments (no schema support) — use prefix naming instead.
---
## Consequences Of Violation
Extraction to microservices requires renaming tables or creating views, adding migration risk.

# Rule: Apply prefixes consistently to all tables
---
## Category
Code Organization
---
## Rule
Apply context prefixes consistently to all tables. Do not prefix some tables while leaving others unprefixed.
---
## Reason
Inconsistent prefixing makes ownership partly invisible. Developers cannot tell if an unprefixed table is a new context, an oversight, or belongs to a specific context.
---
## Bad Example
```php
// Inconsistent — some prefixed, some not
Schema::create('users', function (Blueprint $table) { /* ... */ });        // unprefixed
Schema::create('billing_invoices', function (Blueprint $table) { /* ... */ }); // prefixed
Schema::create('products', function (Blueprint $table) { /* ... */ });      // unprefixed
```
---
## Good Example
```php
// Consistent — all tables prefixed
Schema::create('identity_users', function (Blueprint $table) { /* ... */ });
Schema::create('billing_invoices', function (Blueprint $table) { /* ... */ });
Schema::create('catalog_products', function (Blueprint $table) { /* ... */ });
```
---
## Exceptions
Tables shared across all contexts (e.g., `migrations`, `failed_jobs` in Laravel).
---
## Consequences Of Violation
Ownership is ambiguous for unprefixed tables; automated prefix enforcement cannot work partially.

# Rule: Register context database connections in the context service provider
---
## Category
Code Organization
---
## Rule
Configure database connections for each context in the context's service provider, registering them in Laravel's database config during boot.
---
## Reason
Colocating connection configuration with the owning context keeps database setup close to the code that uses it. Centralized `config/database.php` becomes unwieldy as contexts multiply.
---
## Bad Example
```php
// All connections defined in central config/database.php
// 50 lines of connection config for 10 contexts
// Adding a new context requires editing shared configuration
```
---
## Good Example
```php
// Context registers its own connection
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        config([
            'database.connections.billing' => [
                'driver' => 'mysql',
                'database' => env('BILLING_DB_DATABASE', 'billing'),
                'host' => env('BILLING_DB_HOST', '127.0.0.1'),
                'prefix' => 'billing_',
            ],
        ]);
    }
}
```
---
## Exceptions
Database-per-context with fully separate databases may prefer centralized config for visibility.
---
## Consequences Of Violation
Connection config is scattered or centralized with no ownership; adding a context touches shared configuration files.
