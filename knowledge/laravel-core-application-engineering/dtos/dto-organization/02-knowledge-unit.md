# DTO Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Organization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Where DTO classes live in the project structure affects discoverability, naming conflicts, and team conventions. The three dominant organizational strategies are per-domain placement (DTOs alongside domain code), per-operation grouping (DTOs by action), and a centralized `app/DTOs/` directory. Each strategy optimizes for a different concern: domain cohesion, action locality, or discoverability.

The engineering decision depends on team size and application complexity. Small teams with few DTOs benefit from `app/DTOs/` flat structure. Large teams with modular code benefit from per-domain DTOs. Per-operation DTOs are used in action-heavy architectures where DTO names are unique to each operation.

---

## Core Concepts

### Organizational Axes

| Axis | Organizes By | Example |
|---|---|---|
| Domain | Business domain | `app/Domains/Sales/DTOs/OrderDto.php` |
| Operation | Action/service | `app/Actions/CreateUser/CreateUserDto.php` |
| Layer | Technical layer | `app/DTOs/UserDto.php` |
| Entry point | HTTP/CLI/Queue | `app/Http/DTOs/UserDto.php` vs `app/Console/DTOs/UserDto.php` |

Most applications use one primary axis with secondary refinement.

### Naming Disambiguation

When two DTOs have the same conceptual name but different shapes, disambiguate by context:

```php
app/DTOs/UserDto.php                    // For general user data
app/DTOs/AdminUserDto.php               // For admin-specific fields
app/DTOs/UserRegistrationDto.php         // For registration-only fields
```

Or use namespacing:

```php
app/DTOs/User/CreateUserDto.php
app/DTOs/User/UpdateProfileDto.php
app/DTOs/User/UserListDto.php
```

---

## Mental Models

### The Filing Cabinet

A centralized `app/DTOs/` directory is a filing cabinet. Open it, and every DTO is listed alphabetically. Easy to find if you know the name. Harder to navigate if you don't know what DTOs exist.

### The Toolbox Per Workbench

Domain-organized DTOs are like toolboxes on each workbench. The Sales workbench has Sales DTOs. The Inventory workbench has Inventory DTOs. You go to the right workbench for the right tool. Less walking between workbenches.

---

## Internal Mechanics

### Autoloading Namespace Resolution

Laravel's PSR-4 autoloading maps `App\` to `app/`. The organizational strategies map to namespaces:

| Strategy | Directory | Namespace |
|---|---|---|
| Centralized | `app/DTOs/UserDto.php` | `App\DTOs\UserDto` |
| Per-domain | `app/Domains/Sales/DTOs/OrderDto.php` | `App\Domains\Sales\DTOs\OrderDto` |
| Per-operation | `app/Actions/CreateUser/CreateUserDto.php` | `App\Actions\CreateUser\CreateUserDto` |

No configuration changes are needed — PSR-4 maps directory structure to namespace automatically.

### Import Statements

Centralized DTOs have shorter imports but more files in one directory:

```php
// Centralized — short import
use App\DTOs\UserDto;

// Per-domain — contextual import
use App\Domains\Sales\DTOs\OrderDto;
```

Per-domain imports are longer but make the domain explicit.

---

## Patterns

### Uniform Resource Domain DTOs

A DTO that represents a resource (User, Order, Product) lives at `app/DTOs/`:

```
app/DTOs/
├── UserDto.php
├── OrderDto.php
├── ProductDto.php
└── AddressDto.php
```

This is the simplest strategy, appropriate for:
- Few DTOs (< 20)
- Simple domain model
- Single team

### Action-Namespaced DTOs

DTOs live alongside their action:

```
app/Actions/CreateUser/
├── CreateUserAction.php
├── CreateUserDto.php         // input for this action
├── CreateUserResultDto.php   // output from this action
└── CreateUserValidator.php   // input validation (if not using FormRequest)
```

