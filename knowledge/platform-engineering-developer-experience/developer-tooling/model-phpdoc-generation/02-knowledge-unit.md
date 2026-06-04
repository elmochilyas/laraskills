# Knowledge Unit: Model PHPDoc Generation

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/model-phpdoc-generation
- **Maturity:** Mature
- **Related Technologies:** Laravel IDE Helper, PHP, Eloquent, PHPDoc, Doctrine DBAL

## Executive Summary

Model PHPDoc generation uses the `barryvdh/laravel-ide-helper` package's `php artisan ide-helper:models` command to generate PHPDoc `@property` and `@method` annotations for Eloquent models. These annotations document the database-backed attributes (columns as properties) and relationships (methods returning Relation instances) that IDEs cannot infer dynamically. The generator reads the database schema via Doctrine DBAL to discover column names and types, then analyzes model methods to identify relationships. The annotations enable IDEs to autocomplete `$user->email`, `$user->posts()`, `User::where('email', '...')`, and other model operations. The generator can write inline PHPDoc (modifying model files) or generate a separate `_ide_helper_models.php` file.

## Core Concepts

- **@property Annotations:** Document model attributes that come from database columns: `@property int $id`, `@property string $email`, `@property Carbon|null $email_verified_at`
- **@method Annotations:** Document query builder methods that return typed results: `@method static User|null find(int $id)`, `@method static User whereEmail(string $email)`
- **Relationship Annotations:** Document relationship methods with proper return types: `@property-read Collection|Post[] $posts`, `@property-read User|null $parentUser`
- **Doctrine DBAL:** The database abstraction layer used to read schema metadata (columns, types, nullability, defaults) from the database
- **Dynamic Property Detection:** The generator discovers Eloquent model attributes that are defined in `$fillable`, `$guarded`, or the database schema
- **Schema vs Schema-less:** For models backed by database tables, columns are detected from the schema. For schema-less models (MongoDB, etc.), columns are detected from casts, fillable, or annotations.

## Mental Models

- **Model PHPDoc as Schema Documentation:** Each `@property` annotation documents a database column—it's the schema expressed in code, making the database structure visible in the IDE
- **Model PHPDoc as Type Contract:** The annotations declare what types the model's dynamic attributes return, enabling static analysis and autocompletion
- **Model PHPDoc as Relationship Map:** Relationship annotations show the model's graph connections, making it easy to discover related models without referencing migrations

## Internal Mechanics

1. **Model Discovery:** The generator scans the `app/Models` directory (configurable) for Eloquent model classes
2. **Schema Reading:** For each model, Doctrine DBAL queries the database to read the table schema: column names, types, lengths, nullability, defaults, indexes
3. **Type Mapping:** Database types are mapped to PHP types: `VARCHAR` → `string`, `INT` → `int`, `TIMESTAMP` → `\Illuminate\Support\Carbon`, `TEXT` → `string`
4. **Relationship Detection:** The generator analyzes model methods for relationship patterns (`$this->hasMany()`, `$this->belongsTo()`, `$this->belongsToMany()`, etc.) and generates `@property-read` annotations
5. **Column-to-Property Mapping:** Special columns (timestamp columns, soft delete column) are mapped to applicable casts and types
6. **Annotation Output:** Annotations are written either inline (directly into model files) or to a separate `_ide_helper_models.php` file

## Patterns

- **Post-Migration Pattern:** Run `php artisan ide-helper:models` after creating new migrations that add columns to existing models
- **Fresh Database Pattern:** Run the models command after resetting the database: `migrate:fresh --seed` followed by `ide-helper:models` for accurate schema reflections
- **Inline Annotation Pattern:** Use `--write` to write annotations directly into model files—annotations are version-controlled and visible in diffs
- **Separate File Pattern:** Use default mode (no `--write`) to generate `_ide_helper_models.php`—model files stay clean and generated content is .gitignored
- **Exclusion Pattern:** Exclude specific models (third-party packages, legacy) via `--exclude` flag or config: `php artisan ide-helper:models --exclude="App\Models\Legacy"`
- **Post-Composer-Update Pattern:** Regenerate model annotations after `composer update` that changes the IDE Helper package or database schema

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Annotation location | Inline vs separate file | Inline for full visibility (version controlled); separate file for clean diffs |
| Schema detection strategy | Database vs fillable vs casts | Database (most accurate); fallback to fillable/casts if DB unavailable |
| Relationship detection | Auto-detect vs manual annotations | Auto-detect (covers 90%+ of relationships); manual for non-standard relations |
| Output format | PHPDoc blocks vs attributes vs meta file | PHPDoc blocks (broadest IDE support) |
| Version control | Track annotations vs ignore | Track inline annotations; ignore separate file (regenerate on clone) |

