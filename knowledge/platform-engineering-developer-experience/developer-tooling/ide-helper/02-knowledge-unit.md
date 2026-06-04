# Knowledge Unit: IDE Helper

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/ide-helper
- **Maturity:** Mature
- **Related Technologies:** Laravel IDE Helper, PHP, PhpStorm, VS Code, Composer

## Executive Summary

The `barryvdh/laravel-ide-helper` package is the essential IDE productivity tool for Laravel, providing generated PHPDoc stubs and meta files that enable IDE autocompletion, type inference, and refactoring support for Laravel-specific constructs. It offers three main commands: `ide-helper:generate` (facade and helper stubs), `ide-helper:models` (Eloquent model PHPDoc annotations), and `ide-helper:meta` (PhpStorm meta file for advanced type inference). The package also generates `_ide_helper.php` (facade stubs), `_ide_helper_models.php` (or inline model annotations), and `.phpstorm.meta.php` (PhpStorm meta file). It supports: facades, global helpers, Eloquent models, factories, service container resolution, macros, and collection type inference. With 14.9k+ GitHub stars, it's the most widely used Laravel development tool outside the framework itself.

## Core Concepts

- **Facade Stubs:** `_ide_helper.php` provides `@method` annotations for all facades, enabling `Cache::`, `DB::`, `Event::` completion
- **Model Annotations:** `_ide_helper_models.php` or inline PHPDoc adds `@property`, `@method`, `@mixin` annotations to Eloquent models for property/relationship completion
- **PhpStorm Meta:** `.phpstorm.meta.php` maps abstract types to concrete implementations (e.g., `app('mailer')` resolves to \Illuminate\Mail\Mailer)
- **Collection Type Support:** The meta file teaches PhpStorm about `Collection::filter()`, `Collection::map()`, `Collection::first()` return types
- **Macro Support:** Detects facades extended with macros and includes them in generated stubs
- **Factory Annotations:** Generates PHPDoc for model factories, enabling autocompletion for factory state methods and attribute definitions

## Mental Models

- **IDE Helper as Laravel-IDE Bridge:** The package bridges Laravel's runtime dynamic resolution with IDE's static analysis—it translates Laravel's "magic" into PHPDoc that IDEs understand
- **Generated Docs as Type Contracts:** Each generated PHPDoc annotation is a type contract that the IDE uses for autocompletion, inspection, and refactoring
- **Meta File as Dependency Injection Map:** The PhpStorm meta file maps container identifiers to concrete classes, enabling the IDE to resolve `app()->make()`, `resolve()`, and constructor injection types

## Internal Mechanics

1. **Facade Stub Generation:** `generate()` reads all facades from `config/app.php` aliases, resolves each facade's root class, iterates public methods via reflection, and outputs `@method` annotations to `_ide_helper.php`
2. **Model Annotation Generation:** `models()` reads each model class, introspects the database schema (via `doctrine/dbal` or Laravel schema builder) to determine columns and types, reads relationships from method definitions, and generates `@property` and `@method` annotations
3. **PhpStorm Meta Generation:** `meta()` creates a `.phpstorm.meta.php` file with `override()` calls that map `\Illuminate\Contracts\*` interfaces to concrete implementations and container abstracts to resolved types
4. **Collection Type Inference:** The meta file uses PhpStorm's `type()` function to describe generic collection types, enabling `User::where(...)->get()->first()` to return `User|null` instead of `mixed`
5. **Factory Integration:** Reads model factory definitions and generates type hints for factory state methods (e.g., `User::factory()->unverified()->create()`)

## Patterns

- **Full Setup Pattern:** Run all three commands on `composer install`: `ide-helper:generate`, `ide-helper:models`, `ide-helper:meta` for complete IDE support
- **Model Annotation Strategy Pattern:** Choose inline annotations (`--nowrite` generates inline PHPDoc in models) vs separate file (`_ide_helper_models.php`) based on team preference
- **Post-Update Regeneration Pattern:** Automate regeneration via Composer scripts: `"post-update-cmd": [ "@php artisan ide-helper:generate", "@php artisan ide-helper:meta" ]`
- **Exclusion Pattern:** Exclude specific models from annotation generation via `--exclude` flag or config for third-party models that shouldn't be modified
- **Write Model Annotations Pattern:** Use `--write` flag to directly modify model files with PHPDoc annotations (convenient but modifies tracked files)
- **Config File Pattern:** Publish `config/ide-helper.php` to customize: excluded models, included facades, timestamps behavior, and macro detection settings

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Model annotation style | Inline PHPDoc vs separate file | Inline for single-model repositories; separate file for shared/modular projects |
| Model annotation detail | All columns vs selected vs none | All columns for autocompletion; selected for sensitive/excluded fields |
| Factory annotation | Generate vs skip | Generate for full autocompletion of factory states |
| PhpStorm meta | Generate vs skip | Generate for advanced container resolution inference |
| Version control | Track generated files vs ignore | Ignore `_ide_helper.php` and `.phpstorm.meta.php`; track model annotations if inline |

