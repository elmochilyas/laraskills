# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Data Management
Knowledge Unit: Test Data Cleanup (Minimal Data Principle)
 KU Code: ku-03-test-data-cleanup
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
The minimal data principle states that tests should create only the minimum data required to verify the specific behavior under test. Instead of creating large, realistic datasets, tests create 1-3 records with precisely the attributes needed. This principle is foundational to Laravel testing best practices: fast tests, focused assertions, and reduced test maintenance. It applies to all test types and is particularly important for test suites running in parallel or CI pipelines, where unnecessary data creation multiplies execution time.

# Core Concepts
- **Minimum viable data**: The smallest dataset that exercises the target behavior. 1 record for existence tests, 2-3 for scoping tests.
- **1-3 record guideline**: Most database tests need 1-3 records. Exceptions: pagination (per-page + 1), sorting (diverse values), concurrency (multiple simultaneous ops).
- **Data sufficiency vs excess**: Sufficient data triggers the behavior. Excess data slows tests, increases maintenance, obscures intent.
- **Test-specific data, not realistic data**: `User::factory()->create(['name' => 'Test'])` is sufficient. Faker names add noise.
- **Explicit attributes over defaults**: Specify attributes relevant to the assertion. Don't rely on factory defaults for behavior-critical attributes.

# When To Use
- All database-using tests as a baseline principle
- Feature tests where setup time is significant (most Laravel tests)
- CI pipelines where every millisecond of data creation multiplies across tests
- Tests that verify scoping, filtering, or authorization boundaries
- When profiling shows data creation is a significant portion of test time

# When NOT To Use
- Performance/load testing (needs production-like data volumes)
- Tests specifically designed to verify behavior with large datasets
- Pagination tests need enough records for multiple pages
- Sorting/ordering tests need records with diverse values
- Concurrency tests need enough records for simultaneous operations

# Best Practices (WHY)
- **Create exactly the data needed for the assertion**: Reason: every unnecessary record adds 1-5ms creation time. 100 unnecessary records × 100 tests = 50 seconds wasted CI time.
- **Use explicit values for assertions, not Faker defaults**: Reason: `assertDatabaseHas('users', ['email' => 'test@example.com'])` is predictable. Faker emails may contain special characters that cause false failures.
- **Prefer 1-2 records for authorization tests**: Reason: testing "user can see own posts" needs exactly 2 posts (one owned, one not). Adding more records doesn't improve coverage.
- **Profile test data creation with `--profile`**: Reason: data-heavy tests are visible in profiling output. Identify and optimize the worst offenders.
- **Set team conventions for maximum records per test**: Reason: "No test should create more than 10 records without a comment explaining why" is a good team rule.
- **Remove unused data during code review**: Reason: copy-pasted factory calls often create data that's never used. Review test code for dead data.
- **Use `expectsDatabaseQueryCount` for N+1, not more data**: Reason: adding more records to test N+1 detection is unnecessary. Query count assertions catch N+1 with 2 records.

# Architecture Guidelines
- **Contract: RefreshDatabase**: All tests that create database records should use `RefreshDatabase` or `DatabaseTruncation` for cleanup.
- **Data creation isolation**: Tests should not depend on data created by other tests. Each test creates its own minimum data.
- **Factory attribute overrides**: `User::factory()->create(['role' => 'admin'])` creates a user with admin role and Faker defaults for other fields. Override only what's material.
- **Record count decision guide**: 1 record for existence/ownership. 2-3 for scoping/list. ~15 for pagination. Never more without justification.
- **Test data budget**: Monitor total records created per test suite. Alert when trends increase.

# Performance
- **Per-record creation**: 1-5ms for simple models, 5-20ms for models with relationships.
- **1-3 records**: ~3-15ms per test. **50 records**: ~50-250ms per test.
- **Transaction rollback**: Proportional to modified data. 3 records vs 50: 10x faster for 3.
- **Connection pool contention**: Less data = less contention across parallel workers.
- **Faker generation**: ~0.01ms per call. 50 calls per model × 50 models = 25ms in Faker alone.

