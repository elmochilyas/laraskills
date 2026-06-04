# DTO Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Organization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

Where DTO classes live in the project structure affects discoverability, naming conflicts, and team conventions. The three dominant organizational strategies are per-domain placement (DTOs alongside domain code), per-operation grouping (DTOs by action), and a centralized `app/DTOs/` directory. Each strategy optimizes for a different concern: domain cohesion, action locality, or discoverability.

The engineering decision depends on team size and application complexity. Small teams with few DTOs benefit from `app/DTOs/` flat structure. Large teams with modular code benefit from per-domain DTOs. Per-operation DTOs are used in action-heavy architectures where DTO names are unique to each operation.

## Core Concepts

- **Organizational Axes:** Domain (business domain), Operation (action/service), Layer (technical layer), Entry point (HTTP/CLI/Queue)
- **Naming Disambiguation:** When two DTOs share a conceptual name, disambiguate by context (e.g., `UserDto`, `AdminUserDto`, `UserRegistrationDto`) or by namespace (`User/CreateUserDto`, `User/UpdateProfileDto`)
- **Autoloading:** PSR-4 maps directory structure to namespace automatically — no configuration changes needed regardless of strategy
- **Cross-Domain DTOs:** Shared DTOs (used across multiple domains) live in a shared location (`app/DTOs/` or a `Shared` domain)

## When To Use

- **Centralized (`app/DTOs/`):** Small teams (< 5), small applications (< 30k LOC), few DTOs (< 15)
- **Per-Domain:** Medium-large teams, modular monolith, > 15 DTOs, strong domain boundaries
- **Per-Operation:** Action-heavy architecture, DTOs are tightly coupled to specific operations
- **Hybrid:** Large applications (> 100k LOC) with both shared and domain-specific DTOs

## When NOT To Use

- Do NOT mix organizational strategies — using both `app/DTOs/UserDto.php` and `app/Domains/User/DTOs/UserDto.php` creates duplicate names and import confusion
- Do NOT place DTOs inside `app/Http/Controllers/DTOs/` — DTOs are not HTTP-specific
- Do NOT nest deeper than 3-4 directory levels from `app/` — `app/Domains/Sales/Order/DTOs/V2/Internal/OrderDto.php` is too deep
- Do NOT define DTOs inline in action files (multiple classes per file) — violates PSR-1 and complicates autoloading

## Best Practices (WHY)

- **Why centralized for small apps:** Easy discoverability — every DTO is in one directory. New developers know exactly where to look.
- **Why per-domain for large apps:** Domain cohesion — DTOs are co-located with their domain logic. Reduces cognitive load when working within a domain.
- **Why per-operation in action-heavy architectures:** DTOs are isolated per action — refactoring an action only affects its own DTO. Files are self-contained.
- **Why consistent naming:** `Dto` vs `Data` suffix must be consistent across the project. Mixing creates confusion and IDE autocomplete pollution.

## Architecture Guidelines

- Strategy selection by DTO count: < 15 → centralized, 15-50 → per-domain or per-operation, 50+ → per-domain with shared DTOs
- Naming convention: `UserDto`, `CreateUserDto`, `UserData` (pick one suffix per project)
- Cross-domain shared DTOs in `app/DTOs/`, domain-specific DTOs in `app/Domains/{Domain}/DTOs/`
- Standardize file structure with a team template (namespace, readonly class, construct, factories, toArray)
- Add orphan DTO detection to CI (PHPStan level 6 detects unused classes)

## Performance

Organizational strategy has zero runtime performance impact. PSR-4 resolution is O(1) per file regardless of directory depth. The only consideration is IDE performance — directories with 100+ files may cause slower initial indexing in some IDEs.

## Security

- DTOs in `app/Http/` can create confusion about layer boundaries — keep DTOs separate from HTTP code
- No security implications from organizational strategy itself

## Common Mistakes

1. **Mixing Organizational Strategies:** Inconsistent placement creates duplicate class names and import confusion. Pick one strategy and apply it consistently across the project.

2. **Overly Deep Nesting:** More than 4 directory levels from `app/` makes imports long and navigation difficult. Flatten to maximum 3-4 levels.

3. **DTOs in Controllers Directory:** `app/Http/Controllers/DTOs/` mixes layers. DTOs are not HTTP-specific — keep them separate from controller code.

4. **Duplicate DTO Names Across Domains:** `Sales\OrderDto` and `Shipping\OrderDto` exist. Importing the wrong one causes type errors. Use distinct names or explicit `use` aliasing.

## Anti-Patterns

- **The Scattered DTOs:** DTOs placed arbitrarily across the codebase with no organizational strategy. Some in `app/DTOs/`, some in `app/Models/DTOs/`, some in `app/Helpers/`. Creates confusion and import chaos.
- **The Inline DTO:** DTO class defined in the same file as the action/service (multiple classes per file). Violates PSR-1, complicates autoloading, and prevents reuse.
- **The Deep Nesting:** `app/Domains/Sales/DTOs/V2/Internal/Cached/OrderDto.php` — too deep to navigate easily. Flatten to 3-4 levels max.

## Examples

### Centralized (Small App)
```
app/DTOs/
├── UserDto.php
├── OrderDto.php
└── AddressDto.php
```

### Per-Domain (Modular Monolith)
```
app/Domains/
├── Sales/
│   └── DTOs/
│       ├── OrderDto.php
│       └── OrderLineItemDto.php
├── Billing/
│   └── DTOs/
│       ├── InvoiceDto.php
│       └── PaymentDto.php
└── Shared/
    └── DTOs/
        └── UserDto.php
```

### Per-Operation (Action-Heavy)
```
app/Actions/CreateUser/
├── CreateUserAction.php
├── CreateUserDto.php
└── CreateUserResultDto.php
```

### Hybrid (Large Application)
```
app/
├── DTOs/                          # Cross-cutting / shared DTOs
│   ├── UserDto.php
│   └── PaginatedResultDto.php
└── Domains/
    ├── Sales/DTOs/                # Domain-specific DTOs
    └── Billing/DTOs/
```

## Related Topics

- **DTO Fundamentals** — baseline DTO definition
- **Feature-based Application Structure** — DTO organization in modular code
- **Directory Convention Strategies** — overall directory structure
- **Action Organizational Strategies** — per-action DTO placement

## AI Agent Notes

- Create DTOs in `app/DTOs/` for small projects; use per-domain for larger projects
- Use consistent suffix: `Dto` for plain DTOs, `Data` for spatie/laravel-data objects
- Never place DTOs in HTTP-related directories
- Follow PSR-4 namespace conventions — no custom autoloading needed
- For modular monoliths, each module has its own DTO directory

## Verification

- [ ] DTO organization strategy is consistent across the entire project
- [ ] DTOs are not placed in HTTP-related directories
- [ ] Directory nesting does not exceed 3-4 levels from `app/`
- [ ] DTO naming conventions (suffix, casing) are consistent
- [ ] No duplicate DTO class names exist
- [ ] Orphaned DTO detection is configured in CI
- [ ] Team template is established for new DTO files
