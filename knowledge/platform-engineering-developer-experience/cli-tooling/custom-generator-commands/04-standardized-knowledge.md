# 04-Standardized Knowledge: Custom Generator Commands

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | cli-tooling-artisan-extensions |
| **Knowledge Unit** | custom-generator-commands |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | custom-artisan-command-patterns, stub-customization-laravel, blueprint-code-generation |
| **Framework/Language** | Laravel Artisan, Stubs, Blade, PHP |

## Overview

Custom generator commands extend Laravel's `make:` family by extending `Illuminate\Console\GeneratorCommand`. They generate files from stub templates, replacing placeholders with provided values. `GeneratorCommand` handles stub path resolution, file existence checks, PSR-4 namespace detection, class name formatting, and output messaging. Custom generators implement `getStub()` and `getDefaultNamespace()`, then register in the Kernel. They support `stub:publish` for user customization.

## Core Concepts

- **GeneratorCommand**: base class for scaffolding: stub loading, namespace resolution, file creation, existence checks
- **Stub Files**: PHP template files with `{{ placeholder }}` variables replaced during generation
- **Stub Publishing**: `php artisan stub:publish` copies vendor stubs to `/stubs` for customization
- **Namespace Detection**: `getDefaultNamespace()` auto-detects PSR-4 namespaces from `composer.json`
- **Placeholder Variables**: `{{ class }}`, `{{ namespace }}`, `{{ rootNamespace }}`, `{{ namespacedModel }}`, plus custom via `buildClass()`

## When to Use

- Creating application-specific classes (DTOs, Actions, Services, ViewModels) with consistent structure
- Enforcing team conventions for new files (all generated classes follow the same template)
- Generating multi-file components (model + controller + request + test from a single command)
- Reducing boilerplate for repetitive patterns across the codebase

## When NOT to Use

- Single-use scaffolding tasks (use `php artisan make:` built-in commands)
- Code that varies significantly per project (use published stubs for customization)
- Runtime code generation (use Blade or view rendering instead)
- When stub maintenance overhead outweighs manual creation time

## Best Practices (WHY)

- **Extend GeneratorCommand**: use the base class for stub processing, namespace detection, and existence checks
- **Custom placeholders in `buildClass()`**: override to add project-specific replacement variables beyond the defaults
- **Respect `--force`**: follow Laravel convention to overwrite existing files when `--force` is passed
- **Validate class names**: use `Str::studly()` and provide clear error feedback for invalid names
- **Version stubs in VCS**: checked-in stubs ensure all developers generate the same code
- **Document migration paths**: when stubs change, provide commands to update generated files

## Architecture Guidelines

- Store shared stubs in `/stubs` at project root; use `base_path('stubs/my-stub.stub')` in `getStub()`
- Override `rootNamespace()` for test generators returning `Tests` namespace
- For multi-file generation, compose multiple `GeneratorCommand` calls or use a custom Command
- Use `$this->ask()` and `$this->choice()` for interactive collection of generation parameters

## Performance Considerations

- Stub file reading is <1ms per generation; bulk generation (100+ files) cumulative I/O is negligible
- Namespace resolution reads `composer.json` once and caches
- Bulk generation of 100 files takes ~100-500ms; bottleneck is file writing (disk I/O)

## Security Considerations

- Stubs are PHP code templates — ensure user input is sanitized before being embedded
- Never use `{{ }}` placeholders for values that could contain code injection
- Generated files should not contain hard-coded credentials or secrets
- Be cautious with `--force` overwriting existing files — confirm if files have local changes

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Test namespace not handled | Generators put test files in wrong namespace | `rootNamespace()` returns `App` | Tests can't autoload | Override `rootNamespace()` for test generators |
| Hard-coded app path | Using `app_path()` instead of namespace resolution | Convenience | Wrong path if autoloading changes | Use GeneratorCommand namespace resolution |
| Missing placeholder replacement | `{{ customField }}` left unreplaced in output | Forgetting `buildClass()` override | Broken generated code | Always add replacement logic in `buildClass()` |
| No existence check | Overwriting files without prompt | Not calling `parent::handle()` | Accidental data loss | Call parent handle or check `alreadyExists()` |
| Force flag not supported | Custom generator ignores `--force` | Not matching Laravel conventions | Inconsistent UX | Check `$this->option('force')` |

## Anti-Patterns

- **God Generator**: one command generating everything instead of focused generators per type
- **Stub Sprawl**: hundreds of stubs with minor variations — use placeholders and conditional logic
- **Outdated Stubs**: stubs that don't match current coding standards or framework version
- **Silent Overwrite**: generating files without checking if they already exist
- **Complex Logic in Stubs**: stubs with PHP logic instead of simple template replacement

## Examples

```php
namespace App\Console\Commands;

use Illuminate\Console\GeneratorCommand;

class MakeDto extends GeneratorCommand
{
    protected $signature = 'make:dto {name : The DTO class name} {--force : Overwrite existing file}';
    protected $description = 'Create a new DTO class';
    protected $type = 'DTO';

    protected function getStub(): string
    {
        return base_path('stubs/dto.stub');
    }

    protected function getDefaultNamespace($rootNamespace): string
    {
        return "{$rootNamespace}\\DataTransferObjects";
    }

    protected function replaceCustomPlaceholders(string $stub, string $name): string
    {
        return str_replace(
            '{{ datetime }}',
            now()->format('Y-m-d H:i:s'),
            $stub
        );
    }
}
```

## Related Topics

- custom-artisan-command-patterns — command structure and registration
- stub-customization-laravel — publishing and editing stubs
- blueprint-code-generation — YAML-based code generation
- artisan-command-signatures-arguments — defining input specifications

## AI Agent Notes

- `GeneratorCommand` has remained largely stable since Laravel 5.0; patterns apply across versions
- Stubs use `{{ class }}` and `{{ namespace }}` placeholder names since Laravel 8.x (replaced `DummyClass`)
- When AI generates generators, ensure `getStub()` returns a valid path and stubs are in version control
- For bulk generation, compose multiple generator calls rather than creating a multi-file generator

## Verification

- [ ] `php artisan make:dto MyDto` creates file in correct namespace
- [ ] Placeholders replaced correctly in generated output
- [ ] Existing files cause confirmation prompt (unless `--force`)
- [ ] `--force` overwrites existing files without prompt
- [ ] Namespace detection works for project's PSR-4 structure
- [ ] Generated file passes linting and static analysis
- [ ] Stubs are version-controlled and consistent across team
- [ ] Custom placeholders replaced via `buildClass()` override
