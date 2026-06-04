# BelongsToMany Factories — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | BelongsToMany Factories |
| Focus | Anti-patterns in many-to-many factory relationship usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Manual Pivot Table Inserts (Bypassing `hasAttached()`) | Framework Usage | High |
| 2 | Pivot Attributes in Related Model's `definition()` | Architecture | Critical |
| 3 | Array for Varying Pivot Attributes | Reliability | High |
| 4 | Over-Factory Attachment for Reference Data | Performance | Medium |
| 5 | Embedded BelongsToMany in Factory `configure()` | Performance | High |
| 6 | Missing Count Control on Attachments | Testing | Medium |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is defining pivot-table columns in the related model's factory `definition()` method, causing SQL column mismatch errors
- Manual pivot table inserts via `DB::table()` create brittle coupling to table and column names
- Using plain arrays for pivot attributes when values should vary per attachment assigns incorrect uniform values

---

## 1. Manual Pivot Table Inserts (Bypassing `hasAttached()`)

### Category
Framework Usage

### Description
Manually inserting rows into pivot tables using `DB::table()` or raw SQL instead of using the `hasAttached()` or magic `has{Relation}()` factory method to establish BelongsToMany relationships.

### Why It Happens
Developers who haven't discovered `hasAttached()` fall back to the raw approach they know. Manual inserts are the most obvious solution when thinking at the database level rather than the ORM level. Legacy code may predate the `hasAttached()` method.

### Warning Signs
- `DB::table('pivot_name')->insert([...])` in tests or seeders
- Manually looking up IDs from created models and inserting pivot rows
- Pivot table name and foreign key columns hard-coded as strings
- Factory call sites with separate creation steps for each pivot attachment
- No `hasAttached()` or `has{Relation}()` calls across the codebase
- Pivot-related tests breaking when pivot table names or columns are renamed

### Why Harmful
- Pivot table name and foreign key columns are hard-coded in multiple locations
- Renaming the pivot table or columns requires searching all raw insert calls
- The factory's relationship resolution is bypassed — no single point of change
- Multiple inserts for each pivot row create more database round-trips than `hasAttached()`
- The relationship intent at the call site is implicit rather than explicit

### Consequences
- `DB::table('role_user')->insert(['user_id' => $user->id, 'role_id' => $role->id])` — works but brittle
- Renaming `role_user` to `user_roles` requires updating 15 raw insert statements
- A migration adds a column to the pivot table — all raw inserts must be updated
- Test factories lack the self-documenting nature of `hasAttached()` chains
- New team members see raw DB patterns and replicate them

### Preferred Alternative
```php
User::factory()->hasAttached(Role::factory())->create();
```

### Refactoring Strategy
1. Identify all manual pivot table insert calls in tests and seeders
2. Replace with `hasAttached()` using either a factory or existing model instances
3. Move pivot attribute data into `hasAttached()`'s second argument
4. Remove manual ID lookups and insert statements
5. Verify pivot data is correctly populated after the refactoring

### Detection Checklist
- [ ] Search for `DB::table(` calls that reference pivot table names
- [ ] Search for `->attach(` calls outside of factory context
- [ ] Check for manual pivot row insertion patterns in test files
- [ ] Verify `hasAttached()` or `has{Relation}()` is used for all BelongsToMany
- [ ] Confirm pivot table name conventions are defined on the model, not duplicated at call sites

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use hasAttached() for All BelongsToMany Factory Relationships |
| Skill | `06-skills.md` — Set Up BelongsToMany Factory Relationship with hasAttached() |
| Decision Tree | `07-decision-trees.md` — hasAttached() vs Manual Pivot Insert |

---

## 2. Pivot Attributes in Related Model's `definition()`

### Category
Architecture

### Description
Defining pivot-table columns (e.g., `team_id`, `expires_at`) inside the related model's factory `definition()` method, causing data intended for the pivot table to be inserted into the related model's table.

### Why It Happens
Developers see that the pivot has extra columns and add them to the related model's factory definition without distinguishing which table the columns belong to. The column names look like they "belong" to the related model when viewed alongside its other attributes.

