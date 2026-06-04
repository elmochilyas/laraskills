# Rules: Pest Test Structure

## Rule: Use describe Blocks to Group Related Test Cases
- **Condition:** When organizing tests in a Pest test file
- **Action:** Group tests using `describe()` blocks by resource, then by action. Limit nesting to 3 levels: Resource > Action > Scenario.
- **Consequence:** Clear test hierarchy makes navigation and test output readable.
- **Enforcement:** Architecture tests verify describe nesting depth does not exceed 3 levels.

## Rule: Use beforeEach Closures For Shared Setup
- **Condition:** When multiple tests in a describe block require the same setup
- **Action:** Extract shared setup (authentication, resource creation) into `beforeEach()` closures at the appropriate describe level.
- **Consequence:** Reduces duplication; tests focus on scenario-specific logic.
- **Enforcement:** Code review flags duplicated setup across tests in the same describe block.

## Rule: Apply use Statement For Laravel Integration
- **Condition:** In every Pest test file that uses Laravel features
- **Action:** Add `uses(Tests\TestCase::class)` at the top of the test file before any describe blocks.
- **Consequence:** Laravel framework boots correctly; database, HTTP, and other features work.
- **Enforcement:** Linter checks for missing `uses()` statement in test files.

## Rule: Use dataset For Data-Driven Tests
- **Condition:** When testing the same scenario with multiple input variations
- **Action:** Use `dataset()` to define test inputs. Use PHP generators for large datasets (>50 entries) to avoid eager loading overhead.
- **Consequence:** Coverage increases without test code duplication.
- **Enforcement:** Review flags repeated test logic that could be replaced with datasets.

## Rule: Apply test Groups For Targeted Execution
- **Condition:** When test files cover different API areas
- **Action:** Apply `->group('api', '<resource>')` to describe blocks or files. Use consistent group naming across the test suite.
- **Consequence:** Teams can run targeted test subsets during development and CI.
- **Enforcement:** CI configuration enforces group naming conventions.

## Rule: Keep Tests Readable As Plain Language
- **Condition:** When naming tests
- **Action:** Use `it('does something when condition', ...)` format. Test names should read as complete sentences describing expected behavior.
- **Consequence:** Test output reads as executable specification.
- **Enforcement:** Code review enforces natural language test naming.

## Rule: Place Architecture Tests At File Level
- **Condition:** When writing architecture tests with arch()
- **Action:** Place `arch()` expectations at the file level, not inside describe blocks. Create separate arch test files for extensive structural assertions.
- **Consequence:** Architecture tests run once per file instead of per describe block, reducing test execution overhead.
- **Enforcement:** Review flags arch expectations inside describe blocks.