## Tradeoffs

- **Inline vs Separate Model Annotations:** Inline annotations (modified model files) are visible in diffs and don't require regeneration for each IDE session. Separate file avoids model file modification but requires regeneration after schema changes.
- **Full vs Selective Generation:** Full generation covers all facades and models but takes longer (3-10 seconds). Selective generation is faster but may miss less-used facades.
- **Automated vs Manual Generation:** Automated generation (Composer scripts) keeps stubs current but may fail silently if the environment can't resolve all facades. Manual generation gives control but requires discipline.

## Performance Considerations

- **Generation Time:** `generate` takes 1-3 seconds; `models` takes 3-30 seconds (depends on model count and depth); `meta` takes 1-2 seconds.
- **Model Analysis Time:** The `models` command reads the database schema for each model via Doctrine DBAL. This is the slowest step (0.5-2 seconds per model for the first run).
- **Schema Caching:** Doctrine DBAL caches schema information; subsequent `models` runs are faster (1-5 seconds total).
- **IDE Indexing:** The generated files add 5,000-20,000 lines of PHPDoc annotations. IDE indexing of these files takes 1-5 seconds on modern hardware.

## Production Considerations

- **Dev Dependency Only:** The `barryvdh/laravel-ide-helper` package should be in `require-dev`. CI and production use `composer install --no-dev` to skip installation.
- **CI Skips Generation:** Do not run IDE helper commands in CI or production. The generated files are for local IDE support only.
- **Sensitive Data in Models:** The `models` command reads column types from the database, which may include sensitive column names. Ensure the database is accessible during generation.
- **Team Onboarding:** Include IDE helper setup in the project's development setup documentation. New developers should run `composer install` and the three IDE helper commands.

## Common Mistakes

- **Installing as a production dependency:** Adding `barryvdh/laravel-ide-helper` to `require` instead of `require-dev`; the package is deployed to production unnecessarily
- **Not running all three commands:** Running only `generate` but not `models` or `meta`; missing model property completion and container resolution inference
- **Tracking all generated files:** Committing `_ide_helper.php`, `.phpstorm.meta.php`, and large generated annotations to version control; causes unnecessary merge conflicts
- **Not excluding problematic facades:** Some facades (e.g., those with state-dependent resolution) cause generation errors; use `--ignore` or config exclusions
- **Running with insufficient memory:** The `models` command with many models exhausts memory; set `memory_limit=512M` or higher for the command

## Failure Modes

- **Doctrine DBAL Missing:** The `models` command requires `doctrine/dbal` for schema introspection. Without it, column types default to `mixed`. Mitigate: `composer require --dev doctrine/dbal`.
- **Facade Resolution Failure:** A facade requiring request context (e.g., `Auth` facade) fails during CLI generation. Mitigate: run generation in an environment where all services are resolvable.
- **Stale Schema Cache:** The `models` command uses cached schema data that's out of sync with the actual database. Mitigate: clear cache with `php artisan ide-helper:models --reset`.
- **Custom Package Facades Not Detected:** Third-party facades not in `config/app.php` aliases array. Mitigate: add them to the IDE helper config's `include` array.

## Ecosystem Usage

- **PhpStorm for Laravel:** The primary target for IDE Helper; PhpStorm's Laravel plugin works in conjunction with the generated files for optimal autocompletion
- **VS Code with Intelephense:** VS Code's PHP Intelephense extension reads `_ide_helper.php` and model annotations for type inference
- **Sublime Text with LSP:** PHP LSP servers (intelephense, phpactor) use the generated files for completion and navigation
- **Laravel Teams:** IDE Helper is part of the standard Laravel toolchain, installed on every new project during initial setup
- **Laravel Packages:** Package developers use IDE Helper to provide type information for their package facades and models

## Related Knowledge Units

- facade-autocompletion-generation
- model-phpdoc-generation
- phpstorm-meta-file-generation
- debugbar-collectors-profiling

## Research Notes

- IDE Helper is installed over 100 million times total via Composer, making it one of the most-downloaded Laravel packages
- The `models` command generates PHPDoc for Eloquent models based on database schema reading (via Doctrine DBAL) and relationship method analysis
- PhpStorm meta files (`.phpstorm.meta.php`) use PhpStorm-specific `override()` function that's only parsed by the IDE, not executed by PHP
- Laravel 11's simplified directory structure required updates to IDE Helper's facade discovery and model location logic
