# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Architecture Testing |
| Knowledge Unit | Architecture Presets |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Pest arch() fundamentals, PHP type system understanding |
| Related KUs | Pest arch fundamentals, Static analysis with PHPStan/Larastan, PHP code style with Pint |
| Source | domain-analysis.md K033 |

# Overview

Pest architecture presets provide pre-configured sets of architectural expectations for common Laravel project profiles. The built-in presets — `security`, `laravel`, `php`, `strict`, and `relaxed` — enforce coding standards, prevent regressions in structural decisions, and catch accidental violations of project conventions. Architecture presets reduce boilerplate by applying multiple arch() expectations in a single call, enabling teams to enforce consistent architectural rules across projects without writing each expectation manually.

# Core Concepts

- **Preset types**: `security` (debug functions, SQL injection vectors), `laravel` (facade usage, Eloquent conventions), `php` (PHP version compatibility, deprecated functions), `strict` (type declarations, strict types), `relaxed` (minimal enforcement for legacy projects).
- **Single-call application**: `arch()->preset()->security()` applies multiple architectural expectations at once.
- **Override and extend**: Presets can be customized by chaining additional `not->toUse()` or similar expectations after a preset.
- **Combination**: Multiple presets can be combined: `arch()->preset()->security()->preset()->laravel()`.
- **Target scoping**: Presets apply to specified namespace or directory via `preset()->security()->targeting('app/Http')`.

# When To Use

- On new Laravel projects to establish baseline architectural rules from day one
- To enforce security-critical patterns (no debug functions, no raw SQL concatenation, no dangerous functions)
- To ensure PHP version compatibility and modern syntax usage across a codebase
- To gradually introduce architectural enforcement on legacy projects (start with `relaxed`, tighten over time)
- As a quick-start when adopting Pest architecture testing for the first time

# When NOT To Use

- Without understanding what each preset enforces (read the preset source or documentation first)
- As a replacement for project-specific architectural rules (presets cover generic patterns only)
- With `strict` on entire legacy codebases — will generate thousands of violations and be ignored
- When preset rules conflict with team conventions (override or omit conflicting presets)

# Best Practices (WHY)

- **Combine presets with project-specific rules**: Presets handle common patterns (debug functions, PHP compatibility). Add custom expectations for domain-specific conventions (service interfaces, repository patterns, aggregate boundaries).
- **Start with `security` + `laravel` for new projects**: These two presets catch the most common and most impactful violations without being overly restrictive. Add `strict` gradually as the team matures.
- **Use `targeting()` for progressive adoption**: On existing projects, apply strict presets only to new code directories. Legacy paths use `relaxed` or no preset. This avoids overwhelming violations while still catching new violations.
- **Read preset source before combining**: `vendor/pestphp/pest/src/ArchPresets/` contains each preset's rules. Understanding what each covers prevents duplicate expectations and surprises.
- **Maintain a baseline file**: Use Pest's arch() baseline to suppress known violations. Review and shrink the baseline quarterly. Without a baseline, presets are impractical on existing projects.

# Architecture Guidelines

- **Preset ordering**: Apply the most restrictive preset last. If presets conflict, the last-applied takes precedence for overlapping rules.
- **Placement in CI**: Run architecture presets in the lint/static analysis stage, not the test stage. They fail fast and have no database dependency.
- **Documentation**: Document which presets are in use and what each rule enforces. New team members should run `./vendor/bin/pest --arch` to verify setup.
- **Version management**: When upgrading Pest, review preset changelogs. New versions may add or remove rules.

# Performance Considerations

- Preset evaluation: ~5-20ms per preset (bounded by file scanning).
- Combined presets do not re-scan files — expectations are evaluated in a single pass.
- Security preset is fastest (checks function calls only). Strict preset is slower (parses type declarations).
- Custom expectations combined with presets add negligible overhead.

# Security Considerations

