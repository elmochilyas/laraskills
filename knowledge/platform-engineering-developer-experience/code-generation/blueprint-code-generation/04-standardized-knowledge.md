# 04-Standardized Knowledge: Blueprint Code Generation

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | blueprint-code-generation |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | blueprint-yaml-dsl, custom-artisan-make-commands, stub-customization-laravel |
| **Framework/Language** | Blueprint, Laravel, PHP, YAML, Artisan |

## Overview

Blueprint is an open-source code generation tool for Laravel that reads YAML definition files and generates complete, production-ready components: models, controllers, form requests, migrations, factories, seeders, tests, events, jobs, mailables, notifications, and routes. It follows Laravel conventions — generated code uses type hints, form request validation, resource classes, and proper model relationships. You describe your data model and controllers in a `draft.yaml` file, and Blueprint generates all associated Laravel components.

## Core Concepts

- **draft.yaml**: Blueprint definition file describing models, controllers, relationships, and validation
- **Model Definitions**: YAML blocks defining name, columns, data types, modifiers, and relationships
- **Controller Definitions**: resourceful actions with validation rules, authorization, response types
- **Generated Components**: model, migration, controller, form request, factory, seeder, test
- **Blueprint Cache**: caches analyzed definitions for faster regeneration; invalidate with `blueprint:erase`
- **Tracing**: `--trace` flag for detailed generation process output

## When to Use

- Starting new Laravel projects to scaffold the initial application structure
- Rapid prototyping — define models, generate, validate, iterate
- API-first applications where data model maps directly to API resources
- CRUD-heavy applications with standard patterns
- Teams wanting to enforce consistent code structure across all components

## When NOT to Use

- Applications requiring highly custom business logic beyond CRUD
- Existing projects with established code that doesn't match Blueprint conventions
- When you need fine-grained control over every generated file
- Projects with non-standard directory structures or namespace configurations

## Best Practices (WHY)

- **Version control the draft**: `draft.yaml` is the authoritative specification — commit it, review changes in PRs
- **Review generated code**: always review generated migrations and controllers before committing
- **Use `--only` flag**: limit generation scope with `--only=model,migration` when you don't need everything
- **Iterate in VCS**: generate, customize, commit; regenerate only from updated draft, not over customizations
- **Validate in CI**: `php artisan blueprint:validate` ensures the DSL is well-formed before generation

## Architecture Guidelines

- Keep `draft.yaml` at project root by convention; override with `--path`
- Use resource controllers for web apps, API controllers for API-first apps
- Let Blueprint generate form requests for validation by default
- After generation, add custom business logic in service classes (generated controllers stay thin)
- For complex multi-file patterns, combine Blueprint with custom generator commands

## Performance Considerations

- Generates a complete CRUD component in 1-3 seconds — much faster than individual `make:` commands
- YAML parsing: <10ms for typical files; 50-100ms for 50+ model files
- Cached definitions speed up regeneration by 50-80%
- Generation time dominated by file I/O, not parsing

## Security Considerations

- Review generated form requests for proper authorization gates
- Generated migrations should include appropriate indexes and foreign keys
- Blueprint follows Laravel security conventions (CSRF, mass assignment protection)
- Always review generated code for security-sensitive operations

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Over-reliance on generation | Never customizing generated code | Assuming generation is sufficient | Missing business logic | Customize after generation |
| Not reviewing migrations | Default schema may not match requirements | Trusting defaults | Wrong indexes, FKs, cascades | Review every migration |
| Draft/code drift | Updating YAML without regenerating | Forgetting to run blueprint:build | Code out of sync with spec | CI validation or pre-commit hook |
| Regenerating over custom code | Losing manual changes | Running build after customization | Lost customizations | Use VCS; treat generated code as starting point |
| Bad YAML indentation | Parsing failures | YAML syntax errors | Generation fails | Use blueprint:validate and YAML linter |

## Anti-Patterns

- **Complete Automation**: trying to generate 100% of application code — real apps need custom business logic
- **Draft as Documentation Only**: writing draft.yaml but never regenerating when it changes
- **Ignoring Tests**: Blueprint generates tests — skipping review means untested generated components
- **One Giant Draft**: putting every model in a single massive `draft.yaml` — split by bounded context
- **Forced Blueprint Fit**: contorting application design to match Blueprint's patterns

## Examples

```yaml
# draft.yaml
models:
  Post:
    title: string:400
    content: text:nullable
    published_at: timestamp:nullable
    user_id: id
    relationships:
      belongsTo: User
      hasMany: Comment

  Comment:
    body: text
    post_id: id
    user_id: id
    relationships:
      belongsTo: Post, User

controllers:
  Post:
    resource
    api: true
  Comment:
    resource
    only: store, update, destroy
```

## Related Topics

- blueprint-yaml-dsl — DSL syntax and features
- custom-artisan-make-commands — extending Laravel's make commands
- stub-customization-laravel — customizing generation templates
- laravel-shift — automated Laravel upgrades

## AI Agent Notes

- Blueprint generates production-ready code following latest Laravel conventions
- It uses Laravel's stub system — custom stubs via `stub:publish` are respected
- For CI pipelines, run `blueprint:validate` before `blueprint:build` to catch errors early
- Generated code is editable PHP — not read-only artifacts

## Verification

- [ ] `draft.yaml` committed to version control
- [ ] `blueprint:build` generates all expected files
- [ ] Generated migrations have correct columns, types, indexes, foreign keys
- [ ] Generated controllers use form requests and resource classes
- [ ] Generated tests pass (Pest or PHPUnit)
- [ ] `blueprint:validate` passes without errors
- [ ] No drift between draft and generated code (CI check)
- [ ] Custom business logic added in service classes (not in generated files)