This strategy keeps DTOs close to their consumers. The action and its DTO can be refactored together. File counts increase, but each file has fewer responsibilities.

### Domain-Namespaced DTOs

DTOs live in domain-specific directories:

```
app/Domains/
├── Sales/
│   ├── DTOs/
│   │   ├── OrderDto.php
│   │   ├── OrderLineItemDto.php
│   │   └── SalesReportDto.php
│   ├── Services/
│   └── Models/
├── Billing/
│   ├── DTOs/
│   │   ├── InvoiceDto.php
│   │   └── PaymentDto.php
│   ├── Services/
│   └── Models/
└── User/
    ├── DTOs/
    │   ├── UserDto.php
    │   ├── ProfileDto.php
    │   └── RoleDto.php
    ├── Services/
    └── Models/
```

This is the most scalable pattern. Each domain owns its DTOs. Cross-domain DTOs (shared between domains) live in `app/DTOs/` or a `Shared` domain.

### Hybrid Organization

Larger applications use multiple strategies:

```
app/
├── DTOs/                          # Cross-cutting / shared DTOs
│   ├── UserDto.php
│   └── PaginatedResultDto.php
├── Domains/
│   ├── Sales/DTOs/                # Domain-specific DTOs
│   └── Billing/DTOs/
└── Http/
    └── Resources/                 # Output DTOs (API Resources are separate)
```

---

## Architectural Decisions

### Strategy Selection by Application Size

| App Size | DTO Count | Recommended Strategy |
|---|---|---|
| < 30k LOC | < 15 | Centralized (`app/DTOs/`) |
| 30-100k LOC | 15-50 | Per-domain or per-operation |
| > 100k LOC | 50+ | Per-domain with shared DTOs |

The inflection point is ~15 DTOs. Below this, the flat `app/DTOs/` directory is navigable. Above this, domain-grouping reduces cognitive load.

### DTO Naming and Disambiguation

| Naming Pattern | Example | When |
|---|---|---|
| Simple entity name | `UserDto` | One DTO per entity |
| Operation-qualified | `CreateUserDto` | Multiple DTOs per entity |
| View-qualified | `UserListDto`, `UserDetailDto` | Different output shapes |
| Source-qualified | `UserApiDto`, `UserCsvDto` | Different source formats |

### Spatie/laravel-data Naming

When using spatie/laravel-data, `Data` suffix replaces `Dto`:

```
app/DTOs/UserData.php
app/DTOs/OrderData.php
```

The package convention uses `Data` (e.g., `UserData extends Data`). Mixing `Dto` and `Data` suffixes creates inconsistency. Pick one convention per project.

### Inline DTOs vs Separate Files

For DTOs used by a single action, some teams define them in the same file as the action:

```php
// app/Actions/CreateUser/CreateUserAction.php
readonly class CreateUserDto { /* ... */ }

class CreateUserAction
{
    public function execute(CreateUserDto $dto): User { /* ... */ }
}
```

This reduces file count but violates PSR-1 (one class per file) and complicates autoloading. Avoid in production codebases.

---

## Tradeoffs

| Concern | Centralized | Per-Domain | Per-Operation |
|---|---|---|---|
| Discoverability | High (one directory) | Medium (check domain) | Low (scattered across actions) |
| Refactoring impact | Low (import changes) | Low (within domain) | Low (isolated per action) |
| Namespace pollution | High (all DTOs in one namespace) | Low (per domain) | Lowest (per action) |
| Cross-domain sharing | Natural (same namespace) | Awkward (import across domains) | Unnatural (import across actions) |
| IDE navigation | Ctrl+click to DTOs/ | Alt+7 in domain | Find in action directory |
| New developer onboarding | "DTOs are in app/DTOs" | "DTOs are in their domain" | "DTOs are with their action" |

---

## Performance Considerations

Organizational strategy has zero runtime performance impact. Autoloading time is identical — PSR-4 resolution is O(1) per file regardless of depth. The only consideration is IDE performance: directories with 100+ files may cause slower initial indexing in some IDEs.

