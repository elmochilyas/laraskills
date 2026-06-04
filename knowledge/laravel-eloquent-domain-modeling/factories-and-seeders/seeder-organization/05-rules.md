# Seeder Organization Rules

## Rule 1: Use callSilent() for Reference Data Seeders
---
## Category
Performance
---
## Rule
Always use `callSilent()` when invoking seeders that create or update reference data (roles, permissions, settings, categories).
---
## Reason
Reference data operations insert or update static records. Model events (cache clearing, notification dispatch, search indexing) are unnecessary overhead for these operations and can cause side effects in deployment pipelines. `callSilent()` skips event dispatch entirely.
---
## Bad Example
```php
$this->call(RoleSeeder::class); // Fires model events for reference data
$this->call(PermissionSeeder::class);
```
---
## Good Example
```php
$this->callSilent(RoleSeeder::class); // No events
$this->callSilent(PermissionSeeder::class);
```
---
## Exceptions
When the reference data seeder intentionally triggers events (e.g., clearing a permission cache after updating roles). Document why events are needed.
---
## Consequences Of Violation
Performance: deployment time increases with every unnecessary event dispatch. Reliability: event failure blocks the entire seeding process.
---

## Rule 2: Order Seeders by Foreign Key Dependency
---
## Category
Reliability
---
## Rule
Always sequence seeder calls in `DatabaseSeeder` such that models with no foreign key dependencies are seeded first, followed by models that depend on them.
---
## Reason
Seeders execute in call order. Seeding `PostSeeder` before `UserSeeder` fails with a foreign key constraint violation because the referenced user does not yet exist. Dependency ordering guarantees all referenced records exist before dependent seeders run.
---
## Bad Example
```php
// Post references User — will fail if User table is empty
$this->call(PostSeeder::class);
$this->call(UserSeeder::class);
```
---
## Good Example
```php
// Users exist before posts reference them
$this->call(UserSeeder::class);
$this->call(PostSeeder::class);
```
---
## Exceptions
When using database systems that defer foreign key checks (SQLite with foreign keys off). Never rely on this — always order correctly.
---
## Consequences Of Violation
Reliability: `SQLSTATE[23000]: Integrity constraint violation` during seeding.
---

## Rule 3: Group Seeders by Domain Boundary
---
## Category
Code Organization
---
## Rule
Organize seeders into domain-based group seeders rather than calling model seeders directly from `DatabaseSeeder`.
---
## Reason
A flat list of 30+ individual seeders in `DatabaseSeeder` becomes unmanageable. Domain group seeders (e.g., `BillingSeeder`, `ContentSeeder`, `UserSeeder`) act as a namespace, making it clear which seeders belong to which domain and enabling domain-level environment gates.
---
## Bad Example
```php
// Flat, unstructured
$this->call(RoleSeeder::class);
$this->call(PermissionSeeder::class);
$this->call(UserSeeder::class);
$this->call(PlanSeeder::class);
$this->call(SubscriptionSeeder::class);
$this->call(InvoiceSeeder::class);
$this->call(PostSeeder::class);
$this->call(CommentSeeder::class);
```
---
## Good Example
```php
// Domain-grouped
$this->call(AccessControlSeeder::class); // Roles, permissions
$this->call(BillingSeeder::class);       // Plans, subscriptions, invoices
$this->call(ContentSeeder::class);       // Users, posts, comments
```
---
## Exceptions
Small applications with fewer than 5 seeders. Once the count exceeds 5, domain grouping should be introduced.
---
## Consequences Of Violation
Maintainability: `DatabaseSeeder` grows without structure. Readability: unclear which seeders belong to which domain.
---

