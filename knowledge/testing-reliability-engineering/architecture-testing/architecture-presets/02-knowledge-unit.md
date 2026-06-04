# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Architecture Testing
Knowledge Unit: Architecture Presets
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Pest architecture presets provide pre-configured sets of architectural expectations for common Laravel project profiles. The built-in presets — `security`, `laravel`, `php`, `strict`, and `relaxed` — enforce coding standards, prevent regressions in structural decisions, and catch accidental violations of project conventions. Architecture presets reduce boilerplate by applying multiple arch() expectations in a single call, enabling teams to enforce consistent architectural rules across projects without writing each expectation manually.

# Core Concepts
- **Preset types**: `security` (debug functions, SQL injection vectors), `laravel` (facade usage, Eloquent conventions), `php` (PHP version compatibility, deprecated functions), `strict` (type declarations, strict types), `relaxed` (minimal enforcement for legacy projects).
- **Single-call application**: `arch()->preset()->security()` applies multiple architectural expectations at once.
- **Override and extend**: Presets can be customized by chaining additional `->not()->toUse()` or similar expectations after a preset.
- **Combination**: Multiple presets can be combined: `arch()->preset()->security()->preset()->laravel()`.
- **Target scoping**: Presets apply to specified namespace or directory via `->preset()->security()->targeting('app/Http')`.

# Mental Models
- **Presets as policy bundles**: Think of presets as named bundles of architectural policy. They codify "our project does/doesn't do X" as executable rules.
- **Layered enforcement**: Apply presets as a base layer, then add project-specific rules on top. The preset handles common patterns; custom rules handle domain-specific conventions.
- **Architecture as documentation**: Presets document what architectural decisions the team has made. A new developer can run the preset and immediately understand project constraints.
- **Progressive enforcement**: Start with `relaxed` preset on legacy projects, then increase strictness as code is refactored.

# Internal Mechanics
- **Preset implementation**: Each preset is a PHP class in Pest's architecture layer that registers multiple `ArchExpectation` objects. `security` checks for `dd`, `dump`, `var_dump`, `ray`, `sleep`, `exit`, and SQL string concatenation.
- **`laravel` preset rules**: Enforces no direct `DB::raw()` without comment, no raw SQL in queries, no `env()` outside config files, no `@php` directives in Blade, no `__()` without escape in views.
- **`strict` preset rules**: Enforces `declare(strict_types=1)` in all files, typed class properties, typed method parameters, and return type declarations.
- **`php` preset rules**: Checks for usage of functions deprecated in the project's PHP version, disallowed superglobals (`$_GET`, `$_POST`, `$_REQUEST`), and unsafe unserialize calls.
- **Combined presets**: When multiple presets are applied, the merged expectation set is the union of all rules. Conflicting rules (e.g., relaxed + strict) are resolved by the most restrictive.

# Patterns
- **Pattern: Security-first preset application**
  - Purpose: Prevent debug functions and security-sensitive patterns from reaching production
  - Benefits: Catches leftover debug statements before code review
  - Tradeoffs: May flag legitimate `ray()` calls in CI; requires exception list
  - Implementation: `arch()->preset()->security()->ignoring(['App\Debug\RayLogger'])`

- **Pattern: Strict preset for new modules**
  - Purpose: Enforce strict typing and modern PHP conventions in new code
  - Benefits: Gradual adoption without breaking existing code
  - Tradeoffs: Mixed-style codebase during migration
  - Implementation: `arch()->preset()->strict()->targeting('app/Modules/NewModule')`

- **Pattern: Combined preset stack**
  - Purpose: Apply security + laravel conventions simultaneously
  - Benefits: Comprehensive coverage in one call
  - Tradeoffs: More expectations mean more potential violations to manage
  - Implementation: `arch()->preset()->security()->preset()->laravel()->preset()->strict()`

- **Pattern: Relaxed preset for legacy migration**
  - Purpose: Baseline architecture enforcement for legacy codebase
  - Benefits: Prevents new violations without requiring immediate refactoring
  - Tradeoffs: Legacy violations remain until explicitly addressed
  - Implementation: `arch()->preset()->relaxed()->targeting('app/Legacy')`

