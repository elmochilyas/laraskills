# 04-Standardized Knowledge: Facade Autocompletion Generation

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | facade-autocompletion-generation |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | ide-helper, model-phpdoc-generation, phpstorm-meta-file-generation |
| **Framework/Language** | Laravel IDE Helper, PHP, PhpStorm, VS Code |

## Overview

Facade autocompletion generation uses `barryvdh/laravel-ide-helper`'s `php artisan ide-helper:generate` to produce PHPDoc stubs enabling IDE autocompletion for Laravel facades. It resolves each facade's underlying service container binding via `getFacadeRoot()`, reflects public methods, and writes `_ide_helper.php` with `@method` annotations. Also generates stubs for global helper functions (`response()`, `redirect()`, `view()`). Detects macros on facades and includes them.

## Core Concepts

- **Facade Resolution Analysis**: introspects each facade's `getFacadeRoot()` for underlying class, reads public methods via reflection
- **PHPDoc Stub Generation**: `@method` annotations in `_ide_helper.php` with parameters and return types
- **Macro Expansion**: detects registered macros on facades (via `Macroable` trait reflection) and includes them
- **Helper Function Stubs**: stubs for global helpers (`response()`, `redirect()`, `session()`, etc.)
- **Eloquent Query Builder**: extends query builder stubs for chaining completion (`where()`, `orderBy()`, `with()`)

## When to Use

- All Laravel projects for IDE autocompletion on facades and helpers
- Projects using facades extensively
- Teams using IDEs that support PHPDoc stub files (PhpStorm, VS Code, Sublime Text)

## When NOT to Use

- Projects not using facades (e.g., full dependency injection)
- CI/production environments (not needed, file is for local IDE only)
- Projects where all developers use the same IDE without stub support

## Best Practices (WHY)

- **Post-Composer-Update regeneration**: run `ide-helper:generate` after `composer update` for current stubs
- **Gitignore the generated file**: `_ide_helper.php` is generated; committing it creates merge conflicts
- **Composer script automation**: add to `post-autoload-dump` for automatic regeneration: `@php artisan ide-helper:generate`
- **Use --helpers flag**: generates stubs for global helper functions (`response()`, `redirect()`, `view()`)
- **Environment-specific setup**: dev-only dependency, skip generation in CI and production

## Architecture Guidelines

- File location: project root (`_ide_helper.php`) for broad IDE compatibility
- Add `_ide_helper.php` to `.gitignore`; `_ide_helper_models.php` may be tracked per team preference
- Run generation in same environment as development to resolve all facades correctly
- Pin `laravel-ide-helper` version in `composer.json` for consistent generation

## Performance Considerations

- Generation time: 1-3 seconds for 50-100 facades
- File size: 5,000-15,000 lines; IDE parsing adds 100-500ms to index startup (negligible)
- Memory: 10-30MB RAM during generation

## Security Considerations

- Dev dependency only (`require-dev`); ensure `composer install --no-dev` in production
- Do not run in CI (wastes pipeline time, the file has no CI value)

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| Tracking `_ide_helper.php` in VCS | Generated file differs per environment | Unnecessary merge conflicts | Gitignore; regenerate on install |
| Not regenerating after facade changes | New methods/macros missing | No IDE completion | Add to composer scripts |
| Running in CI | File unused in CI | Wasted pipeline time | Skip in CI config |
| Missing helpers flag | No global function stubs | Missing completion for helpers | Use `--helpers` flag |

## Anti-Patterns

- **Manual stub editing**: never manually edit `_ide_helper.php`; regeneration overwrites changes
- **Production deployment**: the package and generated file have no runtime effect; still, don't deploy dev deps

## Examples

```bash
# Generate facade and helper stubs
php artisan ide-helper:generate --helpers

# Add to composer.json scripts
"scripts": {
    "post-update-cmd": [
        "@php artisan ide-helper:generate",
        "@php artisan ide-helper:meta"
    ]
}
```

## Related Topics

- ide-helper — full IDE helper package overview
- model-phpdoc-generation — Eloquent model annotation generation
- phpstorm-meta-file-generation — PhpStorm-specific meta file

## AI Agent Notes

- Always add `ide-helper:generate` to composer scripts when scaffolding new Laravel projects
- Do not include `_ide_helper.php` in initial commits

## Verification

- [ ] `_ide_helper.php` in `.gitignore`
- [ ] Package in `require-dev`
- [ ] Composer scripts configured for generation
- [ ] `--helpers` flag used
- [ ] Version pinned in composer.json