- The `security` preset is the most security-relevant: it blocks debug functions (`dd`, `dump`, `var_dump`, `ray`), dangerous functions (`eval`, `exec`, `system`, `passthru`, `shell_exec`, `sleep`, `exit`), and raw SQL string concatenation patterns.
- Security preset enforcement in CI prevents accidental exposure of sensitive information through debug functions in production.
- Presets cannot catch all security vulnerabilities (SQL injection through Eloquent, XSS through unsanitized output). Use in conjunction with security audit tools and secure coding practices.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Applying strict preset to entire legacy codebase | Want immediate strict typing everywhere | Thousands of violations; test becomes noise | Target new modules only; use relaxed for legacy; gradually migrate |
| Not maintaining exception lists | Legitimate uses exist (ray() in debug code, env() in config) | CI failures on valid code; developers learn to ignore failures | Explicitly ignoring() known legitimate uses with comments explaining why |
| Duplicating preset rules in custom expectations | Not reading preset source to understand coverage | Redundant rules; inconsistent violation messages | Read preset source before adding custom rules |
| Confusing preset strictness levels | Assuming relaxed provides no safety net | Team may not verify what relaxed actually enforces | Document what each preset enforces; verify with team understanding |
| Applying all presets without customization | "More presets = better coverage" | Conflicting rules; unexpected CI failures | Select presets based on project needs; customize with ignoring() |

# Anti-Patterns

- **Blind application of all presets**: Applying `security`, `laravel`, `php`, `strict`, and `relaxed` to the entire project. Instead, select relevant presets and apply with progressive targeting.
- **No baseline/exception mechanism**: Applying presets without `ignoring()` or baseline. Instead, always provide exemption paths for legitimate code.
- **Preset as architecture strategy**: Using only presets and no project-specific rules. Instead, use presets as foundation and add domain-specific expectations.
- **One-size-fits-all strictness**: Using the same preset set for frontend (Vue/Inertia) and backend code. Instead, apply different presets to different namespaces based on their needs.

# Examples

```php
// Security-first preset for all application code
arch()->preset()->security()
    ->ignoring(['App\Debug\RayLogger']);

// Strict preset for new modules only
arch()->preset()->strict()
    ->targeting('App\Modules\NewModule');

// Combined preset stack for new code
arch()
    ->preset()->security()
    ->preset()->laravel()
    ->preset()->strict()
    ->targeting('app/Modules')
    ->ignoring('app/Modules/Legacy');

// Relaxed for legacy code — prevent new violations
arch()->preset()->relaxed()
    ->targeting('app/Legacy');

// Custom rule on top of presets
arch()->preset()->security()
    ->expect('App\Http\Controllers')
    ->not->toUse('App\Repositories');
```

# Related Topics

- **Prerequisites**: Pest arch() fundamentals, PHP type system understanding
- **Related**: Pest arch fundamentals, Static analysis with PHPStan/Larastan, PHP code style with Pint
- **Advanced**: Custom architecture presets, Architecture baseline management, Cross-project preset sharing

# AI Agent Notes

- When setting up a new Laravel project, start with `arch()->preset()->security()->preset()->laravel()`. This catches the most impactful issues without being overly strict.
- For existing projects, first run `./vendor/bin/pest --arch` with a single preset to see the current violation count. Use the output to build `ignoring()` lists. Never apply `strict` to an entire existing codebase.
- The `security` preset is the most universally applicable — even legacy projects benefit from debug function detection. Always include it.
- When combining presets, remember that the `strict` preset includes typing requirements that may not be project-appropriate if targeting older PHP versions.

# Verification

- [ ] Presets are applied with appropriate targeting (not blanket to whole project)
- [ ] Security preset blocks debug functions in production code
- [ ] ignoring() list is documented with reasons for each exemption
- [ ] Preset baseline is committed to repository and reviewed quarterly
- [ ] Team understands what each preset enforces
- [ ] Presets run in CI lint stage before static analysis
- [ ] Custom expectations complement (not duplicate) preset rules
- [ ] Preset version is reviewed on Pest upgrades
