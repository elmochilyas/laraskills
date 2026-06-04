# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Data Management
Knowledge Unit: Minimal Data Principle
Difficulty Level: Core
Last Updated: 2026-06-02

---

# Executive Summary
The minimal data principle states that tests should create only the minimum data required to verify the specific behavior under test. Instead of creating large, realistic datasets, tests create 1-3 records with precisely the attributes needed. This principle is foundational to Laravel testing best practices: fast tests, focused assertions, and reduced test maintenance. The principle applies to all test types (unit, feature, browser) and is particularly important for test suites that run in parallel or as part of CI pipelines, where unnecessary data creation multiplies execution time.

# Core Concepts
- **Minimum viable data**: The smallest dataset that exercises the target behavior. If testing "user can view own profile," create exactly 1 user. If testing "admin can see all users," create 1 admin and 2 regular users.
- **1-3 record guideline**: Most database tests need 1-3 records. Exceptions: pagination tests (need enough for multiple pages), sorting tests (need diverse values), concurrency tests (need multiple simultaneous operations).
- **Data sufficiency vs data excess**: Sufficient data triggers the behavior. Excess data slows tests, increases maintenance, and obscures the test's intent.
- **Test-specific data, not realistic data**: Tests don't need realistic names, emails, or descriptions. `User::factory()->create(['name' => 'Test User'])` is sufficient. Faker-generated names add noise without value.
- **Explicit attributes over defaults**: Specify the attributes relevant to the assertion. Don't rely on factory defaults for behavior-critical attributes.

# Mental Models
- **Data as minimal set**: Like mathematical set theory — the test verifies a specific behavior; the dataset is the minimal set of elements that demonstrates that behavior.
- **Excess data as test smell**: Unnecessary data creation indicates the test may be testing too much, or the developer was uncertain about what to test. "When in doubt, leave it out."
- **Data speed-cost curve**: Each additional database record adds ~1-5ms of creation time. 100 unnecessary records × 100 tests × 5ms = 50 seconds of wasted CI time.
- **Explicit small data vs realistic large data**: Small explicit data serves the test better than large realistic data. "User 1" and "User 2" are more useful in a test assertion than "John Smith" and "Jane Doe."

# Internal Mechanics
- **Factory without attributes**: `User::factory()->create()` creates a user with random Faker attributes. All default factory attributes are created, even if the test doesn't reference them.
- **Factory with minimal attributes**: `User::factory()->create(['name' => 'Test'])` creates a user with the specified name and random defaults for other fields. Specified fields use known values; unspecified fields use Faker.
- **Relationship data overhead**: `User::factory()->hasPosts(10)->create()` creates 1 user + 10 posts. If only the user is needed for the test, posts are unnecessary overhead.
- **Sequence with minimal entries**: `User::factory(3)->sequence(['role' => 'admin'], ['role' => 'member'], ['role' => 'member'])->create()` creates exactly 3 users with the minimum attributes to distinguish them.
- **RefreshDatabase transaction cleanup**: All created data is rolled back after each test. Transaction overhead is proportional to the amount of data created. Less data = faster rollback.

# Patterns
- **Pattern: Single-record verification**
  - Purpose: Test behavior involving a single entity
  - Benefits: Fastest possible data setup; clear assertion target
  - Tradeoffs: Cannot test multi-record scenarios (pagination, sorting)
  - Implementation: `$user = User::factory()->create(['role' => 'admin']); $this->actingAs($user)->get('/admin')->assertOk();`

- **Pattern: Two-record boundary test**
  - Purpose: Test behavior that distinguishes between two entities
  - Benefits: Minimal dataset for authorization, ownership, visibility tests
  - Tradeoffs: Not sufficient for sorting, ranking, or concurrency tests
  - Implementation: `$owner->create(['name' => 'Owner']); $other->create(['name' => 'Other']); $this->actingAs($owner)->get('/resource/1')->assertOk()->assertSee('Owner');`

- **Pattern: List/scoping with minimum records**
  - Purpose: Test listing with scoping rules
  - Benefits: Verifies correct filtering with minimum data
  - Tradeoffs: May not catch edge cases with more varied data
  - Implementation: `$visible = Post::factory()->published()->create(['title' => 'Visible']); $hidden = Post::factory()->draft()->create(['title' => 'Hidden']); $this->get('/posts')->assertSee('Visible')->assertDontSee('Hidden');`

- **Pattern: Pagination boundary with exact minimum**
  - Purpose: Test pagination with exactly enough records
  - Benefits: Minimum data to test pagination boundaries
  - Tradeoffs: Test must be updated if page size changes
  - Implementation: `Post::factory(15)->create(); $this->get('/posts?page=1')->assertSee('page 2'); $this->get('/posts?page=2')->assertDontSee('page 3');` (per page = 10)

- **Pattern: Specific attribute focus**
  - Purpose: Test behavior dependent on a specific attribute
  - Benefits: Isolates the attribute under test; other attributes use default
  - Tradeoffs: Factory default changes may affect test behavior
  - Implementation: `$user = User::factory()->create(['email_verified_at' => null]); $this->post('/login', ['email' => $user->email])->assertSee('verify your email');`