### Warning Signs
- Factory `definition()` methods containing columns that exist only on the pivot table
- Pivot column values appearing in the related model's database rows (wrong table)
- SQL errors about unknown columns when the related model's table doesn't have those columns
- `Column not found` SQL exceptions that trace back to factory definitions
- Confusion about which table owns which columns in factory definitions

### Why Harmful
- Data intended for the pivot table is inserted into the wrong table
- SQL exceptions when the column doesn't exist on the target table
- Silent data corruption when the column happens to exist on both tables
- Factory definitions are misleading — they appear to set model attributes but actually set pivot data
- The relationship between factory definitions and database schema is incorrect

### Consequences
- `RoleFactory` defines `'team_id' => 1` but `team_id` is a pivot column — `roles.team_id` doesn't exist, SQL error
- A `Post` factory defines `'tag_order' => 1` but `tag_order` is a pivot column on `post_tag` — `posts.tag_order` doesn't exist
- A developer adds `'expires_at' => now()` to `UserFactory` but `expires_at` is a pivot column — it silently writes to `users.expires_at` instead
- Debugging requires comparing factory definitions to database schema
- Migrations that add columns to pivot tables require updating multiple factory definitions

### Preferred Alternative
```php
// Pivot attributes go into hasAttached(), not definition()
User::factory()
    ->hasAttached(Role::factory(), ['team_id' => 1])
    ->create();
```

### Refactoring Strategy
1. Identify pivot-column references in related model factory `definition()` methods
2. Remove pivot-column assignments from `definition()` methods
3. Move pivot data to `hasAttached()` second argument (array or closure)
4. For every call site using the old factory, add `hasAttached()` with the appropriate pivot data
5. Verify pivot data appears in the pivot table, not in the related model's table

### Detection Checklist
- [ ] Cross-reference factory `definition()` columns with actual database table schemas
- [ ] Search for column names that exist only in pivot tables but appear in model factory definitions
- [ ] Check database rows for unexpected column values in related model tables
- [ ] Verify that pivot attribute values are passed via `hasAttached()`, not `definition()`
- [ ] Review factory definitions against migration schemas for each related model

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Manually Set Pivot Attributes in the Related Model's Definition |
| Skill | `06-skills.md` — Set Up BelongsToMany Factory Relationship with hasAttached() |

---

## 3. Array for Varying Pivot Attributes

### Category
Reliability

### Description
Using a plain array as the pivot attributes argument to `hasAttached()` when pivot values should differ per attachment row. All pivot rows receive the same values, producing incorrect test data.

### Why It Happens
Developers use the array form because it's simpler and more obvious than a closure. The difference between uniform and per-attachment pivot data may not be apparent during initial development. The array form works — it just produces wrong data when values should vary.

### Warning Signs
- `hasAttached(Factory::count(N), ['team_id' => 1])` — same `team_id` for all N attachments
- Pivot attribute values that should be unique per attachment but are hard-coded the same
- Test assertions on pivot data that check for variation but find uniform values
- Closure form never used for pivot attributes in the codebase
- Pivot data in tests that doesn't match real-world distribution
- Seeder scripts creating pivot rows with identical attribute values

### Why Harmful
- All pivot rows get the same attribute values — unrealistic test data
- Tests pass with wrong pivot data, masking bugs that only surface with varied data
- Business logic that branches on pivot attribute values is never tested with different values
- The pivot relationship's true nature (many-to-many with context) is obscured
- Refactoring to use closures later requires changing all call sites

### Consequences
- A user has 3 roles, all with `team_id = 1` — but in reality, each role assignment has a different team
- Testing "user's role for team X" logic passes because every pivot row says `team_id = 1`
- A bug where wrong team permissions are assigned is never caught — pivot data is unrealistically uniform
- Production data reveals pivot variation that tests never exercised
- The closure form is never learned because the array form "works"

### Preferred Alternative
```php
User::factory()
    ->hasAttached(
        Role::factory()->count(3),
        fn () => ['team_id' => Team::factory()->create()->id]
    )
    ->create();
```

### Refactoring Strategy
1. Identify `hasAttached()` calls using array pivot attributes with `->count(N)`
2. Determine if pivot values should vary per attachment
3. Replace the array with a closure that returns varying values
4. For truly uniform pivot data, the array form is correct — keep it
5. Update test assertions to verify per-attachment variation

