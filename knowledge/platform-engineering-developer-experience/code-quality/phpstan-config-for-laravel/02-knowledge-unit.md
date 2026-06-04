# Knowledge Unit: PHPStan Config for Laravel

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/phpstan-config-for-laravel
- **Maturity:** Mature
- **Related Technologies:** PHPStan, Larastan, PHP, Laravel, NEON

## Executive Summary

PHPStan configuration for Laravel applications is defined in `phpstan.neon` using Larastan's rules and extensions. The configuration specifies: analysis level (0-9), paths to scan, excluded paths (vendor, storage, compiled views), Larastan-specific configuration (database type, model directory), custom rules, baseline file location, memory limits, and bootstrap files. Larastan provides a default configuration that handles most Laravel patterns out of the box, but production-grade setups require customizations: level selection based on team maturity, path exclusions for generated files, custom stub files for facades and macros, and report-only rules for patterns that should be flagged but not block CI. The config file is committed to version control and shared across the team.

## Core Concepts

- **phpstan.neon:** The main configuration file in NEON format (PHPStan's native config format, similar to YAML with PHP-specific features)
- **Level:** Integer (0-9) controlling analysis strictness; level 1 is basic (undefined variables), level 9 is max (strict types, generics, never returns)
- **Paths/ExcludedPaths:** Directories to scan and directories to exclude from scanning
- **Bootstrap Files:** PHP files executed before analysis to define constants, functions, or initialize services that PHPStan needs to understand
- **Stub Files:** PHPDoc-stub files that describe types for classes PHPStan can't analyze (vendor classes without type information, facades)
- **Parameters:** Larastan-specific settings: `databaseMigrations` (analyze schema), `customRulesImplemented` (check rule implementations), `reportUnmatchedIgnoredErrors` (validate baseline)
- **Services:** PHPStan extension registration; Larastan extensions, custom extensions, and third-party extensions are registered here

## Mental Models

## Internal Mechanics

## Patterns

- **Level Escalation Pattern:** Set `level: 6` as the minimum; increase to 9 for critical modules (payment, auth, billing). Use separate configs for different modules if needed.
- **Strict Module, Relaxed Legacy Pattern:** Core modules (app/Models, app/Services) run at level 9; legacy modules (app/Legacy) run at level 3. Use multiple `phpstan.neon` configs with `includes`.
- **Bootstrap File Pattern:** Create `phpstan-bootstrap.php` for constants, global functions, and class aliases that PHPStan needs to understand legacy code patterns.
- **Stub Override Pattern:** For third-party packages without type information, create stub files in `phpstan/` directory describing the package's type contracts.
- **Environment-Aware Config Pattern:** Use separate configs for local (strict, longer timeout) and CI (consistent level, memory limit) environments with `includes`.
- **Database-Aware Analysis Pattern:** Configure `databaseMigrations: true` to analyze migration files for schema changes; enable `databaseSchema` for query analysis.
- **Baseline Integration Pattern:** `parameters: > baseline: phpstan-baseline.neon` links the baseline file for incremental adoption at strict levels.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Analysis level | 1-9 | Level 6 for new projects; level 9 for critical systems; baseline for existing codebases |
| Configuration format | neon vs yaml vs php | NEON (native PHPStan format, most features) |
| Bootstrap approach | Single bootstrap file vs per-directory bootstrap | Single bootstrap for most projects; per-directory for complex autoloading setups |
| Custom rules implementation | Inline neon rules vs PHP rule classes | Neon rules for simple patterns; PHP rule classes for complex analysis |
| Extension distribution | Composer package vs project file | Composer for reusable extensions; project files for project-specific rules |

## Tradeoffs

- **Strict Level vs Adoption Cost:** Higher analysis levels catch more bugs but require more type annotations, PHPDocs, and code structure changes. Level 6 provides a good balance of value vs effort for most Laravel projects.
- **Inclusive vs Exclusive Path Configuration:** Scanning all paths is thorough but slow; excluding non-critical paths (storage, compiled views) improves speed but may miss issues. Prefer inclusion (scan what matters) over exclusion (skip what doesn't).
- **Global Stubs vs Project Stubs:** Global stubs (in `~/.phpstan/`) affect all projects but are invisible to the team. Project stubs (in `phpstan/`) are version-controlled and shared. Use project stubs for team consistency.

## Performance Considerations

- **Path Exclusion Impact:** Excluding directories from analysis reduces scan time proportionally. Generate a list of excluded paths in the config: `vendor/`, `storage/`, `bootstrap/cache/`, `node_modules/`, `public/`.
- **Memory Limit Configuration:** Set `memoryLimit: 1024M` in config to prevent PHPStan from exhausting memory. Larger projects may need `2G` or `4G`.
- **Parallel Processing:** Enable parallel processing: `parallel: > maximumNumberOfProcesses: 4`. Adjust based on CI runner CPU cores.
- **Bootstrap File Overhead:** Complex bootstrap files (loading many services, constants, or class aliases) add 1-5 seconds to analysis startup. Keep bootstrap files minimal.

## Production Considerations

- **CI Configuration:** In CI, use a dedicated config or CLI flags: `--memory-limit=1G --no-progress --error-format=github` for GitHub Actions annotations
- **Version Locking:** Lock `phpstan/phpstan` and `larastan/larastan` versions in `composer.json`. Analysis behavior changes between versions; unexpected upgrades can break CI.
- **Environment-Specific Config:** Use `phpstan.neon` for local development (faster, less strict) and `phpstan.ci.neon` for CI (consistent level, full scan). The CI config should be the canonical standard.
- **Local vs CI Differences:** Ensure local and CI configs don't diverge significantly. CI config should include all rules from local config plus any CI-specific settings.
- **Bootstrap File Maintenance:** The bootstrap file must be updated when the application's autoloading, global state, or environment configuration changes.

## Common Mistakes

- **Not excluding vendor and storage:** PHPStan scans vendor and storage directories by default, causing long analysis times and false positives from third-party code
- **Setting level too low:** `level: 1` catches obvious errors but provides minimal value; teams think they're "doing static analysis" but miss most type-related bugs
- **Missing Larastan-specific configuration:** Not setting `databaseType`, `modelDirectory`, or other Larastan parameters; analysis misses Laravel-specific patterns
- **Not configuring memory limit:** PHPStan crashes with "Allowed memory size exhausted" on large projects; always set an explicit memory limit
- **Forgetting to exclude test files from strict rules:** Tests use different patterns (mocks, facades without resolution) that trigger errors at high levels; use a separate config or per-directory level for tests

## Failure Modes

- **Memory Exhaustion:** Analysis crashes with memory limit error. Mitigate: increase `memoryLimit`, exclude unnecessary paths, enable parallel processing.
- **Config Format Error:** NEON syntax error in `phpstan.neon` causes PHPStan to fail on startup. Mitigate: validate NEON syntax with `phpstan --configuration` check.
- **Extension Loading Failure:** A registered PHPStan extension class is not autoloadable. Mitigate: verify extension package installation; check autoloading configuration.
- **Bootstrap File Error:** The bootstrap file has a fatal error (undefined function, missing file). Mitigate: test bootstrap file with `php -l phpstan-bootstrap.php`.
- **Stale Config After Laravel Upgrade:** The config references Laravel features or paths that changed in a version upgrade. Mitigate: review config after major Laravel upgrades.

## Ecosystem Usage

- **Larastan:** The primary use case; Larastan provides the Laravel-specific extensions referenced in `phpstan.neon`
- **PHPStan Extensions:** `phpstan/phpstan-phpunit` for test directory analysis, `phpstan/phpstan-doctrine` for DBAL usage, `phpstan/phpstan-symfony` for Symfony-specific patterns
- **Community Configurations:** Open-source Laravel projects often share their `phpstan.neon` as examples of well-configured Laravel static analysis
- **Laravel Shift:** Shift generates PHPStan-friendly code during upgrades; the generated code assumes PHPStan with Larastan is configured

## Related Knowledge Units

- phpstan-neon-configuration
- phpstan-baseline-patterns
- laravel-phpstan
- static-analysis-ci-integration

## Research Notes

- Larastan v2.x changed its configuration format; projects upgrading from v1.x need to update `phpstan.neon` parameter names and extension registration
- NEON is PHPStan's native configuration format, offering features not available in YAML: entity references, service definitions, and PHP constant resolution
- PHPStan level mapping: 0 (basic checks), 1 (undefined variables), 2 (unknown classes), 3 (return types), 4 (dead code, unused params), 5 (uninitialized properties), 6 (mixed type issues), 7 (nullable types), 8 (strict comparisons), 9 (strictest, everything typed)
- The `scanFiles` and `scanDirectories` parameters in neon allow PHPStan to analyze files outside the project's autoloading configuration