## Tradeoffs

- **Inline vs Separate File:** Inline annotations are visible in diffs and always available, but they clutter model files. Separate files keep models clean but require regeneration for every schema change.
- **Database Accuracy vs Build Speed:** Reading the database schema provides accurate column information but requires a running database with up-to-date migrations. Without a database, the generator falls back to fillable/casts analysis, which is less accurate.
- **Comprehensive vs Selective Generation:** Generating annotations for all models provides complete coverage but takes longer (3-30 seconds). Selective generation is faster but may miss models added by packages.

## Performance Considerations

- **Schema Reading Time:** The `models` command reads schema information via Doctrine DBAL. For the first run, this takes 0.5-2 seconds per model. Schema caching significantly speeds up subsequent runs.
- **Total Generation Time:** For a project with 50 models, generation takes 5-30 seconds (cold cache) or 2-5 seconds (warm cache).
- **Doctrine DBAL Dependency:** The package requires `doctrine/dbal` for schema reading. Without it, column types default to `mixed`, reducing annotation accuracy.
- **File Writing Time:** Writing inline annotations to 50 model files takes 1-3 seconds. This is a one-time cost per generation run.

## Production Considerations

- **Dev Dependency:** `laravel-ide-helper` and `doctrine/dbal` must be in `require-dev`. CI and production use `composer install --no-dev` to skip installation.
- **CI Exclusion:** Do not run `ide-helper:models` in CI. The generated annotations are for local IDE support and have no effect on runtime behavior.
- **Database Access:** The models command requires database access (configured in `.env`). Ensure developers have a running database with migrated schema before running the command.
- **Schema Cache:** The Doctrine DBAL schema cache persists in `bootstrap/cache/`. Clear it when the database schema changes.
- **Team Standardization:** All team members should generate model annotations from the same database schema. Inconsistent schemas produce different annotations.

## Common Mistakes

- **Not running Doctrine DBAL install:** Running `ide-helper:models` without `doctrine/dbal` installed; column types default to `mixed` (no type accuracy)
- **Generating without a running database:** The models command fails or produces stale annotations without database access
- **Not excluding third-party models:** Third-party package models get annotated unnecessarily; use `--exclude` or config exclusions
- **Modifying generated annotations manually:** Editing `_ide_helper_models.php` or inline annotations by hand; regenerating overwrites manual changes
- **Running with stale schema:** Adding columns to the database but forgetting to run migrations first; generated annotations miss new columns

## Failure Modes

- **Doctrine DBAL Schema Error:** Doctrine can't read the database schema (permission denied, table not found, connection timeout). Mitigate: verify database connection; check table visibility.
- **Unsupported Column Type:** Doctrine maps a database type to an unexpected PHP type. Mitigate: override the type mapping in `config/ide-helper.php`.
- **Ambiguous Relationship Detection:** A model method returns a relationship but the generator can't determine the related model. Mitigate: manually add `@property-read` annotations for ambiguous relations.
- **Memory Exhaustion for Large Models:** Models with many columns (100+) cause memory spikes during annotation generation. Mitigate: increase `memory_limit` for the command.

## Ecosystem Usage

- **Laravel Teams:** Model PHPDoc generation is a standard step in Laravel project setup, run after each migration that modifies the schema
- **PhpStorm for Laravel:** PhpStorm reads `@property` annotations for autocompletion, refactoring, and code inspections on Eloquent models
- **VS Code with Intelephense:** VS Code users benefit from model annotations for property completion and type inference in blade files and controllers
- **Laravel Package Development:** Package developers generate model PHPDoc for their package models to provide IDE support for consumers
- **Static Analysis Integration:** Model annotations feed into PHPStan/Larastan for accurate static analysis of Eloquent model usage (fewer false positives)

## Related Knowledge Units

- ide-helper
- facade-autocompletion-generation
- phpstorm-meta-file-generation
- laravel-phpstan

## Research Notes

- The `ide-helper:models` command was introduced early in the IDE Helper package's history and has been refined across multiple Laravel versions
- Doctrine DBAL provides database-agnostic schema reading; the generator works with MySQL, PostgreSQL, SQLite, and SQL Server
- Relationship detection relies on method body analysis: the generator looks for `$this->hasMany(...)`, `$this->belongsTo(...)` etc. in model methods
- Laravel 11's model directory change (`app/Models/` instead of `app/`) required updates to the generator's default model discovery path
