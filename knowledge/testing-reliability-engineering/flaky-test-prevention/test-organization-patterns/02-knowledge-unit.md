# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Flaky Test Prevention
Knowledge Unit: Test Organization Patterns
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Test organization patterns define how test files are structured, named, and grouped to maximize readability, maintainability, and reliability. In the Laravel ecosystem, two primary organizational approaches exist: grouping by feature (e.g., `tests/Feature/Invoice/InvoiceSubmissionTest.php`) or by type (e.g., `tests/Feature/Controllers/`, `tests/Feature/Services/`). The community standard in 2026 favors feature-based organization, with tests serving dual purposes as both validation and living documentation. Well-organized tests follow the Arrange-Act-Assert pattern, use descriptive naming conventions, employ declarative factory methods, and are "boring" — readable over clever.

# Core Concepts
- **Feature-based organization**: Test files grouped by application feature or domain. `tests/Feature/Billing/`, `tests/Feature/Auth/`, `tests/Feature/Reporting/`. Each directory corresponds to a business capability.
- **Type-based organization**: Test files grouped by test type. `tests/Feature/Controllers/`, `tests/Feature/Services/`, `tests/Unit/Models/`. Focuses on the architectural layer being tested.
- **Arrange-Act-Assert (AAA)**: Three-part test structure. Arrange: set up test data and context. Act: execute the action under test. Assert: verify the outcome.
- **Descriptive test naming**: Test method names describe expected behavior. `it_can_submit_an_invoice`, `it_validates_required_invoice_fields`, `it_rejects_unauthorized_invoice_access`.
- **Declarative factory methods**: Custom factory methods that encapsulate setup logic. `$this->createSubscribedUser()` instead of inline factory calls.
- **Living documentation**: Tests that read as specifications. A new team member can understand the application's behavior by reading the test suite.

# Mental Models
- **Tests as documentation**: The test suite is the most up-to-date documentation of what the application actually does. Organize tests so they tell a coherent story about each feature.
- **Feature directories as menus**: `tests/Feature/Auth/` contains everything about authentication. `tests/Feature/Billing/` contains everything about billing. Each directory is a chapter in the documentation.
- **AAA as narrative**: The three-part structure mirrors storytelling: setup (context), action (plot), verification (resolution). Tests should read like short stories.
- **Readable over clever**: Clever test code (complex assertions, dynamic generation, nested loops) is fragile and hard to debug. Boring, explicit test code is maintainable.
- **One assertion family per test**: Each test should verify one coherent set of behaviors. Not "one assertion" literally, but one "what" — e.g., "what happens when the user submits an invoice."

# Internal Mechanics
- **Pest file naming**: `InvoiceSubmissionTest.php` becomes `test('can submit an invoice')` in Pest. Descriptive, readable, and self-documenting.
- **`describe()` blocks**: Pest's `describe('Invoice submission')` groups related tests. Provides nested structure: describe → test → assertions. Mirrors feature directory structure.
- **`beforeEach()` and `afterEach()`**: Setup and teardown hooks. `beforeEach()` is preferred over constructor/`setUp()` for clarity. Use for common Arrange steps.
- **Helper methods**: Custom methods on the test case class for declarative setup. `private function createSubscribedUser(): User` encapsulates complex factory chains.
- **Dataset providers**: Pest datasets provide structured test inputs. Combine with feature organization for comprehensive validation coverage per feature.
- **Higher-order tests**: Pest's `it()` and `test()` with `->assert()` chains for simple, readable one-liner tests. Best for straightforward validation scenarios.

# Patterns
- **Pattern: Feature directory organization**
  - Purpose: Group all tests for a feature in one directory
  - Benefits: Easy to find all tests related to a feature; new team members understand feature coverage
  - Tradeoffs: Some shared test helpers need centralization
  - Implementation: `tests/Feature/Invoices/`, `tests/Feature/Auth/`, `tests/Feature/Reports/`

- **Pattern: Declarative factory methods**
  - Purpose: Encapsulate complex object setup in named methods
  - Benefits: Test body is readable and focused on the scenario
  - Tradeoffs: Helper layer requires maintenance
  - Implementation: `$this->createTeamWithAdminAndMember()` instead of inline factory nesting

- **Pattern: AAA with blank line separation**
  - Purpose: Visually separate Arrange, Act, Assert sections
  - Benefits: Instant visual parsing of test structure
  - Tradeoffs: Slightly more vertical space
  - Implementation: Three paragraphs separated by blank lines within the test method

- **Pattern: Descriptive Pest test names**
  - Purpose: Test names read as specification sentences
  - Benefits: Test failures show the expected behavior; report reads as documentation
  - Tradeoffs: Long test names may exceed line length
  - Implementation: `test('rejects invoice when user lacks permission')`

- **Pattern: Describe blocks for feature grouping**
  - Purpose: Nest tests within feature sub-groups
  - Benefits: Hierarchical organization mirrors application structure
  - Tradeoffs: Deep nesting can reduce readability
  - Implementation: `describe('Invoice submission')` → `describe('authorization')` → `test('...')`

