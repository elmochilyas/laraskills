# Skill: Generate PhpStorm Meta File

## Purpose
Generate `.phpstorm.meta.php` for advanced PhpStorm type inference including service container resolution, collection generics, query builder return types, and factory return types.

## When To Use
- PhpStorm users in the team wanting maximum type inference
- Projects using service container heavily
- Teams wanting collection generic type support

## When NOT To Use
- Teams using VS Code, Sublime Text, or other non-PhpStorm IDEs (meta file is PhpStorm-specific)
- CI/production environments (no runtime effect)
- Minimal projects without container abstraction usage

## Prerequisites
- `barryvdh/laravel-ide-helper` installed as a dev dependency
- PhpStorm IDE configured to use the meta file

## Inputs
- Laravel application with service container bindings
- `.phpstorm.meta.php` — generated output file

## Workflow

1. **Install Package:** Run `composer require --dev barryvdh/laravel-ide-helper`.

2. **Generate Meta File:** Execute `php artisan ide-helper:meta` to produce `.phpstorm.meta.php` in the project root.

3. **Verify Type Inference:** In PhpStorm, test that `app('mailer')` resolves to `\Illuminate\Mail\Mailer`, `User::query()->first()` returns `User|null`, and `collect()->first()` returns typed results.

4. **Add to .gitignore:** Append `.phpstorm.meta.php` to `.gitignore` since it's regenerated per developer.

5. **Automate with Composer Script:** Add to `composer.json` `post-update-cmd` for automatic regeneration after dependency updates.

6. **Regenerate After Container Changes:** Run `ide-helper:meta` after adding new service container bindings or changing abstract-to-concrete mappings.

## Validation Checklist

- [ ] `.phpstorm.meta.php` exists in project root
- [ ] `app()->make('mailer')` resolves to `\Illuminate\Mail\Mailer`
- [ ] Collection operations (`first()`, `filter()`, `map()`) return typed items
- [ ] Query builder methods (`find()`, `first()`, `get()`) return correct model types
- [ ] Factory methods (`User::factory()->create()`) return `User`
- [ ] File is in `.gitignore` and not tracked

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Meta file not regenerated | Type inference missing for new bindings/classes |
| `.gitignore` not updated | Meta file committed to version control |
| No benefit for non-PhpStorm IDEs | VS Code/Sublime don't use `.phpstorm.meta.php` |

## Decision Points

- **PhpStorm-specific:** Meta file only benefits PhpStorm users. VS Code/Intelephense use PHPDoc stubs instead.
- **All three commands:** Run `generate` + `models` + `meta` for complete IDE support

## Performance/Security Considerations

- **Dev-only:** No runtime impact; never deploy to production
- **One-time cost:** Generation takes 1-3 seconds

## Related Rules

- META-RULE-001: Run ide-helper:meta
- META-RULE-002: Dev dependency only
- META-RULE-003: Gitignore output
- META-RULE-004: Composer script

## Related Skills

- Generate Facade Autocompletion Stubs
- Generate Model PHPDoc Annotations
- Configure IDE Helper

## Success Criteria

- PhpStorm provides accurate type inference for container resolution
- Collection methods return typed items for IDE autocompletion
- Query builder chains resolve to correct model types
