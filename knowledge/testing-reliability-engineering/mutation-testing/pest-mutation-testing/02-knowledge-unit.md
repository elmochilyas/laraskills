# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mutation Testing
Knowledge Unit: Pest Mutation Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Pest's built-in mutation testing evaluates test suite quality by introducing faults into the source code and verifying that tests detect them. Integrated directly into the Pest test runner via `--mutate` and `--min` flags, it provides a zero-configuration mutation testing experience for Laravel projects. Pest mutation testing targets specific files or directories using the `covers()` and `mutates()` functions, enabling fine-grained control over which code is mutated. It discovers untested assertions, missing boundary checks, and weak test logic. For most Laravel projects, Pest mutation testing is the recommended starting point before adopting the more comprehensive Infection PHP.

# Core Concepts
- **`--mutate` flag**: Enables mutation testing in Pest. `php artisan test --mutate` runs the test suite with mutation analysis.
- **`--min` flag with mutation**: `--min=70` sets minimum MSI (Mutation Score Indicator). Test suite fails if MSI drops below 70.
- **`covers()` function**: Declares which class a test covers. `covers(InvoiceCalculator::class)`. Restricts mutation to that class for the test.
- **`mutates()` function**: Declares which class should be mutated for this test. `mutates(InvoiceCalculator::class)`. Similar to `covers()` but explicit about mutation target.
- **Mutation score**: Percentage of mutations killed. Score = `killed / (killed + survived + uncovered) × 100`.
- **Mutation types**: Pest mutates boundary conditions (`>` to `>=`), conditionals (`&&` to `||`), return values, and type hints.
- **Error mutation**: A mutation that caused a PHP error (parse error, type error) rather than a test failure. Treated as killed (the error is detected).

# Mental Models
- **Mutation as test quality mirror**: If your test asserts "`calculateTotal()` returns 100", a mutation that changes `+` to `-` should be caught. If the mutation survives, your assertion doesn't verify the calculation logic.
- **`covers()` as scope control**: `covers(InvoiceCalculator::class)` tells Pest "this test is about this class." Mutations are only applied to the covered class, not the entire codebase.
- **Zero-config start**: Unlike Infection PHP, Pest mutation works with zero configuration. Run `--mutate` and get immediate feedback.
- **Progressive adoption**: Start with `--mutate` on critical files. Gradually add `covers()` annotations. Then migrate to Infection for full analysis.

# Internal Mechanics
- **Mutation engine**: Pest's mutation testing is built on top of Infection PHP's core engine but with Pest-specific integration. It uses the same mutators and AST parsing.
- **Coverage-guided execution**: Pest first runs the test suite to collect coverage. Only code covered by tests is mutated. Tests not covering the mutated line are skipped for that mutation.
- **Per-test mutation**: When `covers()` is specified, Pest only mutates the covered class and only runs the tests that cover it. Drastically reduces mutation time.
- **Mutation application**: Pest parses source files, applies mutators one at a time, runs the relevant tests, and records results. Each mutation is a separate test run.
- **Result aggregation**: After all mutations, Pest aggregates results: killed, survived, uncovered, and error counts. MSI is computed and compared against `--min` threshold.

# Patterns
- **Pattern: `covers()` for targeted mutation**
  - Purpose: Limit mutation scope to specific class
  - Benefits: Fast mutation feedback; clear test-class mapping
  - Tradeoffs: Requires explicit annotation; tests without `covers()` won't mutate
  - Implementation: `covers(InvoiceCalculator::class); test('calculates total', function () { ... });`

- **Pattern: CI mutation gate on critical paths**
  - Purpose: Enforce MSI threshold for critical business logic
  - Benefits: Prevents untested changes to core logic
  - Tradeoffs: Adds CI time (1-5 minutes for targeted mutation)
  - Implementation: `php artisan test --mutate --min=70 --filter=InvoiceCalculator`

- **Pattern: Gradual mutation adoption**
  - Purpose: Introduce mutation testing without overwhelming the team
  - Benefits: Team learns to read mutation reports; quick wins build confidence
  - Tradeoffs: Incomplete coverage initially
  - Implementation: Add `covers()` to new tests; periodically add to existing tests

- **Pattern: Mutation + coverage combined gate**
  - Purpose: Enforce both coverage and mutation thresholds
  - Benefits: Code executes AND assertions verify behavior
  - Tradeoffs: Two CI gates may both fail; more noise
  - Implementation: Stage 1: `--coverage --min=80`. Stage 2: `--mutate --min=70`.

