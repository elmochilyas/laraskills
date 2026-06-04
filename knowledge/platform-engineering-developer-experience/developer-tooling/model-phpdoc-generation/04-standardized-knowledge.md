# 04-Standardized Knowledge: Model PHPDoc Generation

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | model-phpdoc-generation |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | ide-helper, facade-autocompletion-generation, phpstorm-meta-file-generation |
| **Framework/Language** | Laravel IDE Helper, PHP, Eloquent, Doctrine DBAL |

## Overview

Model PHPDoc generation uses `php artisan ide-helper:models` to generate `@property` and `@method` annotations for Eloquent models. Documents database-backed attributes (columns as properties) and relationships (methods returning Relation instances). Reads database schema via Doctrine DBAL for column names/types, analyzes model methods for relationships. Supports inline PHPDoc (modifying model files) or separate `_ide_helper_models.php` file.

## Core Concepts

- **@property Annotations**: document DB columns: `@property int $id`, `@property string $email`, `@property Carbon|null $email_verified_at`
- **@method Annotations**: query builder methods: `@method static User|null find(int $id)`, `@method static User whereEmail(string $email)`
- **Relationship Annotations**: `@property-read Collection|Post[] $posts`, `@property-read User|null $parentUser`
- **Doctrine DBAL**: database abstraction layer for schema introspection
- **Dynamic Property Detection**: discovers attributes from `$fillable`, `$guarded`, or DB schema

## When to Use

- All Laravel projects using Eloquent models
- Teams wanting IDE autocompletion for model properties and relationships
- Pre-requisite for accurate PHPStan/Larastan static analysis on models

## When NOT to Use

- Projects not using Eloquent
- CI/production environments (no IDE benefit)
- When neither Doctrine DBAL nor database is available

## Best Practices (WHY)

- **Post-migration generation**: run `ide-helper:models` after schema changes for accurate annotations
- **Install Doctrine DBAL**: `composer require --dev doctrine/dbal` — without it, column types default to `mixed`
- **Exclude third-party models**: use `--exclude` flag for package models that shouldn't be modified
- **Inline vs separate file**: inline (`--write`) for full visibility in diffs; separate file for clean models
- **Team standardization**: all members should generate from same schema for consistent annotations
- **Fresh database before generation**: `migrate:fresh --seed` then `ide-helper:models` for accuracy

## Architecture Guidelines

- Run after every migration that changes model-related tables
- Use `config/ide-helper.php` for customizations: excluded models, timestamps behavior
- Version control: track inline annotations; ignore separate `_ide_helper_models.php`
- Gitignore entries: `_ide_helper_models.php` if using separate file

## Performance Considerations

- Schema reading: 0.5-2s per model (first run); cached for subsequent runs
- 50 models: 5-30s (cold cache), 2-5s (warm cache)
- File writing: 1-3s for 50 models
- Advanced: Doctrine DBAL caching speeds up generation significantly

## Security Considerations

- Dev dependency only (`require-dev`)
- Models command reads DB schema — ensure DB accessible during generation
- No runtime effect — generated annotations are IDE-only

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| No Doctrine DBAL | Column types default to `mixed` | Inaccurate annotations | Install `doctrine/dbal` |
| Generating without DB | Fails or stale annotations | No or wrong output | Ensure running DB with migrations |
| Not excluding third-party models | Package models annotated | Unnecessary modifications | Use `--exclude` flag |
| Manual annotation editing | Regeneration overwrites changes | Lost manual edits | Don't edit generated files |
| Running with stale schema | Missing new columns | Incomplete annotations | Run after each migration |

## Anti-Patterns

- **Generating once and never updating**: annotations become stale as schema changes
- **Without Doctrine DBAL**: accepting `mixed` types for all columns

## Examples

```bash
# Generate inline model annotations with Doctrine DBAL
composer require --dev doctrine/dbal
php artisan ide-helper:models --write

# Generate separate file (no --write)
php artisan ide-helper:models
```

## Related Topics

- ide-helper — full IDE helper package overview
- facade-autocompletion-generation — facade stub generation
- phpstorm-meta-file-generation — PhpStorm meta file

## AI Agent Notes

- Always install `doctrine/dbal` alongside `laravel-ide-helper` when setting up model annotations
- Add `ide-helper:models` to composer scripts for `post-update-cmd`

## Verification

- [ ] `doctrine/dbal` installed in `require-dev`
- [ ] `ide-helper:models` run after last migration
- [ ] Third-party models excluded if using `--write`
- [ ] Annotation strategy chosen (inline vs separate file)
- [ ] Team documented about regeneration workflow