### Detection Checklist
- [ ] Search for `hasAttached(.*, [` patterns — check if pivot values should vary
- [ ] Review test assertions — do they test for varied pivot data?
- [ ] Compare pivot data distribution in tests vs production
- [ ] Check if closure form exists anywhere in the codebase
- [ ] Verify business logic that branches on pivot attributes is tested with varied data

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Closures for Varying Pivot Attributes |
| Skill | `06-skills.md` — Set Up BelongsToMany Factory Relationship with hasAttached() |
| Decision Tree | `07-decision-trees.md` — Pivot Attribute Assignment |

---

## 4. Over-Factory Attachment for Reference Data

### Category
Performance

### Description
Using `Role::factory()->count(N)` inside `hasAttached()` to create related models that should be pre-existing reference data (roles, permissions, categories). Each factory call duplicates reference records that could be reused.

### Why It Happens
The factory approach is the default — create fresh related models for each parent. Developers may not distinguish between "test data that should be fresh" and "reference data that should be shared." The performance impact is negligible for small datasets.

### Warning Signs
- `hasAttached(Role::factory()->count(2))` — roles are reference data, not unique test data
- `hasAttached(Permission::factory()->count(3))` — permissions are reference data
- Duplicate reference records accumulating across test runs
- Test assertions that check role count but don't account for duplicates from previous runs
- Seeder scripts that create reference data via factories instead of predefined instances
- Tests slower than necessary due to redundant reference data creation

### Why Harmful
- Reference data (roles with the same name, permissions with the same key) is created fresh each time
- Database tables accumulate duplicate reference records across test runs
- Tests that query reference data by name find ambiguous results (multiple records with the same name)
- Seeding takes longer than necessary for data that already exists
- The distinction between reference data and test data is blurred

### Consequences
- Every test run creates 2 new roles — after 100 runs, there are 200 role records instead of 2
- `Role::where('name', 'admin')->first()` returns a different record each time
- Test cleanup must delete all created roles instead of leaving reference data intact
- Seeding 10,000 users with `hasAttached(Role::factory()->count(2))` creates 20,000 role records
- Assertions on `Role::count()` fail because of reference data accumulation

### Preferred Alternative
```php
$admin = Role::firstWhere('name', 'admin');
$editor = Role::firstWhere('name', 'editor');

User::factory()
    ->hasAttached([$admin, $editor])
    ->create();
```

### Refactoring Strategy
1. Identify reference data types (roles, permissions, statuses, categories) created via factory
2. Define reference data in seeders so it exists before tests run
3. Replace factory-based `hasAttached()` with existing model instances
4. For integration tests, ensure reference data is seeded in `setUp()`
5. Remove factory calls for reference data types

### Detection Checklist
- [ ] Identify which related models are reference data vs test-specific data
- [ ] Check for duplicate reference records in test databases
- [ ] Review `hasAttached()` calls — are they for reference types or test-specific types?
- [ ] Measure whether reference data creation adds significant time to test suites
- [ ] Verify reference data exists before test runs (via seeding)

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Pass Existing Models for Known Reference Datasets |
| Skill | `06-skills.md` — Set Up BelongsToMany Factory Relationship with hasAttached() |
| Decision Tree | `07-decision-trees.md` — Factory vs Existing Instances |

---

## 5. Embedded BelongsToMany in Factory `configure()`

### Category
Performance

### Description
Embedding `hasAttached()` or `afterCreating()` callbacks with pivot attachment logic inside the factory's `configure()` method, forcing every usage of the factory to create and attach related models regardless of whether the test needs them.

### Why It Happens
Developers want to create "complete" models by default, so they add relationship creation into the factory configuration. This ensures every model has its required relationships without callers needing to remember. The performance cost is hidden until data volume grows.

### Warning Signs
- Factory `configure()` method contains `hasAttached()` calls
- `afterCreating()` callbacks in `configure()` that attach related models
- Tests that don't need related models but get them anyway
- Slow factory creation even for simple model instances
- Factories that cannot create "bare" models without related data
- Tests that override the default by detaching or deleting created relations

