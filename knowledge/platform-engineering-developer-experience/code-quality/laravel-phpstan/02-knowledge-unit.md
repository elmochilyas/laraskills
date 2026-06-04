# Knowledge Unit: Laravel PHPStan

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/laravel-phpstan
- **Maturity:** Mature
- **Related Technologies:** PHPStan, Larastan, PHP, Laravel, Static Analysis

## Executive Summary

Laravel PHPStan (via the Larastan package) brings PHPStan's powerful static analysis to Laravel applications, detecting type errors, undefined methods, missing return types, incorrect facade calls, and hundreds of other potential bugs without running the code. Larastan provides Laravel-specific extensions that understand: facades (resolve `Cache::get()` return types), Eloquent models (recognize relationships, scopes, dynamic properties), `collect()` helper return types, `response()` and `redirect()` helpers, request validation, and Blade view rendering. It ships with a configuration file (`phpstan.neon`) tailored for Laravel's conventions. Larastan integrates with PHPStan's baseline feature (allowing incremental adoption) and supports up to level 9 (strictest analysis). The package is maintained by the Laravel community and is the de facto standard for static analysis in Laravel projects.

## Core Concepts

- **Static Analysis:** Analyzing source code to find errors without executing it—PHPStan examines types, method calls, return values, and control flow to detect potential issues
- **Larastan Extensions:** PHPStan extensions that teach it about Laravel-specific patterns: facades, Eloquent queries, helpers, macros, and service container resolution
- **Analysis Levels:** 0-9 (0 being easiest, 9 being strictest); each level adds more checks (mixed type violations, void returns, strict comparisons)
- **Baseline File:** A file that records current errors as "known issues," allowing teams to start at strict levels and fix errors incrementally over time
- **PHPDoc Support:** PHPStan reads `@param`, `@return`, `@var`, `@property`, `@method` annotations to understand types that aren't natively declared
- **Generics Support:** PHPStan understands `Collection<User>`, `array<string, User>`, and other generic type annotations common in Laravel applications

## Mental Models

- **PHPStan as Automated Code Review:** PHPStan reviews every method call, every return type, every variable assignment—like a senior developer reading every line of code with perfect attention
- **Analysis Levels as Safety Screens:** Level 0 catches obvious errors (undefined variables), level 9 enforces perfect type safety—each level is an additional safety screen
- **Larastan as Laravel Translator:** Larastan translates Laravel's magic (facades, dynamic properties, macro expansions) into types PHPStan can understand

## Internal Mechanics

1. **Rule Processing:** PHPStan parses each PHP file into an AST (via `php-php-parser`), applies rules to each node (function calls, method definitions, property accesses), and collects errors
2. **Type Inference:** PHPStan tracks types through assignments, function returns, and method calls using flow-sensitive type inference—it knows that `$user = User::find(1)` returns `User|null`
3. **Extension Execution:** Larastan extensions hook into PHPStan's extension points: `DynamicStaticMethodReturnTypeExtension` for facade calls, `DynamicMethodReturnTypeExtension` for query builder chains
4. **Facade Resolution:** Larastan maps `Cache::get()` to `Illuminate\Cache\CacheManager::get()` and resolves the return type from the underlying implementation
5. **Model Reflection:** Eloquent model extensions read the model's `$fillable`, `$casts`, relationships, and PHPDoc to determine dynamic property types

## Patterns

- **Incremental Adoption Pattern:** Start at level 1, add types to the codebase, raise the level as type coverage improves. Use baseline to cap existing errors while fixing new code strictly.
- **Baseline-Driven Improvement Pattern:** Run `vendor/bin/phpstan --generate-baseline` to capture current errors, then gradually resolve them while keeping the baseline clean for new issues
- **PHPDoc First Pattern:** Before adding native types to legacy code, add PHPDoc annotations (`@param`, `@return`, `@var`) to help PHPStan understand the types without changing method signatures
- **Model Annotation Pattern:** Add `@property` and `@method` annotations to Eloquent models so PHPStan understands dynamic attributes and relationships: `@property string $email`, `@method BelongsTo|User user()`
- **Collection Generic Pattern:** Use `@return Collection<User>` instead of `@return Collection` so PHPStan knows the item type when iterating or calling collection methods
- **Strict Comparison Pattern:** Use `===` and `!==` for all comparisons; PHPStan level 8+ flags loose comparisons as potential bugs

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Analysis level | Level 1-9 | Level 6 as minimum (catches mixed type issues); level 9 for strict shops |
| Adoption approach | Full codebase vs baseline vs new code only | Baseline for existing code; strict for new code with CI gate |
| Error reporting | Fail CI on any error vs fail on new errors only | Fail on new errors (baseline comparison) with scheduled baseline regeneration |
| PHPDoc vs native types | Docblocks only vs mixed vs native types only | Native types for new code; PHPDoc for legacy code (with migration plan) |

## Tradeoffs

