# 04-Standardized Knowledge: PhpStorm Meta File Generation

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | phpstorm-meta-file-generation |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | ide-helper, facade-autocompletion-generation, model-phpdoc-generation |
| **Framework/Language** | Laravel IDE Helper, PhpStorm, PHP |

## Overview

PhpStorm meta file generation uses `php artisan ide-helper:meta` to produce `.phpstorm.meta.php` — a PhpStorm-specific file for advanced type inference: service container resolution (`app()->make()`, `resolve()`), factory methods, collection operations, query builder chains, and route/URL generation. Uses PhpStorm's proprietary `override()` function mapping abstract types to concrete implementations. Enables `app('mailer')` → `\Illuminate\Mail\Mailer`, `User::query()->first()` → `User|null`, `collect()->first()` → typed results.

## Core Concepts

- **.phpstorm.meta.php**: PhpStorm-specific type mapping file
- **override() Function**: PhpStorm-magic function (not executed by PHP) telling IDE how to resolve types
- **Container Resolution Mapping**: maps abstract names to resolved classes
- **Collection Generics**: types collection items for `first()`, `filter()`, `map()` return types
- **Query Builder Return Types**: maps `find()`, `first()`, `get()` to model types
- **Factory Return Types**: `User::factory()->create()` returns `User`

## When to Use

- PhpStorm users in the team wanting maximum type inference
- Projects using service container heavily
- Teams wanting collection generic type support

## When NOT to Use

- Teams using VS Code, Sublime Text, or other non-PhpStorm IDEs (meta file is PhpStorm-specific)
- CI/production environments (no runtime effect)
- Minimal projects without container abstraction usage

## Best Practices (WHY)

- **Regenerate after provider changes**: service provider binding changes require meta regeneration
- **Composer script automation**: `post-autoload-dump` for automatic regeneration
- **Gitignore the file**: `.phpstorm.meta.php` is generated; tracking causes merge conflicts
- **Run alongside generate and models**: all three commands for complete IDE support
- **Install PhpStorm Laravel plugin**: enhances meta file parsing for Laravel-specific patterns

## Architecture Guidelines

- File location: project root (auto-detected by PhpStorm)
- Gitignore and regenerate on `composer install`/`composer update`
- Only benefits PhpStorm users; VS Code relies on `_ide_helper.php` for type info
- Part of standard `ide-helper` workflow: `generate` + `models` + `meta`

## Performance Considerations

- Generation time: 1-3s (small), 5-10s (large projects with many providers)
- File size: 500-3000 lines; PhpStorm parses on project load (100-500ms)
- IDE indexing: larger files increase indexing but <1s typically

## Security Considerations

- Dev-only file with no runtime impact (never loaded by PHP)
- Gitignore to avoid merge conflicts from different provider sets

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Not regenerating after provider changes | New bindings not in meta | Missing completion | Add to composer scripts |
| Tracking meta in VCS | Different provider sets | Merge conflicts | Gitignore; regenerate on clone |
| Expecting VS Code support | Meta file is PhpStorm-specific | No benefit for VS Code | Use `_ide_helper.php` instead |
| Not running after package installs | Package bindings not resolved | Missing types | Regenerate after install |

## Anti-Patterns

- **Skipping meta generation**: losing PhpStorm's container resolution and collection type inference
- **Manual meta editing**: regeneration overwrites manual changes

## Examples

```bash
# Generate PhpStorm meta file
php artisan ide-helper:meta

# Full IDE helper setup (composer post-update-cmd)
"post-update-cmd": [
    "@php artisan ide-helper:generate",
    "@php artisan ide-helper:models",
    "@php artisan ide-helper:meta"
]
```

## Related Topics

- ide-helper — full IDE helper package overview
- facade-autocompletion-generation — facade stub generation
- model-phpdoc-generation — model annotation generation

## AI Agent Notes

- Include `ide-helper:meta` in composer scripts for PhpStorm-using teams
- Only generate when at least one team member uses PhpStorm

## Verification

- [ ] `.phpstorm.meta.php` in `.gitignore`
- [ ] `ide-helper:meta` in composer scripts
- [ ] Regenerated after provider/package changes
- [ ] File is PhpStorm-only (VS Code team may skip)