# Architectural Decisions
- **Feature vs type organization**: Feature-based for most applications (business-aligned, easier to navigate). Type-based only for very large codebases (>1000 tests) where test runner optimization matters.
- **File vs describe grouping**: Separate files per sub-feature when a feature has many tests (>50). Use `describe()` blocks for smaller groupings within a file.
- **Test helper location**: `Tests/Helpers/` for shared helpers. `Tests/Feature/Invoices/Helpers/` for feature-specific helpers. Avoid helper classes that grow into general-purpose utilities.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Feature-based organization is intuitive | Duplicate setup across feature files | Use helpers and parent test classes |
| Descriptive names = living documentation | Long test names | Use Pest's test() with string names |
| AAA structure improves readability | More verbose per test | Worth the readability benefit |
| Declarative helpers reduce duplication | Helper maintenance overhead | Review helpers quarterly for consolidation |

# Performance Considerations
- Test organization does not directly affect execution time. Indirect effects: well-organized tests are easier to identify as flaky, easier to parallelize (feature-based sharding), and easier to optimize.
- Feature-based grouping works well with parallel execution. Each feature directory can be a shard.
- Helper methods shared across tests may increase memory usage if they load large fixture data. Use lazy loading in helpers.
- Dataset providers for feature-based tests: organize datasets per feature for targeted data variation.

# Production Considerations
- **Test review in code review**: Require test changes in every PR that adds or modifies code. Test organization patterns should be discussed in code review.
- **Test convention documentation**: Document test organization conventions in `CONTRIBUTING.md`. Include naming patterns, directory structure, and AAA conventions.
- **Architecture test for test organization**: Use arch tests to enforce that tests follow naming conventions or directory placement. Example: all feature tests must be under `tests/Feature/<FeatureName>/`.
- **Test file size limits**: Establish a guideline: no test file should exceed 300 lines. Split large files into multiple files within the feature directory.

# Common Mistakes
- **Mistake: Organizing tests by implementation type**
  - Why: "All controller tests together, all service tests together"
  - Why harmful: Related tests are scattered; understanding a feature requires opening 5 files
  - Better: Group by feature; include controller, service, and validation tests for the feature in one directory

- **Mistake: Long, unstructured test methods**
  - Why: One test method that arranges, acts, asserts for multiple scenarios
  - Why harmful: First assertion failure hides later assertions; test intent is unclear
  - Better: One test per behavior; use AAA structure with blank line separation

- **Mistake: Mixing AAA sections**
  - Why: Assertions interleaved with arrange and act steps
  - Why harmful: Unclear where setup ends and verification begins
  - Better: Strict AAA: all arrange first, then act, then assert. Don't go back.

- **Mistake: Generic test names**
  - Why: `test_invoice()`, `test_auth()`, `test_create()`
  - Why harmful: Test failure doesn't indicate what behavior broke
  - Better: `test('rejects invoice with past due date')`, `test('prevents guest from accessing invoice')`

# Failure Modes
- **Bloated test files**: A single `InvoiceTest.php` grows to 2000+ lines. Tests become unmaintainable. Split by sub-feature at 300 lines.
- **Inconsistent naming**: Some tests use camelCase (`testCanSubmitInvoice`), some use snake_case (`test_can_submit_invoice`), some use Pest strings. Standardize in project conventions.
- **Lost tests in wrong directories**: A billing test in `tests/Feature/Auth/`. No arch test catches it. Team assumes billing is tested when it's not. Use arch tests to enforce directory conventions.
- **Dead test helpers**: Helpers for features that no longer exist. Accumulate and confuse new developers. Review and remove quarterly.

# Ecosystem Usage
- **Laravel core**: Laravel's own tests use a combination of feature-based and type-based organization. `tests/Feature/` contains HTTP tests grouped by feature. `tests/Unit/` is type-based.
- **Laravel Jetstream**: Jetstream's tests are organized by feature (Teams, API, Profile) with clear naming conventions. Each feature has a dedicated test file or directory.
- **Spatie packages**: Most Spatie packages organize tests by feature, with descriptive Pest test names. The README often references the test suite as documentation.
- **Filament**: Filament's test suite uses feature-based organization with `describe()` blocks for sub-grouping. Tests serve as the primary documentation for plugin development.

# Related Knowledge Units
- **Prerequisites**: Pest/PHPUnit test writing, AAA pattern, Feature vs unit test distinction
- **Related Topics**: Declarative factory methods, Flaky test prevention, Test naming conventions
- **Advanced Follow-up**: Test suite refactoring strategies, Test coverage analysis, Living documentation practices

# Research Notes
- The 70/20/10 test ratio (feature/unit/E2E) makes feature-based organization the natural default; since most tests are feature tests, grouping them by business capability creates a coherent test structure
- Pest's `describe()` function maps naturally to feature directories; each `describe()` block corresponds to a sub-feature, and each `test()` within it corresponds to a specific behavior
- The Laravel community consensus in 2026 favors "readable tests" over "DRY tests"; some duplication in test setup is acceptable if it keeps each test self-contained and readable
- Feature-based test organization aligns with domain-driven design principles; each bounded context maps to a test directory, making it easy to enforce domain boundaries at the test level
- Automated architecture tests that validate test organization conventions (e.g., "every module must have a corresponding test directory") are an emerging practice in the Laravel ecosystem
