# Skill: Configure IDE Helper for Full Laravel IDE Support

## Purpose
Install and configure `barryvdh/laravel-ide-helper` across all three commands (facade stubs, model annotations, PhpStorm meta) for complete IDE autocompletion and type inference.

## When To Use
- Every Laravel project for IDE productivity
- Teams using PhpStorm, VS Code with Intelephense, or any PHP IDE
- New project scaffolding to ensure team productivity from day one

## When NOT To Use
- Teams that don't use IDEs (vim/emacs without LSP)
- CI/production environments (wasted time, no benefit)
- Extremely simple projects with minimal facade/model usage

## Prerequisites
- `barryvdh/laravel-ide-helper` installed as a dev dependency
- `doctrine/dbal` for model schema introspection (required for `ide-helper:models`)
- Database connection configured for model annotation generation

## Inputs
- `_ide_helper.php` — facade and global helper stubs
- Model files (with inline annotations) or `_ide_helper_models.php`
- `.phpstorm.meta.php` — PhpStorm type mapping file

## Workflow

1. **Install Package:** Run `composer require --dev barryvdh/laravel-ide-helper`. For model annotations, also run `composer require --dev doctrine/dbal`.

2. **Generate Facade Stubs:** Run `php artisan ide-helper:generate` to produce `_ide_helper.php` with `@method` annotations for all facades and global helpers.

3. **Generate Model Annotations:** Run `php artisan ide-helper:models` and choose either:
   - `--write` for inline annotations directly on model files (visible in diffs)
   - Separate `_ide_helper_models.php` file for clean model files

4. **Generate PhpStorm Meta:** Run `php artisan ide-helper:meta` to produce `.phpstorm.meta.php` for advanced type inference (container resolution, collection generics, query builder return types).

5. **Add to .gitignore:** Append `_ide_helper.php`, `.phpstorm.meta.php`, and `_ide_helper_models.php` (if using separate file approach) to `.gitignore`.

6. **Automate with Composer Script:** Add to `composer.json` `post-update-cmd` for automatic regeneration after dependency updates.

7. **Pin Package Version:** Specify exact version in `composer.json` to ensure consistent stubs across team members.

## Validation Checklist

- [ ] `_ide_helper.php` generated and in `.gitignore`
- [ ] Model files have `@property` annotations for DB columns
- [ ] Relationship methods have `@property-read` annotations
- [ ] `.phpstorm.meta.php` generated (if using PhpStorm)
- [ ] Composer script configured for `post-update-cmd`
- [ ] Version pinned for consistent team experience

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Model annotations missing after migration | Run `ide-helper:models` after schema changes |
| `.gitignore` not updated | Generated files committed to version control |
| `doctrine/dbal` missing | Model annotation generation fails with error |
| Different stubs across team | No version pin; add exact version to composer.json |

## Decision Points

- **Inline vs separate model annotations:** Inline (`--write`) for full diff visibility; separate file for clean model files
- **PhpStorm meta only:** Only useful for PhpStorm users; VS Code/Sublime don't use `.phpstorm.meta.php`

## Performance/Security Considerations

- **Dev-only package:** No runtime impact; never deploy to production
- **Generation time:** 3-10 seconds for all three commands together

## Related Rules

- IDE-RULE-001: Run all three commands
- IDE-RULE-002: Composer script automation
- IDE-RULE-003: Dev dependency only
- IDE-RULE-004: Gitignore generated files
- IDE-RULE-005: Pin version

## Related Skills

- Generate Facade Autocompletion Stubs
- Generate Model PHPDoc Annotations
- Generate PhpStorm Meta File

## Success Criteria

- IDE provides full autocompletion for facades, models, and container resolution
- Model properties and relationships have type hints in the editor
- Annotations regenerate automatically on `composer update`
