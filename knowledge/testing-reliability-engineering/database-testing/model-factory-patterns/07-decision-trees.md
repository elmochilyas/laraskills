# Decision Trees — Model Factory Patterns

## Decision Tree 1: Fixed Strings vs Faker in Factory Definitions

```
What should factory default values be?
│
├── Is the field asserted against in tests?
│   └── YES → Use fixed string (deterministic, reproducible)
│       `'email' => 'user@example.com'`
│       Assertion: `assertDatabaseHas('users', ['email' => 'user@example.com'])`
│       Faker in assertions = flaky tests
│
├── Does the field need unique values per record (bulk creation)?
│   └── YES → Use `fake()` only in a dedicated state method
│       `->uniqueEmail()` state for bulk scenarios
│       Default: fixed string
│
└── Is the field irrelevant to any test (never asserted)?
    └── Fixed string is still preferred for determinism
        `fake()` makes debugging harder with no benefit
        Example: `'avatar' => 'default-avatar.png'`
```

## Decision Tree 2: `create()` vs `make()`

```
Does this test need the model persisted to the database?
│
├── Does the test make database assertions (assertDatabaseHas)?
│   └── YES → Use `create()` — model must exist in DB
│       Slower (2-10ms) but necessary for persistence verification
│
├── Does the test only need model attributes (unit test, policy check)?
│   └── YES → Use `make()` — model in memory only
│       Faster (<1ms) — avoids unnecessary DB writes
│       Example: `$user = User::factory()->admin()->make()`
│       Policy test: `expect($policy->view($user, $post))->toBeTrue()`
│
└── Does the test need the model for feature-level HTTP assertions?
    └── Use `create()` — HTTP requests need persisted records
        Exception: using `actingAs($user)` where `$user` is made, not created
        (authentication works with made instances)
```

## Decision Tree 3: Named State vs Inline Override

```
How should custom attribute values be specified?
│
├── Is the same attribute pattern used in 2+ tests?
│   └── YES → Extract to named state method on factory
│       ```php
│       public function admin(): static {
│           return $this->state(['role' => 'admin', 'email' => 'admin@ex.com']);
│       }
│       ```
│       Usage: `User::factory()->admin()->create()`
│       Benefit: single source of truth for "admin user" definition
│
├── Is the pattern used in only 1 test?
│   └── Use inline `->create(['key' => 'value'])`
│       No premature extraction — wait for duplication
│
└── Does the factory define a required belongs-to relationship?
    └── Define in `definition()` using sub-factory
        `'user_id' => User::factory()` in PostFactory
        Prevents foreign key constraint errors in tests
```
