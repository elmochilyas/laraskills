# Environment-Specific Seeding — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Environment-Specific Seeding |
| Focus | Anti-patterns in environment-gated seeding |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Ungated Demo Seeders Running in Production | Security | Critical |
| 2 | Non-Idempotent Production Seeders | Reliability | High |
| 3 | Truncate in Production-Runnable Seeders | Security | Critical |
| 4 | Hard-Coded Seeder Data Volumes | Maintainability | Medium |
| 5 | Mixed Reference and Demo Data in One Seeder | Code Organization | High |
| 6 | Using `call()` Instead of `callSilent()` for Reference Data | Performance | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is running demo seeders in production without environment gating, potentially inserting fake data into production tables
- Non-idempotent production seeders (using `insert()` instead of `firstOrCreate()`) create duplicate records on each deployment
- Using `truncate()` in seeders that can run in production is catastrophic — it permanently deletes all production data

---

## 1. Ungated Demo Seeders Running in Production

### Category
Security

### Description
Calling demo data seeders from `DatabaseSeeder` without wrapping them in an `app()->environment('local', 'staging')` check, causing fake or PII-like demo data to be inserted into production tables during deployment.

### Why It Happens
The environment gate is forgotten during initial setup. The seeder works correctly in local development and the developer doesn't test against a production-like environment. The issue is only discovered after deployment when fake data appears in production.

