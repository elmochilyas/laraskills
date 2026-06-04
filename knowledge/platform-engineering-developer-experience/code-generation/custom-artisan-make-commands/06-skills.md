# Skill: Create Custom Artisan Make Commands

## Purpose
Build custom `make:` Artisan commands that generate project-specific classes (DTOs, Actions, Services) using stubs with placeholder replacement, following Laravel's generator patterns.

## When To Use
- Creating many similar classes (DTOs, Actions, Services) following the same pattern
- Enforcing architectural conventions through code generation
- Patterns appearing 10+ times in the codebase

## When NOT To Use
- One-off classes (manual creation is simpler)
- Highly variable structures (stubs can't express all variations)
- Very simple patterns where copy-paste is faster

## Prerequisites
- Understanding of Laravel's GeneratorCommand base class
- Stub templates with placeholders

## Inputs
- Command class extending `Illuminate\Console\GeneratorCommand`
- Stub files in `stubs/` directory
- Composer PSR-4 autoloading configuration

## Workflow

1. **Create Command Class:** Extend `Illuminate\Console\GeneratorCommand`. Implement `getNameInput()` to detect the class name from the argument, and `getStub()` to return the path to your stub file.

2. **Define getDefaultNamespace():** Override to set the target namespace (e.g., `App\DTOs`). Use `$this->rootNamespace()` rather than hard-coding `App\`.

3. **Create Stub Template:** In `stubs/` directory, create a stub file with `{{ class }}`, `{{ namespace }}`, `{{ rootNamespace }}` placeholders. Prefix custom placeholders (e.g., `{{ dtoParent }}`) to avoid collisions.

4. **Register Command:** Add the command to `app/Console/Kernel.php` `$commands` array or use auto-discovery.

5. **Use --force Option:** Respect Laravel convention for overwriting existing files when `--force` is passed. GeneratorCommand handles this automatically.

6. **Provide --namespace Option:** Override for non-standard namespace targets when users need to generate outside the default namespace.

7. **Ship Stubs with Package:** For package generators, reference stubs using `__DIR__ . '/../stubs/'` instead of the project's `stubs/` directory.

## Validation Checklist

- [ ] Command extends GeneratorCommand
- [ ] `$rootNamespace()` used, not hard-coded `App\`
- [ ] Custom placeholders prefixed to avoid collisions
- [ ] `--force` flag respected
- [ ] `--namespace` option provided for flexibility
- [ ] Stubs version-controlled
- [ ] Command registered in Kernel

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Hard-coded namespace | Fails on projects with non-standard root namespace |
| Placeholder collision | `{{ parent }}` conflicts with existing placeholders; prefix custom ones |
| Stub not found | Verify `getStub()` returns correct path |

## Decision Points

- **Use for patterns appearing 10+ times** — DTOs, Actions, Services following the same structure
- **Skip for one-off classes** — Manual creation is simpler than building a generator
- **Skip for highly variable structures** — Stubs can't express all variations
- **Store custom stubs in `/stubs`** directory (version-controlled)

## Performance/Security Considerations

- **Stub changes affect all future generated code** — Review stub changes in PRs like code changes
- **Keep stubs simple** — Use placeholders for variables, not control structures

## Related Rules

- CUSTMAKE-RULE-001: Extend GeneratorCommand
- CUSTMAKE-RULE-002: Use $rootNamespace
- CUSTMAKE-RULE-003: Respect `--force`
- CUSTMAKE-RULE-004: Prefix custom placeholders
- CUSTMAKE-RULE-005: Keep stubs simple

## Related Skills

- Customize Laravel Stubs
- Generate Laravel Code with Blueprint
- Write Blueprint YAML DSL Definitions

## Success Criteria

- Custom `make:` command generates correctly-namespaced, properly-structured classes
- Placeholder replacement works correctly for all variables
- Command follows Laravel conventions (force flag, namespace handling)
- Team uses custom generators for consistent class structures
