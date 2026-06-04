# Skill: Structure DatabaseSeeder with Domain-Grouped Seeders

## Purpose

Organize `DatabaseSeeder` into domain-based group seeder classes, ordered by foreign key dependency, to maintain a scalable and understandable seeding structure.

## When To Use

- Application has more than 5 individual seeder classes
- Models have foreign key dependencies across domains
- Team needs clear ownership boundaries for seed data

## When NOT To Use

- Application has fewer than 5 seeders (flat list in DatabaseSeeder is sufficient)
- All seeders are independent with no dependencies between them

## Prerequisites

- `DatabaseSeeder` exists at `database/seeders/DatabaseSeeder.php`
- Individual model seeders exist or are being created
- Domain boundaries are identified

## Inputs

- List of all seeder classes
- Domain mapping (which seeders belong to which domain)
- Foreign key dependency graph between models

## Workflow

1. Group seeders by domain boundary:
   - `AccessControlSeeder` (roles, permissions)
   - `BillingSeeder` (plans, subscriptions, invoices)
   - `ContentSeeder` (users, posts, comments)
2. Order domain seeders in `DatabaseSeeder::run()` by dependency:
   ```
   $this->callSilent(AccessControlSeeder::class)  // No FK dependencies
   $this->call(BillingSeeder::class)              // Depends on access control
   $this->call(ContentSeeder::class)              // Depends on billing
   ```
3. Use `callSilent()` for reference data seeders that should not fire model events:
   ```
   $this->callSilent(RoleSeeder::class)
   ```
4. Use `call()` for demo data seeders where events are useful:
   ```
   if (app()->environment('local')) {
       $this->call(DemoUserSeeder::class)
   }
   ```
5. Make every seeder idempotent using `firstOrCreate()` or `updateOrCreate()`:
   ```
   Role::firstOrCreate(['name' => 'admin'])
   ```

## Validation Checklist

- [ ] Seeders are grouped by domain with group seeder classes
- [ ] `DatabaseSeeder` calls domain seeders in dependency order
- [ ] Reference data seeders use `callSilent()`
- [ ] Demo data seeders are gated by environment
- [ ] All seeders are idempotent
- [ ] No business logic exists inside seeder classes

## Common Failures

- **Flat unstructured list**: 30+ individual seeder calls in `DatabaseSeeder` with no grouping. Introduce domain group seeders when count exceeds 5.
- **Wrong call order**: Dependent seeder called before its prerequisite. Order by FK dependency — independent tables first.
- **Non-idempotent inserts**: Using `DB::table()->insert()` instead of `firstOrCreate()` causes duplicate records on re-seed.

## Decision Points

- **callSilent vs call**: Use `callSilent()` for reference/infrastructure seeders. Use `call()` for demo/simulation seeders that benefit from model events.
- **call() vs direct method call**: Use `$this->call()` or `$this->callSilent()` for proper seeder lifecycle. Do not directly call `run()` on another seeder.

## Performance Considerations

- `callSilent()` skips model event dispatch — prefer for reference data
- Domain group seeders do not add overhead — they delegate to individual seeders

## Security Considerations

- Never seed production data inside database migrations — use seeders only
- Never use `truncate()` in seeders that could run in production

## Related Rules

- Rule 1: Use callSilent() for Reference Data Seeders
- Rule 2: Order Seeders by Foreign Key Dependency
- Rule 3: Group Seeders by Domain Boundary
- Rule 4: Keep Seeders Idempotent
- Rule 6: Use call() for Demo Data, callSilent() for Reference Data

## Related Skills

- Environment-Specific Seeding with Gates
- Seeding Strategies for Bulk Data
- Factory Definition for Model Factories

## Success Criteria

- `DatabaseSeeder` clearly shows domain structure with grouped seeders
- Seeding order respects all foreign key dependencies
- All seeders can be re-run without producing duplicate records
- Reference data seeding does not trigger unnecessary model events