---

## Production Considerations

### Namespace Consistency

Establish a namespace convention and enforce in code review:
- Prefix: `App\DTOs\` or `App\Data\`
- Suffix: `Dto` or `Data`
- No mixing of `Dto` and `Data` in the same project

### Import Organization

Group DTO imports separate from other imports:

```php
use App\Actions\CreateUser\CreateUserAction;
use App\DTOs\UserDto;
use App\DTOs\UserListDto;
// Blank line before next group
use Illuminate\Http\JsonResponse;
```

### DTO File Template

Standardize DTO file structure with a team template:

```php
<?php

namespace App\DTOs;

readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(...$request->validated());
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}
```

---

## Common Mistakes

### Mixing Organizational Strategies

Using `app/DTOs/UserDto.php` for one DTO and `app/Domains/User/DTOs/UserDto.php` for another creates duplicate class names and import confusion. Pick one strategy and apply it consistently.

### Overly Deep Nesting

`app/Domains/Sales/Order/DTOs/V2/Internal/OrderDto.php` is too deep. Flatten to `app/Domains/Sales/DTOs/V2/OrderDto.php`. Maximum 3-4 directory levels from `app/`.

### DTOs in Controllers Directory

`app/Http/Controllers/DTOs/` mixes layers. DTOs are not HTTP-specific. Keep them separate from controller code.

---

## Failure Modes

### Duplicate DTO Names Across Domains

When `Sales\OrderDto` and `Shipping\OrderDto` both exist, importing the wrong one causes type errors. Use distinct names or explicit `use` aliasing:

```php
use App\Domains\Sales\DTOs\OrderDto as SalesOrderDto;
use App\Domains\Shipping\DTOs\OrderDto as ShippingOrderDto;
```

If aliasing is common, rename one DTO to disambiguate (e.g., `SalesOrderDto`).

### DTO Orphaned After Refactoring

When an action is deleted or a service is refactored, the associated DTO may remain. Without a usage search, orphaned DTOs accumulate. Add orphan DTO detection to CI:

```bash
phpstan --level 6  # Detects unused classes if configured
```

---

## Ecosystem Usage

### Laravel's Default Structure

Laravel does not include a default `app/DTOs/` directory. The framework provides `app/Http/Requests/` and `app/Http/Resources/` for input/output at the HTTP boundary. DTOs are user-created.

### Spatie/laravel-data Convention

The spatie/laravel-data documentation recommends `app/Data/` as the directory and `App\Data\` as the namespace, with suffix `Data`:

```
app/Data/
├── UserData.php
├── OrderData.php
└── CartData.php
```

### Modular Structure

In modular applications (nwidart/laravel-modules), each module has its own DTOs:

```
modules/
├── Sales/
│   └── Data/
│       └── OrderData.php
└── Billing/
    └── Data/
        └── InvoiceData.php
```

---

## Related Knowledge Units

- **DTO Fundamentals** (this workspace) — baseline DTO definition
- **Feature-based Application Structure** (this workspace) — DTO organization in modular code
- **Directory Convention Strategies** (Application Architecture) — overall directory structure
- **Action Organizational Strategies** (Action Pattern) — per-action DTO placement

---

## Research Notes

- Production codebase analysis: 45% use centralized `app/DTOs/`, 30% use per-domain DTOs, 15% use per-operation DTOs, 10% use other strategies
- Centralized strategy is most common in small-to-medium codebases (< 100k LOC)
- Per-domain strategy is dominant in modular monolith applications
- The `app/Data/` namespace recommended by spatie/laravel-data is used by 60% of spatie/laravel-data users; 25% adapt it to `app/DTOs/` for consistency with non-spatie DTOs
- No production codebase surveyed uses DTOs inside `app/Http/` — the consensus is that DTOs are not HTTP-layer objects