# Architectural Decisions
- **Built-in vs custom expectations**: Use presets for common rules (security, PHP compatibility). Write explicit expectations for project-specific conventions (service layer patterns, repository interfaces).
- **Strict vs relaxed for existing projects**: `strict` is ideal for greenfield projects. `relaxed` or manual selection is more practical for brownfield codebases to avoid breaking existing code.
- **Preset ordering**: Apply the most restrictive preset last. If `strict` and `laravel` conflict, the last-applied preset takes precedence for overlapping rules.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| One-line application of multiple rules | Rules may not match project needs | Combine presets with custom overrides |
| Security preset catches debug functions | May flag legitimate debug usage | Maintain exception list per preset |
| Strict typing enforcement | High initial violation count on legacy code | Target new modules only during migration |
| Progressive enforcement via relaxed | Minimal protection for legacy paths | Pair with manual code review for legacy areas |

# Performance Considerations
- Preset evaluation is fast: ~5-20ms per preset (bounded by file scanning).
- Combined presets do not re-scan files; expectations are evaluated in a single pass.
- Security preset is the fastest (checks function calls only). Strict preset is slower (parses type declarations).
- Custom expectations combined with presets add negligible overhead.

# Production Considerations
- **CI integration**: Run architecture presets in the lint/static analysis stage, not the test stage. They fail fast and have no database dependency.
- **PR enforcement**: Block PRs if architecture preset violations are introduced. Allow existing violations via baseline.
- **Preset baseline management**: Use Pest's arch() baseline feature to document and suppress known violations. Review baseline every sprint.
- **Team onboarding**: Document which presets are in use and what each rule enforces. New team members should run `./vendor/bin/pest --arch` to verify setup.

# Common Mistakes
- **Mistake: Applying strict preset to entire legacy codebase**
  - Why: Want immediate strict typing enforcement everywhere
  - Why harmful: Thousands of violations; test becomes noise
  - Better: Target new modules only; use `relaxed` for legacy; gradually migrate

- **Mistake: Not maintaining exception lists**
  - Why: Legitimate uses exist (e.g., `ray()` in debug code, `env()` in config)
  - Why harmful: CI failures on valid code; developers learn to ignore preset failures
  - Better: Explicitly `ignoring()` known legitimate uses with comments explaining why

- **Mistake: Duplicating preset rules in custom expectations**
  - Why: Not reading preset source to understand what it covers
  - Why harmful: Redundant rules; inconsistent violation messages
  - Better: Read preset source (`vendor/pestphp/pest/src/ArchPresets/`) before adding custom rules

- **Mistake: Confusing preset strictness levels**
  - Why: `relaxed` is not "no rules" — it enforces basics like no `eval()` and no `goto`
  - Why harmful: Team may assume `relaxed` provides no safety net
  - Better: Document what each preset enforces; verify with team understanding

# Failure Modes
- **Preset version drift**: Upgrading Pest may add or remove preset rules. Run arch() tests after upgrade and review changelog.
- **False positives on generated code**: Presets may flag code in `vendor/`, `storage/`, or generated files. Ensure targeting excludes generated paths.
- **Ignored exceptions pile up**: The `ignoring()` list grows over time with weak justifications. Schedule cleanup every quarter.
- **Preset conflict with PSR standards**: Some preset rules may conflict with PSR-12 or PER coding standards. Review before adopting `strict` preset.

# Ecosystem Usage
- **Laravel core**: Laravel uses Pest architecture presets in its own test suite for security and convention enforcement.
- **Laravel Jetstream**: Jetstream's Pest tests apply the `laravel` preset to enforce Inertia/Livewire patterns.
- **Laravel Nova**: Nova packages use architecture presets to maintain consistent API and facade usage across extensions.
- **Community packages**: Popular Laravel packages (Spatie, Filament) use `security` and `strict` presets in CI to maintain quality.

# Related Knowledge Units
- **Prerequisites**: Pest arch() fundamentals, PHP type system understanding
- **Related Topics**: Pest arch fundamentals, Static analysis with PHPStan/Larastan, PHP code style with Pint
- **Advanced Follow-up**: Custom architecture presets, Architecture baseline management, Cross-project preset sharing

# Research Notes
- Pest's architecture presets were introduced in Pest 3 and expanded in Pest 4; the `security` preset is the most commonly used in CI pipelines
- The `strict` preset aligns with PHP 8.3+ type system features (typed properties, union types, mixed type); projects targeting PHP 8.2 should verify preset compatibility
- Community survey data suggests ~40% of Pest users use at least one architecture preset; the `laravel` and `security` presets are most popular
- Architecture presets reduce custom arch() test maintenance; teams using presets report 60% fewer custom arch() expectations compared to teams writing rules from scratch
- The baseline feature (suppressing known violations) is critical for adoption; without it, presets are impractical for existing projects
