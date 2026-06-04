# Anti-Patterns — Architecture Tests for APIs

## Anti-Pattern 1: Architecture Tests as Decorative Documentation

**Category**: Testing completeness

**Description**: Writing architecture tests that codify obvious conventions without enforcing meaningful structural rules, or writing them but never running them in CI.

**Warning Signs**:
- Arch tests exist but are not part of the CI pipeline
- CI runs only `php artisan test --testsuite=Feature` without `--testsuite=Arch`
- No developer knows arch tests exist (they never fail)
- Rules duplicate what's visually obvious from the directory tree

**Why It's Harmful**: Architecture tests that never fail provide zero value — they give a false sense of structural enforcement. The conventions they codify inevitably drift as the codebase evolves, and no automated signal warns the team.

**Real-World Consequence**: A senior developer leaves; the team adds 10 controllers to a `Controllers\Legacy` namespace that extends the wrong base class. No arch test catches it because arch tests are not in CI. Six months later, refactoring the base controller breaks only half the endpoints.

**Preferred Alternative**: Run arch tests as the first CI stage with `--stop-on-failure`. They complete in <100ms and catch structural violations before any feature test runs.

**Refactoring Strategy**:
1. Add `php artisan test --testsuite=Arch --stop-on-failure` as the first CI stage
2. Ensure feature tests depend on arch tests passing (`needs: [test:arch]`)
3. Review existing arch tests — remove rules that duplicate obvious structure, add ones that enforce non-obvious conventions

**Detection Checklist**:
- [ ] Arch tests run in CI as the first stage
- [ ] Feature tests depend on arch tests passing
- [ ] Arch rules enforce non-obvious conventions (not just directory structure)

**Related Rules**: Run Arch Tests First In CI
**Related Skills**: Write Architecture Tests For APIs

---

## Anti-Pattern 2: Too Many Overly Specific Rules

**Category**: Maintainability

**Description**: Writing architecture tests for every folder, every naming convention, and every import rule, creating a maintenance burden that outweighs the benefit.

**Warning Signs**:
- Every subdirectory has its own arch rule
- Rules enforce naming patterns like "all files must be PascalCase" or "all methods must return a specific type"
- Refactoring (renaming a namespace, moving a class) requires updating 10+ arch rules
- Arch test file is 200+ lines long

**Why It's Harmful**: Over-specific rules create friction for legitimate refactoring. The cost of updating rules exceeds the cost of the violations they prevent. Developers start adding `->ignoring()` for every new class, and the rules become meaningless.

**Real-World Consequence**: A team reorganizes their API from version-based (`Api\V1\PostController`) to resource-based (`Api\Post\PostController`). Renaming the namespace breaks 15 arch rules. The team spends 2 hours updating arch tests — time that could have been spent on feature work.

**Preferred Alternative**: Focus arch rules on high-value, non-obvious conventions: inheritance chains, base class extensions, forbidden debug calls, and layer dependency boundaries. Keep the rule count under 10.

**Refactoring Strategy**:
1. Review all arch rules; remove any that wouldn't cause a production bug if violated
2. Keep rules that enforce: base class extension, namespace purity, forbidden debug calls, test file existence
3. Remove rules that enforce naming patterns or method signatures (those belong in PHPStan/Psalm)

**Detection Checklist**:
- [ ] Arch rules are < 10 in count
- [ ] Each rule catches a violation that would cause a production bug or significant convention drift
- [ ] No rule enforces purely cosmetic conventions

**Related Rules**: Enforce Namespace Conventions
**Related Skills**: Write Architecture Tests For APIs
**Related Decision Trees**: Tree 1 — Architecture Rule Granularity

---

## Anti-Pattern 3: No Exception Mechanism in Arch Rules

**Category**: Maintainability

**Description**: Writing strict architecture rules without providing a way to exclude legitimate exceptions (abstract base classes, third-party packages, generated code).

**Warning Signs**:
- No arch rule uses `->ignoring()` to exclude exceptions
- Adding a new class to a restricted namespace requires editing the arch rule
- Arch tests fail for legitimate patterns (traits, interfaces, abstract classes)

**Why It's Harmful**: Without `->ignoring()`, arch rules create a binary pass/fail that forces developers to either violate the rule (and ignore it) or structure their code around the rule rather than good design principles. This leads to `->ignoring()` being added reactively for every new exception, or worse, developers disabling the arch test entirely.

**Real-World Consequence**: A team adds a `PostServiceProvider` to `App\Services`. The arch rule "Services must only use Repositories" fails because the service provider uses `Illuminate\Support\ServiceProvider`. Instead of adding `->ignoring()`, a developer removes the arch rule entirely.

**Preferred Alternative**: Use PestPHP's `->ignoring()` to exclude legitimate exceptions from arch rules. Review exceptions regularly to ensure they remain valid.

**Refactoring Strategy**:
1. For each arch rule, identify known exceptions (abstract classes, interfaces, providers, traits)
2. Add `->ignoring('App\Services\*ServiceProvider')` or similar patterns to each rule
3. Document the rationale for each exception

