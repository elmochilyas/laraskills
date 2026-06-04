# Knowledge Unit: Custom Generator Commands

## Metadata
- **Subdomain:** CLI Tooling & Artisan Extensions
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** cli-tooling-artisan-extensions/custom-generator-commands
- **Maturity:** Mature
- **Related Technologies:** Laravel Artisan, Stubs, Blade, PHP, Composer

## Executive Summary

Custom generator commands extend Laravel's `make:` command family to scaffold application-specific classes, components, and files. Built on `Illuminate\Console\GeneratorCommand`, these commands generate files from stub templates, replacing placeholder variables with command-provided values. The `GeneratorCommand` base class handles: stub path resolution, file existence checks, namespace detection (based on PSR-4 autoloading configuration), class name formatting, and output messaging. Custom generators are created by extending `GeneratorCommand`, implementing `getStub()` (returning the stub file path) and `getDefaultNamespace($rootNamespace)` (returning the target namespace), and registering the command in the Kernel. They can also leverage `stub:publish` to allow user customization of generated stubs.

## Core Concepts

- **GeneratorCommand:** The base class (`Illuminate\Console\GeneratorCommand`) that provides scaffolding logic: stub loading, namespace resolution, file creation, and existence checks
- **Stub Files:** PHP template files (typically in `/stubs`) with `{{ placeholder }}` variables that are replaced during generation
- **Stub Publishing:** `php artisan stub:publish` copies Laravel's vendor stubs to `/stubs` for customization
- **Namespace Detection:** `GeneratorCommand::getDefaultNamespace()` auto-detects PSR-4 namespaces from `composer.json` autoload configuration
- **Placeholder Variables:** `{{ class }}`, `{{ namespace }}`, `{{ rootNamespace }}`, `{{ namespacedModel }}`, and custom variables via `buildClass()`
- **File Existence Checking:** Built-in `alreadyExists()` check prevents accidental overwrites with configurable prompts

## Mental Models

- **Generator as Template Engine:** The generator is like a server-side template engine—it takes a stub (template) and data (arguments), processes placeholders, and produces the output file
- **Stub as Blueprint:** Each stub defines the structure of the generated class—methods, properties, imports, and namespace—similar to a blueprint for code generation
- **Namespace Detection as Autoloading Mapping:** The generator reads `composer.json` autoload mappings to determine where generated files should be placed, mirroring how Composer resolves class names

## Internal Mechanics

1. **Command Handling:** `GeneratorCommand::handle()` calls `parent::handle()`, which extracts the class name from the command argument, determines the target path, checks for existing files, loads and processes the stub, and writes the output
2. **Stub Processing:** The stub file content is read, processed through `buildClass()` (which replaces `{{ namespace }}`, `{{ class }}`, etc.), and passed through `buildClass()` for custom replacement logic
3. **Path Resolution:** `GeneratorCommand::getPath($name)` converts the fully qualified class name to a filesystem path: `App\Models\User` → `app/Models/User.php`
4. **Namespace Detection:** `getDefaultNamespace()` returns the root namespace based on the first PSR-4 autoload entry in `composer.json`, typically `App`
5. **File Writing:** Once processed, the stub content is written to the resolved path; `GeneratorCommand` sends formatted output via `$this->info()` and `$this->error()`

## Patterns

- **Domain-Specific Generator Pattern:** Create generators for application-specific patterns: `make:dto`, `make:action`, `make:service`, `make:view-model` following consistent stub templates
- **Extend Existing Generator Pattern:** Override `replaceModel()` or `buildClass()` in existing generators to add custom placeholders for project-specific conventions
- **Stub Sharing Pattern:** Store shared stubs in `/stubs` at the project root; reference them with `base_path('stubs/my-stub.stub')` in `getStub()`
- **Interactive Generator Pattern:** Combine generator commands with `$this->ask()` and `$this->choice()` to collect additional generation parameters beyond the class name
- **Bulk Generator Pattern:** A command that accepts a YAML/JSON definition file and generates multiple related classes (model, controller, request, policy) from a single definition

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Base class | GeneratorCommand vs custom Command vs artisan make | GeneratorCommand for file generation; custom Command for complex multi-file generation |
| Stub source | Package stubs vs project stubs vs published stubs | Project stubs for customization; package stubs for distribution; published stubs for user override |
| Namespace strategy | PSR-4 detection vs explicit namespace option | PSR-4 detection by default; `--namespace` option for override |
| Overwrite behavior | Always skip vs ask vs force flag | Ask by default; `--force` to overwrite (matching Laravel conventions) |

## Tradeoffs

