# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Test Framework & Runner Infrastructure
## Knowledge Unit: PHPUnit Compatibility & Migration Paths

---

### Rule 1: Keep `phpunit.xml` as the single source of truth for test suite configuration

| Field | Value |
|-------|-------|
| **Name** | Keep `phpunit.xml` as authoritative config |
| **Category** | Configuration |
| **Rule** | Always maintain `phpunit.xml` as the primary test configuration file. `pest.php` must only augment with Pest-specific settings, never duplicate or override `phpunit.xml` configuration. |
| **Reason** | Both PHPUnit and Pest read `phpunit.xml`. Duplicating settings creates confusion about which file is authoritative and can lead to configuration drift. |
| **Bad Example** | Setting environment variables in both `phpunit.xml` and `pest.php` with different values. |
| **Good Example** | `phpunit.xml` defines all environment variables, test suites, and extensions. `pest.php` only contains `uses()` trait scoping. |
| **Exceptions** | Pest plugin configuration has no `phpunit.xml` equivalent (e.g., `->withFaker()`). |
| **Consequences Of Violation** | Configuration drift between files. Tests behave differently depending on which framework is used to run them. |

---

### Rule 2: Migrate test files one at a time, never in a big-bang migration

| Field | Value |
|-------|-------|
| **Name** | Migrate PHPUnit to Pest file by file |
| **Category** | Migration Strategy |
| **Rule** | Migrate PHPUnit test files to Pest syntax one file at a time. Never attempt to migrate the entire test suite in a single commit or branch. |
| **Reason** | Big-bang migration is high-risk: a single incompatible feature can block the entire migration. File-by-file migration allows testing each converted file independently and rolling back individual changes. |
| **Bad Example** | A single pull request converting 200 PHPUnit test files to Pest — one failure blocks all. |
| **Good Example** | Converting files directory by directory, with each PR containing 5-10 converted files and thorough review. |
| **Exceptions** | Teams with 100% automated test coverage and robust CI can batch larger groups, but file-by-file is still safer. |
| **Consequences Of Violation** | Migration stalls when a single file has an incompatibility. Entire test suite is broken during the transition. |

---

### Rule 3: Use `test()` (not `it()`) when PHPUnit annotations like `@depends` are needed

| Field | Value |
|-------|-------|
| **Name** | Use `test()` for annotation-dependent tests |
| **Category** | Test Syntax |
| **Rule** | Use the `test()` function instead of `it()` when a test requires PHPUnit annotations such as `@depends`, `@dataProvider`, or `@group` that depend on `$this` context. |
| **Reason** | `it()` closures do not have `$this` bound to the TestCase instance. Annotations that inject values via method arguments require `$this` access. |
| **Bad Example** | `it('depends on first', fn ($result) => ...)->depends('first')` — `$this` not available for injection. |
| **Good Example** | `test('depends on first', function ($result) { ... })->depends('first')` — works correctly. |
| **Exceptions** | `@group` annotations work with both `it()` and `test()`. Only annotations that inject method arguments require `test()`. |
| **Consequences Of Violation** | Annotation injection fails. Tests receive wrong arguments or crash with type errors. |

---

### Rule 4: Never mix Pest syntax and PHPUnit class syntax in the same file

| Field | Value |
|-------|-------|
| **Name** | One syntax style per file |
| **Category** | Test Organization |
| **Rule** | Each test file must use either Pest syntax (`it()`/`test()`) or PHPUnit class syntax (`class FooTest extends TestCase`), never both. |
| **Reason** | Pest transpiles `it()`/`test()` into PHPUnit methods. Mixing syntax causes PHPUnit to see duplicate or conflicting method definitions. |
| **Bad Example** | A file with both `it('works', fn() => ...)` and `class UserTest extends TestCase { ... }`. |
| **Good Example** | Different files for different syntax: `tests/Feature/UserTest.php` (PHPUnit), `tests/Feature/PostTest.php` (Pest). |
| **Exceptions** | None. This is a hard constraint of Pest's transpilation engine. |
| **Consequences Of Violation** | PHPUnit errors about duplicate test methods or unexpected class structure. |

