# Skill: Create Custom Generator Commands

## Purpose
Extend Laravel's `make:` family with custom generator commands that scaffold application-specific classes (DTOs, Actions, Services, ViewModels) from stub templates with consistent structure and team conventions.

## When To Use
- Creating application-specific classes with consistent structure
- Enforcing team conventions for new files
- Generating multi-file components (model + controller + request + test)
- Reducing boilerplate for repetitive patterns across the codebase

## When NOT To Use
- Single-use scaffolding tasks (use `php artisan make:` built-in commands)
- Code that varies significantly per project (use published stubs for customization)
- Runtime code generation (use Blade or view rendering instead)
- When stub maintenance overhead outweighs manual creation time

## Prerequisites
- Understanding of `Illuminate\Console\GeneratorCommand`
- Stub template files with `{{ placeholder }}` syntax
- Knowledge of PSR-4 namespace detection

## Inputs
- Class name to generate
- Namespace path
- Custom placeholder values (model names, table names, fields)
- `--force` flag behavior (overwrite existing files)

## Workflow
1. Create a stub file in `/stubs` directory with `{{ placeholder }}` variables
2. Create a generator command extending `Illuminate\Console\GeneratorCommand`
3. Implement `getStub()` to return the path to your stub file
4. Implement `getDefaultNamespace()` to set the target namespace
5. Override `buildClass()` to add custom placeholder replacements
6. Validate class names with `Str::studly()` and provide clear error feedback
7. Respect `--force` to overwrite existing files (Laravel convention)
8. For multi-file generation, compose multiple GeneratorCommand calls
9. Register the command in `App\Console\Kernel`
10. Version stubs in VCS for consistency across developers
11. Document migration paths when stubs change

## Validation Checklist
- [ ] Command extends `Illuminate\Console\GeneratorCommand`
- [ ] `getStub()` returns correct path to stub file
- [ ] `getDefaultNamespace()` sets correct target namespace
- [ ] Custom placeholders implemented via `buildClass()` or `buildView()`
- [ ] `--force` flag respected for overwriting existing files
- [ ] Class names validated with `Str::studly()`
- [ ] Stubs versioned in VCS
- [ ] Multi-file generation uses composed GeneratorCommand calls
- [ ] Migration paths documented for stub changes

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Namespace resolution wrong | PSR-4 detection fails | Override `rootNamespace()` for correct detection |
| Stub changes don't propagate | Stubs not shared | Version stubs in VCS; publish with `stub:publish` |
| Generated file already exists | No `--force` handling | Check and respect `--force` flag |
| Invalid class name crashes command | No validation | Validate with `Str::studly()` before generation |
| Multi-file generation is fragile | Manual file creation | Compose multiple GeneratorCommand calls |
| Stubs are project-specific | Too rigid | Use published stubs from `stub:publish` for customization |

## Decision Points
- **Stub location:** `/stubs` at project root vs custom path via `getStub()` override
- **Single vs multi-file:** Single GeneratorCommand vs composed commands
- **Namespace override:** Default PSR-4 detection vs custom `rootNamespace()`
- **Placeholder strategy:** Built-in `{{ class }}`, `{{ namespace }}` vs custom via `buildClass()`

## Performance/Security Considerations
- Generated files should not contain sensitive placeholder values
- Stub files in VCS are readable by all developers; avoid embedding secrets
- Overwriting existing files with `--force` should prompt confirmation in interactive mode
- Validate generated class names against reserved PHP keywords

## Related Rules
- GEN-RULE-001 through GEN-RULE-012

## Related Skills
- Create Custom Artisan Commands
- Customize Laravel Stubs
- Generate Code with Blueprint
- Define Artisan Command Signatures

## Success Criteria
- Custom generator produces team-convention-compliant files every time
- Stubs are versioned in VCS and shared across the team
- Generated files follow correct namespace and PSR-4 autoloading
- Multi-file generators create all required files in one command
- Stub changes are documented with migration paths for existing generated files
