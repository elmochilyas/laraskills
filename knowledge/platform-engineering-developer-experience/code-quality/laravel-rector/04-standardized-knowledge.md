# 04-Standardized Knowledge: Laravel Rector

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-quality-static-analysis |
| **Knowledge Unit** | laravel-rector |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Maturing |
| **Difficulty** | Foundation |
| **Dependencies** | rector-rules-laravel-upgrades, laravel-shift, phpstan-baseline-patterns |
| **Framework/Language** | Rector, Laravel, PHP |

## Overview

Rector is an automated PHP refactoring tool using AST-based transformations. For Laravel, it provides rules for version upgrades (deprecated methods, renamed classes), code modernization (type declarations, match expressions), and custom migrations. Operates via PHP-Parser's AST — making structural changes impossible with text-based tools. Laravel-specific rules maintained in `rectorphp/rector-laravel`. Supports `--dry-run` for preview and incremental adoption.

## Core Concepts

- **Rule**: single transformation targeting a specific code pattern
- **Set**: collection of rules grouped by purpose (Laravel 100 upgrade, PHP 8.1 features)
- **AST Transformation**: parse PHP → manipulate AST tree → dump modified code
- **Configuration**: `rector.php` defining sets, rules, paths, skip patterns
- **Process Mode**: `--dry-run` (preview) vs apply (modify files)

## When to Use

- Laravel version upgrades (automates 80%+ of upgrade changes)
- PHP modernization (type hints, match expressions, readonly properties)
- Custom framework migrations (old patterns → new conventions)
- Scheduled code quality maintenance (monthly automated refactoring)

## When NOT to Use

- Style-only changes (use Pint instead)
- Critical codebases without thorough testing after Rector
- When diff review bandwidth is limited (each rule set needs review)
- Projects without automated test coverage (Rector can change behavior)

## Best Practices (WHY)

- **Always use `--dry-run` first**: review diffs before applying changes
- **Apply one rule set at a time**: incremental diffs are reviewable
- **Run tests after Rector**: Rector can produce semantically wrong code
- **Lock Rector version**: prevent unexpected rule behavior changes
- **Exclude vendor**: Rector should never process vendor files
- **Incremental by directory**: apply one directory at a time for large projects

## Architecture Guidelines

- Configuration in `rector.php` at project root
- Use `rectorphp/rector-laravel` for Laravel-specific rules
- Schedule Rector as monthly CI task for continuous modernization
- Run Rector before PHPStan — fixes deprecated patterns that PHPStan would flag
- Use `--parallel` for large codebases to reduce analysis time

## Performance Considerations

- Speed: ~50-100 files/second; medium app (500 files) 5-10s
- Memory: large files (5000+ lines) spike to 100-200MB
- Parallel processing: `--parallel` reduces time 2-4x on multi-core
- Caching: processed file cache — clear with `clear-cache` after config changes

## Security Considerations

- Rector can modify any PHP file — always review changes in PR
- Never run Rector on production servers
- Lock versions to prevent surprise rule behavior changes
- Rector changes may introduce security issues if rules are incorrect

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Too many rules at once | Massive unreadable diffs | Impatience | Can't review effectively | Apply one set at a time |
| No --dry-run | Direct application without preview | Trusting automation | Wrong changes applied | Always dry-run first |
| Missing Laravel config | Using Rector without rector-laravel | Not knowing | Misses Laravel transformations | Include rector-laravel package |
| No tests after Rector | Assuming correctness | Overconfidence | Undetected behavior changes | Always run full test suite |
| Not excluding vendor | Processing vendor files | Default config | Slow, unnecessary | Exclude vendor/ explicitly |

## Anti-Patterns

- **Rector as Black Box**: applying changes without understanding what they do
- **One Giant PR**: running all rule sets on full codebase creates unreviewable diffs
- **No Testing After Rector**: Rector can change semantics — always test
- **Rector on Production**: never run automated refactoring on production infrastructure

## Examples

```php
// rector.php
use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\SetList;
use RectorLaravel\Set\LaravelSetList;

return RectorConfig::configure()
    ->withPaths([
        __DIR__.'/app',
        __DIR__.'/config',
        __DIR__.'/database',
    ])
    ->withSkip([
        __DIR__.'/vendor/*',
        __DIR__.'/storage/*',
    ])
    ->withSets([
        LaravelSetList::LARAVEL_110,
        SetList::PHP_82,
        SetList::CODE_QUALITY,
    ])
    ->withParallel();
```

## Related Topics

- rector-rules-laravel-upgrades — Laravel-specific rule sets
- laravel-shift — commercial upgrade alternative
- static-analysis-ci-integration — CI pipeline setup

## AI Agent Notes

- Created by Tomas Votruba; `rectorphp/rector-laravel` is community maintained
- Rector 2.x improved performance and parallel processing
- Laravel rules less comprehensive than Shift but cover common upgrade paths
- For custom project migrations, create custom Rector rules

## Verification

- [ ] Dry run passes with expected changes
- [ ] Full test suite passes after Rector application
- [ ] Vendor excluded from processing
- [ ] One rule set applied per commit
- [ ] Rector version locked in composer.json
- [ ] CI has dry-run check for modernization compliance
- [ ] Parallel processing enabled for large codebases
- [ ] Changes reviewed in PR before merge
