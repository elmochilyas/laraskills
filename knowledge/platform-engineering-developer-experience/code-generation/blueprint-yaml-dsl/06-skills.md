# Skill: Write Blueprint YAML DSL Definitions

## Purpose
Create `draft.yaml` files using Blueprint's YAML DSL to declaratively define Laravel application data models, controllers, relationships, and validation rules.

## When To Use
- Defining application data models before writing any PHP code
- Blueprint code generation workflow
- Documenting application architecture in a machine-readable format
- Team communication about data structure via a shared DSL

## When NOT To Use
- For business logic (DSL is for data structure, not behavior)
- When relationships have unconventional foreign key names (explicit definition needed)
- When data model is not yet understood (explore manually first)

## Prerequisites
- Blueprint installed
- Understanding of Laravel model relationships
- Basic YAML syntax knowledge

## Inputs
- `draft.yaml` — Blueprint specification file

## Workflow

1. **Create draft.yaml:** At project root, create the YAML file starting with `models:` key. List each model as a top-level key under `models:`.

2. **Define Model Columns:** For each model, list columns as key-value pairs. Use `column_name: data_type` format. Use modifiers with colon syntax: `email: string:unique`, `age: integer:nullable:default(18)`.

3. **Configure Relationships:** Use foreign key conventions (`user_id` → `belongsTo User`) for auto-detection. For non-standard FKs, use an explicit `relationships:` block. Use `belongsToMany: Role` with `pivot: true` for many-to-many.

4. **Define Controller Actions:** Under `controllers:`, list each model with `resource: true` (CRUD with views), `api: true` (API-only), or specific action methods with inline validation rules.

5. **Set Data Type Modifiers:** Common types: `string`, `text`, `integer`, `bigInteger`, `boolean`, `date`, `datetime`, `float`, `decimal`, `json`, `uuid`, `ulid`. Use modifiers: `unique`, `nullable`, `default(value)`, `unsigned`.

6. **Validate YAML:** Run `php artisan blueprint:validate` to catch syntax errors before generation. Fix any reported issues.

7. **Generate and Iterate:** Run `php artisan blueprint:build` to generate code. Review output, then iterate on the draft.

## Validation Checklist

- [ ] Models use singular names (`User`, `Post`, `Comment`)
- [ ] `id` columns not specified (Blueprint auto-generates)
- [ ] `timestamps` explicitly set to `false` only on models that genuinely don't need them
- [ ] Foreign keys follow convention for auto-detection (`user_id`)
- [ ] Explicit `relationships:` block for non-standard FK names
- [ ] YAML validated with `blueprint:validate`
- [ ] `draft.yaml` committed to version control

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Non-standard FK names without explicit relationship | Blueprint generates wrong relationship type |
| Missing `id` on pivot tables | Pivot fails without explicit ID |
| `timestamps: false` on models needing timestamps | Missing created_at/updated_at on important data |

## Decision Points

- **Use DSL for data model definition before writing PHP** — Document architecture in machine-readable format
- **Don't use for business logic** — DSL is for data structure, not behavior
- **Start with models, then controllers** — Models first for data structure, controllers for CRUD

## Performance/Security Considerations

- **draft.yaml as source code** — Treat as source code; review in PRs, commit to VCS
- **Validation** — Always run `blueprint:validate` before generating to catch errors

## Related Rules

- BPYAML-RULE-001: Use explicit relationships for non-standard FKs
- BPYAML-RULE-002: Validate before building
- BPYAML-RULE-003: Keep models singular
- BPYAML-RULE-004: Don't specify `id`
- BPYAML-RULE-005: Use `timestamps: false` deliberately

## Related Skills

- Generate Laravel Code with Blueprint
- Customize Laravel Stubs
- Create Custom Artisan Make Commands

## Success Criteria

- `draft.yaml` defines complete data model with correct columns, types, and relationships
- Validation passes without errors
- Generated code accurately reflects the YAML specification
- Draft file serves as authoritative, version-controlled data model documentation