## Rule 4: Keep Seeders Idempotent
---
## Category
Reliability
---
## Rule
Design every seeder to produce the same final state regardless of how many times it is run.
---
## Reason
Seeders run during `migrate:fresh --seed`, which always starts from empty tables. But they may also run in production deployments, CI pipelines, or manually. Idempotent seeders guarantee no duplicate records, no constraint violations, and no unintended side effects on re-run.
---
## Bad Example
```php
public function run(): void
{
    DB::table('roles')->insert(['name' => 'admin']); // Duplicates on re-run
    DB::table('roles')->insert(['name' => 'editor']);
}
```
---
## Good Example
```php
public function run(): void
{
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'editor']);
}
```
---
## Exceptions
When the seeder only runs inside a `migrate:fresh` workflow where tables are always empty. However, always coding for idempotency is a safer default.
---
## Consequences Of Violation
Reliability: duplicate key exceptions on re-run. Data integrity: accumulated duplicate records across deploys.
---

## Rule 5: Do Not Seed Production Data Inside Database Migrations
---
## Category
Architecture
---
## Rule
Always place data population logic in seeders, never in migration `up()` methods.
---
## Reason
Migrations are versioned schema changes. Data inserted by a migration that is later rolled back is lost, and re-running the migration fails because the data already exists. Seeders are explicitly designed for data population and respect idempotency patterns.
---
## Bad Example
```php
public function up(): void
{
    Schema::create('roles', fn (Blueprint $table) => ...);
    DB::table('roles')->insert(['name' => 'admin']); // Data in migration
}
```
---
## Good Example
```php
public function up(): void
{
    Schema::create('roles', fn (Blueprint $table) => ...);
}

// Separate seeder class
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'admin']);
    }
}
```
---
## Exceptions
When the data is required for the migration itself to function (e.g., inserting a default value referenced by a subsequent schema change). Document the exception explicitly.
---
## Consequences Of Violation
Reliability: migration rollbacks delete production data. Maintainability: data and schema concerns are entangled.
---

## Rule 6: Use call() for Demo Data, callSilent() for Reference Data
---
## Category
Architecture
---
## Rule
Distinguish reference seeders (`callSilent()`) from demo seeders (`call()`) by their need for model events.
---
## Reason
Demo data often triggers events that are useful for development (welcome emails, notification setup, cache warming). Reference data should never trigger events. The distinction communicates intent: silent is "essential infrastructure," call is "user-facing simulation."
---
## Bad Example
```php
// Uniform treatment — no distinction between reference and demo
$this->call(RoleSeeder::class);
$this->call(DemoUserSeeder::class);
```
---
## Good Example
```php
// Intent communicated through method choice
$this->callSilent(RoleSeeder::class);  // Infrastructure
$this->call(DemoUserSeeder::class);    // Simulation
```
---
## Exceptions
When demo data should not trigger events to avoid side effects in CI. Gate the call method behind an environment check.
---
## Consequences Of Violation
Performance: unnecessary event dispatch for reference data. Testing: events fire during CI seeding, causing unintended side effects.
---

## Rule 7: Do Not Put Business Logic Inside Seeders
---
## Category
Architecture
---
## Rule
Keep seeders as pure data-population scripts. Never implement business rules, calculations, or decision logic inside a seeder.
---
## Reason
Seeders run during setup and are not maintained as application code. Business logic in seeders drifts from the actual application logic, creating discrepancies between seeded data and real data. Business rules belong in service classes that are tested and maintained.
---
## Bad Example
```php
public function run(): void
{
    $plan = Plan::create(['name' => 'Premium', 'price' => 1999]);
    if ($plan->isPopular()) { // Business logic in seeder
        $plan->discounts()->create(['percent' => 10]);
    }
}
```
---
## Good Example
```php
public function run(): void
{
    $plan = Plan::firstOrCreate(['name' => 'Premium', 'price' => 1999]);
    // Discount logic belongs in a service/action class
}
```
---
## Exceptions
When the logic is trivial data derivation (e.g., generating a slug from a name). Even then, consider using model events or accessors.
---
## Consequences Of Violation
Maintainability: business logic is duplicated and untested. Reliability: seeded data diverges from production data.
---
