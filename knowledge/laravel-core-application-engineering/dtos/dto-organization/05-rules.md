## Rule 1: Choose One Organizational Strategy and Apply It Consistently

---

## Category

Code Organization

---

## Rule

Select exactly one DTO organizational strategy (centralized, per-domain, per-operation, or hybrid) and apply it consistently across the entire project. Never mix strategies.

---

## Reason

Mixed strategies produce duplicate class names, import confusion, and namespace ambiguity. A developer looking for `OrderDto` must check `app/DTOs/`, `app/Domains/Sales/DTOs/`, and `app/Actions/CreateOrder/`, unsure which is the canonical one. Consistent strategy eliminates this search cost.

---

## Bad Example

```
app/DTOs/UserDto.php                  // Centralized
app/Domains/Billing/DTOs/UserDto.php  // Also per-domain — same class name in two places
app/Actions/CreateUser/CreateUserDto.php // Also per-operation — third location
// Three UserDto files. Importing the wrong one causes type errors.
```

---

## Good Example

```
// Single strategy: per-domain
app/Domains/User/DTOs/CreateUserDto.php
app/Domains/Billing/DTOs/InvoiceDto.php
app/Domains/Shipping/DTOs/AddressDto.php
// Every DTO has exactly one home. No naming conflicts. No import confusion.
```

---

## Exceptions

For very large applications (200k+ LOC) with clear module boundaries, a hybrid strategy (shared DTOs in `app/DTOs/`, domain DTOs in domain directories) is acceptable. Document which DTOs belong where.

---

## Consequences Of Violation

Maintenance: duplicate DTOs drift apart over time. Reliability: importing the wrong class causes type errors at runtime. Team efficiency: every developer spends time searching for the correct DTO location.

---

## Rule 2: Never Place DTOs Inside HTTP-Related Directories

---

## Category

Architecture

---

## Rule

Do not place DTO classes inside `app/Http/` or any HTTP-related directory (`app/Http/Controllers/`, `app/Http/Requests/DTOs/`). DTOs must live outside the HTTP layer.

---

## Reason

DTOs are cross-layer data carriers used by CLI commands, queue jobs, services, and tests — not just HTTP controllers. Placing DTOs inside `app/Http/` creates the false impression that they belong to the HTTP layer, discouraging use from non-HTTP entry points and creating a design smell that DTOs are HTTP-specific.

---

## Bad Example

```
app/Http/
├── Controllers/
│   └── DTOs/
│       └── UserDto.php      // DTO inside HTTP directory
└── Requests/
    └── DTOs/
        └── UserDto.php      // Another DTO inside HTTP directory
```

---

## Good Example

```
app/DTOs/UserDto.php                      // Centralized — not in HTTP
// or
app/Domains/User/DTOs/UserDto.php         // Per-domain — not in HTTP
// or
app/Actions/CreateUser/CreateUserDto.php  // Per-operation — not in HTTP
```

---

## Exceptions

No common exceptions. DTOs are architectural objects that cross all layers. They must never be placed in HTTP-specific directories.

---

## Consequences Of Violation

Architecture: DTOs become implicitly coupled to HTTP in developers' mental models. Maintenance: non-HTTP entry points require importing from an HTTP directory, creating confusion about layer boundaries.

---

## Rule 3: Limit Directory Nesting to a Maximum of 4 Levels from `app/`

---

## Category

Code Organization

---

## Rule

Do not nest DTO directories deeper than 4 levels from the `app/` directory. Flatten deeply nested structures before reaching this limit.

---

## Reason

Deep directory nesting creates long import statements (`use App\Domains\Sales\Order\DTOs\V2\Internal\OrderDto`), makes file navigation cumbersome in IDEs, and increases the cognitive load of understanding the directory hierarchy. A 4-level maximum keeps imports readable and navigation fast.

---

## Bad Example

```
app/Domains/Sales/Order/DTOs/V2/Internal/Cached/OrderDto.php
// 7 levels deep. Import: use App\Domains\Sales\Order\DTOs\V2\Internal\Cached\OrderDto;
```

---

## Good Example

```
app/Domains/Sales/DTOs/OrderDto.php
// 3 levels deep. Import: use App\Domains\Sales\DTOs\OrderDto;
// Flattened: V2, Internal, Cached are not meaningful organizational levels for DTOs.
```

---

## Exceptions

When using per-domain organization with a 3-level domain hierarchy (e.g., `Sales/Order/Fulfillment`), nesting to 4-5 levels may be necessary. Review whether the depth adds meaningful organization or just ceremony.

---

## Consequences Of Violation

