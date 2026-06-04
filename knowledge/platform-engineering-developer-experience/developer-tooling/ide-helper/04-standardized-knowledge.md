# 04-Standardized Knowledge: IDE Helper

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | ide-helper |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | facade-autocompletion-generation, model-phpdoc-generation, phpstorm-meta-file-generation |
| **Framework/Language** | Laravel IDE Helper, PHP, PhpStorm, VS Code, Composer |

## Overview

`barryvdh/laravel-ide-helper` is the essential IDE productivity package for Laravel, generating PHPDoc stubs and meta files for autocompletion, type inference, and refactoring. Three main commands: `ide-helper:generate` (facade/helper stubs → `_ide_helper.php`), `ide-helper:models` (Eloquent model annotations → `_ide_helper_models.php` or inline), `ide-helper:meta` (PhpStorm meta file → `.phpstorm.meta.php`). Supports facades, global helpers, Eloquent models, factories, macros, service container resolution, and collection type inference. 14.9k+ GitHub stars, most popular Laravel dev tool.

## Core Concepts

- **Facade Stubs**: `_ide_helper.php` with `@method` annotations for all facades (`Cache::`, `DB::`, `Event::`)
- **Model Annotations**: `@property`, `@method`, `@mixin` on Eloquent models for property/relationship completion
- **PhpStorm Meta**: `.phpstorm.meta.php` mapping abstract types to concrete implementations via `override()`
- **Collection Type Support**: meta file teaches PhpStorm about `filter()`, `map()`, `first()` return types
- **Macro Support**: detects facades extended with macros and includes in generated stubs
- **Factory Annotations**: PHPDoc for model factories enabling completion for state methods and attributes

## When to Use

- Every Laravel project for IDE productivity
- Teams using PhpStorm, VS Code with Intelephense, or any PHP IDE
- New project scaffolding to ensure team productivity from day one

## When NOT to Use

- Teams that don't use IDEs (vim/emacs without LSP)
- CI/production environments (wasted time, no benefit)
- Extremely simple projects with minimal facade/model usage

## Best Practices (WHY)

- **Run all three commands**: `generate`, `models`, `meta` for complete IDE support
- **Composer script automation**: `post-update-cmd` for automatic regeneration
- **Dev dependency only**: `require-dev` to avoid production deployment
- **Gitignore generated files**: `_ide_helper.php` and `.phpstorm.meta.php`; track model annotations if inline
- **Model annotation style**: inline (`--write`) for full diff visibility; separate file for clean models
- **Pin version**: consistent stubs across team members

## Architecture Guidelines

- Run all three commands after `composer install`/`composer update`
- Publish `config/ide-helper.php` for customizations: excluded models, included facades, timestamps
- Choose annotation strategy per team: inline vs separate file for models
- PhpStorm meta only benefits PhpStorm users; VS Code users rely on `_ide_helper.php`

## Performance Considerations

- `generate`: 1-3 seconds
- `models`: 3-30 seconds (depends on model count, database schema reading)
- `meta`: 1-2 seconds
- IDE indexing of generated files: 1-5 seconds on modern hardware
- Schema caching speeds subsequent `models` runs significantly

## Security Considerations

- Dev dependency only; never install in production
- `models` command reads database column types; ensure DB accessible during generation
- No sensitive data exposed in generated files (column names only, not values)

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Installing in `require` | Package deployed to production | Unnecessary production dependency | Use `require-dev` |
| Not running all 3 commands | Missing model or meta support | Incomplete IDE help | Run all three |
| Tracking all generated files | Merge conflicts | Diff noise | Gitignore generated files |
| No Doctrine DBAL | Column types default to `mixed` | Inaccurate model annotations | `composer require --dev doctrine/dbal` |
| Running with insufficient memory | Models command crashes | Generation fails | Set `memory_limit=512M` |

## Anti-Patterns

- **Manual PHPDoc editing**: manually writing `@property` annotations instead of running the generator
- **Skipping meta generation**: losing container resolution type inference in PhpStorm

## Examples

```bash
# Complete IDE helper setup
php artisan ide-helper:generate
php artisan ide-helper:models --write
php artisan ide-helper:meta
```

## Related Topics

- facade-autocompletion-generation — facade-specific stub generation
- model-phpdoc-generation — model annotation generation
- phpstorm-meta-file-generation — PhpStorm meta file

## AI Agent Notes

- When scaffolding new Laravel projects, add `barryvdh/laravel-ide-helper` to `require-dev` and configure composer scripts
- Always check if `doctrine/dbal` is needed for model annotation generation

## Verification

- [ ] Package in `require-dev`
- [ ] All 3 commands configured in composer scripts
- [ ] `_ide_helper.php` and `.phpstorm.meta.php` in `.gitignore`
- [ ] `doctrine/dbal` installed if using `models` command
- [ ] Version pinned in composer.json
