# Knowledge Unit: Laravel Pint

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/laravel-pint
- **Maturity:** Mature
- **Related Technologies:** Laravel Pint, PHP-CS-Fixer, PHP, Coding Standards

## Executive Summary

Laravel Pint is an opinionated, zero-configuration code style fixer for Laravel applications, built on top of PHP-CS-Fixer. It enforces PSR-12 and Laravel-specific coding standards (import ordering, brace style, spacing, naming conventions) with minimal setup. Pint is installed as a Composer dev dependency and invoked via `./vendor/bin/pint` (or `php artisan pint` in Laravel 11+). It can fix style issues automatically (`pint`) or check without modifying (`pint --test`). Configuration via `pint.json` allows preset selection (`laravel`, `psr12`, `per`, `symfony`), custom rule overrides, and file/directory exclusions. Pint is designed for Laravel developers who want consistent code style without learning PHP-CS-Fixer's complex configuration. It's officially maintained by the Laravel team and is the recommended code style tool for Laravel projects.

## Core Concepts

- **Zero Configuration:** `./vendor/bin/pint` works out of the box with Laravel conventions—no configuration file required for standard Laravel projects
- **Presets:** Predefined rule sets: `laravel` (default, follows Laravel's coding style), `psr12` (PSR-12 standard), `per` (PER coding style), `symfony` (Symfony conventions)
- **Auto-Fixing:** Pint modifies files in place to fix style issues; use `--test` flag for dry-run (CI mode, exit code 1 if files would change)
- **File Filtering:** `--filter=filename.php` targets specific files; `pint app/Models` targets specific directories
- **Configurable Rules:** `pint.json` in the project root overrides preset defaults with custom PHP-CS-Fixer rules
- **Dirty File Detection:** `pint --dirty` only processes files with uncommitted changes (Git-tracked files modified since the last commit)

## Mental Models

- **Pint as Automatic Formatter:** Like Prettier for JavaScript or `gofmt` for Go—Pint formats PHP code automatically, eliminating style debates in code reviews
- **Pint as Style Enforcement Layer:** Pint enforces the "how" (formatting) while code review focuses on the "what" (logic, architecture)—separating concerns in the development workflow
- **Pint as Laravel's Style Guardian:** Pin maintains the Laravel ecosystem's visual consistency—code written by any team looks familiar to any Laravel developer

## Internal Mechanics

1. **Configuration Loading:** Pint reads `pint.json` (if present) to determine preset and custom rules; falls back to `laravel` preset with no custom rules
2. **File Discovery:** Pint scans the specified directory (default: project root) for `.php` files, respecting `.gitignore` patterns and `exclude` directives in `pint.json`
3. **PHP-CS-Fixer Engine:** Each discovered file is passed to the PHP-CS-Fixer engine, which parses the file into tokens using `PhpCsFixer\Tokenizer\Tokens`
4. **Rule Application:** PHP-CS-Fixer applies each configured rule sequentially: ordered_imports, braces, single_quote, trailing_comma, etc.
5. **Diff Generation:** Rules generate a diff between the original and fixed file; files are only overwritten if changes are detected
6. **Output Formatting:** Pint formats results (changed files, elapsed time, and per-rule details with `-v` flag)

## Patterns

- **Pre-Commit Formatting Pattern:** Run `pint` before each commit (via pre-commit hook or manually) to ensure committed code follows style guidelines
- **CI Gate Pattern:** Run `pint --test` in CI as a mandatory check; fail the build if style issues exist. Run `pint` (auto-fix) before the test step to avoid style-related noise
- **Dirty File Pattern:** Use `pint --dirty` for quick formatting of only the files changed in the current branch, avoiding full project formatting
- **Configuration File Pattern:** Check `pint.json` into version control so all team members use consistent rules. Keep the configuration minimal—add rules only when needed
- **Targeted Formatting Pattern:** Format specific directories (`pint app/Modules`) or files (`pint --filter=UserController.php`) for large projects where full project formatting would create too many diffs

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Preset | Laravel vs PSR-12 vs PER vs Symfony | Laravel (default)—matches Laravel's own coding style |
| Configuration | No config (defaults) vs pint.json with presets vs full rule set | No config for Laravel projects; pint.json for custom rules |
| Auto-fix vs test | `pint` (fix) vs `pint --test` (CI) | Fix locally; test in CI |
| File scope | Full project vs targeted directories | Full project for adoption; targeted for post-addition maintenance |

## Tradeoffs

- **Auto-Fixing vs Code Review Discussion:** Auto-fixing eliminates style debates but can introduce formatting changes that obscure the actual code changes in diffs. To mitigate, format the full project in a single initial commit (or use `--dirty` for selective formatting).
- **Preset vs Custom Rules:** Using the default preset requires no configuration but may not match team preferences. Custom rules match team style but require maintenance as Pint/PHP-CS-Fixer versions change.
- **Pint vs Raw PHP-CS-Fixer:** Pint is simpler (zero config, Laravel-optimized presets) but less configurable than raw PHP-CS-Fixer. For complex custom rulesets, raw PHP-CS-Fixer offers more flexibility.

## Performance Considerations

- **Formatting Speed:** Pint processes ~100-200 files/second on modern hardware. A medium Laravel app (500 files) formats in 2-5 seconds.
- **Incremental Runs:** After the first full run, subsequent runs are faster because most files are already formatted and PHP-CS-Fixer skips them quickly.
- **Memory Usage:** Pint uses 50-100MB of RAM during formatting. This is higher than typical PHP CLI tools due to token-based parsing.
- **CI Impact:** Formatting adds 3-10 seconds to CI per run. This is acceptable for CI pipelines but should be considered in overall CI timing.

## Production Considerations

- **CI Pipeline:** Run `pint --test` as a fast pre-check before slower steps (PHPStan, PHPUnit). If style fails, fix and re-push without waiting for the full pipeline.
- **Pre-Commit Hook:** Integrate Pint into pre-commit hooks (via CaptainHook or similar) to catch style issues before they reach CI.
- **Editor Integration:** Configure editors/IDEs to run Pint on save: PhpStorm file watcher, VS Code extension, or manual `pint` invocation.
- **Initial Formatting Commit:** When adopting Pint on an existing project, run `pint` on the entire codebase in a single commit to establish the baseline.

## Common Mistakes

- **Running pint --test in CI without auto-fixing:** CI fails on style issues, developer sees the failure, runs pint locally, pushes again—extra loop. Instead, run pint (auto-fix) as a CI step before tests.
- **Not using --test in CI:** Running `pint` (auto-fix) in CI modifies files but doesn't fail on issues; the CI task succeeds even though style problems exist. Always use `pint --test` for CI gates.
- **Ignoring the --dirty flag:** Running `pint` on the full project creates large diffs that mix formatting changes with logic changes. Use `--dirty` for focused formatting.
- **Overriding too many preset rules:** Defining 50+ custom rules in pint.json defeats Pint's simplicity advantage. Start with preset defaults and add custom rules judiciously.
- **Configuration not in version control:** Forgetting to commit `pint.json` causes inconsistent behavior across team members and CI environments.

## Failure Modes

- **Pint Changes Break Tests:** In rare cases, Pint's formatting changes can alter behavior (e.g., removing trailing commas that change function call behavior in older PHP versions). Mitigate: always run tests after formatting.
- **Pint Hangs on Large Files:** Extremely large PHP files (5000+ lines) may cause Pint to hang or exceed memory due to tokenization overhead. Mitigate: exclude generated files and very large controllers.
- **Pint --dirty on Untracked Files:** `--dirty` only detects Git-tracked modified files; new untracked files are not formatted. Mitigate: run `pint` on new files before committing.
- **Pint and Generated File Conflicts:** Pint formats generated PHP files (compiled views, cached configs, IDE helper files), which are regenerated. Mitigate: exclude generated directories (bootstrap/cache, storage, vendor).

## Ecosystem Usage

- **Laravel Framework:** Pint is the official code style tool for Laravel; Laravel itself uses Pint for its own code formatting
- **Laravel Packages:** Most first-party (Nova, Telescope, Horizon, Pulse, Sail) and third-party (Spatie packages) use Pint for consistent formatting
- **Laravel Teams:** Development teams adopt Pint as the universal code style tool across all Laravel projects, ensuring consistent code regardless of which developer wrote it
- **Laravel Forge:** Forge's deployment scripts can optionally run Pint during deployment to format freshly deployed code

## Related Knowledge Units

- pint-configuration
- pint-presets
- pint-ci-integration
- custom-pint-rules
- pre-commit-hooks-code-quality

## Research Notes

- Laravel Pint was introduced in Laravel 10.x, replacing the previous `laravel/framework` built-in CS fixer integration
- Pint uses `php-cs-fixer/shim` under the hood (a standalone build of PHP-CS-Fixer), providing full PHP-CS-Fixer rule support without the Composer dependency conflicts
- Pint v1.x (early versions) had limited rule customization; Pint 2+ (Laravel 11+) added full PHP-CS-Fixer rule configuration support
- The `--dirty` flag uses `git diff --name-only` to detect modified files, respecting both staged and unstaged changes
