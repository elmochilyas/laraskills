# Skill: Generate Laravel Code with Blueprint

## Purpose
Use Blueprint to scaffold production-ready Laravel components (models, migrations, controllers, form requests, tests) from YAML definition files, accelerating new project development.

## When To Use
- Starting new Laravel projects to scaffold initial application structure
- CRUD-heavy applications with standard patterns
- Teams wanting rapid prototyping with production-quality code
- Projects where data model is well-understood before coding begins

## When NOT To Use
- Existing projects with established code that doesn't match Blueprint conventions
- Applications with highly custom business logic beyond CRUD
- When you need full control over every generated line

## Prerequisites
- `blueprint/blueprint` installed via Composer
- `draft.yaml` file at project root

## Inputs
- `draft.yaml` — YAML definition of models, controllers, relationships, validation
- Blueprint cache (stored in `storage/framework/cache/blueprint`)

## Workflow

1. **Install Blueprint:** Run `composer require --dev blueprint/blueprint`.

2. **Define Draft YAML:** Create `draft.yaml` at project root describing models with columns, data types, modifiers, and relationships. Define controllers with actions and validation rules.

3. **Validate Draft:** Run `php artisan blueprint:validate` to catch YAML errors before generation.

4. **Generate Code:** Run `php artisan blueprint:build` to generate all components. Use `--only=model,migration` to limit scope when not everything is needed.

5. **Review Generated Code:** Check generated migrations for correct schema, controllers for proper validation and authorization, and tests for accuracy.

6. **Customize Generated Code:** Add business logic to service classes (not in generated controllers). Controllers stay thin; add logic separately.

7. **Iterate in VCS:** Generate from updated draft, review changes, commit. Blueprint regenerates only from draft changes — don't edit generated files directly and expect them to be preserved.

## Validation Checklist

- [ ] `draft.yaml` is version-controlled and reviewed in PRs
- [ ] `blueprint:validate` passes without errors
- [ ] Generated migrations have correct columns, types, and indexes
- [ ] Generated controllers have proper validation from draft rules
- [ ] Tests generated and pass
- [ ] Business logic added to service classes, not controllers
- [ ] Only needed components generated (use `--only` flag)

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Draft not version-controlled | Lost authoritative specification |
| Generated code not reviewed | Incorrect migrations or controllers merged |
| Editing generated files directly | Changes overwritten on next generation |
| YAML validation errors | Draft errors caught by `blueprint:validate` |

## Decision Points

- **Use for new Laravel projects** to scaffold initial application structure
- **Use for CRUD-heavy apps** with standard patterns
- **Don't use for existing projects** with established code that doesn't match Blueprint conventions
- **Resource controllers for web apps;** API controllers for API-first apps

## Performance/Security Considerations

- **Generation speed:** < 30 seconds for 10-15 models
- **Cache invalidation:** Run `php artisan blueprint:erase` to clear cache if generation produces unexpected results
- **Review generated code:** Always review migrations and controllers before committing

## Related Rules

- BPGEN-RULE-001: Version control the draft
- BPGEN-RULE-002: Review generated code
- BPGEN-RULE-003: Use `--only` flag
- BPGEN-RULE-005: Validate in CI
- BPGEN-RULE-009: Business logic in service classes

## Related Skills

- Write Blueprint YAML DSL
- Customize Laravel Stubs
- Create Custom Artisan Make Commands

## Success Criteria

- Blueprint generates correct models, migrations, controllers, and tests from YAML definitions
- Generated code passes validation and tests
- Business logic is in service classes, not generated controllers
- Draft file serves as authoritative data model documentation
