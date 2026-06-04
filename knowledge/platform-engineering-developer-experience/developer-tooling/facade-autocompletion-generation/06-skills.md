# Skill: Generate Facade Autocompletion Stubs

## Purpose
Generate PHPDoc stubs for Laravel facades and global helper functions enabling IDE autocompletion and type inference.

## When To Use
- All Laravel projects for IDE autocompletion on facades and helpers
- Projects using facades extensively
- Teams using IDEs supporting PHPDoc stub files (PhpStorm, VS Code, Sublime Text)

## When NOT To Use
- Projects not using facades (e.g., full dependency injection)
- CI/production environments (file is local IDE-only)
- Projects where all developers use the same IDE without stub support

## Prerequisites
- `barryvdh/laravel-ide-helper` installed as a dev dependency
- Composer autoload configured

## Inputs
- Laravel facades defined in the application
- `_ide_helper.php` — generated output file

## Workflow

1. **Add Dev Dependency:** Run `composer require --dev barryvdh/laravel-ide-helper`.

2. **Generate Facade Stubs:** Run `php artisan ide-helper:generate` to produce `_ide_helper.php` with `@method` annotations for all facades and global helpers (`response()`, `redirect()`, `view()`).

3. **Add to .gitignore:** Append `/_ide_helper.php` to `.gitignore` since the file is regenerated per developer.

4. **Add Composer Script:** In `composer.json`, add `"post-update-cmd": "@php artisan ide-helper:generate"` for automatic regeneration after dependency updates.

5. **Regenerate After Macro Changes:** When facades are extended with macros, regenerate stubs so macros are included in autocompletion.

## Validation Checklist

- [ ] `_ide_helper.php` exists after running `ide-helper:generate`
- [ ] IDE shows autocompletion for `Cache::`, `DB::`, `Event::` facade methods
- [ ] Global helpers (`response()`, `redirect()`, `session()`) have autocompletion
- [ ] Macros on facades appear in autocompletion suggestions
- [ ] File is in `.gitignore` and not tracked in version control

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Stubs not regenerated after package update | Missing autocompletion for new facade methods |
| Macros not in stubs | Facade extension methods missing from autocompletion |
| `.gitignore` not updated | `_ide_helper.php` ends up in version control |

## Decision Points

- **All Laravel projects benefit** from facade autocompletion generation
- **Use with all IDEs** that support PHPDoc stub files

## Performance/Security Considerations

- **File is dev-only:** No runtime performance impact; do not deploy to production
- **One-time cost:** Generation takes 1-3 seconds; only runs on demand or post-update

## Related Rules

- FACADE-RULE-001: Run ide-helper:generate
- FACADE-RULE-002: Dev dependency only
- FACADE-RULE-003: Gitignore output
- FACADE-RULE-004: Composer script for automatic regeneration
- FACADE-RULE-005: Macro detection included

## Related Skills

- Generate Model PHPDoc Annotations
- Generate PhpStorm Meta File
- Configure IDE Helper

## Success Criteria

- IDE provides full autocompletion for all Laravel facades and global helpers
- Macros registered on facades appear in suggestions
- File regenerates automatically on `composer update`
