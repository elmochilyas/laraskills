# Skill: Configure Rector for Automated Laravel Refactoring

## Purpose
Install and configure Rector for automated PHP code refactoring including Laravel version upgrades, PHP modernization, and custom code migrations.

## When To Use
- Laravel version upgrades (automates 80%+ of upgrade changes)
- PHP modernization (type hints, match expressions, readonly properties)
- Custom framework migrations (old patterns → new conventions)
- Scheduled code quality maintenance (monthly automated refactoring)

## When NOT To Use
- Style-only changes (use Pint instead)
- Critical codebases without thorough testing after Rector
- When diff review bandwidth is limited (each rule set needs review)
- Projects without automated test coverage (Rector can change behavior)

## Prerequisites
- `rector/rector` installed as a dev dependency
- `rectorphp/rector-laravel` for Laravel-specific rules
- `rector.php` configuration file at project root
- Comprehensive test suite to verify Rector's changes

## Inputs
- `rector.php` — configuration defining sets, rules, paths, skip patterns
- Application source code
- Test suite (run after Rector to verify correctness)

## Workflow

1. **Install Dependencies:** Run `composer require --dev rector/rector rectorphp/rector-laravel`.

2. **Create Configuration:** Create `rector.php` at project root defining `rector-laravel` sets (e.g., `LaravelLevelSetList::UP_TO_LARAVEL_110`), paths to scan (`__DIR__ . '/app'`), and skip patterns.

3. **Always Dry-Run First:** Run `vendor/bin/rector process --dry-run` to preview changes without modifying files. Review the diff carefully.

4. **Apply One Set at a Time:** For upgrades, apply one version set at a time (L10→L11 first, then L11→L12). Incremental diffs are reviewable; applying all sets at once produces overwhelming diffs.

5. **Run Tests After Rector:** Always run the full test suite after applying Rector changes. Rector can produce semantically incorrect code in 5-10% of cases.

6. **Exclude Vendor and Generated Files:** In `rector.php`, use `$rectorConfig->skip()` to exclude `vendor/`, `storage/`, and `bootstrap/cache/`.

7. **Lock Rector Version:** Pin `"rector/rector"` version in `composer.json` to prevent unexpected rule behavior changes.

8. **Schedule as Monthly CI Task:** For ongoing code quality, schedule Rector as a monthly CI task that creates a PR with automated refactoring changes.

## Validation Checklist

- [ ] `rector.php` configured with appropriate sets and paths
- [ ] `--dry-run` reviewed before applying changes
- [ ] Test suite passes after Rector changes
- [ ] Incremental approach: one set at a time
- [ ] Vendor and generated files excluded
- [ ] Rector version pinned in `composer.json`
- [ ] Upgrade changes in feature branch, not main

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Applying all sets at once | Overwhelming diff; hard to review |
| Not testing after Rector | Semantic errors introduced unnoticed |
| Running on vendor files | Exclude `vendor/` in config |
| No dry-run preview | Unintended changes applied directly |

## Decision Points

- **Use for Laravel version upgrades** — Automates 80%+ of upgrade changes
- **Use for PHP modernization** — Type hints, match expressions, readonly properties
- **Use Pint instead** for style-only changes (Rector is for structural refactoring)
- **Skip for critical codebases** without thorough test coverage

## Performance/Security Considerations

- **Analysis time:** 2-5 minutes for medium Laravel projects; use `--parallel` for large codebases
- **Run before PHPStan:** Fixes deprecated patterns that PHPStan would flag
- **Never run on production code directly:** Always run in feature branch with PR review

## Related Rules

- RECTOR-RULE-001: Always use --dry-run first
- RECTOR-RULE-002: Apply one rule set at a time
- RECTOR-RULE-003: Run tests after Rector
- RECTOR-RULE-004: Lock Rector version
- RECTOR-RULE-005: Exclude vendor

## Related Skills

- Apply Rector Rules for Laravel Upgrades
- Set Up Laravel PHPStan with Larastan
- Configure Laravel Pint for Code Style

## Success Criteria

- Rector successfully automates 80%+ of Laravel upgrade changes
- Code is modernized with proper type hints, match expressions, and current patterns
- Test suite passes after all Rector changes
- Team reviews incremental diffs via `--dry-run` before applying
