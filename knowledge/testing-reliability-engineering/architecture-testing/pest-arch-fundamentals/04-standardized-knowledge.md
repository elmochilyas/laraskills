# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Architecture Testing |
| Knowledge Unit | Pest Architecture Testing Fundamentals |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | PHP class structure understanding, Namespace conventions |
| Related KUs | Architecture presets, Static analysis (PHPStan/Larastan), PHP Code Sniffer/Pint |
| Source | domain-analysis.md K017 |

# Overview

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

# When To Use

- To enforce architectural conventions (layering, base class extension, interface implementation)
- To prevent debug statements (`dd`, `dump`, `ray`, `var_dump`) in production code
- To codify team conventions as executable rules
- As CI gate in lint/static analysis stage (fastest tests in the suite)
- When onboarding new team members to communicate project structure

# When NOT To Use

- For runtime behavior validation (use feature tests for return values, logic, database state)
- As substitute for static analysis tools (PHPStan catches type errors; arch() catches structural rules)
- With overly broad expectations that block all usage of a feature (e.g., `not->toUse('DB')` on whole app)
- As a one-time exercise — expectations must be maintained as architecture evolves

# Best Practices (WHY)

- **Write expectations as contracts**: "All services must extend BaseService" is better than checking individual services. This makes the test the source of truth for architectural rules.
- **Start permissive, tighten over time**: Use `ignoring()` for legacy code paths. As code is refactored, remove exemptions. Immediate strict enforcement on large codebases creates noise and tests get ignored.
- **Place arch tests in lint CI stage**: Arch tests don't need database or app booting. Running them before the test suite gives faster feedback (milliseconds vs minutes).
- **Use namespace targeting for PSR-4 code**: `expect('App\Models')` matches PSR-4 namespaces. `expect('app/Models')` matches directory paths. The wrong choice means expectations don't apply.
- **Document ignoring() exceptions**: Add comments explaining why each class is ignored. Review quarterly to remove stale exemptions.

# Architecture Guidelines

- **Placement**: Store arch tests in `tests/Arch/` or `tests/Architecture/`. Keep separate from feature/unit test files.
- **Integration with CI**: Run in lint stage before static analysis. Fastest feedback loop.
- **Baseline management**: Use Pest's arch() baseline feature for known violations. Commit baseline to repository; update quarterly.
- **Preset combination**: Start with Pest built-in presets (`security`, `laravel`), then add project-specific expectations.

# Performance Considerations

- Arch tests run in 5-50ms per expectation (PHP Parser overhead).
- Large namespace scanning (e.g., whole `app/`) takes 20-100ms depending on file count.
- Combined expectations on the same target share parse results; no redundant parsing.
- No database or application booting necessary — fastest test type in the suite.

# Security Considerations

- Architecture tests cannot validate security behaviors (use feature tests for auth, authorization, validation).
- Debug statement detection (`dd`, `dump`, `var_dump`) is a security best practice for preventing information leakage in production.
- Security-enforcing architecture rules (e.g., "no raw SQL concatenation") complement but do not replace security audits.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using arch tests for runtime behavior | Confused with behavior testing | Arch tests cannot validate method return values or logic | Use feature tests for runtime; arch tests for structure only |
| Overly broad expectations | `arch()->expect('App')->not->toUse('DB')` blocks all DB usage | Even repositories and services can't use DB directly | Target specific layers; allow DB usage in repository/service namespace |
| Not maintaining ignoring() lists | Legitimate exceptions exist (facades in config files, helpers in Blade) | CI failures on valid code; developers work around tests | ignoring() with documented exceptions; review quarterly |
| Misunderstanding namespace vs directory | `expect('app/Models')` vs `expect('App\Models')` behave differently | Architecture mismatch; tests may not apply to expected classes | Use namespace targeting for PSR-4 code; directory for non-PSR-4 |

# Anti-Patterns

- **One giant arch test**: Putting all architecture expectations in a single test. Instead, group by concern (layering, debug statements, base classes, interfaces).
- **Architecture test as blocker for all changes**: Using arch tests to enforce subjective preferences (e.g., "no services may use arrays"). Focus on objective, team-agreed conventions.
- **Duplicating preset rules**: Writing custom expectations that duplicate built-in preset checks. Use presets first, then add project-specific rules.
- **No ignoring() strategy**: Applying architectural rules without any exemption mechanism. Always provide ignoring() for valid exceptions.

# Examples

```php
// Layering enforcement: controllers must not use repositories directly
arch()->expect('App\Http\Controllers')
    ->not->toUse('App\Repositories');

// Base class contract: all jobs must extend Dispatchable
arch()->expect('App\Jobs')
    ->toExtend('Illuminate\Bus\Queueable');

// Debug statement gate: no debug functions in production code
arch()->expect('App')
    ->not->toUse(['dd', 'dump', 'var_dump', 'ray'])
    ->ignoring('App\Debug\Loggers');

// All services must implement ServiceInterface
arch()->expect('App\Services')
    ->toImplement('App\Contracts\ServiceInterface');

// Strict types enforcement in new modules
arch()->expect('App\Modules\NewModule')
    ->toUseStrictTypes();
```

# Related Topics

- **Prerequisites**: PHP class structure understanding, Namespace conventions
- **Related**: Architecture presets, Static analysis (PHPStan/Larastan), PHP Code Sniffer/Pint
- **Advanced**: Custom arch() expectations, Architecture baseline management, Multi-project architecture enforcement

# AI Agent Notes

- When creating arch tests for a project, first scan the directory structure to understand the layering scheme. Common Laravel layers: `Http/Controllers`, `Services`, `Repositories`, `Models`, `Jobs`, `Events`, `Notifications`, `Mail`.
- Look for existing conventions by checking a few files in each directory. If all services extend `BaseService`, write an arch test enforcing this. If there's no pattern, start with debug statement prevention.
- Never write an arch test that you can't confidently explain the rationale for. Every rule should have a documented "why" — otherwise it becomes noise.
- When working on legacy codebases, use `targeting()` to apply strict rules only to new directories/modules. Apply `relaxed` preset to legacy paths.

# Verification

- [ ] arch() tests run in CI lint stage, not test stage
- [ ] Debug statement detection rule is active for app/ directory
- [ ] Layer dependency rules enforce the project's architectural layering
- [ ] ignoring() list is documented with reasons for each exemption
- [ ] Architecture baseline is committed to repository
- [ ] Expectations use namespace (not directory) targeting for PSR-4 code
- [ ] Arch tests run in < 1 second total
- [ ] Every expectation has a documented architectural rationale
