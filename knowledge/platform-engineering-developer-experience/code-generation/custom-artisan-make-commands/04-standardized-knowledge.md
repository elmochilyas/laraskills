# 04-Standardized Knowledge: Custom Artisan Make Commands

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | custom-artisan-make-commands |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | custom-artisan-command-patterns, stub-customization-laravel, blueprint-code-generation |
| **Framework/Language** | Laravel Artisan, Stubs, PHP, Composer |

## Overview

Custom Artisan `make:` commands extend Laravel's scaffolding to generate project-specific classes: `make:dto`, `make:action`, `make:service`, `make:enum`, `make:trait`. By extending `Illuminate\Console\GeneratorCommand`, they use stub templates with placeholder replacement, detect PSR-4 namespaces automatically, handle file existence checks, and support `--force`. Custom make commands are essential for teams following specific architectural patterns who need consistent boilerplate.

## Core Concepts

- **GeneratorCommand**: base class for stub handling, namespace detection, path resolution
- **Stub Templates**: files with `{{ placeholder }}` variables for dynamic content
- **Namespace Resolution**: auto-detection from Composer PSR-4 autoloading
- **Placeholder System**: `{{ class }}`, `{{ namespace }}`, `{{ rootNamespace }}`, custom via `buildClass()`
- **Already Exists Check**: built-in file detection with interactive prompt and `--force`
- **Stub Publishing**: `stub:publish` makes built-in stubs available for customization

## When to Use

- Creating many similar classes (DTOs, Actions, Services) that follow the same pattern
- Enforcing team conventions through generated code structure
- Providing package generators that create classes in the application namespace
- Reducing boilerplate for patterns appearing 10+ times in the project

## When NOT to Use

- One-off classes (manual creation is simpler than building a generator)
- Classes with highly variable structure (stubs can't express all variations)
- When stub maintenance overhead exceeds manual creation time
- For patterns that change frequently (stubs become outdated quickly)

## Best Practices (WHY)

- **Extend GeneratorCommand**: get namespace detection, file checks, and stub processing for free
- **Use `$rootNamespace`**: never hard-code `App\` — respect the project's actual namespace
- **Respect `--force`**: follow Laravel convention for overwriting existing files
- **Prefix custom placeholders**: use `{{ dtoParent }}` instead of `{{ parent }}` to avoid collisions
- **Keep stubs simple**: use placeholders for variables, not control structures
- **Version-control stubs**: stub changes affect all future generated code — review in PRs

## Architecture Guidelines

- Store custom stubs in project `/stubs` directory (version-controlled)
- For package generators, ship stubs within the package and reference with `__DIR__`
- Override `rootNamespace()` for test generators returning `Tests` namespace
- Provide `--namespace` option override for non-standard namespace targets
- Document available make commands in CONTRIBUTING.md or README

## Performance Considerations

- Stub file I/O: <1ms per file; negligible for manual generation
- Namespace resolution cached from composer.json autoload config
- Performance not a primary concern — generators are invoked manually (1-10 times/day)

## Security Considerations

- Stubs are PHP templates — sanitize user input before embedding in generated code
- Generated files should not contain hard-coded credentials
- `--force` overwrites existing files — confirm if files have local changes
- Generated code should follow secure coding practices (type hints, validation)

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Hard-coding namespace | Using `App\` instead of `$rootNamespace` | Convenience | Broken on custom namespaces | Always use `$rootNamespace` |
| Not respecting --force | No overwrite support | Missing convention | Inconsistent UX | Check `$this->option('force')` |
| Complex stub logic | Control structures in stubs | Over-engineering | Hard to maintain stubs | Put logic in `buildClass()` or `handle()` |
| Forgetting registration | Command not in Kernel | Oversight | Command not found | Add to Kernel or `load()` directory |
| Overwriting built-in stubs | Modifying published stubs unintentionally | Not understanding scope | Changes all make: commands | Keep custom stubs separate |

## Anti-Patterns

- **Too Many Generators**: creating generators for every class type — maintenance cost exceeds benefit
- **Stub Sprawl**: dozens of near-identical stubs — use conditional placeholders instead
- **Rigid Generators**: no options for customization (`--parent`, `--traits`, `--namespace`)
- **Unregistered Commands**: building generators but not documenting or registering them
- **Static Stubs Never Updated**: stubs that don't reflect current coding standards or framework version

## Examples

```php
namespace App\Console\Commands;

use Illuminate\Console\GeneratorCommand;

class MakeAction extends GeneratorCommand
{
    protected $signature = 'make:action {name : The action class name}
        {--force : Overwrite existing file}
        {--invokable : Generate an invokable single-action class}';

    protected $description = 'Create a new action class';
    protected $type = 'Action';

    protected function getStub(): string
    {
        return $this->option('invokable')
            ? base_path('stubs/action-invokable.stub')
            : base_path('stubs/action.stub');
    }

    protected function getDefaultNamespace($rootNamespace): string
    {
        return "{$rootNamespace}\\Actions";
    }

    protected function buildClass($name): string
    {
        $stub = parent::buildClass($name);
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

- `GeneratorCommand` has been stable since Laravel 5.0; patterns are version-agnostic
- Stubs use `{{ placeholders }}` since Laravel 8.x (replaced the older `DummyClass` convention)
- For package generators, ship stubs in a `/stubs` directory relative to the command class
- When generating code via AI, prefer extending GeneratorCommand for single-class generation

## Verification

- [ ] Command appears in `php artisan list` under `make:` namespace
- [ ] Generated file created in correct namespace and directory
- [ ] Placeholders replaced correctly in output
- [ ] `--force` overwrites existing files
- [ ] Existing files prompt for confirmation (without `--force`)
- [ ] Namespace detection works for project's PSR-4 structure
- [ ] Generated file passes linting and static analysis
- [ ] Stubs are version-controlled
- [ ] Make commands documented for the team
