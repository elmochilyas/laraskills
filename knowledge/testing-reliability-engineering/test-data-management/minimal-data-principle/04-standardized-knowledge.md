# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Test Data Management |
| Knowledge Unit | Minimal Data Principle |
| Difficulty | Core |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Model factory fundamentals, Database testing lifecycle, Factory states |
| Related KUs | Declarative factory methods, Factory states and sequences, Test suite profiling |
| Source | domain-analysis.md K036 |

# Overview

The minimal data principle states that tests should create only the minimum data required to verify the specific behavior under test. Instead of creating large, realistic datasets, tests create 1-3 records with precisely the attributes needed. This principle is foundational to Laravel testing best practices: fast tests, focused assertions, and reduced test maintenance. The principle applies to all test types (unit, feature, browser) and is particularly important for test suites that run in parallel or as part of CI pipelines, where unnecessary data creation multiplies execution time.

# Core Concepts

- **Minimum viable data**: The smallest dataset that exercises the target behavior. If testing "user can view own profile," create exactly 1 user.
- **1-3 record guideline**: Most database tests need 1-3 records. Exceptions: pagination, sorting, and concurrency tests.
- **Data sufficiency vs data excess**: Sufficient data triggers the behavior. Excess data slows tests, increases maintenance, and obscures the test's intent.
- **Test-specific data, not realistic data**: Tests don't need realistic names, emails, or descriptions. `User::factory()->create(['name' => 'Test User'])` is sufficient.
- **Explicit attributes over defaults**: Specify the attributes relevant to the assertion. Don't rely on factory defaults for behavior-critical attributes.

# When To Use

- All feature and unit tests as the default approach
- Database assertions where specific records need to exist
- Authorization and ownership boundary testing
- List/filtering behavior verification
- Pagination boundary testing (with minimum required records)

# When NOT To Use

- Performance/load testing (need production-like data volumes)
- Sorting tests (need enough diverse values for meaningful sort order)
- Concurrency tests (need multiple simultaneous operations)
- Integration tests that verify data rendering (need realistic display data)
- Regression tests for edge cases involving large datasets

# Best Practices (WHY)

- **Create only the data your assertion checks**: Reason: if your test asserts the user can see their own post, create 1 user and 1 post. Don't create 10 posts, 5 comments, and 3 categories.
- **Use explicit values for assertions**: Reason: `User::factory()->create(['email' => 'test@example.com'])` then `assertDatabaseHas('users', ['email' => 'test@example.com'])`. Faker values in assertions may contain edge-case characters.
- **Remove unused data**: Reason: dead data slows tests and confuses readers. If a variable is created but not used in the assertion, remove it.
- **Profile data creation volume**: Reason: tests creating >50 records should be flagged for optimization. Use `--profile` to identify data-heavy tests.
- **Prefer specific factory states over inline attributes**: Reason: `Post::factory()->published()->create()` is clearer than `Post::factory()->create(['status' => 'published'])` for commonly used states.

# Architecture Guidelines

- **Record count guidelines**: 1 record for existence/ownership, 2-3 for scoping/list tests, ~15 for pagination tests (enough for 2 pages).
- **Attribute specification**: Specify attributes relevant to the assertion. Use factory defaults for irrelevant fields.
- **Relationship minimization**: Avoid creating relationships unless they're needed for the test scenario. `User::factory()->hasPosts(10)` is unnecessary if only the user is tested.
- **Test speed-cost awareness**: Each additional database record adds ~1-5ms of creation time. 100 unnecessary records × 100 tests × 5ms = 50 seconds of wasted CI time.

# Performance Considerations

- **Per-record creation**: 1-5ms for simple models (User, Post). 5-20ms for models with relationships.
- **Transaction rollback**: Proportional to modified data volume. 3 records vs 50 records: rollback is 10x faster for 3.
- **Database connection**: Each test's data volume affects connection pool utilization. Less data = less contention.
- **Factory Faker generation**: Faker calls are fast (~0.01ms) but add up. 50 Faker calls × 50 models = 25ms in Faker alone.

# Security Considerations

- **Data exposure**: Minimal data means fewer records with sensitive attributes. Avoid creating data with real user information.
- **Test isolation**: Minimal data reduces the chance of data leakage between tests. Fewer records = less state to manage.

# Common Mistakes

**Mistake: Creating production-like datasets for every test**
- Description: Realistic names, emails, descriptions in every test
- Cause: "Tests should use realistic data to catch real-world issues"
- Consequence: Slow tests; hard to debug; most Faker data is irrelevant
- Better: Create minimum records with explicit attributes.

**Mistake: Using Faker in assertions**
- Description: `$user = User::factory()->create(); $this->assertDatabaseHas('users', ['email' => $user->email]);`
- Cause: Convenience; "the factory creates valid data"
- Consequence: Faker email may contain special characters causing assertion failures
- Better: Use explicit values: `User::factory()->create(['email' => 'test@example.com'])`.

**Mistake: Creating data that's never used**
- Description: Copy-pasted factory creation from another test
- Cause: "Might need it"
- Consequence: Dead data slows tests and confuses readers
- Better: Remove unused data. Add when needed.

**Mistake: Confusing "realistic" with "correct"**
- Description: Spending effort on realistic-looking test data
- Cause: "The test data must look like real production data"
- Consequence: Focus on aesthetic realism over behavioral correctness
- Better: The minimum data that makes the behavior observable is the right amount.

# Anti-Patterns

- **Factory relationship over-creation**: Creating parent-child relationships when only the parent is needed.
- **Data-for-every-test approach**: Creating the same large dataset in every test via `setUp()` or `beforeEach()`.
- **Unreviewed data creation**: Code review should flag `User::factory(10)->create()` when 2 would suffice.
- **Faker-dependent test logic**: Tests that use Faker data in assertions instead of explicit values.

# Examples

**Single-record verification**
```php
test('admin can access admin panel', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $this->actingAs($user)->get('/admin')->assertOk();
});
```

**Two-record boundary test**
```php
test('user can only see their own posts', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $ownedPost = Post::factory()->create(['user_id' => $owner->id]);
    Post::factory()->create(['user_id' => $other->id]);

    $this->actingAs($owner)
        ->get('/posts')
        ->assertSee($ownedPost->title)
        ->assertDontSee($other->posts->first()->title);
});
```

**Pagination boundary with exact minimum**
```php
test('paginates posts at 10 per page', function () {
    Post::factory(11)->create(); // 10 for page 1, 1 for page 2

    $this->get('/posts?page=1')->assertSee('page 2');
    $this->get('/posts?page=2')->assertDontSee('page 3');
});
```

# Related Topics

- Declarative factory methods
- Factory states and sequences
- Test suite profiling
- Data creation optimization
- Test performance budgeting
- Database seeding strategies

# AI Agent Notes

- When generating test code, default to creating the minimum records (1-3) needed for the assertion.
- Use explicit attribute values for assertions, not Faker-generated values.
- Never generate unnecessary relationship creation in tests.
- For pagination tests, create exactly enough records to test the boundary (page size + 1).
- Flag data creation patterns in code review: if a test creates >10 records, require a comment explaining why.

# Verification

- [ ] Tests create the minimum records needed for the assertion
- [ ] Explicit values are used for assertion-related attributes
- [ ] No unused factory-created records exist in tests
- [ ] Relationship creation is minimized to what the test requires
- [ ] Pagination tests create exactly page_size + 1 records
- [ ] Code review flags `User::factory(10)` when 2 would suffice
- [ ] CI profiling identifies data-heavy tests for optimization
- [ ] Faker data is not used in test assertions
