# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Architecture Testing
Knowledge Unit: Pest Architecture Testing Fundamentals
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Pest's `arch()` testing enables structural and dependency validation of Laravel codebases without running any application logic. Architecture tests verify that classes extend expected base classes, implement required interfaces, use (or don't use) specific traits, and respect dependency direction rules. They serve as executable documentation of architectural decisions and catch regressions like accidental introduction of `dd()` statements, wrong import paths, or broken layering. Architecture tests run in milliseconds and are typically placed in the lint/static analysis stage of CI pipelines.

# Core Concepts
- **`arch()` function**: Entry point for all architecture expectations. Returns an `ArchExpectation` builder.
- **`expect()`**: Defines a class or namespace target for expectations. `arch()->expect('App\Models')` targets all model classes.
- **`toExtend()`**: Asserts classes extend a specific base class. `->toExtend('Illuminate\Database\Eloquent\Model')`.
- **`toImplement()`**: Asserts classes implement a specific interface. `->toImplement('App\Contracts\Reportable')`.
- **`toUse()` / `not->toUse()`**: Asserts classes use (or don't use) specific traits. `->not->toUse('Illuminate\Support\Facades\DB')`.
- **`toHaveMethods()` / `toHaveMethod()`**: Asserts classes have specific methods. `->toHaveMethod('handle')`.
- **`targeting()`**: Restricts an expectation to a specific directory or namespace.
- **`ignoring()`**: Excludes specific classes or namespaces from an expectation.

# Mental Models
- **Architecture tests as contracts**: Write architecture tests as if the codebase has contracts. "All services must extend BaseService", "All repositories must implement RepositoryInterface".
- **Fail fast, no booting**: Architecture tests fail in milliseconds. They validate structure without booting Laravel, unlike feature tests.
- **Dependency direction enforcement**: Use arch tests to enforce that `app/Http` never imports from `app/Domain` directly, or that `app/Infrastructure` depends only on contracts.
- **Live documentation**: When someone asks "what extends this class?", the architecture test is the authoritative answer.

# Internal Mechanics
- **PHP Parser dependency**: Pest's arch layer uses `nikic/php-parser` to parse PHP files without executing them. This means arch tests work on syntax and AST analysis, not runtime reflection.
- **File scanning**: `arch()->expect('App\Models')` scans the `app/Models` directory tree, parses each file, and extracts class names, parent classes, interfaces, traits, and method signatures.
- **Expectation chain**: Each `->toExtend()`, `->toImplement()`, `->toUse()` call appends a rule to the expectation. All rules must pass for the test to pass.
- **Scope behavior**: `targeting()` narrows the scope of an expectation after initial definition. `ignoring()` removes specific classes from consideration.
- **`not->` prefix**: Negates any expectation. `not->toUse('Facades\DB')` means "must not use DB facade".

# Patterns
- **Pattern: Layering enforcement**
  - Purpose: Prevent controllers from directly accessing repositories
  - Benefits: Enforces service layer pattern at architectural level
  - Tradeoffs: Requires explicit naming/namespace conventions
  - Implementation: `arch()->expect('App\Http\Controllers')->not->toUse('App\Repositories')`

- **Pattern: Base class contract**
  - Purpose: All jobs must extend `Dispatchable` base
  - Benefits: Ensures consistent job structure across team
  - Tradeoffs: Doesn't verify job logic, only structure
  - Implementation: `arch()->expect('App\Jobs')->toExtend('Illuminate\Bus\Queueable')`

- **Pattern: Debug statement gate**
  - Purpose: No debug functions in production code
  - Benefits: Prevents `dd()` and `dump()` from reaching production
  - Tradeoffs: May flag legitimate `ray()` calls; use ignoring()
  - Implementation: `arch()->expect('App')->not->toUse(['dd', 'dump', 'var_dump', 'ray'])`

- **Pattern: Facade usage restriction**
  - Purpose: Limit facade usage to dedicated layers
  - Benefits: Encourages dependency injection over facades
  - Tradeoffs: Some facades (Cache, Config) are widely acceptable
  - Implementation: `arch()->expect('App\Services')->not->toUse('Illuminate\Support\Facades\DB')`

# Architectural Decisions
- **Per-directory vs per-namespace targeting**: Use namespace targeting for code with PSR-4 autoloading. Use directory targeting for non-standard structures.
- **Strict vs pragmatic enforcement**: Start permissive (allow legacy code via `ignoring()`) and tighten over time. Immediate strict enforcement on large codebases creates noise.
- **Arch tests in CI stage**: Place arch tests in the lint/static analysis stage, not the test stage. They don't need database or application booting.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Validates structure without booting | Only checks what's syntactically visible | Pair with static analysis for deeper checks |
| Enforces layering automatically | Requires discipline to maintain expectations | Review expectations quarterly |
| Catches `dd()` before code review | May flag temporary debug code | Use ignoring() with expiration comments |
| Acts as living documentation | Tests must be updated when architecture changes | Treat as design-time artefacts |

# Performance Considerations
- Arch tests run in 5-50ms for most expectations (PHP Parser overhead).
- Large namespace scanning (e.g., whole `app/`) takes 20-100ms depending on file count.
- Combined expectations on the same target share the parse result; no redundant parsing.
- No database or application booting necessary. Fastest test type in the suite.

# Production Considerations
- **CI placement**: Run arch tests in lint stage, before static analysis and test suite. Fast feedback loop.
- **PR gate**: Block PRs that introduce arch violations. Use baseline for existing violations.
- **Baseline management**: Pest supports arch baseline file for known violations. Commit baseline and update per sprint.
- **IDE integration**: Many PhpStorm/PHP plugin suites integrate arch test results for real-time feedback.

# Common Mistakes
- **Mistake: Using arch tests for runtime behavior**
  - Why: Confused with behavior testing
  - Why harmful: Arch tests cannot validate method return values or logic
  - Better: Use feature tests for runtime; arch tests for structure only

- **Mistake: Overly broad expectations**
  - Why: `arch()->expect('App')->not->toUse('DB')` blocks all DB usage everywhere
  - Why harmful: Even repositories and services can't use DB directly
  - Better: Target specific layers; allow DB usage in repository/service namespace

- **Mistake: Not maintaining ignoring() lists**
  - Why: Legitimate exceptions exist (facades in config files, helpers in Blade)
  - Why harmful: CI failures on valid code; developers work around tests
  - Better: `ignoring()` with documented exceptions; review quarterly

- **Mistake: Misunderstanding namespace vs directory**
  - Why: `expect('app/Models')` vs `expect('App\Models')` behave differently
  - Why harmful: Architecture mismatch; tests may not apply to expected classes
  - Better: Use namespace targeting for PSR-4 code; directory for non-PSR-4

# Failure Modes
- **PHP parser compatibility**: New PHP syntax (enums, readonly classes, property hooks) may not be supported by older `nikic/php-parser` versions. Keep PHP Parser updated.
- **Generated file interference**: Stubs, ide-helper files, and generated classes may trigger false violations. Explicitly `ignoring()` generated paths.
- **Refactoring blind spots**: Renaming a namespace without updating arch expectations causes false passes. Review expectations during refactoring.
- **Convention drift**: As team conventions evolve, old arch expectations may become outdated. Schedule quarterly architecture test review.

# Ecosystem Usage
- **Laravel core**: Laravel uses arch tests internally to verify framework structure and extension points.
- **Laravel Jetstream**: Jetstream includes arch tests for Livewire/Inertia stack enforcement.
- **Laravel Nova**: Nova packages use arch tests to verify Nova resource and tool extension contracts.
- **Spatie packages**: Many Spatie packages use arch tests to enforce PHP version compatibility and strict type usage.

# Related Knowledge Units
- **Prerequisites**: PHP class structure understanding, Namespace conventions
- **Related Topics**: Architecture presets, Static analysis (PHPStan/Larastan), PHP Code Sniffer/Pint
- **Advanced Follow-up**: Custom arch() expectations, Architecture baseline management, Multi-project architecture enforcement

# Research Notes
- Pest's arch testing uses `nikic/php-parser` for static analysis, not runtime reflection; this means arch tests work on un-autoloadable code and don't trigger autoloading side effects
- Architecture testing is unique to Pest; PHPUnit has no built-in equivalent, making it a significant differentiator for Pest adoption
- The `not->toUse()` pattern is the most commonly used arch expectation in Laravel projects, primarily for catching `dd()`/`dump()` and preventing direct DB facade usage in controllers
- Arch testing complements but does not replace static analysis tools (PHPStan/Larastan); arch tests enforce structural conventions while static analysis catches type errors and undefined variables
- Teams that adopt architecture testing report improved codebase navigability and faster onboarding, as the tests serve as executable documentation of project conventions
