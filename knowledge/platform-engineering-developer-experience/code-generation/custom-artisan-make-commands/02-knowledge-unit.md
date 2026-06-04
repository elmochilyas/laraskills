# Knowledge Unit: Custom Artisan Make Commands

## Metadata
- **Subdomain:** Code Generation & Scaffolding
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-generation-scaffolding/custom-artisan-make-commands
- **Maturity:** Mature
- **Related Technologies:** Laravel Artisan, Stubs, PHP, Composer

## Executive Summary

Custom Artisan `make:` commands extend Laravel's scaffolding system to generate project-specific or domain-specific classes beyond the built-in `make:model`, `make:controller`, and `make:migration` commands. By extending `Illuminate\Console\GeneratorCommand` or implementing a custom generator from scratch, developers can create commands like `make:dto`, `make:action`, `make:service`, `make:enum`, `make:trait`, `make:factory`, or any other class pattern specific to the project's architecture. These commands follow the same conventions as Laravel's built-in generators: they use stub templates with placeholder replacement, detect PSR-4 namespaces automatically, handle file existence checks, and support the `--force` flag for overwriting. Custom make commands are essential for teams that follow specific architectural patterns (Domain-Driven Design, Service Layer, Action pattern) and want to maintain consistency through generated boilerplate.

## Core Concepts

- **GeneratorCommand:** The base class providing stub handling, namespace detection, path resolution, and output formatting for single-file generation
- **Stub Templates:** Files containing the skeleton structure of the generated class with `{{ placeholder }}` variables for dynamic content
- **Namespace Resolution:** Automatic detection of the target namespace from Composer's PSR-4 autoloading configuration, ensuring generated files are placed in the correct directory
- **Placeholder System:** Predefined placeholders (`{{ class }}`, `{{ namespace }}`, `{{ rootNamespace }}`) and custom placeholders added via `buildClass()` overrides
- **Already Exists Check:** Built-in file existence detection with interactive prompt (skip or overwrite) and `--force` flag support
- **Stub Publishing:** Using `stub:publish` to make built-in stubs available for customization, or storing custom stubs in the project's `/stubs` directory

## Mental Models

- **Make Command as Template Expander:** The command takes a class name and expands it through a stub template, like a mail merge for PHP classes
- **Make Command as Convention Enforcer:** By centralizing generation logic, make commands enforce team conventions—every generated DTO follows the same structure, uses the same imports, and has the same base class
- **Make Command as Boilerplate Eliminator:** Where you previously copied and pasted existing classes, a make command generates the correct structure from scratch

## Internal Mechanics

1. **Command Definition:** The class extends `GeneratorCommand`, defines `$signature` (with arguments for class name, options for constraints), and `$description`
2. **Stub Resolution:** `getStub()` returns the filesystem path to the stub template; typically `base_path('stubs/dto.stub')` or `__DIR__.'/../../stubs/dto.stub'` for package commands
3. **Root Namespace:** `getDefaultNamespace($rootNamespace)` returns the namespace under which the new class will live: `$rootNamespace.'\DataTransferObjects'`
4. **Placeholder Replacement:** `buildClass()` replaces `{{ dtoNamespace }}`, `{{ parentClass }}`, `{{ traits }}` with values derived from the command's arguments or options
5. **File Writing:** The processed stub is written to the filesystem at the path determined by PSR-4 namespace mapping; success/failure message is sent to console output
6. **Registration:** The command is registered in `App\Console\Kernel` via `$commands` array or `load()` method

## Patterns

- **Architecture-Specific Generator Pattern:** Create `make:action` (single-action controllers/services), `make:dto` (data transfer objects), `make:view-model` (Laravel view models), `make:enum` (PHP enums with Laravel integration)
- **Package Generator Pattern:** When building Laravel packages, provide `make:vendor-component` commands that generate classes in the application's namespace, not the package's
- **Multi-File Generator Pattern:** For complex scaffolding (like creating a model, migration, and factory together), use a custom `handle()` method that creates multiple files instead of extending `GeneratorCommand`
- **Extend Built-In Pattern:** Override `buildClass()` in a subclass of Laravel's built-in generators to add project-specific placeholders or defaults
- **Interactive Generator Pattern:** Use `$this->ask()`, `$this->choice()` before generation to collect additional parameters (base class selection, trait inclusion, namespace override)

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Base class | GeneratorCommand vs custom Command vs Composer generate | GeneratorCommand for single file; custom Command for multi-file; Composer for project creation |
| Stub source | Project `/stubs` vs package stubs vs vendor stubs | Project `/stubs` for team conventions; package stubs for distributable generators |
| Placeholder strategy | `{{ }}` vs `{{ }}` with prefixes vs `{{ namespace }}/{{ class }}` | Placeholder prefixing (e.g., `{{ dtoParent }}`) avoids collision with built-in placeholders |
| Autodiscovery | Kernel array vs `load()` directory vs service provider | `load()` for modular apps; Kernel array for simple projects; service provider for packages |