# Architectural Decisions
- **Pest mutation vs Infection**: Pest mutation for developer-local use and CI on critical paths. Infection for comprehensive pre-release analysis. Pest mutation is simpler; Infection is more configurable.
- **`covers()` vs `mutates()`**: Use `covers()` for standard test-class mappings. Use `mutates()` when a test exercises a class but primarily cares about a different class's mutation.
- **--min threshold**: 60-70% for initial adoption. 80%+ for well-tested critical paths. Lower threshold is better than no threshold.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero configuration | Less flexible than Infection | Upgrade to Infection for advanced needs |
| `covers()` makes mutation fast | Manual annotation overhead | Worth the speed benefit |
| Integrated in Pest CLI | Fewer mutators than Infection | Sufficient for most projects |
| CI gate with `--min` | Adds 1-5 min to CI for critical paths | Use targeted mutation, not full suite |

# Performance Considerations
- Without `covers()`: mutation time = full test suite time × number of mutations in all covered files. Impractical for large codebases.
- With `covers()`: mutation time = (test execution time for that test) × (mutations in covered class). Typically 1-5 minutes.
- Coverage collection: adds pcov overhead (20-40%) on initial test run.
- Parallel mutation: Not supported in Pest mutation (unlike Infection). Mutations run sequentially.
- Memory: Pest mutation can use 50-200MB RAM depending on mutation count.

# Production Considerations
- **CI targeting**: Do not run `--mutate` on the entire test suite in CI. Target critical namespaces only (Models, Services, Actions). Use separate CI job for mutation.
- **Nightly full mutation**: Run full Pest mutation (or Infection) nightly. The report identifies areas needing test improvement.
- **Mutation report review**: Review surviving mutations as a team. Each survivor is a discussion point: does this behavior need a test?
- **Developer workflow**: Developers run `php artisan test --mutate` locally before pushing critical changes. Fix surviving mutations or document acceptable survivors.

# Common Mistakes
- **Mistake: Running `--mutate` without `covers()`**
  - Why: "I want to mutate everything"
  - Why harmful: Mutates entire codebase; takes 30+ minutes; mutates unrelated code
  - Better: Always use `covers()` to scope mutation to the class under test

- **Mistake: Setting `--min` too high initially**
  - Why: "100% mutation score or nothing"
  - Why harmful: First run shows 30% MSI; team gives up on mutation testing
  - Better: Start at 60%; celebrate progress toward 70%, 80%

- **Mistake: Not understanding surviving mutations**
  - Why: "MSI is 85%; that's good enough"
  - Why harmful: 15% survivors are untested behaviors; some may be critical
  - Better: Review survivors; fix or document acceptable survivors

- **Mistake: Using `covers()` incorrectly**
  - Why: `covers()` placed inside `describe()` instead of at test level
  - Why harmful: Mutation scope may be wrong; tests don't mutate as expected
  - Better: Place `covers()` at the function level or in `describe()` for group coverage

# Failure Modes
- **Mutation timeout**: Some mutations may cause infinite loops (e.g., removing a loop exit condition). Pest has a per-mutation timeout (default 60s).
- **False survivor from equivalent mutation**: A mutation that produces identical behavior (e.g., `if (true)` to `if (false)` with no else). Rare but possible.
- **False killed from test pollution**: A mutation is killed not by the relevant assertion but by a side effect (e.g., mutation breaks a subsequent test). Isolate tests properly.
- **Configuration errors**: Missing `covers()` means no mutation happens. Verify mutation runs by checking the output for "Mutation Score" line.

# Ecosystem Usage
- **Pest PHP**: Built-in mutation testing was introduced in Pest 3 and expanded in Pest 4. It is a key differentiator from PHPUnit.
- **Laravel core**: Laravel's Pest-based test suite uses `covers()` annotations for targeted mutation testing on core framework classes.
- **Kirschbaum Development**: Their "Practical Guide to Mutation Testing with Pest" provides the most comprehensive community guidance for Pest mutation adoption in Laravel.
- **Laravel community**: Pest mutation testing is the recommended starting point for teams new to mutation testing, with Infection as the upgrade path for advanced needs.

# Related Knowledge Units
- **Prerequisites**: Pest fundamentals, Code coverage concepts, Test writing best practices
- **Related Topics**: Infection PHP mutation testing, Coverage reporting, Test quality metrics
- **Advanced Follow-up**: MSI threshold strategy, Mutation baseline management, Covers/mutates annotations best practices

# Research Notes
- Pest mutation testing uses Infection PHP's mutators under the hood, meaning the mutation quality is identical; the difference is in configuration flexibility and execution strategy
- The `covers()` annotation is the key performance optimization for Pest mutation; tests without `covers()` will not be mutated, which is a common source of confusion for new users
- Pest mutation testing supports `--mutate --filter=TestName` to target specific tests while still mutating their covered classes, enabling fast targeted mutation runs during development
- Community adoption of Pest mutation testing is growing but still limited; the primary barrier is the requirement for `covers()` annotations, which most existing test suites lack
- MSI targets for Laravel applications: Service/Action classes should target 80%+; Eloquent models typically achieve 50-60% (many methods are thin wrappers); controllers vary widely based on logic complexity
