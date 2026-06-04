# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Database Testing
## Knowledge Unit: Model Factory Patterns

---

### Rule 1: Use fixed strings, not faker, in factory `definition()` defaults

| Field | Value |
|-------|-------|
| **Name** | Use deterministic defaults in factory definitions |
| **Category** | Factory Design |
| **Rule** | Use fixed string values in the factory `definition()` method for all fields. Reserve `fake()` only for specific states where randomness is meaningful (e.g., unique email constraints). |
| **Reason** | Random data makes test failures non-reproducible — each run produces different data, values never match assertions, and debugging requires pinning down which random values were generated. Fixed strings ensure deterministic, debuggable tests. |
| **Bad Example** | `'name' => fake()->name(), 'email' => fake()->email()` — every test creates a different user. |
| **Good Example** | `'name' => 'Test User', 'email' => 'user@example.com'` — deterministic, reproducible. |
| **Exceptions** | Fields with unique constraints where multiple records are created (use `fake()` in a state method for that scenario). |
| **Consequences Of Violation** | Test failures are non-reproducible. Assertions against output fail because factory values change on every run. |

---

### Rule 2: Create only the minimum data needed for the test

| Field | Value |
|-------|-------|
| **Name** | Minimize created records in tests |
| **Category** | Performance |
| **Rule** | Create only the minimum number of records required to exercise the behavior under test. 1-2 records per entity is sufficient for most tests. |
| **Reason** | Each `create()` call adds 2-10ms. `User::factory()->count(50)->create()` adds 100-500ms for data that most tests never use. Unnecessary records slow the suite without improving coverage. |
| **Bad Example** | `Post::factory()->count(50)->create()` for a test that only needs to verify a single post can be viewed. |
| **Good Example** | `Post::factory()->create()` — one record is sufficient to verify the show endpoint works. |
| **Exceptions** | Tests for pagination, bulk operations, or collection queries require multiple records. |
| **Consequences Of Violation** | Test suite runs slower than necessary. CI feedback loop lengthens. |

---

### Rule 3: Extract named states for scenarios used in 2+ tests

| Field | Value |
|-------|-------|
| **Name** | Use named states for reusable setups |
| **Category** | Factory Design |
| **Rule** | When the same factory override pattern appears in 2 or more tests, extract it into a named state method (e.g., `->admin()`, `->unverified()`). |
| **Reason** | Duplicated inline overrides (`->create(['role' => 'admin'])`) are hard to maintain — changing the admin definition requires editing every test. Named states centralize the definition and make tests more readable. |
| **Bad Example** | `User::factory()->create(['role' => 'admin'])` repeated in 5 test files. |
| **Good Example** | `User::factory()->admin()->create()` — single `admin()` state defined on the factory. |
| **Exceptions** | One-off overrides that will never be reused. |
| **Consequences Of Violation** | Changing a reusable scenario requires editing every test file. Definition drift between tests. |

---

### Rule 4: Define required belongs-to relationships in the factory definition

| Field | Value |
|-------|-------|
| **Name** | Define required parent models in factory definitions |
| **Category** | Factory Design |
| **Rule** | For models that require a belongs-to relationship (e.g., `Post` belongs to `User`), define the foreign key in the `definition()` using `User::factory()` as the default value. |
| **Reason** | Tests that create a `Post` without explicitly creating a `User` will hit foreign key constraint violations. Defining the parent in `definition()` ensures a valid parent is always created automatically. |
| **Bad Example** | `PostFactory` definition omits `user_id` — tests must remember to create a user first or they get FK violations. |
| **Good Example** | `'user_id' => User::factory()` in `PostFactory::definition()` — parent created automatically. |
| **Exceptions** | Models where the relationship is optional (nullable foreign key). |
| **Consequences Of Violation** | Foreign key constraint errors when tests forget to create related models. Tests are more complex because each must manage parent creation. |

---

### Rule 5: Use `make()` instead of `create()` when database persistence is not needed

| Field | Value |
|-------|-------|
| **Name** | Prefer `make()` over `create()` for non-persistence tests |
| **Category** | Performance |
| **Rule** | Use `factory()->make()` to create model instances without persisting them when the test doesn't need database interaction. |
| **Reason** | `make()` is <1ms (no INSERT query). `create()` is 2-10ms (INSERT + callbacks). For tests that only need a model instance for data attributes or validation, `make()` avoids unnecessary database writes. |
| **Bad Example** | `User::factory()->create(['role' => 'admin'])` in a unit test that only checks if `canAccess()` returns true — doesn't need persistence. |
| **Good Example** | `$admin = User::factory()->admin()->make()` — model instance without DB write. |
| **Exceptions** | Tests that need the model to exist in the database (feature tests, relationship queries). |
| **Consequences Of Violation** | Unnecessary database writes slow down tests. More database connections required. |

---

### Rule 6: Keep `afterCreating()` callbacks lightweight

| Field | Value |
|-------|-------|
| **Name** | Minimize `afterCreating()` callback overhead |
| **Category** | Performance |
| **Rule** | `afterCreating()` callbacks should only perform essential post-creation setup. Avoid heavy operations (job dispatch, API calls, large data creation) inside `afterCreating()`. |
| **Reason** | `afterCreating()` runs synchronously for every created model. If the callback dispatches a job or creates 10 related records, creating 50 models produces 50× the overhead of a single model. |
| **Bad Example** | `afterCreating(fn ($user) => $user->notify(new WelcomeMail()))` — sends notification on every factory creation. |
| **Good Example** | Explicit notification test: `$user = User::factory()->create(); $user->notify(new WelcomeMail());` — notification only sent when explicitly tested. |
| **Exceptions** | Essential relationship setup that is part of the model's core definition (e.g., creating a `Profile` when a `User` is created). |
| **Consequences Of Violation** | Factory creation is unexpectedly slow. Tests that only need a simple model instance pay for unrelated callbacks. |
