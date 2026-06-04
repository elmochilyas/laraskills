# Directory Structure

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Design |
| Knowledge Unit | Directory Structure |
| Classification | Foundation |
| Last Updated | 2026-06-02 |

## Overview

Model file organization impacts team productivity, code discoverability, and domain cohesion. Laravel defaults to `app/Models/`, but as applications grow, grouping models by domain or feature becomes essential. This KU covers organizational patterns and tradeoffs.

## Core Concepts

- **`app/Models` convention** (Laravel 8+): Default model directory with `App\Models` namespace
- **Flat structure**: All models in one directory — simple for small apps
- **Domain-based subdirectories**: `app/Models/{Domain}/{Entity}` — organized by business domain
- **Feature-based grouping**: Models alongside related controllers, policies, and tests per feature
- **Module-based structure**: `app/Modules/{Module}/Models/` — encapsulated bounded contexts

## When To Use

- **Flat**: Small apps (<20 models)
- **Domain subdirectories**: Medium-large apps with clear domain boundaries
- **Feature grouping**: Feature-based development workflow
- **Module structure**: Large apps with bounded contexts (DDD)

## When NOT To Use

- Over-engineering the structure before the app needs it (use flat until it hurts)
- Mixing patterns — choose one and be consistent

## Best Practices

- **Start flat, split by domain when needed**: A flat `app/Models/` directory is fine for the first 20-30 models. Split into domain subdirectories when navigation becomes difficult.
- **Match namespace to directory**: Models in `app/Models/Billing/Invoice.php` should have namespace `App\Models\Billing`. This ensures autoloading works without issues.
- **Be consistent**: Choose one organizational pattern and apply it consistently. Mixing flat and subdirectory approaches causes confusion.

## Architecture Guidelines

- Default: `app/Models/{Model}.php` with `App\Models` namespace
- Growing: `app/Models/{Domain}/{Model}.php` with `App\Models\{Domain}` namespace
- DDD: `app/Modules/{Module}/Models/{Model}.php` with `App\Modules\{Module}\Models` namespace

## Examples

```
app/Models/
├── User.php
├── Post.php
├── Billing/
│   ├── Invoice.php
│   └── Payment.php
└── Support/
    ├── Ticket.php
    └── TicketReply.php
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Base Model Class |
| Closely Related | Model Conventions |
| Advanced | Bounded Contexts |

## AI Agent Notes

- Start flat, split by domain when navigation suffers
- Match namespace to directory
- Be consistent across the application

## Verification

- [ ] Namespace matches directory structure
- [ ] Consistent pattern is used across all models
- [ ] Directory structure is appropriate for app size