- **Strictness vs Development Speed:** High analysis levels catch more bugs but require more type annotations and slower iteration. Level 6 provides good coverage without excessive ceremony. Level 9 is best for critical systems.
- **False Positives vs Missed Issues:** Strict rules may flag code patterns that are actually correct (false positives). Tuning rules reduces false positives but may also reduce true positive detection. Strike a balance with rule customization.
- **Baseline Use vs Fixing Errors:** A large baseline hides existing issues while preventing new ones. Too much baseline = accumulated technical debt. Set a baseline expiry (e.g., "fix 10% per quarter") and monitor ratio.

## Performance Considerations

- **Analysis Time:** PHPStan analysis of a medium Laravel app (500 PHP files) takes 30-120 seconds. Large apps (2000+ files) may take 5-15 minutes. Use PHPStan's result cache for faster subsequent runs.
- **Memory Usage:** PHPStan is memory-intensive: a medium app needs 256-512MB RAM, large apps need 1-2GB. In CI, ensure sufficient memory allocation.
- **Level Impact on Speed:** Higher analysis levels are slightly slower (more rules to evaluate). The difference between level 1 and level 6 is ~5-10% in runtime.
- **Result Cache:** PHPStan caches analysis results; subsequent runs (with no file changes) are 10-50x faster. Invalidate cache only when PHPStan version or configuration changes.

## Production Considerations

- **CI Integration:** Run `phpstan analyse --memory-limit=1G` in CI with a separate step. Fail the build if new errors appear (compare against baseline). Use `--no-progress` for clean CI logs.
- **Pre-Commit Hook:** Run PHPStan on changed files only via pre-commit hooks for fast feedback. Use tools like `pre-commit` or CaptainHook to gate commits on passing static analysis.
- **Version Locking:** Lock `larastan/larastan` and `phpstan/phpstan` versions to prevent analysis changes from breaking CI. Upgrade on a schedule with dedicated PRs.
- **Extension Loading:** Ensure all required PHPStan extensions are installed: `phpstan/phpstan-doctrine` (if using DBAL), `phpstan/phpstan-phpunit` (for test analysis), `nunomaduro/larastan` (Laravel-specific analysis).

## Common Mistakes

- **Running at too low a level:** Level 1 catches obvious errors but misses type safety issues; teams think they're "using static analysis" but get minimal value
- **Ignoring the baseline:** Generating a baseline once and never reviewing it; the baseline grows stale and hides emerging issues
- **Not understanding Larastan's limitations:** Larastan can't analyze dynamic calls (magic __call, __get), runtime-generated classes, or Blade-compiled templates
- **Forgetting to update PHPStan after Laravel upgrades:** New Laravel features may not be covered by the installed Larastan version; upgrade both together
- **Running without --memory-limit in CI:** PHPStan exhausts the default PHP memory limit (128MB) and crashes; set `--memory-limit=1G` for reliable CI execution

## Failure Modes

- **Out of Memory:** PHP analysis of large codebases exceeds PHP's memory_limit configuration. Mitigate: set `--memory-limit=2G` and increase CI runner memory.
- **Extension Conflict:** Multiple PHPStan extensions conflict (duplicate type extensions, overlapping rules). Mitigate: test extensions together; simplify the extension set.
- **Incorrect Type Resolution:** Larastan misinterprets a dynamic type (e.g., `User::where('active', true)->first()` returns incorrect type). Mitigate: add explicit type annotations for ambiguous chains.
- **Stale Result Cache:** PHPStan's result cache doesn't detect changes in `.blade.php` files, config files, or runtime-generated code. Mitigate: run `phpstan clear-result-cache` when analysis seems stale.

## Ecosystem Usage

- **Laravel Ecosystem:** Larastan is the standard static analysis tool for Laravel, used by most open-source Laravel packages and recommended in the Laravel documentation
- **PHPStan Ecosystem:** Larastan is a collection of PHPStan extensions; it participates in PHPStan's extension ecosystem and works with other PHPStan extensions
- **Laravel Shift:** Shift includes PHPStan analysis as part of its upgrade service to detect code issues after version migration
- **Laravel Pint:** Pint handles code style (cosmetic), PHPStan handles static analysis (correctness)—they're complementary tools in the quality toolchain
- **Laravel Rector:** Rector handles automated refactoring; running Rector before PHPStan often reduces PHPStan errors by fixing deprecated patterns automatically

## Related Knowledge Units

- phpstan-config-for-laravel
- phpstan-neon-configuration
- phpstan-baseline-patterns
- static-analysis-ci-integration
- phpstan-in-ci

## Research Notes

- Larastan was originally created by Can Vural and now maintained by Nuno Maduro (Laravel core team member), ensuring alignment with Laravel's development
- Larastan v2.x (for Laravel 10+/PHP 8.1+) rewrote many extensions to use PHP 8.1 features (enums, readonly properties, intersection types)
- Larastan v3.x adds support for PHPStan 2.0 features including improved generics, array shapes, and template types
- PHPStan's result cache is stored in `tmp/phpstan` by default; exclude this directory from version control and CI artifact caching
