# 04-Standardized Knowledge: Laravel Pint

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | laravel-pint |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | pint-configuration, pint-presets, pint-ci-integration |
| **Framework/Language** | Laravel Pint, PHP-CS-Fixer, PHP |

## Overview

Laravel Pint is an opinionated, zero-configuration code style fixer for Laravel, built on PHP-CS-Fixer. It enforces PSR-12 and Laravel-specific standards (import ordering, brace style, spacing). Invoked via `./vendor/bin/pint`, it auto-fixes issues or checks with `--test`. Configuration via `pint.json` allows preset selection (`laravel`, `psr12`, `per`, `symfony`), custom rules, and exclusions. Pint is the official code style tool for Laravel.

## Core Concepts

- **Zero Configuration**: works out of the box with Laravel conventions
- **Presets**: `laravel` (default), `psr12`, `per`, `symfony`
- **Auto-Fixing**: modifies files in place; `--test` for dry-run CI mode
- **File Filtering**: `--filter=file.php` or `pint app/Models` for targeted formatting
- **Dirty File Detection**: `--dirty` processes only Git-tracked uncommitted changes
- **Configuration**: `pint.json` in project root overrides presets

## When to Use

- Every Laravel project for consistent code style
- CI pipeline as a fast pre-check before slower static analysis
- Pre-commit formatting to catch style issues before code review
- Mass codebase formatting when adopting style standards

## When NOT to Use

- Projects using non-PHP-CS-Fixer tools for formatting
- Non-Laravel PHP projects (use PHP-CS-Fixer directly for more flexibility)
- When zero formatting changes are desired (Pint always changes some style)

## Best Practices (WHY)

- **Use `--test` in CI**: fail the build if style issues exist; auto-fix, then test
- **Use `--dirty` locally**: format only changed files to avoid massive formatting diffs
- **Keep config minimal**: start with preset defaults; add 3-5 custom rules max
- **Commit pint.json**: all team members and CI must use the same configuration
- **Initial formatting commit**: run `pint` on full codebase in one isolated commit

## Architecture Guidelines

- Exclude generated code: `bootstrap/cache`, `storage`, `vendor` (included by default)
- Run Pint before PHPStan in CI (fix style first, then analyze)
- For monorepos, use nested `pint.json` per package with appropriate presets
- Lock Pint version in `composer.json` to prevent unexpected rule changes

## Performance Considerations

- Formatting speed: ~100-200 files/second; medium app (500 files) in 2-5 seconds
- Memory: 50-100MB during formatting due to token-based parsing
- CI impact: 3-10 seconds per run — acceptable for CI pipelines

## Security Considerations

- Pint modifies PHP files — always review changes before committing
- Generated PHP files (compiled views, cached configs) should be excluded
- Formatting changes are cosmetic, not security-related

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Not using --test in CI | Auto-fixing without failing on issues | Wrong CI config | Style issues pass CI | Always use pint --test |
| Using --test without auto-fix | CI fails but devs must manually fix | Missing auto-fix step | Extra loop | Run pint (fix) then --test |
| No --dirty for local work | Formatting entire project | Not knowing flag | Massive diffs | Use --dirty for feature work |
| Too many custom rules | 50+ rules overriding preset | Strong opinions | Defeats Pint's simplicity | Start with preset defaults |
| Config not in VCS | Inconsistent across team | Forgetting commit | Formatting diverges | Always commit pint.json |

## Anti-Patterns

- **Pint in Production**: running Pint on production servers (unnecessary)
- **No Configuration**: never customizing any rules when team strongly disagrees with defaults
- **Ignoring Vendor Updates**: not reviewing preset changes when Pint version is upgraded
- **Blind Auto-Fix**: applying Pint changes without reviewing the diff

## Examples

```json
{
    "preset": "laravel",
    "rules": {
        "single_quote": true,
        "trailing_comma_in_multiline": true,
        "no_unused_imports": true
    },
    "exclude": [
        "app/Legacy"
    ]
}
```

## Related Topics

- pint-configuration — pint.json configuration reference
- pint-presets — preset selection and comparison
- pint-ci-integration — CI pipeline integration
- custom-pint-rules — custom rule definitions

## AI Agent Notes

- Pint uses `php-cs-fixer/shim` under the hood, providing full PHP-CS-Fixer rule support
- `--dirty` uses `git diff --name-only` to detect modified files
- Pint was introduced in Laravel 10.x and is the official code style tool
- For non-Laravel projects, prefer raw PHP-CS-Fixer over Pint

## Verification

- [ ] `pint --test` passes without errors
- [ ] `pint.json` committed to version control
- [ ] Generated/excluded directories not formatted
- [ ] CI has pint --test as a gate
- [ ] Team understands preset and custom rules
- [ ] Initial formatting commit exists in Git history
- [ ] Pint version locked in composer.json
