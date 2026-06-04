# Rules — Minimal Data Principle

## Rule 1: Create Only the Data Your Assertion Checks
| Field | Value |
|-------|-------|
| **Name** | Create Only the Data Your Assertion Checks |
| **Category** | Data Minimization |
| **Rule** | Create exactly the records needed for the specific assertion. If you assert "user can see their own post," create 1 user and 1 post. Nothing more. |
| **Reason** | Every additional record adds noise to the test intent and performance overhead. A test asserting ownership needs exactly two records to establish the boundary (owned vs not owned). Adding categories, tags, comments, or likes distracts from the test's purpose and slows execution. |
| **Bad Example** | `$user = User::factory()->hasPosts(10)->hasCategories(5)->create()` — testing "user can see own post" but creating 10 posts and 5 categories that aren't used. |
| **Good Example** | `$user = User::factory()->create(); $post = Post::factory()->create(['user_id' => $user->id]); $this->actingAs($user)->get('/posts')->assertSee($post->title);` |
| **Exceptions** | Tests verifying complex scenarios where multiple related entities are genuinely needed. |
| **Consequences Of Violation** | Slow tests; obscured intent; unnecessary database writes. |

## Rule 2: Use Specific Factory States Over Inline Attributes for Reusable Patterns
| Field | Value |
|-------|-------|
| **Name** | Use Specific Factory States Over Inline Attributes for Reusable Patterns |
| **Category** | Readability & Maintainability |
| **Rule** | Use factory state methods (`Post::factory()->published()->create()`) for commonly reused attribute sets. Reserve inline `create(['attr' => 'val'])` for one-off test-specific values. |
| **Reason** | State methods encode domain vocabulary (`published`, `draft`, `archived`) that makes test setup readable. Inline attributes for common patterns (`['status' => 'published', 'published_at' => now()]`) duplicate the same values across tests and bury domain intent in implementation details. |
| **Bad Example** | `Post::factory()->create(['status' => 'published', 'published_at' => now()])` — duplicated in 10 tests; intent is unclear compared to `->published()`. |
| **Good Example** | `Post::factory()->published()->create()` — clear intent; single source of truth for the state definition. |
| **Exceptions** | One-off attribute values that don't represent a reusable state. |
| **Consequences Of Violation** | Duplicated inline attributes; unclear test intent; harder to maintain state definitions. |

## Rule 3: Follow the Record Count Decision Guide
| Field | Value |
|-------|-------|
| **Name** | Follow the Record Count Decision Guide |
| **Category** | Governance & Standards |
| **Rule** | Use these guidelines for record counts: 1 for existence/ownership tests, 2-3 for scoping/boundary tests, ~15 for pagination tests (per_page + page_size_needed_for_next_page). Never exceed without documented justification. |
| **Reason** | Standardized record counts make tests predictable and reviewers knowing what to expect. A test claiming to verify "user can see own posts" with 15 records raises a red flag. Standard guides prevent over-creation while ensuring sufficient data for the test type. |
| **Bad Example** | `Post::factory(50)->create()` for a test verifying "published posts appear in listing" — 1 published + 1 draft = 2 is sufficient. |
| **Good Example** | Existence test: 1 record. Boundary test: 2-3 records. Pagination: `per_page + 1` records (e.g., 11 for per_page=10). |
| **Exceptions** | Tests specifically designed to verify behavior with large datasets (document explicitly). |
| **Consequences Of Violation** | Data-heavy tests; obscured intent; reviewer uncertainty about necessity. |

## Rule 4: Avoid Creating Relationships Unless Needed
| Field | Value |
|-------|-------|
| **Name** | Avoid Creating Relationships Unless Needed |
| **Category** | Data Minimization |
| **Rule** | Do not create related models unless the relationship is directly tested or required for the behavior under test. Never create parent-child relationships when only the child is tested. |
| **Reason** | Creating relationships adds database writes (1-20ms per related model) and obscures the test's focus. A test for `Invoice::total()` shouldn't create a User, a Team, and a PaymentMethod for the user — it should create just the invoice with the minimum required foreign keys. |
| **Bad Example** | `$user = User::factory()->hasTeam()->hasPaymentMethod()->create(); $invoice = Invoice::factory()->for($user)->create();` — testing invoice total but creating team and payment method. |
| **Good Example** | `$invoice = Invoice::factory()->create(['user_id' => User::factory()])` — only the required relationship. |
| **Exceptions** | Tests that verify interaction across multiple related models (e.g., "invoice notification includes team name"). |
| **Consequences Of Violation** | Unnecessary data creation; obscured test focus; slower tests. |

## Rule 5: Profile Data-Heavy Tests and Optimize
| Field | Value |
|-------|-------|
| **Name** | Profile Data-Heavy Tests and Optimize |
| **Category** | Performance & Optimization |
| **Rule** | Use profiling to identify tests that create excessive data. Optimize any test creating more than 10 records without justification. |
| **Reason** | Data creation time is proportional to record count. A test creating 50 records takes 50-250ms just for setup — that's 5-25x more than a 3-record test. Profiling reveals these data-heavy tests so they can be optimized. Data creation is often the easiest optimization target in a slow test suite. |
| **Bad Example** | `--profile` shows 3 tests each creating 100+ records — 60% of total suite time is data creation for these 3 tests. |
| **Good Example** | "Test `UserSearchTest` creates 100 users. It needs only 15 for pagination + search filtering. Reducing to 15 saves 400ms per run." |
| **Exceptions** | Performance/load tests that intentionally create large datasets. |
| **Consequences Of Violation** | Unnoticed data bloat; gradual test suite slowdown. |

## Rule 6: Never Use Faker Data in Test Assertions
| Field | Value |
|-------|-------|
| **Name** | Never Use Faker Data in Test Assertions |
| **Category** | Determinism & Reliability |
| **Rule** | Never use Faker-generated values in assertion comparisons. Always use explicit, fixed values for attributes that appear in assertions. |
| **Reason** | Faker values are random. An assertion like `assertEquals($user->email, ...)` using a Faker-generated email may fail on edge-case values (special characters, long strings). Explicit values guarantee the assertion behaves identically on every run, making test failures always reproducible and meaningful. |
| **Bad Example** | `$user = User::factory()->create(['email' => 'test@example.com']); $this->actingAs($user)->get('/profile')->assertSee($user->email)` — Faker email could contain "+" or accented characters that behave differently in URL routing. |
| **Good Example** | `$user = User::factory()->create(['email' => 'test@example.com']); $this->actingAs($user)->get('/profile')->assertSee('test@example.com')` — fixed value, always works. |
| **Exceptions** | Assertions that verify data exists but don't check specific values (e.g., `assertDatabaseCount`). |
| **Consequences Of Violation** | Non-reproducible assertion failures from edge-case Faker output. |
