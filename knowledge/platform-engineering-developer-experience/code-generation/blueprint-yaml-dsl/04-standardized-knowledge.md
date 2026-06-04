# 04-Standardized Knowledge: Blueprint YAML DSL

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | blueprint-yaml-dsl |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | blueprint-code-generation, stub-customization-laravel, custom-artisan-make-commands |
| **Framework/Language** | Blueprint, Laravel, PHP, YAML |

## Overview

Blueprint's YAML DSL is the declarative specification format for defining Laravel application components. Written in `draft.yaml`, it describes models with columns, data types, modifiers, and relationships; controllers with actions, validation rules, authorization, and response types. The DSL supports column definitions, relationship inference from foreign key conventions, pivot tables, UUID/ULID support, soft deletes, timestamps control, and polymorphic relationships — all in a concise, readable format.

## Core Concepts

- **Model Definitions**: YAML keys under `models:` with column definitions as key-value pairs
- **Data Types**: `string`, `text`, `integer`, `bigInteger`, `boolean`, `date`, `datetime`, `float`, `decimal`, `json`, `uuid`, `ulid`
- **Modifiers**: chained with colon: `email: string:unique`, `age: integer:nullable:default(18)`
- **Relationships**: auto-detected from FK columns (`user_id` → belongsTo User); explicit `relationships:` block for custom relations
- **Controller Actions**: `resource`, `api`, or specific actions with inline validation rules
- **Pivot Tables**: many-to-many with `belongsToMany: Role` and `pivot: true`

## When to Use

- Defining application data models before writing any PHP code
- Specifying CRUD controller behavior with validation rules
- Documenting data architecture in a machine-readable format
- Team collaboration — product owners describe models, developers generate code
- Rapid iteration on data model during early project phases

## When NOT to Use

- Defining behavior beyond data structure (business logic, event handling, complex queries)
- For models with non-standard column types or database-specific features
- When the DSL's inferencing produces incorrect results (use explicit relationships)
- For applications with complex authorization rules that can't be expressed inline

## Best Practices (WHY)

- **Use explicit relationships for non-standard FKs**: auto-inference fails with `author_id` → `User`? Blueprint infers from column prefix only
- **Validate before building**: run `php artisan blueprint:validate` to catch YAML errors before generation
- **Keep models singular**: `User`, `Post`, `Comment` — Blueprint expects singular model names
- **Don't specify `id` unless non-standard**: Blueprint auto-generates auto-incrementing `id` by default
- **Use `timestamps: false` deliberately**: disable only on models that genuinely don't need timestamps
- **Group related models**: organize YAML with logical grouping for readability

## Architecture Guidelines

- Start with models, then add controllers for models that need CRUD endpoints
- Use `api: true` on controllers for API-only apps (excludes `create`/`edit` views)
- Define utility/value objects as models without controller sections
- Document custom DSL conventions or deviations in project README
- The `draft.yaml` should be treated as source code — reviewed in PRs

## Performance Considerations

- YAML parsing: <20ms for 20 models; 100-200ms for 50+ models
- DSL parsing is a one-time cost per `blueprint:build` invocation
- Performance impact of DSL complexity is negligible compared to generation I/O

## Security Considerations

- Validation rules defined in DSL translate to form request validation — review for injection protection
- Authorization not enforced by DSL; add policies after generation
- DSL doesn't handle sensitive data encryption — configure casts on generated models
- Review generated mass assignment protection (`$fillable`/`$guarded`)

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Incorrect indentation | 3 spaces instead of 2, or mixed tabs/spaces | YAML sensitivity | Parse failure | Use YAML linter, consistent editor config |
| Missing type for relationships | `user_id: integer` instead of letting Blueprint infer | Over-specification | No relationship generated | Let Blueprint infer from naming convention |
| Inconsistent naming | Mixing singular/plural model names | Carelessness | Incorrect generated code | Use singular consistently |
| Over-specifying id column | Defining `id: integer` | Old habit | Works but redundant | Omit id (auto-generated) |
| Nested models not grouped | Flat structure for 30+ models | No organization | Hard to read draft | Group related models logically |

## Anti-Patterns

- **DSL Complexity**: trying to express business logic through the DSL — it's for data structure, not behavior
- **No Validation CI**: committing invalid YAML that breaks `blueprint:build`
- **Inconsistent Column Naming**: mixing `first_name` and `firstname` — choose convention and stick to it
- **Relationship Over-Inference**: relying on auto-detection for non-obvious FKs without explicit definition
- **Draft as Afterthought**: writing draft.yaml after writing PHP code, rather than as the specification

## Examples

```yaml
models:
  Team:
    name: string
    slug: string:unique
    owner_id: id
    relationships:
      belongsTo: User
      hasMany: Project

  Project:
    name: string:200
    description: text:nullable
    team_id: id
    due_date: date:nullable
    status: string:default(active)
    relationships:
      belongsTo: Team
      hasMany: Task

  Task:
    title: string
    description: text:nullable
    assigned_to: id:nullable
    project_id: id
    completed_at: timestamp:nullable
    relationships:
      belongsTo: Project, User
      morphMany: Comment

  Comment:
    body: text
    commentable_id: id
    commentable_type: string
    user_id: id
    relationships:
      belongsTo: User
      morphTo: Commentable

controllers:
  Team:
    resource
  Project:
    resource
    api: true
  Task:
    resource
    only: index, store, update
```

## Related Topics

- blueprint-code-generation — generating code from DSL
- custom-artisan-make-commands — extending Laravel's make commands
- stub-customization-laravel — customizing generation templates

## AI Agent Notes

- Blueprint DSL was inspired by Rails scaffolding; uses 2-space YAML indentation
- Column type modifiers (`:unique`, `:nullable`, `:default(value)`) are a Blueprint innovation
- The DSL intentionally omits behavior definitions (events, observers) to stay focused on data structure
- When generating draft.yaml, always include `relationships:` block for non-obvious relations

## Verification

- [ ] YAML validates with `blueprint:validate`
- [ ] All model names are singular and consistently named
- [ ] Columns use appropriate data types matching business requirements
- [ ] Foreign key columns follow `model_id` naming convention
- [ ] Relationships explicitly defined for non-standard FK names
- [ ] Controller actions defined with validation rules
- [ ] Timestamps, soft deletes, UUIDs configured as needed
- [ ] No YAML indentation or syntax errors
- [ ] Draft committed to version control
