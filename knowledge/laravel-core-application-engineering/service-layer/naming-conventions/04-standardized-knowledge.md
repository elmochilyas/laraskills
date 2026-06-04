# ECC Standardized Knowledge — Service Naming Conventions

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Service Layer Pattern |
| **Knowledge Unit** | Service Naming Conventions |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — Business Logic |
| **Last Updated** | 2026-06-02 |

---

## Overview

Service naming conventions establish predictable class and method names across the service layer. The standard pattern is `{Entity}Service` (`UserService`, `OrderService`, `NotificationService`) with method names that describe business operations (`register()`, `place()`, `cancel()`).

Consistent naming reduces cognitive overhead — developers can predict service class names from entity names and method names from business operations. Inconsistent naming forces developers to search for the right class or method.

---

## Core Concepts

### Class Naming
`{Entity}Service` for entity-oriented services. `{Capability}Service` for capability-oriented services.

### Method Naming
Verb-based: `registerUser()`, `placeOrder()`, `cancelOrder()`. Avoid HTTP verb names like `store()`, `update()`, `destroy()`.

### Namespace Convention
`App\Services\{Domain}\{Entity}Service`. Domain subdirectories for large applications.

---

## When To Use

- ALL service classes in the application
- When establishing team conventions for new projects
- When migrating from inconsistent naming

---

## Best Practices

### Use Entity-Oriented Names
Name after the primary entity: `UserService`, `OrderService`, `ProductService`.

**Why:** Entity names are stable and universally understood. Developers can find the service for any entity without documentation.

### Use Business Verbs, Not HTTP Verbs
Method names: `place()`, `cancel()`, `ship()` not `store()`, `update()`, `destroy()`.

**Why:** Business verbs reflect domain meaning. HTTP verbs couple the service to the transport layer.

### Avoid Service Suffix on Method Names
`orderService.placeOrder()` not `orderService.placeOrderOperation()`.

**Why:** The suffix adds no information. The class name already establishes the domain context.

### Use Domain Subdirectories for Scale
`App\Services\Sales\OrderService`, `App\Services\Billing\InvoiceService`.

**Why:** Flat service directories become unmanageable beyond 20-30 files. Domain grouping provides clear ownership.

---

## Common Mistakes

### HTTP Verb Method Names
Desc: `store()`, `update()`, `destroy()` in services.
Cause: Copying controller method naming.
Consequence: Service coupled to HTTP semantics; unclear business meaning.
Better: `register()`, `updateProfile()`, `archive()`.

### Inconsistent Prefixing
Desc: `UserManagementService`, `ServiceUser`, `UserSvc`.
Cause: No team convention.
Consequence: Developers must search for the right class name.
Better: `UserService` consistently.

### Generic Names
Desc: `HelperService`, `UtilityService`, `ManagerService`.
Cause: Grouping unrelated operations.
Consequence: God service with unclear responsibility.
Better: Name by entity or capability.

---

## Examples

### Good Naming
```php
App\Services\UserService
  → register(), suspend(), activate()

App\Services\OrderService
  → place(), cancel(), ship(), refund()
```

### Bad Naming
```php
App\Services\UserManager
  → store(), update(), delete()  // HTTP verbs

App\Services\HelperService
  → sendEmail(), calculateTotal(), validateAddress()  // unrelated
```

---

## Related Topics

### Prerequisites
- **Service Class Design** — Foundation for naming

### Closely Related
- **Directory Conventions** — Namespace-to-directory mapping
- **Action Naming Conventions** — Comparison with action naming

---

## AI Agent Notes

### Important Decisions
- Class: `{Entity}Service` — most common and recommended
- Method: business verbs (place, cancel, register)
- Namespace: `App\Services\{Domain}\{Entity}Service`
- Domain subdirectories for applications with 20+ services

---

## Verification

This document has been validated against:
- Production Laravel codebase naming conventions
- Community best practices (Spatie, Tighten)