### Why Harmful
- Every factory call creates unnecessary related model records
- Test runtime increases proportionally to the number of attached relations
- No way to create a model without its default attachments
- Performance impact compounds across test suites
- The factory is no longer a minimum-viable-model factory

### Consequences
- `User::factory()->create()` creates 2 roles, 3 permissions, and 1 team — even for a test that just needs a user ID
- A simple "user can be created" test takes 10 database writes instead of 1
- Ten test cases each creating a user result in 100 extra writes for data nobody uses
- Switching to a test database with slower I/O exposes the hidden performance cost
- New developers assume the factory creates only the user, not understanding the hidden attachments

### Preferred Alternative
```php
// Call-site attachment — explicit and intentional
User::factory()
    ->hasAttached(Role::factory()->count(2))
    ->create();

// No embedded relationships in configure()
```

### Refactoring Strategy
1. Identify factory `configure()` methods with relationship attachments
2. Move attachments out of `configure()` to call sites
3. For models that truly always need certain relationships, reconsider — is the relationship mandatory or just convenient?
4. Update all call sites to explicitly add wanted relationships
5. Verify the factory can now create bare models

### Detection Checklist
- [ ] Check factory `configure()` methods for `hasAttached()`, `afterCreating()`, or `has()` calls
- [ ] Measure the number of DB writes from a single `Factory::create()` call
- [ ] Review test suites — how many factory calls don't use the default relationships?
- [ ] Check if any tests override or detach the default relationships
- [ ] Verify the factory can produce a minimum-viable model

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep hasAttached() Calls Outside of Factory Definitions |
| Skill | `06-skills.md` — Set Up BelongsToMany Factory Relationship with hasAttached() |

---

## 6. Missing Count Control on Attachments

### Category
Testing

### Description
Using `hasAttached(Related::factory())` without a `->count(N)` call on the related factory, resulting in exactly one attachment when the test may need a specific number of related records for assertions.

### Why It Happens
Developers add `hasAttached()` without specifying the count, accepting the default of 1. The test passes with a single attachment, but the assertion count is never explicitly validated. The missing count is only noticed when tests need to assert a different number.

### Warning Signs
- `hasAttached(Related::factory())` without `->count(N)` in test code
- Test assertions that check `->count()` but the factory produces exactly 1
- Tests that should verify "user has 3 roles" but pass with 1 role
- Hard-coded magic number assertions tied to the default count
- Tests that break when the factory default changes from 1 to another number
- No explicit relationship count expectation in test names or comments

### Why Harmful
- The relationship count is implicit and undocumented in the test
- If the factory default changes, tests silently produce different data volumes
- Tests that should verify multi-attachment behavior only test single-attachment
- Edge cases with multiple attachments are never exercised
- Test assertions use the same hard-coded number as the default, masking incorrect counts

### Consequences
- "User has multiple roles" test creates 1 role but assertion passes because both say 1
- A factory refactoring changes the default count — half the tests now fail because counts changed
- Business logic that iterates related models is tested with a single iteration
- A bug that only appears with 3+ attachments is never caught
- Test coverage of pivot-related logic is incomplete despite "passing" tests

### Preferred Alternative
```php
User::factory()
    ->hasAttached(Role::factory()->count(3))
    ->create();

// Assertion explicitly expects 3:
$this->assertCount(3, $user->roles);
```

### Refactoring Strategy
1. Identify `hasAttached()` calls without explicit `->count(N)`
2. Add `->count()` with the number appropriate for the test scenario
3. Update assertions to match the explicit count
4. For single-attachment scenarios where 1 is correct, still add `->count(1)` for clarity
5. Consider a data provider that tests multiple attachment counts

### Detection Checklist
- [ ] Search for `hasAttached(.*Factory()` without `->count` following it
- [ ] Cross-reference test assertions with actual attachment counts
- [ ] Check if tests would break if the default attachment count changed
- [ ] Verify multi-attachment edge cases are tested (0, 1, many)
- [ ] Review test names — do they specify the expected count?

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use hasAttached() for Count-Controlled Many-to-Many Data |
| Skill | `06-skills.md` — Set Up BelongsToMany Factory Relationship with hasAttached() |
