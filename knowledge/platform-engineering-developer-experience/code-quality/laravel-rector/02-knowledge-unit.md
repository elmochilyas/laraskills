# Knowledge Unit: Laravel Rector

## Metadata
- **Subdomain:** Code Quality & Static Analysis
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-quality-static-analysis/laravel-rector
- **Maturity:** Maturing
- **Related Technologies:** Rector, Laravel, PHP, Automated Refactoring, PHP-Parser

## Executive Summary

Rector is an automated refactoring tool for PHP that applies AST-based transformations to upgrade and improve code. For Laravel applications, Rector provides sets of rules that automate: Laravel version upgrades (migrating deprecated methods, renamed classes, changed interfaces), code modernization (type declarations, match expressions, readonly properties), custom framework migrations (old patterns to new conventions), and code quality improvements. Rector operates on PHP files' Abstract Syntax Trees (AST), making structural changes (method renaming, class replacement, argument reordering) that are impossible with text-based tools. Laravel-specific Rector rules are maintained primarily by the community in `rectorphp/rector-laravel`. Rector can be run selectively (specific rules, specific directories), making it safe for incremental adoption on existing codebases.

## Core Concepts

- **Rule:** A single transformation: `RenameMethodRector`, `AddReturnTypeDeclarationRector`, `ChangeMethodVisibilityRector`. Each rule targets a specific code pattern.
- **Set:** A collection of rules grouped by purpose: `SetList::LARAVEL_100` (Laravel 10 upgrade rules), `SetList::PHP_81` (PHP 8.1 features), `SetList::CODE_QUALITY`
- **AST Transformation:** Rector parses PHP into an AST, manipulates the tree (add nodes, remove nodes, change properties), and dumps the modified tree back to PHP code
- **Configuration:** `rector.php` file defining sets, rules, paths, autoload paths, and skip/only patterns
- **Process Mode:** `--dry-run` (show diff without changes) vs `--dry-run` (actual file modification)
- **PHP-Parser:** The underlying library (by Nikita Popov) that provides the PHP parser and AST printer used by Rector

## Mental Models

- **Rector as Automatic Refactoring Engine:** Like an IDE refactoring on steroids—Rector applies complex, multi-file transformations across the entire codebase in seconds
- **Rector as Upgrade Automation:** Instead of manually reading upgrade guides and searching for deprecated usage, Rector applies all required changes automatically
- **Rector as Deprecation Patrol:** Scheduled Rector runs catch deprecated patterns before they become breaking changes, like a security scanner but for code freshness

## Internal Mechanics

1. **File Discovery:** Rector scans configured paths for `.php` files, respecting skip/exclude patterns
2. **PHP Parsing:** Each file is parsed into an AST using `nikic/php-parser` (PHP 8.4 compatible); Rector maintains a `PhpParser\Node` tree for modification
3. **Node Traversal:** Rector walks the AST applying registered rules; each rule implements a visitor pattern that visits specific node types (MethodCall, ClassMethod, Property, etc.)
4. **Node Mutation:** Rules modify the AST: replacing nodes (e.g., `OldClass` → `NewClass`), adding nodes (e.g., `: void` return type), or removing nodes (e.g., deleted method calls)
5. **Pretty Printing:** After all rules are applied, the modified AST is printed back to PHP source code using PHP-Parser's PrettyPrinter
6. **Diff Generation:** Before overwriting, Rector computes the diff between original and modified code; in dry-run mode, it displays the diff; in apply mode, it writes the file

## Patterns

- **Incremental Upgrade Pattern:** Apply one Laravel version upgrade at a time (8→9, 9→10, 10→11) with Rector, testing between each upgrade to isolate issues
- **Dry-Run First Pattern:** Always run `vendor/bin/rector process --dry-run` first to review changes before applying; use `--dry-run --xdebug` for detailed output
- **Custom Rule Pattern:** Create project-specific Rector rules for migrating internal conventions: `RenameServiceMethodsRector`, `ReplaceCustomHelperWithFacadeRector`
- **Scheduled Refactoring Pattern:** Schedule Rector to run monthly (e.g., as a GitHub Action) with PR creation to continuously modernize the codebase
- **Namespace Migration Pattern:** Use Rector to rename namespaces when restructuring modules: `App\OldModule` → `App\Modules\NewModule`
- **Type Declaration Pattern:** Use Rector's type declaration set to add missing return types, parameter types, and property types based on inferred usage

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Rule source | Standard sets vs community sets vs custom rules | Standard sets for upgrades; community for Laravel; custom for project-specific |
| Application mode | Apply all at once vs rule-by-rule vs directory-by-directory | Directory-by-directory for large projects; all-at-once for small projects |
| Verification | Manual diff review vs automated tests | Automated tests + manual diff review for critical changes |
| Frequency | One-time upgrade vs continuous (scheduled) | Continuous (monthly) for modernization; on-demand for version upgrades |

