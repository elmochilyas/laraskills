# Rules — Factory States and Sequences

## Rule 1: Use Deterministic Values in State Definitions — Never `now()`
| Field | Value |
|-------|-------|
| **Name** | Use Deterministic Values in State Definitions — Never `now()` |
| **Category** | Determinism & Reliability |
| **Rule** | Use fixed or deterministic values (e.g., `Carbon::yesterday()`) in factory state definitions. Never use `now()`, `Carbon::now()`, or `rand()` in state methods. |
| **Reason** | State methods are used across many tests. A state using `now()` introduces time-dependent behavior into every test that uses it — tests pass or fail based on when they run. Using `Carbon::yesterday()` or freezing time in the test makes the state deterministic and the test reproducible. |
| **Bad Example** | `public function published(): static { return $this->state(['published_at' => now()]); }` — varies per test run; flaky at time boundaries. |
| **Good Example** | `public function published(): static { return $this->state(['published_at' => Carbon::yesterday()]); }` — fixed value, always reproducible. |
| **Exceptions** | State methods used only in tests that always freeze time first. |
| **Consequences Of Violation** | Non-reproducible test failures at time boundaries; intermittent flakiness. |

## Rule 2: Prefer `->has()` Over `afterCreating` for Scenario-Specific Relationships
| Field | Value |
|-------|-------|
| **Name** | Prefer `->has()` Over `afterCreating` for Scenario-Specific Relationships |
| **Category** | Design & Clarity |
| **Rule** | Use `->has()` for creating related models in tests. Reserve `afterCreating` only for relationships that are always required for the model to be valid. |
| **Reason** | `->has()` is explicit at the call site — `User::factory()->has(Profile::factory())->create()` clearly shows that a profile is created. `afterCreating` hides this relationship — the test reader doesn't know a profile was created unless they check the factory definition. Hidden relationships cause confusion and brittle tests. |
| **Bad Example** | `UserFactory::configure()` has `afterCreating(fn ($user) => $user->profile()->save(...))` — every test reader is surprised when a profile exists for a user they created. |
| **Good Example** | `User::factory()->has(Profile::factory())->create()` — relationship creation is visible at the call site. |
| **Exceptions** | Required relationships without which the model is invalid (e.g., an order always needs a customer). Document in the factory docblock. |
| **Consequences Of Violation** | Hidden relationship creation; tests that depend on side effects without knowing it. |

## Rule 3: Document Available States in Factory Docblocks
| Field | Value |
|-------|-------|
| **Name** | Document Available States in Factory Docblocks |
| **Category** | Documentation & Discovery |
| **Rule** | Add a `@method` docblock or `@see` annotation to factory classes listing all available state methods. Never leave states undocumented. |
| **Reason** | Teams discover available states by opening the factory file and looking at methods. Without documentation, they may miss useful states and re-implement them inline. A `@method` docblock at the top of the factory class provides a quick reference of available states for any team member. |
| **Bad Example** | `PostFactory` has `published()`, `draft()`, `archived()`, `featured()` states — no documentation; new team members discover them by reading the entire file. |
| **Good Example** | ```
/**
 * @method static static published()
 * @method static static draft()
 * @method static static archived()
 * @method static static featured()
 */
class PostFactory extends Factory
``` |
| **Exceptions** | Very small factory classes (1-2 states) where methods are self-explanatory. |
| **Consequences Of Violation** | Undiscovered states; duplicated state logic across tests; inconsistency. |

## Rule 4: Understand Attribute Precedence: `create()` > Last State > First State > Base
| Field | Value |
|-------|-------|
| **Name** | Understand Attribute Precedence: `create()` > Last State > First State > Base |
| **Category** | Correctness & Predictability |
| **Rule** | Know and document the attribute precedence: `create(['attr' => 'x'])` overrides all states; last-applied state overrides earlier states; states override base definition. Never apply conflicting states without understanding precedence. |
| **Reason** | `User::factory()->admin()->create(['role' => 'editor'])` results in `role: editor` because `create()` attributes win. `Post::factory()->draft()->published()->create()` results in `published` status because the last state wins. Teams that don't understand this precedence get unexpected attribute values. |
| **Bad Example** | `Post::factory()->draft()->published()->create()` — developer assumes `draft` status; actually `published` wins because it's applied last. |
| **Good Example** | Document precedence in the factory: `// Precedence: create() > last state > first state > base definition`. Apply states in the correct order. |
| **Exceptions** | None. This precedence is fundamental to understanding factory behavior. |
| **Consequences Of Violation** | Unexpected attribute values; tests that behave differently than expected. |

## Rule 5: Use Sequences for Small Batches (2-10), Explicit Loops for Larger
| Field | Value |
|-------|-------|
| **Name** | Use Sequences for Small Batches (2-10), Explicit Loops for Larger |
| **Category** | Readability & Complexity |
| **Rule** | Use `->sequence()` for creating 2-10 varied models. For more than 10 models or complex logic, use explicit loops with `create()`. |
| **Reason** | Sequences are concise and readable for small batches — `User::factory(4)->sequence(...)->create()` clearly creates 4 users with different roles. For larger batches, sequences become hard to read (long arrays, wrapping behavior) and explicit loops with clear iteration logic are more maintainable. |
| **Bad Example** | `User::factory(50)->sequence(fn ($seq) => ['role' => $seq->index < 40 ? 'member' : 'admin'])->create()` — a condition inside a sequence callback for 50 models is harder to read than a loop. |
| **Good Example** | `User::factory(4)->sequence(['role' => 'admin'], ['role' => 'editor'], ['role' => 'member'], ['role' => 'viewer'])->create()` — clear, concise for 4. For 50: explicit loop with clear logic. |
| **Exceptions** | Dynamic sequences using `$sequence->index` for 10-20 models where the callback is simple. |
| **Consequences Of Violation** | Hard-to-read sequence logic; wrapping behavior surprises when creating more models than sequence items. |

## Rule 6: Document `afterCreating` Hooks Clearly
| Field | Value |
|-------|-------|
| **Name** | Document `afterCreating` Hooks Clearly |
| **Category** | Documentation & Transparency |
| **Rule** | Add a docblock comment above any `afterCreating` hook explaining what it creates and why it's required. Never add hidden side effects without documentation. |
| **Reason** | `afterCreating` hooks execute automatically when a model is created. Test readers who don't know about these hooks are surprised when related data appears. Documenting the hook makes the side effect transparent and helps developers understand whether they should use `->has()` instead. |
| **Bad Example** | `$this->afterCreating(fn (User $user) => $user->profile()->save(Profile::factory()->make()))` — no explanation; reader doesn't know a profile is created. |
| **Good Example** | `// AfterCreating: creates a default profile. Required because User::profile() is called in all user views. Consider using ->has(Profile::factory()) for test-specific needs.` |
| **Exceptions** | None. Every `afterCreating` hook needs documentation. |
| **Consequences Of Violation** | Hidden side effects; tests that rely on undocumented behavior; confusion when data appears unexpectedly. |
