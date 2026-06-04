# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Flaky Test Prevention |
| Knowledge Unit | Test Organization Patterns |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Pest/PHPUnit test writing, AAA pattern, Feature vs unit test distinction |
| Related KUs | Declarative factory methods, Flaky test prevention, Test naming conventions |
| Source | domain-analysis.md K028 |

# Overview

Test organization patterns define how test files are structured, named, and grouped to maximize readability, maintainability, and reliability. Two primary approaches exist: grouping by feature (e.g., `tests/Feature/Invoice/`) or by test type (e.g., `tests/Feature/Controllers/`). The community standard in 2026 favors feature-based organization, with tests serving dual purposes as both validation and living documentation. Well-organized tests follow the Arrange-Act-Assert pattern, use descriptive naming, employ declarative factory methods, and are readable over clever.

# Core Concepts

- **Feature-based organization**: Test files grouped by application feature or domain. Each directory corresponds to a business capability.
- **Type-based organization**: Test files grouped by test type (Controllers, Services, Models). Focuses on architectural layer.
- **Arrange-Act-Assert (AAA)**: Three-part test structure. Arrange: setup. Act: execute. Assert: verify.
- **Descriptive test naming**: Names describe expected behavior. `test('rejects invoice when user lacks permission')`.
- **Declarative factory methods**: Custom methods encapsulating setup logic. `$this->createTeamWithAdmin()`.
- **Living documentation**: Tests that read as specifications. New team members understand behavior by reading tests.

# When To Use

- When starting a new project (establish conventions from day one)
- When test suite exceeds 50 tests (organization becomes critical)
- When multiple developers contribute (consistent naming and structure)
- When onboarding new team members (tests as documentation)

# When NOT To Use

- For trivial test suites (<20 tests) where flat structure is clear
- When rigid conventions would slow down prototyping (establish patterns later)
- When testing a proof-of-concept or prototype

# Best Practices (WHY)

- **Group tests by feature, not by implementation type**: Related tests for a feature should be in one directory. Type-based organization scatters related tests across files, making it hard to understand feature coverage.
- **Use descriptive Pest test names**: `test('rejects invoice with past due date')` communicates intent. Test failures show the expected behavior. Reports read as documentation.
- **Use AAA with blank line separation**: Visually separates setup, action, and verification. Instant parsing of test structure. No mixing of concerns.
- **Prefer readable tests over DRY tests**: Some duplication is acceptable if it keeps each test self-contained and readable. "Boring" test code is maintainable test code.
- **Limit test files to ~300 lines**: Large files are hard to navigate. Split by sub-feature when exceeding this limit.

# Architecture Guidelines

- **Feature vs type organization**: Feature-based for most applications. Type-based only for very large codebases (>1000 tests).
- **File vs describe grouping**: Separate files per sub-feature when a feature has many tests (>50). Use `describe()` blocks for smaller groupings.
- **Test helper location**: `Tests/Helpers/` for shared helpers. Feature-specific helpers in `Tests/Feature/<Feature>/Helpers/`.

# Performance Considerations

- Organization does not directly affect execution time. Indirectly: well-organized tests are easier to parallelize (feature-based sharding), easier to identify as flaky, and easier to optimize.
- Feature-based grouping works well with parallel execution. Each feature directory can be a shard.
- Large fixture data in helpers may increase memory. Use lazy loading.

# Security Considerations

- Security-critical tests (auth, permissions) must be easy to find and review. Feature-based organization helps locate them.
- Architecture tests can enforce security conventions: "every protected endpoint must have a guest access test."

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Organizing tests by implementation type | "All controller tests together" | Related tests scattered; understanding a feature requires 5 files | Group by feature; include all test types for the feature in one directory |
| Long, unstructured test methods | One test for multiple scenarios | First assertion failure hides later assertions | One test per behavior; AAA with blank line separation |
| Mixing AAA sections | Assertions interleaved with arrange/act | Unclear where setup ends and verification begins | Strict AAA: all arrange → act → assert. Don't go back |
| Generic test names | `test_invoice()`, `test_auth()` | Failure doesn't indicate what broke | `test('rejects invoice with past due date')` |

# Anti-Patterns

- **Type-based ghettos**: `tests/Feature/Controllers/`, `tests/Feature/Models/`. Tests for a single feature are scattered everywhere.
- **Bloated single test file**: A 2000-line `InvoiceTest.php`. Impossible to navigate. Split at 300 lines.
- **Inconsistent naming**: Mix of camelCase, snake_case, and Pest strings. Standardize on one convention.
- **Dead test helpers**: Helpers for features that no longer exist. Review and remove quarterly.
- **Lossy test documentation**: Tests that don't explain the business rule they verify. Every test name should answer "what behavior is this verifying?"

# Examples

```php
// Feature-based directory structure
// tests/Feature/Invoices/
//   InvoiceSubmissionTest.php
//   InvoiceCancellationTest.php
//   InvoiceAuthorizationTest.php
//   Helpers/
//     InvoiceTestHelpers.php

// AAA with blank line separation
public function test_rejects_invoice_with_past_due_date()
{
    $this->freezeTime();
    $user = User::factory()->create();
    $invoice = Invoice::factory()->for($user)->pastDue()->create();

    $response = $this->actingAs($user)
        ->post(route('invoices.pay', $invoice), [
            'payment_method' => 'credit_card',
        ]);

    $response->assertSessionHasErrors('invoice');
    $this->assertTrue($invoice->fresh()->isPastDue());
}

// Descriptive test with Pest
test('rejects invoice when user lacks permission')
    ->with([['guest'], ['regular-user']])
    ->expect(fn ($role) => match($role) {
        'guest' => $this->get(route('invoices.create'))->assertRedirect('login'),
        'regular-user' => $this->actingAs(User::factory()->create())
            ->get(route('invoices.create'))
            ->assertForbidden(),
    });

// Declarative factory method
private function createTeamWithAdminAndMember(): array
{
    $team = Team::factory()->create();
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create();
    $team->members()->attach([$admin->id, $member->id]);

    return [$team, $admin, $member];
}
```

# Related Topics

- **Prerequisites**: Pest/PHPUnit test writing, AAA pattern, Feature vs unit test distinction
- **Related**: Declarative factory methods, Flaky test prevention, Test naming conventions
- **Advanced**: Test suite refactoring strategies, Test coverage analysis, Living documentation practices

# AI Agent Notes

- Feature-based organization is the natural default for the 70/20/10 test ratio (feature/unit/E2E). Most tests are feature tests; grouping them by business capability creates a coherent structure.
- Pest's `describe()` function maps naturally to feature directories. Each `describe()` block corresponds to a sub-feature; each `test()` corresponds to a specific behavior.
- Architecture tests can enforce test organization conventions. Example: "every module must have a corresponding test directory."

# Verification

- [ ] Tests are organized by feature, not by implementation type
- [ ] Each feature has a dedicated test directory
- [ ] Test files are kept under ~300 lines
- [ ] Test names are descriptive and communicate the expected behavior
- [ ] AAA pattern is used with blank line separation
- [ ] Declarative factory methods encapsulate complex setup
- [ ] Test naming conventions are documented and consistent
- [ ] Architecture tests enforce organizational conventions
- [ ] Dead test helpers are removed quarterly