## Tradeoffs

- **GeneratorCommand vs Full Custom Command:** `GeneratorCommand` handles namespace detection and stub processing but is designed for single class files. For generation that involves multiple files (creating a model, controller, and tests together), a full custom Command with multiple file writing operations is necessary.
- **Too Many vs Too Few Generators:** Too many make commands create tooling maintenance overhead. Too few result in inconsistent code patterns. Target make commands for patterns that appear >10 times in the project.
- **Conventions vs Flexibility:** Custom generators enforce conventions (consistent structure) but limit flexibility. Balance by providing generator options (e.g., `--parent=CustomBaseClass`) rather than hard-coding assumptions.

## Performance Considerations

- **Stub File I/O:** Reading stub files from disk is fast (<1ms). For multi-file generators, batch file operations where possible.
- **Namespace Resolution Caching:** PSR-4 namespace mapping is resolved from `composer.json` autoload section on each command run. With Composer's autoload optimizer, this is cached.
- **Generation Frequency:** Custom make commands are typically invoked manually (1-10 times per day). Performance is not a primary concern; correctness and DX are more important.

## Production Considerations

- **Stub Versioning:** Stub files should be committed to version control. Changes to stubs affect all future generated classes. Review stub changes in PRs like code changes.
- **Team Documentation:** Document available make commands and their options in the project's CONTRIBUTING.md or README. New team members should know what generators are available.
- **Generator Testing:** Write tests for generator commands that verify: correct file creation, proper namespace resolution, accurate placeholder replacement, and graceful error handling.
- **Cross-Platform Paths:** Use `DIRECTORY_SEPARATOR` or forward slashes in stub paths to ensure Windows/Unix compatibility. PHP's `DIRECTORY_SEPARATOR` is not needed if using forward slashes (PHP resolves them on Windows).

## Common Mistakes

- **Hard-coding the app namespace:** Using `App\` instead of `$rootNamespace` in `getDefaultNamespace()`; generated code breaks when the project uses a custom namespace
- **Not respecting --force:** Custom generators should respect the `--force` flag convention, allowing overwrite of existing files when explicitly requested
- **Forgetting to register the command:** Creating a stub and command class but not registering it in the Kernel; running `php artisan make:my-class` returns "Command not found"
- **Overwriting built-in stubs unintentionally:** `stub:publish` copies to `/stubs`; modifying them there changes generation for all built-in `make:` commands, not just custom ones
- **Complex stub logic:** Putting control structures or conditional logic in stub files; keep stubs simple (template variables) and put logic in `buildClass()` or `handle()`

## Failure Modes

- **Namespace Resolution Failure:** If `composer.json` has non-standard PSR-4 autoload configuration, `getDefaultNamespace()` may return unexpected results. Mitigate: provide a `--namespace` option override and test with different autoload configurations.
- **Stub Not Found:** The stub file path in `getStub()` points to a non-existent file. Mitigate: validate stub existence in command constructor with a meaningful error message.
- **Overwrite of Critical Classes:** `make:dto User` overwrites an existing carefully-crafted DTO. Mitigate: always prompt for overwrite confirmation; respect `--force`.
- **Class Name Collision:** Generated class name conflicts with a class loaded by a Composer dependency. Mitigate: advise using prefixes or suffixes for common class names.

## Ecosystem Usage

- **Laravel Framework:** Built-in `make:model`, `make:controller`, `make:request`, `make:policy`, `make:seeder`, `make:test`, `make:notification`, `make:event`, `make:listener`, `make:job`, `make:mail`, `make:rule`, `make:command`, `make:channel`, `make:middleware`, `make:provider`, `make:resource`, `make:exception`, `make:factory`, `make:migration`—all using `GeneratorCommand`
- **Laravel Nova:** `nova:resource`, `nova:action`, `nova:lens`, `nova:filter` custom generators
- **Laravel Telescope:** `telescope:clear`, `telescope:prune`—administrative commands, not generators
- **Laravel Horizon:** `horizon:install` generator command that publishes Horizon configuration
- **Spatie Packages:** Many Spatie packages provide `make:` commands for generating config, service classes, and models following their conventions
- **Laravel Livewire:** `make:livewire` generates Livewire component classes and views

## Related Knowledge Units

- custom-artisan-command-patterns
- stub-customization-laravel
- blueprint-code-generation
- artisan-command-signatures-arguments

## Research Notes

- The `GeneratorCommand` class has been part of Laravel since version 5.0 and is one of the most extended classes in the Laravel ecosystem
- Laravel 8.x introduced the more expressive `{{ placeholders }}` syntax, replacing the older `DummyClass` / `DummyNamespace` convention that persisted from Laravel 4.x
- Custom make commands are a recommended pattern in the Laravel package development guide; the Spatie package skeleton includes examples
- The `stub:publish` command copies stubs from `vendor/laravel/framework/src/Illuminate/Console/stubs` to the project's `/stubs` directory