Maintenance: deep nesting adds friction to every file operation (create, rename, move, import). Team efficiency: developers spend time expanding directory trees and typing long imports.

---

## Rule 4: Use a Consistent Suffix Across All DTO Classes

---

## Category

Code Organization

---

## Rule

Pick exactly one suffix (`Dto` or `Data`) for all DTO classes and use it consistently across the entire project. Do not mix suffixes.

---

## Reason

Mixed suffixes create confusion about naming conventions and IDE autocomplete pollution. A developer searching for "user data" sees both `UserDto` and `UserData`, not knowing which is the canonical class. Consistent suffix means consistent naming, import, and search behavior.

---

## Bad Example

```php
// Mixed suffixes in the same project
app/DTOs/UserDto.php
app/DTOs/OrderData.php
app/DTOs/LineItemDto.php
app/DTOs/InvoiceData.php
// Is InvoiceData a DTO or a spatie/laravel-data object? Inconsistent naming.
```

---

## Good Example

```php
// Consistent suffix: Dto for plain DTOs
app/DTOs/UserDto.php
app/DTOs/OrderDto.php
app/DTOs/InvoiceDto.php

// Or consistent suffix: Data for spatie/laravel-data objects
app/Data/UserData.php
app/Data/OrderData.php
app/Data/InvoiceData.php
```

---

## Exceptions

Some projects use `Dto` for plain DTOs and `Data` for spatie/laravel-data objects as a deliberate distinction. This is acceptable if the convention is documented and consistently applied.

---

## Consequences Of Violation

Maintenance: developers must remember which suffix each class uses. Code review: inconsistent naming is a recurring source of "use correct suffix" comments. IDE experience: autocomplete results are cluttered with both suffixes.

---

## Rule 5: Place Shared Cross-Domain DTOs in a Centralized Location

---

## Category

Code Organization

---

## Rule

When using per-domain organization, place DTOs used across multiple domains in a shared centralized location (`app/DTOs/` or a `Shared` domain directory). Domain-specific DTOs remain in their respective domain directories.

---

## Reason

Per-domain organization keeps DTOs close to their domain logic, but cross-domain DTOs (e.g., `UserDto` used by both Billing and Support domains) would require duplication or cross-domain imports if placed in a single domain. A shared location eliminates duplication and prevents inter-domain dependencies.

---

## Bad Example

```
// UserDto duplicated across domains because no shared location exists
app/Domains/Billing/DTOs/UserDto.php
app/Domains/Support/DTOs/UserDto.php
// Two copies — they will diverge. The Billing domain needs email; the Support domain adds phone.
```

---

## Good Example

```
app/
├── DTOs/                         # Shared cross-domain DTOs
│   └── UserDto.php
└── Domains/
    ├── Billing/DTOs/             # Domain-specific DTOs
    │   └── InvoiceDto.php
    └── Support/DTOs/
        └── TicketDto.php
// UserDto lives once in the shared location. Both domains import the same class.
```

---

## Exceptions

For small applications with few cross-domain dependencies, a single centralized `app/DTOs/` directory eliminates the need for a hybrid strategy entirely.

---

## Consequences Of Violation

Maintenance: duplicated cross-domain DTOs diverge over time. Architecture: forcing cross-domain imports creates unnecessary coupling between domains. Reliability: one team updates their copy without updating the other.

---

## Rule 6: Add Orphan DTO Detection to CI

---

## Category

Maintainability

---

## Rule

Configure static analysis (PHPStan level 6+ or equivalent) in CI to detect unused DTO classes. Remove or merge orphaned DTOs when they are identified.

---

## Reason

DTOs accumulate over time as requirements change. An orphaned DTO (defined but never imported) is dead code that adds maintenance burden, increases cognitive load, and may give false confidence that a data contract is documented. Automated detection prevents accumulation.

---

## Bad Example

```php
// app/DTOs/OldUserDto.php — defined but never imported anywhere
// No static analysis to flag it. Sits in the codebase for 2 years.
// Another team creates UserDtoV2. Now two User DTOs exist — which is active?
```

---

## Good Example

```php
// phpstan.neon.dist or equivalent CI configuration
// PHPStan level 6+ detects unused classes automatically.
// CI pipeline fails on unused DTOs.
// Team reviews quarterly: remove or merge orphaned DTOs.
```

---

## Exceptions

DTOs exported as part of a package's public API that are consumed externally should not be removed even if unused internally.

---

## Consequences Of Violation

Maintenance: orphaned DTOs accumulate, increasing file count and reducing discoverability of active DTOs. Onboarding: new developers find dead DTOs and waste time understanding their purpose.
