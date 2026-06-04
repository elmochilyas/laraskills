# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mutation Testing |
| Knowledge Unit | Pest Mutation Testing |
| Difficulty | Intermediate |
| Maturity | Emerging |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Pest fundamentals, Code coverage concepts, Test writing best practices |
| Related KUs | Infection PHP mutation testing, Coverage reporting, Test quality metrics |
| Source | domain-analysis.md K037 |

# Overview

Pest's built-in mutation testing evaluates test suite quality by introducing faults into the source code and verifying that tests detect them. Integrated directly into the Pest test runner via `--mutate` and `--min` flags, it provides a zero-configuration mutation testing experience for Laravel projects. Pest mutation testing targets specific files or directories using the `covers()` and `mutates()` functions, enabling fine-grained control over which code is mutated. For most Laravel projects, Pest mutation testing is the recommended starting point before adopting the more comprehensive Infection PHP.

# Core Concepts

- **`--mutate` flag**: Enables mutation testing. `php artisan test --mutate`.
- **`--min` flag with mutation**: `--min=70` sets minimum MSI. Suite fails if MSI drops below threshold.
- **`covers()` function**: Declares which class a test covers. Restricts mutation to that class.
- **`mutates()` function**: Declares which class should be mutated for this test.
- **Mutation score**: `killed / (killed + survived + uncovered) × 100`.
- **Mutation types**: Boundary conditions, conditionals, return values, type hints.

# When To Use

- As the starting point for teams new to mutation testing
- For quick local mutation feedback during development
- For CI gates on critical code paths (Models, Services, Actions)
- When zero configuration is desired (no `infection.json` needed)

# When NOT To Use

- For full codebase mutation analysis (use Infection for comprehensive runs)
- When custom mutators or advanced configuration is needed
- For projects using PHPUnit (no Pest mutation integration)
- When parallel mutation execution is required (Pest mutation runs sequentially)

# Best Practices (WHY)

- **Always use `covers()` to scope mutation**: Without `covers()`, Pest mutates the entire codebase, taking 30+ minutes and mutating unrelated code. With `covers()`, mutation is scoped to the class under test (1-5 minutes).
- **Set realistic MSI targets**: Start at 60% and escalate. 100% is unrealistic for most code. Lower threshold with steady improvement is better than no mutation testing at all.
- **Review surviving mutations as a team**: Each survivor is a discussion point. Either the behavior needs a test, or the mutation is acceptable (equivalent mutation).
- **Combine `--mutate` with `--filter`**: `php artisan test --mutate --filter=InvoiceCalculator` targets specific tests, providing fast feedback during development.
- **Target mutation on service/action classes**: These contain business logic with high mutation impact. Controllers and models often have thinner logic with lower MSI potential.

# Architecture Guidelines

- **Pest mutation vs Infection**: Pest mutation for developer-local use and CI on critical paths. Infection for comprehensive pre-release analysis.
- **`covers()` vs `mutates()`**: Use `covers()` for standard mappings. Use `mutates()` when a test exercises a class but cares about a different class's mutation.
- **MSI threshold**: 60-70% for initial adoption. 80%+ for well-tested critical paths.

# Performance Considerations

- Without `covers()`: mutation time = full suite time × number of mutations. Impractical.
- With `covers()`: mutation time = 1-5 minutes for targeted mutation.
- Coverage collection adds pcov overhead (20-40%) on initial run.
- Sequential execution only (no parallel mutation in Pest).

# Security Considerations

- Mutation testing on security-critical code (auth, permissions, validation) should be targeted first. A surviving mutation in these areas represents a real security risk.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running `--mutate` without `covers()` | "I want to mutate everything" | Mutates entire codebase; 30+ minutes; mutates unrelated code | Always use `covers()` to scope mutation |
| Setting `--min` too high initially | "100% mutation score or nothing" | First run shows 30% MSI; team gives up | Start at 60%; celebrate progress toward 80% |
| Not understanding surviving mutations | "MSI is 85%; that's good enough" | 15% survivors are untested behaviors | Review survivors; fix or document |
| Using `covers()` incorrectly | `covers()` inside `describe()` at wrong level | Mutation scope is wrong | Place `covers()` at function level or in `describe()` for group coverage |
| No `covers()` at all | Missing annotation | No mutation happens | Verify mutation runs by checking output for "Mutation Score" |

# Anti-Patterns

- **Full suite mutation in CI**: `php artisan test --mutate` on the entire suite. Takes too long. Target critical namespaces only.
- **No `covers()` annotations**: Mutation scope is undefined; nothing gets mutated, or everything gets mutated.
- **MSI without action**: Running mutation but never reviewing survivors or improving tests. Reports are wasted effort.
- **Ignoring Pest mutation in favor of Infection**: Starting with Infection without trying Pest mutation first. Pest mutation is simpler and sufficient for most needs.

# Examples

```php
// Basic covers() usage for targeted mutation
covers(InvoiceCalculator::class);
test('calculates total with tax', function () {
    $calculator = new InvoiceCalculator();
    $result = $calculator->calculateTotal(100, 0.2);

    expect($result)->toBe(120.0);
});

// Running mutation test locally
// php artisan test --mutate --filter=InvoiceCalculatorTest

// CI mutation gate on critical path
// php artisan test --mutate --min=70 --filter=InvoiceServiceTest

// Combined coverage + mutation
// Stage 1: php artisan test --coverage --min=80
// Stage 2: php artisan test --mutate --min=70 --filter=InvoiceServiceTest
```

# Related Topics

- **Prerequisites**: Pest fundamentals, Code coverage concepts, Test writing best practices
- **Related**: Infection PHP mutation testing, Coverage reporting, Test quality metrics
- **Advanced**: MSI threshold strategy, Mutation baseline management, Covers/mutates annotations best practices

# AI Agent Notes

- Pest mutation testing uses Infection's mutators under the hood, so mutation quality is identical. The difference is in configuration, scope, and execution speed.
- The `covers()` annotation is essential for performance. Tests without `covers()` will not be mutated. This is the #1 source of confusion for new users.
- Start with Pest mutation before adopting Infection. For most Laravel projects, Pest mutation is sufficient.

# Verification

- [ ] `covers()` annotations are used on all tests to scope mutation
- [ ] MSI target is set realistically (60-70% initial, 80%+ for critical paths)
- [ ] Surviving mutations are reviewed and acted upon
- [ ] CI uses `--mutate --min` on critical code paths
- [ ] Mutation is not run on the entire test suite in CI
- [ ] Team understands how to read mutation reports
- [ ] Equivalent mutations are documented or baselined
- [ ] Mutation testing adoption is gradual and sustainable
