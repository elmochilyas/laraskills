# Seeder Organization — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Seeder Organization |
| Focus | Anti-patterns in DatabaseSeeder structure, seeder ordering, and lifecycle |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Using `call()` for Reference Data Seeders | Performance | High |
| 2 | Wrong Seeder Order Causing FK Violations | Reliability | Critical |
| 3 | Flat Unstructured Seeder List in Large Applications | Code Organization | Medium |
| 4 | Non-Idempotent Seeders | Reliability | High |
| 5 | Data Insertion Inside Database Migrations | Architecture | Critical |
| 6 | Business Logic Inside Seeders | Architecture | High |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is placing data insertion inside migrations instead of seeders, which makes rollbacks destructive and data irrecoverable
- Using `call()` uniformly for all seeders triggers unnecessary model events for reference data, slowing deployments
- Non-idempotent seeders cause duplicate records and constraint violations on re-run across multiple environments

---

## 1. Using `call()` for Reference Data Seeders

### Category
Performance

### Description
Using `$this->call()` (which fires model events) for reference data seeders (roles, permissions, settings, categories) instead of `$this->callSilent()`.

### Why It Happens
`call()` is the default method shown in documentation. Developers use it uniformly without considering whether model events are needed for each specific seeder.

### Warning Signs
- `$this->call()` used for roles, permissions, settings, or categories seeders
- Model events (cache clearing, notification dispatch, search indexing) fire during seeding
- Deployment scripts take longer than necessary due to event overhead
- Comments like "events not needed here but using call() anyway"

### Why Harmful
- Every model event fires for reference data that should be "just there"
- Event failures (e.g., cache service down) block the entire deployment
- CI and deployment pipelines are slower than necessary
- Logs fill with event dispatcher output for reference data operations

### Preferred Alternative
```php
$this->callSilent(RoleSeeder::class);      // No events
$this->callSilent(PermissionSeeder::class);
$this->call(UserSeeder::class);              // Events useful here
```

### Detection Checklist
- [ ] Review every `$this->call()` — does the seeder need model events?
- [ ] Check if `callSilent()` would produce the same result for reference seeders
- [ ] Replace with `callSilent()` for infrastructure/reference data

### Related
| Rule | `05-rules.md` — Use callSilent() for Reference Data Seeders |
| Rule | `05-rules.md` — Use call() for Demo Data, callSilent() for Reference Data |

---

## 2. Wrong Seeder Order Causing FK Violations

### Category
Reliability

### Description
Calling seeders in an order that violates foreign key dependencies, causing `Integrity constraint violation` errors during seeding.

### Why It Happens
Developers add seeders to `DatabaseSeeder` in the order they think of them or the order models were created, without analyzing foreign key dependency chains.

### Warning Signs
- `SQLSTATE[23000]: Integrity constraint violation` during `db:seed`
- Seeder that inserts records referencing a table that hasn't been seeded yet
- Comments like "must run UserSeeder first but not sure why"
- Seeders are ordered alphabetically or by creation date, not by dependency

### Preferred Alternative
```php
// Independent tables first, dependent tables last
$this->call(RoleSeeder::class);         // No FK dependencies
$this->call(UserSeeder::class);          // Depends on roles
$this->call(PostSeeder::class);          // Depends on users
```

### Detection Checklist
- [ ] Map foreign key dependencies between all seeded tables
- [ ] Verify seeder call order follows the dependency map
- [ ] Run `db:seed` from scratch — does it complete without FK errors?

### Related
| Rule | `05-rules.md` — Order Seeders by Foreign Key Dependency |
| Decision Tree | `07-decision-trees.md` — Seeder Ordering by Dependency |

---

## 3. Flat Unstructured Seeder List in Large Applications

### Category
Code Organization

### Description
Calling all individual model seeders directly from `DatabaseSeeder` in a flat list without domain grouping, making the file long and unstructured.

### Why It Happens
The application starts small and the flat list grows organically. No one introduces domain grouping because it's not obvious when the threshold is crossed.

### Warning Signs
- 15+ individual `$this->call()` statements in `DatabaseSeeder`
- No domain group seeders (e.g., `BillingSeeder`, `ContentSeeder`)
- Difficulty finding which seeder belongs to which domain
- Comments like "access control section" in the flat list

