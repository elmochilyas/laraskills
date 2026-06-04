# Environment-Specific Seeding Rules

## Rule 1: Gate All Demo Seeders Behind Environment Checks
---
## Category
Security
---
## Rule
Always wrap demo and development seeders in an `app()->environment('local', 'staging')` check inside `DatabaseSeeder`.
---
## Reason
Ungated demo seeders run in production during deployment pipelines, CI/CD refreshes, or accidental `--force` usage. This can purge real data (if truncation is used), expose PII in development-style datasets, or insert thousands of fake records into production tables.
---
## Bad Example
```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(DemoUserSeeder::class); // Runs in production!
    }
}
```
---
## Good Example
```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        if (app()->environment('local', 'staging')) {
            $this->call(DemoUserSeeder::class);
        }
    }
}
```
---
## Exceptions
No common exceptions. Production seeding must never include demo data.
---
## Consequences Of Violation
Security: PII or fake data leaked into production. Reliability: production database filled with test records.
---

## Rule 2: Keep Production Seeders Minimal and Idempotent
---
## Category
Reliability
---
## Rule
Design production seeders to create or update only essential reference data, and ensure they can run multiple times without duplicating records.
---
## Reason
Production seeders execute on every deployment. If they insert duplicates on re-run, the database accumulates garbage rows. Idempotent patterns (`firstOrCreate()`, `updateOrCreate()`) guarantee consistent state regardless of how many times the seeder runs.
---
## Bad Example
```php
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('roles')->insert(['name' => 'admin']); // Duplicates on re-run
        DB::table('roles')->insert(['name' => 'editor']);
    }
}
```
---
## Good Example
```php
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'editor']);
    }
}
```
---
## Exceptions
When using truncate + re-insert as an intentional pattern for lookup tables with no foreign key dependencies. Always wrap in a transaction.
---
## Consequences Of Violation
Reliability: duplicate key exceptions or accumulated garbage data on re-deploys. Maintenance: manual cleanup required after every deploy.
---

## Rule 3: Never Truncate Tables in Production Seeders
---
## Category
Security
---
## Rule
Never call `DB::table()->truncate()` or Model `::truncate()` in a seeder that can run in production.
---
## Reason
A non-idempotent truncate in a production seeder permanently deletes all production data. Even if the seeder is currently behind an environment gate, future refactors may remove the check. Truncation belongs in development workflows (`migrate:fresh`), not seeders.
---
## Bad Example
```php
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('roles')->truncate(); // Destructive in production
        DB::table('roles')->insert([...]);
    }
}
```
---
## Good Example
```php
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'editor']);
    }
}
```
---
## Exceptions
When used inside an `app()->environment('local')` guard with an explicit warning comment. Even then, prefer `firstOrCreate()`.
---
## Consequences Of Violation
Security: catastrophic data loss in production. Business: unrecoverable deletion of customer data.
---

## Rule 4: Read Seeder Data Volumes from Configuration
---
## Category
Maintainability
---
## Rule
Use `config()` or environment variables to control seeder data counts instead of hard-coding numeric values.
---
## Reason
Hard-coded counts require code changes to adjust data volume per environment. Configuration-driven counts let developers tune local volumes without touching code, and let CI/CD pipelines reduce counts for faster test runs.
---
## Bad Example
```php
User::factory()->count(100)->create(); // Must edit code to change count
```
---
## Good Example
```php
$count = config('seeding.users_count', 50);
User::factory()->count($count)->create();
```
---
## Exceptions
When the count is a domain invariant (e.g., exactly 3 roles in an RBAC system). Such invariants should be constants, not config.
---
## Consequences Of Violation
Maintainability: every developer edits the same file for local tuning, causing merge conflicts. Testing: CI tests are slower than necessary with production-scale counts.
---

## Rule 5: Separate Reference Seeders from Demo Seeders into Different Classes
---
## Category
Code Organization
---
## Rule
Always place reference data and demo data in separate seeder classes, never mix them in a single `run()` method.
---
## Reason
Reference data (always runs) and demo data (environment-gated) have different lifecycle requirements. Mixing them forces environment checks to be repeated inside a single method, obscures which data is essential vs. optional, and makes it easy for demo data to slip through to production.
---
## Bad Example
```php
class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(['email' => 'admin@example.com']); // Reference
        User::factory()->count(100)->create(); // Demo — mixed in same class
    }
}
```
---
## Good Example
```php
class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(['email' => 'admin@example.com']);
    }
}

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->count(100)->create();
    }
}
```
---
## Exceptions
When the reference data and demo data are inseparable because demo records reference reference records. Call the reference seeder first, then the demo seeder separately.
---
## Consequences Of Violation
Security: demo data leaks into production when someone removes a gate but doesn't see the mixed data. Maintainability: unclear which data is essential.
---

## Rule 6: Use callSilent() for Reference Seeders in Production
---
## Category
Performance
---
## Rule
Use `callSilent()` when invoking reference data seeders from `DatabaseSeeder`.
---
## Reason
Reference data seeders (roles, permissions, settings) typically only insert or update rows. Model events (caches, notifications, search indexes) are unnecessary overhead for these operations and can cause side effects in production deployments.
---
## Bad Example
```php
$this->call(RoleSeeder::class); // Fires model events for reference data insertion
```
---
## Good Example
```php
$this->callSilent(RoleSeeder::class); // No events — faster, safer
```
---
## Exceptions
When the reference data seeder intentionally triggers events (e.g., clearing a cache after updating permissions). Document why events are needed.
---
## Consequences Of Violation
Performance: unnecessary event dispatch slows production deploys. Reliability: event listeners may fail on reference data insertion, blocking the deployment.
---
