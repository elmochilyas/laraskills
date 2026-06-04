# Skill: Customize Laravel Stubs for Code Generation

## Purpose
Publish and customize Laravel's Artisan stubs to enforce team coding standards, add project-specific boilerplate, and automate repetitive patterns across all generated code.

## When To Use
- Enforcing team coding standards (type hints, docblocks, `declare(strict_types=1)`)
- Adding project-specific base classes, traits, and interfaces to all generated classes
- Standardizing code structure across the team

## When NOT To Use
- For business logic (stubs are structural templates, not behavior containers)
- When default Laravel stubs are acceptable
- When the team hasn't agreed on coding conventions

## Prerequisites
- Laravel application with `make:` commands
- Understanding of stub template syntax

## Inputs
- Default vendor stubs (published via `stub:publish`)
- Customized stubs in `stubs/` directory

## Workflow

1. **Publish Vendor Stubs:** Run `php artisan stub:publish` to copy all vendor stubs to `stubs/` directory. This creates files like `stubs/model.stub`, `stubs/controller.stub`, `stubs/migration.stub`.

2. **Customize Stubs:** Edit stub files to add: `declare(strict_types=1)` after `<?php`, type hints on method signatures, `use` imports for base classes and traits, consistent docblock format, and property type hints.

3. **Use Traits for Behavior:** In stubs, add imports and trait `use` statements. Define the actual behavior in the trait files — this keeps stubs clean and behavior reusable.

4. **Test Stub Output:** Run `php artisan make:model TestModel` and verify the generated file has the expected customizations.

5. **Version-Control Stubs:** Commit `stubs/` directory to version control. Stub changes affect all future generated code and must be reviewed in PRs.

6. **Diff After Laravel Upgrades:** After upgrading Laravel, re-publish stubs (`stub:publish`), diff the new vendor stubs against your customized versions, and port any structural changes.

7. **Document Conventions:** Document what conventions are encoded in stubs in the team's `CONTRIBUTING.md`.

## Validation Checklist

- [ ] `stubs/` directory version-controlled
- [ ] `declare(strict_types=1)` added to all stubs
- [ ] Base class imports and trait `use` statements added
- [ ] Generated files match expected structure
- [ ] All team members aware of stub conventions
- [ ] Upgrades: stubs diffed and updated
- [ ] Stubs reviewed in PRs

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Re-publishing over custom stubs | Customizations lost; manage via VCS, never re-publish |
| Stubs too complex | Stubs with control structures are hard to maintain; keep simple |
| Stale after Laravel upgrade | New stub variables missing; diff and port changes |
| Business logic in stubs | Should be in traits, not stubs |

## Decision Points

- **Use when enforcing team coding standards** — Type hints, docblocks, `declare(strict_types=1)`
- **Use when adding project-specific boilerplate** — Base classes, traits, interfaces
- **Don't use for business logic** — Stubs are structural templates, not business logic containers
- **Use traits for behavior** — Stubs add imports and traits; traits define the actual behavior

## Performance/Security Considerations

- **Stub changes are global:** All generated code from `make:` commands will include stub changes
- **Review in PRs:** Stub changes should be reviewed like any other code change
- **Diff after upgrades:** New Laravel stub variables may not be present in old custom stubs

## Related Rules

- STUB-RULE-001: Version-control stubs
- STUB-RULE-002: Keep stubs generic
- STUB-RULE-003: Use traits for behavior
- STUB-RULE-004: Test stub output
- STUB-RULE-006: Diff after upgrades

## Related Skills

- Create Custom Artisan Make Commands
- Generate Laravel Code with Blueprint
- Write Blueprint YAML DSL Definitions

## Success Criteria

- All generated `make:` command output follows team coding conventions
- `declare(strict_types=1)` is present in every generated PHP file
- Base classes and traits are consistently applied
- Stub customizations survive Laravel upgrades (diffed and ported)