### Warning Signs
- Demo seeders called directly in `DatabaseSeeder::run()` without environment checks
- `DatabaseSeeder` has no `app()->environment()` calls at all
- Reference data and demo data in the same seeder class (can't gate selectively)
- Production database contains records with placeholder names, fake emails, or lorem-ipsum text
- CI/CD pipeline that runs `db:seed --force` without environment gating
- Seeders that work fine locally but cause issues in staging/production

### Why Harmful
- Fake user accounts appear in production (security/compliance issue)
- Placeholder data (Lorem Ipsum, test@example.com) leaks into production
- Production database accumulates junk records that must be manually cleaned
- PII-like fake data (fake names, addresses) may violate data protection regulations
- Demo data may reference non-existent relationships or break production features

### Consequences
- 100 fake users with `test@example.com` emails appear in production after deployment
- The support team receives tickets about "users who don't exist"
- A cleanup script must be written to remove fake data from production
- GDPR compliance concern: fake personal data stored alongside real data
- Deployment rollback because the seeder can't be undone

### Preferred Alternative
```php
public function run(): void
{
    $this->callSilent(RoleSeeder::class);

    if (app()->environment('local', 'staging')) {
        $this->call(DemoUserSeeder::class);
    }
}
```

### Refactoring Strategy
1. Audit all seeders called from `DatabaseSeeder`
2. Separate reference and demo seeders into different classes
3. Wrap all demo seeder calls in `app()->environment('local', 'staging')`
4. Add a test that verifies demo seeders do not run in non-development environments
5. Review CI/CD pipeline for `--force` usage that bypasses environment checks

### Detection Checklist
- [ ] Search for `$this->call(` in `DatabaseSeeder` — every call should be assessed
- [ ] Identify which seeders produce demo/fake data
- [ ] Verify each demo seeder is wrapped in an environment gate
- [ ] Check production databases for placeholder or fake records
- [ ] Review CI/CD seeding scripts for `--force` without environment awareness

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Gate All Demo Seeders Behind Environment Checks |
| Skill | `06-skills.md` — Set Up Environment-Gated Demo Seeders |
| Knowledge | `04-standardized-knowledge.md` — Environment-Specific Seeding |

---

## 2. Non-Idempotent Production Seeders

### Category
Reliability

### Description
Production seeders that use `insert()` or `create()` instead of `firstOrCreate()` or `updateOrCreate()`, causing duplicate records every time the seeder runs (every deployment).

### Why It Happens
Developers write seeders for local development where `migrate:fresh` resets the database before each seed. They forget that production seeders run on top of existing data. The `insert()` pattern is simpler and faster to write.

### Warning Signs
- `DB::table()->insert([...])` in seeders that run in production
- `Model::create([...])` in production seeders (not checking for existing records)
- Production roles/permissions table with duplicate entries after each deploy
- `Duplicate entry` errors during production seeding
- Manual cleanup scripts that run after every deployment
- Seeders that assume the table is empty when they run

### Why Harmful
- Duplicate key exceptions crash the deployment pipeline
- Accumulated duplicates degrade system performance (more rows to scan)
- Reference data that should have unique entries (roles, permissions) has duplicates
- Queries that expect unique records return ambiguous results
- Manual cleanup after every deploy is error-prone and time-consuming

### Consequences
- `RoleSeeder` inserts "admin" role on every deploy — 50 deploys = 50 "admin" roles
- `PermissionSeeder::insert()` causes a `Duplicate entry` crash — deployment fails
- `User::create(['email' => 'admin@example.com'])` creates duplicate admin accounts
- The app queries `Role::where('name', 'admin')->first()` and gets a random match
- A cleanup job must run after every deployment to deduplicate reference data

### Preferred Alternative
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

### Refactoring Strategy
1. Identify all seeders that run in production (not gated by environment)
2. Replace `insert()` and `create()` with `firstOrCreate()` or `updateOrCreate()`
3. For seeders that should update existing records, use `updateOrCreate()`
4. Run each seeder twice in a test to verify idempotency
5. Remove any post-deploy cleanup scripts

### Detection Checklist
- [ ] Search for `->insert(`, `::create(` in production-runnable seeder files
- [ ] Check for `Duplicate entry` errors in deployment logs
- [ ] Count duplicate rows in reference data tables
- [ ] Run each production seeder twice — does the second run create duplicates?
- [ ] Verify idempotent patterns (`firstOrCreate`, `updateOrCreate`) are used

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Production Seeders Minimal and Idempotent |
| Skill | `06-skills.md` — Set Up Environment-Gated Demo Seeders |

---

## 3. Truncate in Production-Runnable Seeders

### Category
Security

### Description
Calling `DB::table()->truncate()` or `Model::truncate()` in a seeder that is not guarded by an environment check, or in a seeder that could potentially run in production due to refactoring.

### Why It Happens
Developers use truncate + re-insert as a clean way to reset reference data during development. The truncate is placed in the reference seeder (which runs in all environments) for convenience. The production guard is forgotten or later removed.

### Warning Signs
- `DB::table()->truncate()` in any seeder file that isn't explicitly gated
- `Model::truncate()` in reference seeders that run unconditionally
- Truncate operations in seeders that are called from `DatabaseSeeder`
- Comments like "// FIXME: add environment gate" next to truncate calls
- Seeders that truncate before re-inserting reference data
- Assumption that "it's just reference data, safe to truncate"

### Why Harmful
- Truncate permanently deletes all production data in the table
- There is no rollback — data is gone once truncate executes
- Foreign key constraints may prevent truncate, but if disabled via `SET FOREIGN_KEY_CHECKS=0`, data is lost
- The truncate may cascade to related tables if foreign keys cascade
- Even if currently gated, future refactoring may accidentally expose the truncate to production

### Consequences
- A production deployment truncates the `users` table — all customer accounts deleted
- A truncate on `settings` removes all application configuration — system goes down
- Foreign key cascade deletes all related orders when a parent table is truncated
- The company needs a database restore from backup — hours of downtime
- Regulatory compliance violation for data loss

### Preferred Alternative
```php
// Idempotent — no truncate needed
Role::firstOrCreate(['name' => 'admin']);
Role::firstOrCreate(['name' => 'editor']);
```

### Refactoring Strategy
1. Identify all truncate calls in seeder files
2. For production-runnable seeders, replace truncate with `firstOrCreate()` or `updateOrCreate()`
3. For development-only seeders, move truncate behind an explicit `app()->environment('local')` gate
4. Add a lint rule that flags `truncate` in seeder files without environment guards
5. Review any previous truncate-based seeder patterns and migrate to idempotent alternatives

### Detection Checklist
- [ ] Search for `truncate` in all seeder files
- [ ] Check if truncate calls are behind environment gates
- [ ] Verify deletion of `truncate` gate doesn't expose production data
- [ ] Review deployment logs for unexpected truncate operations
- [ ] Test that removing truncate and using idempotent patterns works correctly

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Never Truncate Tables in Production Seeders |
| Skill | `06-skills.md` — Set Up Environment-Gated Demo Seeders |

---

## 4. Hard-Coded Seeder Data Volumes

### Category
Maintainability

### Description
Hard-coding numeric values for factory counts in seeders (e.g., `User::factory()->count(100)->create()`) instead of reading the count from configuration or environment variables.

### Why It Happens
Hard-coding is the most direct approach. The developer knows how many records they want and types the number. Config-driven counts seem like unnecessary indirection for a simple number.

### Warning Signs
- `->count(100)` or similar hard-coded numbers in seeder files
- Different developers on the team have different local seeding needs but all edit the same file
- Merge conflicts in seeder files from developers changing the same hard-coded count
- CI/CD pipeline runs seeders with production-scale data volumes unnecessarily
- No `config('seeding.*')` references in seeder files
- Seeders that are too slow for local development but too fast for production

### Why Harmful
- Every developer edits the same seeder file for local tuning, causing merge conflicts
- CI tests run with production-scale data volumes, slowing down the test suite
- Changing data volume per environment requires a code change and deployment
- New developers don't know what the "right" count is for their machine
- Onboarding documentation must tell developers to edit seeder files

### Consequences
- Two developers both edit `UserSeeder count: 100 → 200` — merge conflict
- CI runs 20 minutes of seeding with 10,000 records when 100 would suffice
- Production deployment scripts cannot tune seeding volumes without patching code
- A developer's laptop runs out of memory seeding 50,000 records intended for staging
- Team members create local forks of seeder files to set their preferred counts

### Preferred Alternative
```php
$count = config('seeding.users_count', 50);
User::factory()->count($count)->create();
```

### Refactoring Strategy
1. Identify hard-coded counts in seeder files
2. Create config entries in `config/seeding.php` with sensible defaults
3. Replace hard-coded values with `config()` calls
4. Document the config keys for developers who need to adjust locally
5. Set CI/CD environment variables for reduced seeding volumes in test environments

### Detection Checklist
- [ ] Search for `->count(\d+)` in seeder files
- [ ] Check for `config('seeding.'` usage — does it exist?
- [ ] Review CI pipeline — does it override seeding counts?
- [ ] Ask developers if they customize local seeding counts
- [ ] Check for merge conflicts in seeder files in version control history

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Read Seeder Data Volumes from Configuration |
| Skill | `06-skills.md` — Set Up Environment-Gated Demo Seeders |

---

## 5. Mixed Reference and Demo Data in One Seeder

### Category
Code Organization

### Description
A single seeder class that contains both essential reference data (always runs) and demo/development data (should be gated), making it impossible to selectively gate the demo portion.

### Why It Happens
Seeders are organized by entity — `UserSeeder` handles everything user-related. The developer adds reference data (admin user) and demo data (100 fake users) in the same class because they both relate to users.

### Warning Signs
- A seeder file contains both `firstOrCreate()` calls and `factory()->count()` calls
- Single seeder per entity (one `UserSeeder` class for all user data)
- Reference seeders that also create demo data because "it's the same entity"
- No separate `Demo*` seeder classes in the project
- Environment checks inside a seeder's `run()` method splitting reference from demo
- The `DatabaseSeeder` calls the same seeder class unconditionally but it contains both data types

### Why Harmful
- The demo portion runs in production because the reference portion must run in all environments
- Environment checks inside the seeder are easy to miss during code review
- Reference data and demo data have different lifecycle requirements but are coupled in one class
- Adding new reference data risks accidentally including demo data
- The seeder class has two distinct responsibilities

### Consequences
- `UserSeeder` creates an admin user (reference) and 100 factory users (demo) in the same `run()`
- Production seeds 100 fake users because the seeder can't be partially gated
- A developer adds a new role to `RoleSeeder` and also adds 5 demo roles — mixed together
- The environment gate is applied to the whole seeder or not at all — no middle ground
- An audit cannot distinguish essential data from development data

### Preferred Alternative
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

### Refactoring Strategy
1. Identify seeders that mix reference and demo data
2. Split each into a reference seeder and a demo seeder
3. Reference seeder uses idempotent patterns, no environment gate
4. Demo seeder uses factory creation, wrapped in environment gate
5. Update `DatabaseSeeder` to call reference unconditionally and demo with gate

### Detection Checklist
- [ ] Review each seeder's `run()` — does it mix `firstOrCreate` with factory calls?
- [ ] Check if any seeder has internal `if (app()->environment(...))` branching
- [ ] Verify separate `Demo*` seeder classes exist
- [ ] Confirm reference seeders can run in production without creating fake data
- [ ] Audit that environment gates cover all and only demo data

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Separate Reference Seeders from Demo Seeders into Different Classes |
| Skill | `06-skills.md` — Set Up Environment-Gated Demo Seeders |
| Decision Tree | `07-decision-trees.md` — Demo vs Reference Seeder Separation |

---

## 6. Using `call()` Instead of `callSilent()` for Reference Data

### Category
Performance

### Description
Using `$this->call()` instead of `$this->callSilent()` when invoking reference data seeders from `DatabaseSeeder`, causing unnecessary model event dispatch (caches, notifications, search indexes) for reference data that doesn't need it.

### Why It Happens
Developers default to `call()` because it's the more commonly known method. They may not be aware that `callSilent()` exists or that model events have performance implications for bulk reference data insertion.

### Warning Signs
- All seeder calls in `DatabaseSeeder` use `call()`, never `callSilent()`
- Reference data seeding triggers cache clears, search re-indexes, or notifications
- Slow deployment seeding times dominated by event dispatch overhead
- Event listeners that fail during reference data insertion (blocking the deployment)
- Logs showing events fired for reference data creation (roles, permissions)
- No distinction between `call()` and `callSilent()` in the team's conventions

### Why Harmful
- Cache clearing on every reference data insertion flushes production caches unnecessarily
- Search indexes rebuild for data that doesn't need to be searchable
- Event listeners may fail on reference data (expecting user context, request, etc.), crashing the seeder
- Deployment time increases proportionally to reference data volume
- Infrastructure costs increase from unnecessary event processing

### Consequences
- A `Role` creation fires a `CacheInvalidation` listener that clears all product caches — products disappear for 5 minutes
- Search index listener tries to index a role but requires a team context — crashes the seeder
- A welcome email listener fires for every reference user created during seeding — sends 500 emails
- Deployment seeding takes 3 minutes because of event processing overhead
- Logs fill with "event processed: role.created" entries that serve no purpose

### Preferred Alternative
```php
$this->callSilent(RoleSeeder::class); // No events — faster, safer
$this->call(DemoUserSeeder::class);   // Events useful for demo data
```

### Refactoring Strategy
1. Identify which seeder calls in `DatabaseSeeder` are for reference data
2. Replace `$this->call()` with `$this->callSilent()` for reference seeders
3. Keep `$this->call()` for demo seeders where event dispatch is useful
4. Verify that reference data doesn't need event-driven side effects
5. Monitor deployment seeding time for improvement

### Detection Checklist
- [ ] Check `DatabaseSeeder` — what ratio of `call()` to `callSilent()`?
- [ ] Review what events fire during reference data creation
- [ ] Check deployment logs for failures caused by event listeners during seeding
- [ ] Measure seeding time — how much is event processing?
- [ ] Verify reference data has no event-dependent consequences

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use callSilent() for Reference Data Seeders |
| Decision Tree | `07-decision-trees.md` — callSilent vs call for Seeders |
