# Skill: Generate Model PHPDoc Annotations

## Purpose
Generate `@property` and `@method` PHPDoc annotations for Eloquent models providing IDE autocompletion for database-backed attributes and relationships.

## When To Use
- All Laravel projects using Eloquent models
- Teams wanting IDE autocompletion for model properties and relationships
- Pre-requisite for accurate PHPStan/Larastan static analysis on models

## When NOT To Use
- Projects not using Eloquent
- CI/production environments (no IDE benefit)
- When neither Doctrine DBAL nor database is available

## Prerequisites
- `barryvdh/laravel-ide-helper` installed as a dev dependency
- `doctrine/dbal` installed as a dev dependency for schema introspection
- Database connection configured and models migrated

## Inputs
- Eloquent model files
- Database schema (read via Doctrine DBAL)
- `config/ide-helper.php` — model generation settings

## Workflow

1. **Install Dependencies:** Run `composer require --dev barryvdh/laravel-ide-helper` and `composer require --dev doctrine/dbal`.

2. **Run Model Generation:** Execute `php artisan ide-helper:models` to generate annotations for all models. The command will prompt for inline vs separate file approach.

3. **Choose Annotation Strategy:**
   - Inline (`--write`): Annotations written directly to model files. Visible in diffs, tracked in version control.
   - Separate file (`_ide_helper_models.php`): All annotations in a single file. Keeps model files clean. Add to `.gitignore`.

4. **Verify Annotations:** Open a model file and confirm `@property` annotations for DB columns (`@property int $id`, `@property string $email`, `@property Carbon|null $email_verified_at`) and relationship annotations (`@property-read Collection|Post[] $posts`).

5. **Regenerate After Schema Changes:** Run `ide-helper:models` after migrations that add/remove columns or change relationships.

## Validation Checklist

- [ ] Model files have `@property` annotations for all DB columns
- [ ] Relationship methods have `@property-read` annotations with correct return types
- [ ] Query builder methods have `@method` annotations (`find()`, `whereEmail()`)
- [ ] Annotations match actual database schema
- [ ] `doctrine/dbal` configured and database accessible
- [ ] Inline annotations (if chosen) tracked in version control

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| `doctrine/dbal` missing | Command fails with error about DBAL |
| Columns missing from annotations | Run after migrations; verify database connection |
| Stale annotations after schema change | Regenerate after every migration that changes columns |

## Decision Points

- **Inline vs separate file:** Inline for full diff visibility during code review; separate file for clean model files
- **Pre-requisite for PHPStan:** Model PHPDoc enables accurate static analysis of model properties and relationships

## Performance/Security Considerations

- **Dev-only:** No runtime impact; never run in CI/production
- **Generation time:** 5-30 seconds depending on model count and database size

## Related Rules

- MODELDOC-RULE-001: Run ide-helper:models
- MODELDOC-RULE-002: Dev dependency only
- MODELDOC-RULE-003: Inline vs separate
- MODELDOC-RULE-004: Pre-requisite for PHPStan

## Related Skills

- Generate Facade Autocompletion Stubs
- Generate PhpStorm Meta File
- Configure IDE Helper

## Success Criteria

- IDE provides autocompletion for all model properties and relationships
- PHPStan analysis of model access is accurate with proper types
- Annotations stay in sync with database schema after migrations