# Security
- **Data exposure in assertions**: Explicit attribute values in assertions may be visible in CI logs. Don't use real PII.
- **Factory default sensitivity**: Factory defaults may include placeholder values that resemble real data. Review factory definitions.
- **Transaction isolation**: `RefreshDatabase` uses transactions. No data persists after test. Safe for sensitive data.
- **Parallel database isolation**: Worker-specific databases prevent cross-test data leaks.

# Common Mistakes

**Mistake: Creating production-like datasets for every test**
- Description: Using Faker to create realistic names, emails, addresses in every test
- Cause: "Tests should use realistic data to catch real-world issues"
- Consequence: Slow tests; hard to debug; most Faker data is irrelevant to the assertion
- Better: Create minimum records with explicit attributes. Use realistic data only in specific scenarios.

**Mistake: Using Faker in assertions**
- Description: `$user = User::factory()->create(); $this->assertDatabaseHas('users', ['email' => $user->email]);`
- Cause: Convenience; "the factory created it, I'll assert it exists"
- Consequence: Faker email may contain dots, plus signs, or special characters; test fails on edge-case values
- Better: Use explicit values: `User::factory()->create(['email' => 'test@example.com'])`.

**Mistake: Creating data that's never used**
- Description: Copy-pasted factory creation from another test
- Cause: "Might need it"
- Consequence: Dead data slows tests and confuses readers
- Better: Remove unused data. Add it only when a test specifically needs it.

**Mistake: Confusing "realistic" with "correct"**
- Description: Focusing on aesthetic realism of test data over behavioral correctness
- Cause: "The test data must look like real production data"
- Consequence: Time wasted on data appearance instead of test logic
- Better: The minimum data that makes the behavior observable is the right amount.

# Anti-Patterns
- **Fixture bloat**: Loading complete fixture files that contain data irrelevant to the specific test.
- **Copy-paste data setup**: Duplicating large data creation blocks across tests instead of extracting minimal setup methods.
- **Assuming more data = better coverage**: Creating 50 records when 2 would suffice, believing it catches more bugs.
- **No data budget**: Allowing test data creation to grow without monitoring. CI time creeps up unnoticed.
- **Faker in assertions**: Using Faker-generated values in assertion calls. Creates flaky tests on edge-case Faker output.

# Examples

**Single-record test**
```php
test('owner can view their profile', function () {
    $user = User::factory()->create(['name' => 'Owner']);
    $this->actingAs($user)->get('/profile')->assertSee('Owner');
});
```

**Two-record authorization test**
```php
test('user cannot view another users draft post', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $post = Post::factory()->draft()->create(['user_id' => $owner]);

    $this->actingAs($other)
        ->get("/posts/{$post->id}")
        ->assertForbidden();
});
```

**Pagination with minimum data**
```php
test('posts are paginated', function () {
    Post::factory(15)->create(); // per_page = 10

    $this->get('/posts?page=1')->assertSee('page 2');
    $this->get('/posts?page=2')->assertDontSee('page 3');
});
```

**Attribute-focused test**
```php
test('unverified users cannot access dashboard', function () {
    $user = User::factory()->create(['email_verified_at' => null]);

    $this->actingAs($user)->get('/dashboard')->assertRedirect('/verify-email');
});
```

# Related Topics
- Declarative factory methods
- Factory states and sequences
- Test suite profiling
- Database testing lifecycle
- Model factory fundamentals

# AI Agent Notes
- Always generate tests with the minimum data principle: 1-3 records by default.
- Use explicit values (`['email' => 'test@example.com']`) in assertions, not factory-generated values.
- When generating authorization tests, use exactly 2 records (one owned, one not) to verify boundaries.
- For pagination tests, create exactly `(per_page + 1)` records, not arbitrary large numbers.
- Flag data creation as a code smell when a test creates more than 10 records without a comment.
- Never use Faker or `now()` in assertion values. Always use fixed, predictable values.

# Verification
- [ ] Each test creates only the data needed for its specific assertion
- [ ] Tests use explicit values for attributes in assertions, not Faker data
- [ ] Most tests create 1-3 records; exceptions have comments explaining why
- [ ] No test creates more than 10 records without a documented reason
- [ ] Pagination tests create exactly `(per_page + 1)` records or use config values
- [ ] `--profile` output does not show data-heavy tests as the slowest
- [ ] Team has an established convention for maximum records per test