- **GeneratorCommand vs Custom Command:** `GeneratorCommand` provides stub processing, namespace detection, and existence checks out of the box but is designed for single-class generation. For multi-file or configuration-based generation, a custom Command with manual file writing is more flexible.
- **Published Stubs vs Package Stubs:** Published stubs (via `stub:publish`) allow users to customize generated code but add a maintenance burden—published stubs don't update automatically when the package updates. Package stubs always match the latest version but can't be customized.
- **Convention vs Configuration:** PSR-4 auto-detection works for standard Laravel setups but fails for unconventional directory structures. Providing an explicit `--path` option handles edge cases.

## Performance Considerations

- **Stub File I/O:** Reading stub files from disk on each generation is fast (<1ms). For bulk generation (100+ files), the cumulative I/O adds up but is still negligible compared to the generation logic.
- **Namespace Parsing:** Composer's `composer.json` is parsed and cached by Laravel's `ComposerScripts`; `getDefaultNamespace()` reads from the application's namespace configuration, which is resolved once and cached.
- **Bulk Generation:** Generating 100 files from stubs takes ~100-500ms. The bottleneck is typically file writing (disk I/O), not stub processing.

## Production Considerations

- **Consistency Across Environments:** Generated code should be consistent regardless of environment. Stubs in version control ensure all developers generate the same code. Avoid environment-specific placeholders in stubs.
- **Versioning Generator Output:** When generator output changes (new stub version), existing generated files aren't automatically updated. Document migration paths or provide upgrade commands.
- **Testing Generated Code:** Generated files should pass the same quality standards as hand-written code. Include generated file validation in CI (linting, static analysis) and provide tests that verify generator output.
- **Cross-Platform Path Handling:** Use `DIRECTORY_SEPARATOR` or Laravel's `Str::slug()` for path generation to ensure Windows/Unix compatibility.

## Common Mistakes

- **Not handling namespace resolution for tests:** Generators don't auto-detect test namespaces correctly; override `rootNamespace()` to return `Tests` for test generators
- **Hard-coding app path:** Using `app_path()` in generators creates paths that don't respect the application's actual autoloading configuration; use `GeneratorCommand`'s namespace resolution
- **Missing stub placeholders:** Defining `{{ customPlaceholder }}` in stubs but forgetting to implement the replacement logic in `buildClass()`; the placeholder remains unreplaced in the output
- **Not checking file existence:** Accidentally overwriting existing files by not calling `parent::handle()` (which includes the existence check)
- **Ignoring --force flag:** Custom generators should respect `--force` to override existing files, matching Laravel's convention

## Failure Modes

- **Namespace Detection Failure:** If `composer.json` has no PSR-4 autoload entries or uses non-standard mappings, namespace detection fails. Mitigate: provide a fallback namespace and clear error message.
- **Stub File Missing:** The stub file referenced in `getStub()` doesn't exist (deleted, renamed, not published). Mitigate: validate stub existence in the constructor with a descriptive exception.
- **Invalid Class Name:** User provides a class name with invalid characters or that doesn't match PHP naming conventions. Mitigate: validate the name with `Str::studly()` and provide clear error feedback.
- **Permission Denied:** The target directory exists but isn't writable by the web server/CLI user. Mitigate: check directory permissions before attempting file creation.

## Ecosystem Usage

- **Laravel Framework Itself:** Core `make:` commands (make:model, make:controller, make:migration, make:command) are all GeneratorCommand implementations
- **Laravel Nova:** Nova provides `nova:resource`, `nova:action`, `nova:lens`, `nova:filter` custom generators for Nova component creation
- **Laravel Livewire:** Livewire's `make:livewire` command generates Livewire component classes and views from stubs
- **Spatie Packages:** Spatie's package skeleton provides custom generators for creating package-specific classes following their conventions
- **Blueprint:** Blueprint reads YAML definitions and uses Laravel's generation infrastructure to produce complete application components (models, controllers, migrations, tests)

## Related Knowledge Units

- custom-artisan-command-patterns
- stub-customization-laravel
- blueprint-code-generation
- artisan-command-signatures-arguments

## Research Notes

- The `GeneratorCommand` class has remained largely stable since Laravel 5.0, with minor improvements to namespace detection and placeholder replacement in later versions
- Laravel 8.x improved the stub system with named placeholders (`{{ class }}`, `{{ namespace }}`) replacing the earlier `DummyClass`, `DummyNamespace` convention
- The `stub:publish` command was added in Laravel 5.0 and has been enhanced in each major version; Laravel 11+ publishes stubs to a configurable location
- Custom generators are one of the most commonly requested patterns in Laravel package development, with many packages providing `make:vendor-package-class` commands