---

### Rule 5: Run both framework syntaxes in CI during active migration

| Field | Value |
|-------|-------|
| **Name** | Run mixed suites in CI during migration |
| **Category** | CI/CD |
| **Rule** | Keep both Pest and PHPUnit test files in the same CI pipeline during migration. Both `*.test.php` and `*Test.php` files must be auto-discovered and executed. |
| **Reason** | During migration, the test suite contains a mix of converted and unconverted files. Running only Pest tests misses unconverted PHPUnit tests, creating a coverage gap. |
| **Bad Example** | Only running `php artisan test` (Pest) in CI — unconverted PHPUnit files in `tests/Unit/` are not executed. |
| **Good Example** | `phpunit.xml` includes both `testsuite` entries that cover both `*.test.php` and `*Test.php` files. |
| **Exceptions** | Once migration is complete, remove PHPUnit-only directories from the test suite. |
| **Consequences Of Violation** | Unconverted test files are silently skipped. Coverage drops without anyone noticing. |

---

### Rule 6: Use `pest-plugin-migrate` for automated conversion but review every file

| Field | Value |
|-------|-------|
| **Name** | Review automated migration output |
| **Category** | Migration Strategy |
| **Rule** | Use `pest-plugin-migrate` for the initial automated conversion of PHPUnit files to Pest syntax, but manually review every converted file before committing. |
| **Reason** | The migration tool achieves ~95% accuracy. The remaining 5% includes edge cases like complex data providers, custom PHPUnit assertions, and unusual setUp patterns that require manual fixes. |
| **Bad Example** | Running `pest-plugin-migrate` on the entire suite and committing without review — 5% of tests are silently broken. |
| **Good Example** | Running `pest-plugin-migrate` on one directory at a time, reviewing each file, fixing edge cases, and running tests before committing. |
| **Exceptions** | Very simple PHPUnit files (single-assertion tests with no custom setup) can be trusted with less review. |
| **Consequences Of Violation** | Broken tests in production. Subtle behavioral differences in migrated files go undetected until they fail in CI. |

---

### Rule 7: Never rewrite working PHPUnit tests without a clear benefit

| Field | Value |
|-------|-------|
| **Name** | Only migrate tests that benefit from Pest syntax |
| **Category** | Migration Strategy |
| **Rule** | Do not migrate stable, working PHPUnit tests to Pest syntax unless there is a clear benefit (e.g., the file is actively maintained or needs refactoring). |
| **Reason** | Reformatting established tests is low-value work that introduces risk of regression without improving test coverage. Effort is better spent on new tests or optimizing slow tests. |
| **Bad Example** | Team spends a sprint converting 1000 stable unit tests to Pest syntax — no new coverage gained, one introduced bug. |
| **Good Example** | Converting only actively maintained feature test files. Leaving stable, infrequently modified unit tests in PHPUnit. |
| **Exceptions** | When the team has decided to standardize on Pest for all new tests, legacy PHPUnit tests can remain as-is indefinitely. |
| **Consequences Of Violation** | Wasted development time. Introduced regressions in stable test files. |

---

### Rule 8: Clear transpilation cache after framework version upgrades

| Field | Value |
|-------|-------|
| **Name** | Clear Pest cache after version upgrades |
| **Category** | Maintenance |
| **Rule** | Run `php artisan pest:clear` after upgrading Pest, PHPUnit, or Laravel framework versions. |
| **Reason** | Stale transpilation cache from a previous framework version can produce PHP code that references removed classes or changed interfaces, causing confusing test failures. |
| **Bad Example** | Upgrading from Pest 3 to Pest 4 without clearing cache — tests fail with "Class not found" errors for removed internal classes. |
| **Good Example** | Running `php artisan pest:clear && php artisan test` after every framework upgrade. |
| **Exceptions** | Minor patch version upgrades that do not change the public API. |
| **Consequences Of Violation** | Tests fail after framework upgrades with cryptic errors. Debugging is time-consuming because the cache obscures the actual issue. |