**Detection Checklist**:
- [ ] Each arch rule has appropriate `->ignoring()` entries
- [ ] Exceptions are reviewed and documented
- [ ] No arch rule is disabled because of unhandled exceptions

**Related Rules**: Enforce Dependency Rules Between Layers
**Related Skills**: Write Architecture Tests For APIs

---

## Anti-Pattern 4: No Test Coverage Enforcement

**Category**: Testing completeness

**Description**: Relying solely on code review to catch missing test files for new controllers, without an architecture test that mechanically verifies coverage.

**Warning Signs**:
- The project has 20 controllers and 15 test files — no one noticed the gap
- New controllers are added frequently but test files are sometimes forgotten
- No arch rule asserts `->toHaveTestFile()`

**Why It's Harmful**: A controller without tests is invisible to CI. Code reviewers may focus on the controller code and miss the missing test file. Over time, test coverage erodes silently until a significant portion of the API has no regression tests.

**Real-World Consequence**: A new developer adds a `ReportsController` with 5 endpoints. Code review focuses on the controller logic. No one notices there's no `ReportsTest.php`. Three months later, a refactoring breaks all 5 endpoints. The team discovers the missing tests only when production monitoring shows errors.

**Preferred Alternative**: Add an arch rule: `expect('App\Http\Controllers\Api')->toHaveTestFile()`. This catches missing test files in <100ms of CI time.

**Refactoring Strategy**:
1. Add `arch('All controllers have feature tests')->expect('App\Http\Controllers\Api')->toHaveTestFile()`
2. Create missing test files for any controllers caught by the new rule
3. Exclude abstract base controllers with `->ignoring()`

**Detection Checklist**:
- [ ] Every API controller has a corresponding test file
- [ ] An arch rule enforces this mechanically
- [ ] The arch rule catches new controllers without tests

**Related Rules**: Enforce Test Coverage Per Controller
**Related Skills**: Write Architecture Tests For APIs
**Related Decision Trees**: Tree 2 — Test Coverage Enforcement

---

## Anti-Pattern 5: API Routes Contaminated with Web Middleware

**Category**: Architecture

**Description**: API routes accidentally using web middleware (sessions, CSRF, cookies), introducing state into stateless API responses.

**Warning Signs**:
- `routes/api.php` contains `->middleware('web')` references
- API routes use `view()` or `session()` calls
- No arch rule prevents this

**Why It's Harmful**: Web middleware introduces session state, CSRF tokens, and cookies — all of which are incompatible with stateless API consumption. Mobile clients and third-party consumers cannot maintain sessions. CSRF token requirements break POST/PUT/DELETE requests from non-browser clients.

**Real-World Consequence**: A developer adds `auth:web` middleware to an API route to reuse an existing authentication setup. Mobile clients receive session cookies they can't use and CSRF token requirements they can't fulfill. All mobile POST requests fail with 419 errors.

**Preferred Alternative**: Add an arch rule: `expect('routes/api.php')->not->toUse('web')->not->toUse('view')->not->toUse('session')`.

**Refactoring Strategy**:
1. Add the arch rule for `routes/api.php`
2. Review existing `routes/api.php` for web middleware usage
3. Move any routes that genuinely need sessions to `routes/web.php`

**Detection Checklist**:
- [ ] `routes/api.php` contains no web middleware references
- [ ] An arch rule enforces this mechanically
- [ ] No session or CSRF concerns leak into API routes

**Related Rules**: Isolate API Routes From Web Routes
**Related Skills**: Write Architecture Tests For APIs

---

## Anti-Pattern 6: Debug Calls in Production Code Undetected

**Category**: Quality

**Description**: `dd()`, `dump()`, `ray()`, or `var_dump()` calls remaining in production code without any automated detection.

**Warning Signs**:
- No arch rule forbids debug calls
- A `dd()` was accidentally committed in the last 6 months (check git log)
- The codebase uses `ray()` or `dump()` for development debugging

**Why It's Harmful**: A single `dd()` in a production endpoint returns a blank response — no JSON, no error, just nothing. The API consumer receives an empty body. The endpoint is completely broken. Without automated detection, these can reach production.

**Real-World Consequence**: A developer adds `dd($post)` inside a controller's `show` method to debug a relationship issue. They forget to remove it before committing. The `GET /api/posts/1` endpoint returns blank. The mobile app shows "connection error" for all post details. The bug takes 30 minutes to trace because the response is empty, not an error.

**Preferred Alternative**: Add an arch rule: `expect('App')->not->toUse(['dd', 'dump', 'ray', 'var_dump', 'print_r'])`.

**Refactoring Strategy**:
1. Add the arch rule forbidding debug calls in production code
2. Remove any existing debug calls found by the rule
3. Add `->ignoring('App\Debug\*')` if a debug helper namespace exists

**Detection Checklist**:
- [ ] An arch rule forbids debug calls in production code
- [ ] The rule covers `dd`, `dump`, `ray`, `var_dump`, `print_r`
- [ ] No debug calls exist in the `App` namespace
