# Rules — Test Data Factories (States & Sequences)

## Rule 1: Use Deterministic Values in State Definitions
| Field | Value |
|-------|-------|
| **Name** | Use Deterministic Values in State Definitions |
| **Category** | Determinism & Reliability |
| **Rule** | Use fixed values or `Carbon::yesterday()` in state definitions. Never use `now()`, `rand()`, or `Str::random()` in state methods. |
| **Reason** | Non-deterministic state values make every test that uses the state potentially flaky. A `published_at => now()` in a state definition varies by test execution time. Tests that check `published_at` values pass or fail based on when they run, not based on code correctness. |
| **Bad Example** | `public function published(): static { return $this->state(['published_at' => now()]); }` — varies per run. |
| **Good Example** | `public function published(): static { return $this->state(['published_at' => Carbon::yesterday()]); }` — fixed value. |
| **Exceptions** | Tests that freeze time first (`$this->freezeTime()`) — `now()` returns the frozen time consistently. |
| **Consequences Of Violation** | Non-reproducible test failures; flaky tests at time boundaries. |

## Rule 2: Prefer `->has()` Over `afterCreating` for Test-Specific Relationships
| Field | Value |
|-------|-------|
| **Name** | Prefer `->has()` Over `afterCreating` for Test-Specific Relationships |
| **Category** | Clarity & Transparency |
| **Rule** | Use `->has()` for creating related models at the call site. Use `afterCreating` only for always-required relationships without which the model is invalid. |
| **Reason** | `->has()` makes relationship creation visible in the test: `Post::factory()->has(Comment::factory(3))->create()`. `afterCreating` hides the relationship — the test relies on it without knowing. Hidden relationships cause confusion when tests unexpectedly have related data or break when the factory changes. |
| **Bad Example** | `afterCreating` creates comments for every post — even tests that only need the post body waste database writes creating comments. |
| **Good Example** | `Post::factory()->has(Comment::factory(3))->create()` — comments are created explicitly when needed. |
| **Exceptions** | Relationships required for basic model validity (e.g., a profile for a user entity that always has one). |
| **Consequences Of Violation** | Unnecessary data creation; hidden dependencies; brittle tests. |

## Rule 3: Name States as Domain Actions, Not Data States
| Field | Value |
|-------|-------|
| **Name** | Name States as Domain Actions, Not Data States |
| **Category** | Readability & Communication |
| **Rule** | Name state methods as verbs/adjectives describing the domain state: `published()`, `verified()`, `subscribed()`. Never use names like `statusPublished()` or `roleAdmin()`. |
| **Reason** | `Post::factory()->published()->create()` reads like natural language. `Post::factory()->statusPublished()->create()` reads like a getter method. State methods should read as descriptions of what the model is, not as assignments of what attribute to set. |
| **Bad Example** | `public function statusPublished(): static { return $this->state(['status' => 'published']); }` — implementation-focused name. |
| **Good Example** | `public function published(): static { return $this->state(['status' => 'published']); }` — domain-focused name. |
| **Exceptions** | Ambiguous domain terms where the state name needs clarity (e.g., `publishedOnPlatform()` vs `publishedInApp()`). |
| **Consequences Of Violation** | Less readable test setup; names that reveal implementation instead of intent. |

## Rule 4: Keep State Definitions in Sync with Schema Changes
| Field | Value |
|-------|-------|
| **Name** | Keep State Definitions in Sync with Schema Changes |
| **Category** | Maintenance & Correctness |
| **Rule** | Review and update factory states when database migrations modify related tables. Never leave states referencing removed or renamed columns. |
| **Reason** | A state referencing a removed column causes factory creation to fail with a database error. A state setting a default for a renamed column creates data that doesn't match the schema. Both cases cause test failures that manifest as confusing, non-obvious errors. |
| **Bad Example** | Migration renames `users.role` to `users.role_id` — `UserFactory::admin()` still sets `role`, causing SQL error. |
| **Good Example** | During migration planning, review factory states: update `admin()` to set `role_id` instead of `role`. |
| **Exceptions** | Schema changes that don't affect existing columns (new columns are backward-compatible). |
| **Consequences Of Violation** | Mysterious test failures; factory states that silently produce incorrect data. |

## Rule 5: Use Sequence Callbacks with `$seq->index` for Dynamic Attributes
| Field | Value |
|-------|-------|
| **Name** | Use Sequence Callbacks with `$seq->index` for Dynamic Attributes |
| **Category** | Readability & Flexibility |
| **Rule** | Use `sequence(fn ($seq) => [...] )` with `$seq->index` for index-based dynamic attributes. Use explicit arrays for static variations. |
| **Reason** | Sequence callbacks with `$seq->index` provide a clean way to create index-dependent values (sequential titles, incremental emails). The 0-based index is predictable and consistent. For static variations (specific roles, fixed values), explicit arrays are clearer than callbacks. |
| **Bad Example** | `sequence(['title' => 'Article 0'], ['title' => 'Article 1'], ...)` — repeated manual values for 10 items. |
| **Good Example** | `sequence(fn ($seq) => ['title' => "Article {$seq->index}"])` — dynamic, concise, 0-based index. |
| **Exceptions** | Non-uniform sequences where each item has a completely different structure. |
| **Consequences Of Violation** | Verbose sequence arrays for dynamic values; harder-to-read test setup. |

## Rule 6: Document Attribute Precedence
| Field | Value |
|-------|-------|
| **Name** | Document Attribute Precedence |
| **Category** | Documentation & Correctness |
| **Rule** | Document the attribute precedence in factory files: `create()` attributes > last state > first state > base definition. Ensure the team understands this order. |
| **Reason** | Developers regularly make mistakes like `User::factory()->admin()->create(['role' => 'member'])` expecting `admin` to win, but `create()` attributes take precedence. Documenting precedence prevents these mistakes and makes factory behavior predictable. |
| **Bad Example** | `User::factory()->admin()->create(['role' => 'member'])` — developer expects `role: admin` but gets `role: member` because `create()` overrides states. |
| **Good Example** | Factory docblock: `// Precedence: create() > last applied state > first applied state > base definition`. Developer reads this and understands the behavior. |
| **Exceptions** | None. Every team member needs to understand this. |
| **Consequences Of Violation** | Unexpected attribute values; tests that pass with wrong data. |