# Architectural Decisions
- **Minimal data vs production-like data**: Use minimal data for behavior verification (99% of tests). Use production-like data volumes for performance/load testing only.
- **Factory defaults vs explicit attributes**: Use factory defaults for attributes irrelevant to the test. Always specify attributes that are material to the assertion.
- **Record count decisions**: 1 record for existence/ownership tests. 2-3 records for scoping/list tests. ~15 records for pagination tests (enough for 2 pages). Never create more than necessary.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Faster test execution | May miss edge cases from varied data | Add explicit edge-case tests for important variations |
| Clearer test intent (explicit data) | Tests are less "realistic" | Reality is in production; tests verify correctness |
| Less maintenance (fewer records to manage) | Pagination tests need updates on page size change | Parameterize page size in config |
| Faster CI feedback loop | Minimal verification scope per test | Write more focused tests, not larger tests |

# Performance Considerations
- Per-record creation: 1-5ms for simple models (User, Post). 5-20ms for models with relationships.
- 1-3 records: ~3-15ms per test. 50 records: ~50-250ms per test. 500 records fails in parallel workers.
- Transaction rollback: Proportional to modified data volume. 3 records vs 50 records: rollback is 10x faster for 3.
- Database connection: Each test's data volume affects connection pool utilization. Less data = less contention.
- Factory Faker generation: Faker calls are fast (~0.01ms) but add up. 50 Faker calls per model × 50 models = 25ms in Faker alone.

# Production Considerations
- **CI time budget**: Monitor data creation volume in CI. Tests that create >50 records should be flagged for optimization.
- **Data creation profiling**: Use `--profile` in Pest/PHPUnit to identify slow tests. Slow tests are often data-heavy tests.
- **Test generation conventions**: Establish team conventions for test data creation. "No test should create more than 10 records without a comment explaining why."
- **Code review focus**: During code review, look for unnecessary data creation. `User::factory(10)->create()` when 2 would suffice is a code smell.

# Common Mistakes
- **Mistake: Creating production-like datasets for every test**
  - Why: "Tests should use realistic data to catch real-world issues"
  - Why harmful: Slow tests; hard to debug; most Faker data is irrelevant to the assertion
  - Better: Create minimum records with explicit attributes. Use realistic data only in specific scenarios that depend on it.

- **Mistake: Using Faker in assertions**
  - Why: `$user = User::factory()->create(); $this->assertDatabaseHas('users', ['email' => $user->email]);`
  - Why harmful: Faker email may contain special characters, dots, or plus signs; test may fail on edge-case values
  - Better: Use explicit values for assertions: `User::factory()->create(['email' => 'test@example.com'])`

- **Mistake: Creating data that's never used**
  - Why: Copy-pasted factory creation from another test; "might need it"
  - Why harmful: Dead data slows tests and confuses readers
  - Better: Remove unused data. If needed later, add it when needed.

- **Mistake: Confusing "realistic" with "correct"**
  - Why: "The test data must look like real production data"
  - Why harmful: Focus on aesthetic realism over behavioral correctness
  - Better: The minimum data that makes the behavior observable is the right amount

# Failure Modes
- **Insufficient data for edge cases**: Minimal data patterns may miss edge cases that only appear with more varied data. Address with targeted edge-case tests, not by increasing data volume in every test.
- **Factory default changes break tests**: A factory default changes, and tests that relied on the default value now fail. Pin critical factory default values in test configuration.
- **Pagination sensitivity**: Page size changes in config break pagination tests that created exactly enough records. Use config values to calculate required record count.
- **Relationship loading assumptions**: Minimal data may not trigger Lazy Loading vs Eager Loading issues. Test N+1 behavior separately with query count assertions.

# Ecosystem Usage
- **Laravel core**: Laravel's own test suite follows the minimal data principle. Most framework tests create 1-3 records. Large dataset creation is limited to specific performance tests.
- **Laravel Jetstream**: Jetstream's tests create minimum data for team invitations, membership management, and API token scenarios.
- **Benjamin Crozat**: The "10 Laravel Testing Best Practices" guide explicitly recommends the minimal data principle as rule #2: "Create only the data you need."
- **greeden field guide**: The "Complete Field Guide: Laravel Testing Strategy" emphasizes that "excessive data creation is the most common test performance problem" and recommends minimal data as the default approach.

# Related Knowledge Units
- **Prerequisites**: Model factory fundamentals, Database testing lifecycle, Factory states
- **Related Topics**: Declarative factory methods, Factory states and sequences, Test suite profiling
- **Advanced Follow-up**: Data creation optimization, Test performance budgeting, Database seeding strategies

# Research Notes
- The minimal data principle is consistently cited across all major Laravel testing resources: Laravel docs, Benjamin Crozat, greeden field guide, and community blog posts; it is a universal recommendation
- Test suite profiling data shows that ~30% of test execution time in typical Laravel projects is spent on database data creation; reducing data to the minimum can yield significant CI time savings
- The 1-3 record guideline has exceptions: pagination tests (per-page + 1 records), sorting tests (3+ records with diverse values), and concurrency tests (enough for simultaneous operations)
- The minimal data principle directly supports the 70/20/10 test ratio recommendation: feature tests (70%) benefit most from minimal data because they already boot the full framework
- Faker data in factory definitions is useful for preventing developers from hardcoding assertion values that match the defaults, but should not be used in test assertions; use explicit values for verification