### Preferred Alternative
```php
$this->call(AccessControlSeeder::class); // Roles, permissions
$this->call(BillingSeeder::class);       // Plans, subscriptions, invoices
$this->call(ContentSeeder::class);       // Users, posts, comments
```

### Detection Checklist
- [ ] Count individual seeder calls in `DatabaseSeeder`
- [ ] More than 5 suggests domain grouping is needed
- [ ] Check if domain group seeders would improve organization

### Related
| Rule | `05-rules.md` — Group Seeders by Domain Boundary |
| Decision Tree | `07-decision-trees.md` — Flat vs Grouped Seeder Structure |

---

## 4. Non-Idempotent Seeders

### Category
Reliability

### Description
Writing seeders that insert data without checking for existing records, causing duplicate entries or constraint violations when the seeder is run multiple times.

### Why It Happens
Developers write seeders assuming they only run once on an empty database (e.g., after `migrate:fresh`). They don't consider deployments where seeders may run against an existing database.

### Warning Signs
- `DB::table()->insert()` instead of `Model::firstOrCreate()` or `updateOrCreate()`
- Seeders that produce duplicate records when re-run
- "Duplicate entry" errors in CI or deployment pipelines
- Comments like "only run this after migrate:fresh"
- No idempotency checks in reference data seeders

### Preferred Alternative
```php
public function run(): void
{
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'editor']);
}
```

### Detection Checklist
- [ ] Search for `DB::table()->insert()` and `->insert()` in seeders
- [ ] Replace with `firstOrCreate()` or `updateOrCreate()` patterns
- [ ] Run the seeder twice — does it produce errors or duplicates?

### Related
| Rule | `05-rules.md` — Keep Seeders Idempotent |
| Skill | `06-skills.md` — Structure DatabaseSeeder with Domain-Grouped Seeders |

---

## 5. Data Insertion Inside Database Migrations

### Category
Architecture

### Description
Inserting data (reference data, default records) inside a migration's `up()` method instead of using a dedicated seeder class.

### Why It Happens
It seems convenient to insert data right after creating the table in the same migration. The data "belongs" with the schema change, so it appears logical to keep them together.

### Warning Signs
- `DB::table()->insert()` or model `::create()` inside a migration's `up()` method
- Migration rollbacks delete data that should persist
- Re-running a migration fails because the data already exists
- Comments like "insert default roles here"

### Preferred Alternative
```php
// Migration — schema only
public function up(): void
{
    Schema::create('roles', fn (Blueprint $table) => ...);
}

// Separate seeder
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'admin']);
    }
}
```

### Detection Checklist
- [ ] Search all migration files for `::create(`, `->insert(`, `::factory()`
- [ ] Move data insertion logic from migrations to seeders
- [ ] Verify migrations only contain schema changes

### Related
| Rule | `05-rules.md` — Do Not Seed Production Data Inside Database Migrations |
| Skill | `06-skills.md` — Structure DatabaseSeeder with Domain-Grouped Seeders |

---

## 6. Business Logic Inside Seeders

### Category
Architecture

### Description
Implementing business rules, calculations, or decision logic inside seeder classes instead of keeping them as pure data-population scripts.

### Why It Happens
Developers treat seeders as "just setup code" and don't realize they're duplicating business logic. The logic is never tested and drifts from the actual application logic over time.

### Warning Signs
- Conditionals (`if`, `switch`) with business decisions in seeder `run()` methods
- Calculations that duplicate service or action class logic
- Seeders that call complex domain methods or make API calls
- Comments like "this is the same logic as in OrderService"
- Seeded data that differs from actual production data patterns

### Preferred Alternative
```php
public function run(): void
{
    $plan = Plan::firstOrCreate(['name' => 'Premium', 'price' => 1999]);
    // Business logic belongs in a service/action class, not here
}
```

### Detection Checklist
- [ ] Review seeder `run()` methods for business logic (conditionals, calculations, API calls)
- [ ] Compare seeder logic with the actual application business layer
- [ ] Extract business rules to service classes where they are tested

### Related
| Rule | `05-rules.md` — Do Not Put Business Logic Inside Seeders |
| Skill | `06-skills.md` — Structure DatabaseSeeder with Domain-Grouped Seeders |