## Tradeoffs

- **Rector vs Manual Refactoring:** Rector applies changes faster and more consistently than manual refactoring but can miss edge cases or produce incorrect transformations. Manual refactoring is safer for complex changes but much slower.
- **Rector vs Laravel Shift:** Rector is open-source and free but requires configuration and rule management. Shift is a paid service with curated, tested rules for Laravel version upgrades. Rector is better for continuous modernization; Shift is better for one-time version jumps.
- **Aggressive vs Conservative Rules:** Aggressive rule sets apply more transformations (modernize everything) but produce larger diffs and more potential issues. Conservative rule sets target specific, safe transformations. Start conservative and add rules as confidence grows.

## Performance Considerations

- **Analysis Time:** Rector processes ~50-100 files/second on modern hardware. A medium Laravel app (500 files) takes 5-10 seconds. A large app (2000+ files) takes 20-60 seconds.
- **Memory Usage:** Rector holds the entire AST for each processed file in memory. For large files (5000+ lines), memory usage can spike to 100-200MB. Process large files individually if memory is constrained.
- **Parallel Processing:** Rector supports parallel processing (`--parallel` flag) for multi-core systems, reducing analysis time by 2-4x on large codebases.
- **Caching:** Rector caches processed files; subsequent runs are faster. Clear cache with `vendor/bin/rector clear-cache` when configuration changes.

## Production Considerations

- **Version Locking:** Lock `rector/rector` and `rectorphp/rector-laravel` versions in `composer.json` to prevent unexpected rule behavior changes.
- **CI Integration:** Run Rector in CI with `--dry-run` to detect code that should be refactored but hasn't been. Fail CI if Rector would make changes, enforcing modernization.
- **Git Workflow:** Run Rector in a dedicated branch, review changes in a PR, and merge. Never apply Rector changes directly on the main branch.
- **Testing After Rector:** Always run the full test suite after Rector application. Rector can change behavior in edge cases (e.g., changing `count($array)` to `$array->count()` may behave differently for non-array types).
- **Incremental Adoption:** For existing codebases, apply Rector incrementally: one rule set at a time, one directory at a time. This makes reviewing changes manageable.

## Common Mistakes

- **Applying too many rules at once:** Running 20+ rule sets simultaneously creates massive diffs that are impossible to review effectively; apply one set at a time
- **Not using --dry-run first:** Running Rector without `--dry-run` applies changes directly; if the result is wrong, you must revert and re-run
- **Ignoring Rector's configuration for Laravel:** Not including the Laravel-specific configuration (`rector-laravel` package); Rector applies generic PHP rules but misses Laravel-specific transformations
- **Running Rector on vendor files:** Rector processes the entire project including vendor by default; exclude `vendor/` explicitly in `rector.php`
- **Not running tests after Rector:** Assuming Rector's transformations are always correct; Rector can produce syntactically valid PHP that's semantically wrong

## Failure Modes

- **Incorrect Transformation:** Rector applies a rule that produces incorrect code (e.g., wrong import, incorrect method signature). Mitigate: always use `--dry-run` and review diffs for critical transformations.
- **AST Parse Error:** Rector fails to parse a PHP file due to syntax errors or unsupported PHP features. Mitigate: fix syntax errors first; check Rector's PHP version support.
- **Rule Conflict:** Two rules attempt to modify the same code portion in incompatible ways. Mitigate: apply rule sets separately to isolate conflicts.
- **Stale Cache Leading to Incorrect Analysis:** Rector's cache doesn't detect all file changes, leading to stale analysis. Mitigate: clear Rector cache before critical runs.

## Ecosystem Usage

- **Laravel Upgrades:** Rector's Laravel rulesets automate the majority of code changes needed for version upgrades (8→9, 9→10, 10→11)
- **PHP Modernization:** Rector is widely used to modernize PHP codebases: adding type hints, replacing deprecated constructs, adopting new PHP features (match expressions, readonly properties, enums)
- **Laravel Shift:** Shift uses Rector-like patterns for its automated upgrade service; Rector can replicate some but not all Shift transformations
- **Open Source Laravel Packages:** Many packages use Rector in CI to ensure compatibility with multiple Laravel versions and PHP versions

## Related Knowledge Units

- rector-rules-laravel-upgrades
- laravel-shift
- phpstan-baseline-patterns
- static-analysis-ci-integration

## Research Notes

- Rector was created by Tomas Votruba and is the dominant automated refactoring tool in the PHP ecosystem
- `rectorphp/rector-laravel` is maintained by the community (not the Rector core team); rule coverage varies and may lag behind Laravel releases
- Rector 2.x introduced significant performance improvements, rule set restructuring, and better parallel processing
- Rector's Laravel rules are less comprehensive than Shift's curated rules but cover the most common upgrade paths (helper functions, facades, config changes)
