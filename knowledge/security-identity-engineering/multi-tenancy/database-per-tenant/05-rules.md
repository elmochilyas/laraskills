# Rules: Database-Per-Tenant Architecture

## Use a Central Database for Tenant Metadata
---
## Category
Architecture
---
## Rule
Maintain a central database with a `tenants` table that stores tenant connection details (database name, host, credentials). Use this database to resolve the current tenant and establish connections.
---
## Reason
Without a central registry, the application cannot know which database a given tenant uses. The central database stores tenant metadata, including the tenant's database credentials. The application queries the central DB to resolve the tenant and then connects to the tenant's specific database.
---
## Bad Example
```php
// No central database — tenant connection hardcoded
```
---
## Good Example
```php
Schema::create('tenants', function ($table) {
    $table->id();
    $table->string('domain')->unique();
    $table->string('database_name');
    $table->string('database_host');
    $table->string('database_username');
    $table->string('database_password'); // Encrypted at rest
});
```
---
## Exceptions
No common exceptions — a central registry is required for database-per-tenant.
---
## Consequences Of Violation
Cannot dynamically resolve tenant databases.
---

## Create and Migrate Tenant Databases Programmatically
---
## Category
Architecture
---
## Rule
Use an Artisan command to create a new tenant database and run migrations when a new tenant signs up. Never create tenant databases manually.
---
## Reason
Manual database creation is error-prone and does not scale. An automated command that creates the database, runs migrations, seeds initial data, and registers the tenant in the central database ensures consistency.
---
## Bad Example
```bash
# Manually create database — error-prone, no audit trail
mysql -e "CREATE DATABASE tenant_abc"
```
---
## Good Example
```php
class CreateTenantDatabase extends Command {
    public function handle() {
        $name = "tenant_{$this->argument('domain')}";
        DB::statement("CREATE DATABASE {$name}");
        config(['database.connections.tenant.database' => $name]);
        Artisan::call('migrate', ['--database' => 'tenant', '--path' => 'database/migrations/tenant']);
        Tenant::create(['domain' => ..., 'database_name' => $name]);
    }
}
```
---
## Exceptions
No common exceptions — automated tenant creation is essential for consistency.
---
## Consequences Of Violation
Inconsistent tenant setups, missing tables or seed data.
---

## Route the Tenant Request to the Correct Database Dynamicly
---
## Category
Architecture
---
## Rule
Implement middleware that resolves the tenant from the request (domain or subdomain), looks up the tenant connection in the central database, and dynamically sets the tenant database connection config.
---
## Reason
Without dynamic connection routing, the application connects to a default database and returns data for the wrong tenant. Middleware resolves the tenant per-request and sets the correct database connection before any database operations run.
---
## Bad Example
```php
// All tenants share the same database — data leak
```
---
## Good Example
```php
class TenantMiddleware {
    public function handle($request, $next) {
        $domain = $request->getHost();
        $tenant = Tenant::where('domain', $domain)->firstOrFail();
        config(['database.connections.tenant.database' => $tenant->database_name]);
        config(['database.connections.tenant.username' => $tenant->database_username]);
        config(['database.connections.tenant.password' => decrypt($tenant->database_password)]);
        DB::purge('tenant');
        DB::reconnect('tenant');
        app()->instance('tenant', $tenant);
        return $next($request);
    }
}
```
---
## Exceptions
No common exceptions — dynamic connection routing is the core of database-per-tenant.
---
## Consequences Of Violation
Wrong tenant data served, or tenant isolation broken.
---

## Encrypt Tenant Database Credentials at Rest
---
## Category
Security
---
## Rule
Encrypt tenant database passwords stored in the central `tenants` table. Use Laravel's `encrypted` cast or `Crypt::encryptString()`. Never store plaintext passwords.
---
## Reason
A breach of the central database exposes all tenant database credentials. Encrypting the passwords ensures that even if the central database is compromised, the attacker must also obtain the `APP_KEY` to decrypt the tenant credentials.
---
## Bad Example
```php
$tenant->database_password = $request->db_password; // Plaintext in database
```
---
## Good Example
```php
$tenant->database_password = Crypt::encryptString($request->db_password); // Encrypted at rest
```
---
## Exceptions
No common exceptions — tenant database credentials must be encrypted at rest.
---
## Consequences Of Violation
All tenant databases exposed if central database is breached.
---

## Run Tenant Migrations Independently From Central Migrations
---
## Category
Architecture
---
## Rule
Separate tenant migrations (in `database/migrations/tenant/`) from central migrations (`database/migrations/`). Run tenant migrations on each tenant database during creation and updates.
---
## Reason
Tenant tables and central tables have different schemas. Mixing migrations runs tenant-specific migrations on the central database and vice versa. Separate directory paths and a migration command scoped to the tenant connection prevent schema corruption.
---
## Bad Example
```php
// All migrations in one directory — tenant tables created in central DB
```
---
## Good Example
```php
// database/migrations/tenant/tenant_users_table.php
// Runs on: php artisan migrate --path=database/migrations/tenant --database=tenant
```
---
## Exceptions
No common exceptions — separate migration paths are essential for schema isolation.
---
## Consequences Of Violation
Central database gets tenant tables, tenant databases get central tables.
---

## Monitor Tenant Database Connections and Resource Usage
---
## Category
Monitoring
---
## Rule
Monitor each tenant database's connection pool, query performance, and disk usage. Alert when any tenant exceeds resource thresholds.
---
## Reason
In a database-per-tenant architecture, one tenant's runaway query can overwhelm the database server and affect all other tenants on the same server. Per-tenant monitoring detects resource abuse early and enables throttling or isolating the problematic tenant.
---
## Bad Example
```php
// No per-tenant monitoring — one tenant can degrade service for all
```
---
## Good Example
```php
// Monitor tenant database connections
$tenant = app('tenant');
Log::info('Tenant query', [
    'tenant_id' => $tenant->id,
    'database' => $tenant->database_name,
    'query_time_ms' => $queryTime,
]);
```
---
## Exceptions
No common exceptions — per-tenant monitoring is essential for resource management.
---
## Consequences Of Violation
One tenant's resource abuse degrades service for all tenants.
