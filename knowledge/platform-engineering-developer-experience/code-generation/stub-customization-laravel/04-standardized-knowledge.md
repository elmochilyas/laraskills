# 04-Standardized Knowledge: Stub Customization in Laravel

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | stub-customization-laravel |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | custom-artisan-make-commands, custom-generator-commands, blueprint-code-generation |
| **Framework/Language** | Laravel Artisan, Stubs, PHP |

## Overview

Laravel's stub customization system overrides default templates used by `make:` commands. `php artisan stub:publish` copies vendor stubs to the project's `stubs/` directory. Modified stubs are automatically used by all `make:` commands. Custom stubs enforce coding standards (consistent docblocks, typing), add project-specific boilerplate (base classes, traits), and automate repetitive patterns. Stub customization is the foundation for custom generator commands and architecture enforcement.

## Core Concepts

- **Stub Files**: PHP templates with `{{ placeholder }}` variables for dynamic content
- **Placeholder Variables**: `{{ class }}`, `{{ namespace }}`, `{{ rootNamespace }}`, `{{ namespacedModel }}`, `{{ model }}`, `{{ modelVariable }}`
- **Stub Publishing**: `php artisan stub:publish` copies vendor stubs to project `stubs/`
- **Stub Resolution Order**: Laravel checks `stubs/` first, then falls back to vendor stubs
- **Custom Stub Files**: files in `stubs/` not from vendor set can be referenced by custom generators

## When to Use

- Enforcing team coding standards (type hints, docblocks, declare(strict_types=1))
- Adding project-specific base classes, traits, and interfaces to all generated classes
- Standardizing namespace and import conventions across the codebase
- Reducing boilerplate for repetitive class structures
- Creating foundation for custom generator commands

## When NOT to Use

- When traits or base classes are more appropriate (reuse at runtime vs template at generation time)
- For business logic that should not be hard-coded into class scaffolding
- When different projects need different conventions (use project-specific stubs)
- For one-off customizations (modify the generated file directly)

## Best Practices (WHY)

- **Version-control stubs**: stub changes affect all future generated code — review in PRs like code
- **Keep stubs generic**: stubs are structural templates, not business logic containers
- **Use traits for behavior**: stubs add imports and traits; traits define the actual behavior
- **Test stub output**: run `make:` commands and verify generated files after stub changes
- **Document conventions**: tell the team what conventions are encoded in stubs
- **Diff after upgrades**: compare old vs new vendor stubs after Laravel upgrades to port changes

## Architecture Guidelines

- Publish stubs once, then manage via version control (never re-publish over customizations)
- Organize custom stubs in `stubs/` with descriptive names: `stubs/model.stub`, `stubs/controller.stub`
- For team-specific patterns, create dedicated stubs referenced by custom generator commands
- Keep stubs simple — use placeholders for variables, not control structures
- Use `declare(strict_types=1)` via stubs to enforce strict typing across all generated code

## Performance Considerations

- Stub file I/O: ~1ms per generation — negligible for interactive use
- Placeholder replacement: microseconds; dominated by file writing time
- Custom stubs don't affect runtime performance — only generation time

## Security Considerations

- Stubs are PHP templates — sanitize user input before embedding in generated code
- Never hard-code credentials, API keys, or secrets in stubs
- Generated files should follow secure coding practices
- Review stub changes for security implications (they affect all future generated code)

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Publishing but not customizing | No visible change, team unaware of stubs | Not following through | Stubs unused | Customize after publishing |
| Re-publishing over changes | Overwriting custom stubs | Running publish again | Lost customizations | Manage stubs in VCS |
| Hard-coding too much | Business logic in stubs | Over-engineering | Brittle stubs | Keep stubs structural only |
| Not testing stub output | Customizations not verified | Assuming it works | Broken generated code | Test after every stub change |
| Missing package stubs | New package stubs not published | Forgetting to check | Outdated scaffolding | Re-publish after package updates |

## Anti-Patterns

- **Stub as Code Repository**: putting business logic, algorithms, or application rules in stubs
- **No Documentation**: team doesn't know what conventions stubs enforce
- **Stale Stubs**: stubs that don't reflect current coding standards or Laravel version
- **Over-Customization**: modifying every stub when only a few need changes
- **Stub Dependency**: generated code that depends on stub-specific imports that don't exist in the project

## Examples

```bash
# Publish stubs for customization
php artisan stub:publish

# Example: custom model stub (stubs/model.stub)
```
```php
<?php

namespace {{ namespace }};

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Concerns\HasUuid;

class {{ class }} extends Model
{
    use HasFactory, SoftDeletes, HasUuid;

    protected $fillable = [
        //
    ];

    protected function casts(): array
    {
        return [
            //
        ];
    }
}
```

## Related Topics

- custom-artisan-make-commands — extending Laravel's make commands
- custom-generator-commands — building custom generators
- blueprint-code-generation — YAML-based code generation
- code-generation-scaffolding — domain overview

## AI Agent Notes

- `stub:publish` has been available since Laravel 5.0; copies from framework's Console directory
- Laravel 8.x introduced `{{ placeholders }}` replacing older `DummyClass` convention
- Laravel 11+ changed stub organization — multiple sources can publish to `stubs/` with naming conventions
- Available stubs include: model, controller, migration, seeder, factory, test, request, policy, event, listener, job, mail, notification, rule, command, channel, middleware, provider, resource, exception, cast, scope, observer

## Verification

- [ ] `stub:publish` copied stubs to project `stubs/` directory
- [ ] Customized stubs in version control
- [ ] `make:model` generates file with custom stubs content
- [ ] `make:controller` generates file with custom stubs content
- [ ] All custom placeholders implemented in replacement logic
- [ ] Generated files pass linting and static analysis
- [ ] Team documented on what conventions stubs enforce
- [ ] Vendor stub changes reviewed after Laravel upgrades
- [ ] No hard-coded secrets or environment-specific values in stubs
