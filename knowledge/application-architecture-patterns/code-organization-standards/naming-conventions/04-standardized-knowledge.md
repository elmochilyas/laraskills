# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Feature-based naming conventions for classes and files
Knowledge Unit ID: COS-08
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Naming conventions in Laravel architecture are communication. A class named `ProcessPayment` vs. `PaymentService` vs. `PaymentProcessor` conveys different intent, responsibility, and abstraction level. Consistent naming is the lowest-cost architectural enforcement: predictably named files make code findable without documentation, and code review catches misplaced logic based on name alone.

---

# Core Concepts

Naming conventions encode three dimensions:
1. **Domain/Feature** — What business area? (`Billing`, `Catalog`, `Auth`)
2. **Role/Pattern** — What architectural role? (`Controller`, `Service`, `Action`, `Model`, `Event`, `Job`)
3. **Operation** — What specific thing? (`CreateInvoice`, `ProcessPayment`)

Common patterns:
- **Models**: Singular PascalCase (`User`, `Invoice`)
- **Controllers**: Plural + `Controller` suffix (`InvoicesController`)
- **Services**: Entity/Domain + `Service` (`UserService`, `BillingService`)
- **Actions**: Verb-Noun (`CreateUser`, `ProcessPayment`)
- **Events**: Past-tense verb (`UserRegistered`, `PaymentFailed`)
- **Jobs**: Noun + `Job` or Verb-Noun (`SendWelcomeEmail`)
- **DTOs**: Noun + `Data` or `Dto` (`UserData`, `CreateInvoiceDto`)

---

# When To Use

- Always — naming conventions should be established in every Laravel project
- Especially important when the team grows beyond 3 developers
- Critical when using action classes, service classes, or domain-based organization

---

# When NOT To Use

- Prototypes or throwaway projects
- When conventions are so rigid they slow development without clear benefit

---

# Best Practices

- **Use Verb-Noun for actions:** `CreateOrder`, `ProcessRefund`, `SendEmailNotification`. WHY: The name is also the contract — `CreateOrder` does exactly one thing: create an order.
- **Domain-qualify service names:** `PaymentService` (not `Service`). WHY: Generic names become ambiguous as the project grows.
- **Use past-tense for events:** `OrderCreated`, `PaymentFailed`, `UserSubscribed`. WHY: Events describe something that already happened — past tense communicates this.
- **Avoid generic suffixes:** `Manager`, `Helper`, `Handler`, `Processor`. WHY: These don't communicate architectural role. Prefer `Service`, `Action`, `UseCase`.
- **Document naming conventions** in CONTRIBUTING.md or ADRs. WHY: Without documentation, naming becomes inconsistent across developers.

---

# Architecture Guidelines

- A file's directory determines its domain; the filename determines its role and operation.
- If a class is named a Service, it should behave as a Service (orchestrate). If named an Action, it should execute a single operation.
- Long file paths with deep namespaces are acceptable — clarity > brevity.
- Singular for service/model names (`UserService`, not `UsersService`).
- Plural for controller names (`UsersController`, not `UserController`).

---

# Performance Considerations

- Long file paths can cause Windows MAX_PATH issues (260 characters). Deeply nested domains with long class names can approach this limit.
- No runtime performance impact from naming conventions.

---

# Security Considerations

- Naming does not affect security. However, clear naming helps audit code for security-sensitive operations.

---

# Common Mistakes

1. **Inconsistent suffix usage:** `UserCreation`, `CreateUserAction`, `UserCreateService` used interchangeably. Cause: no documented convention. Consequence: developer confusion. Better: pick one pattern (Verb-Noun for actions) and apply universally.

2. **Generic naming:** `Manager`, `Helper`, `Handler`, `Processor` as suffixes. Cause: uncertainty about class role. Consequence: class responsibility is unclear. Better: choose role-indicating suffixes like `Service`, `Action`, `UseCase`.

3. **Name drift:** Class named `UserService` now handles invoices and payments. Cause: feature creep into existing class. Consequence: misleading name. Better: split into appropriate classes or rename.

4. **Plural vs. singular inconsistency:** `UserService` vs `UsersService`. Cause: no established convention. Consequence: inconsistent codebase. Better: services are singular (one service per domain entity).

---

# Anti-Patterns

- **God class naming:** A class with a narrow name that has grown to do many things.
- **Role-obscuring names:** `DataManager`, `SystemHelper`, `ObjectProcessor` — impossible to infer responsibility.

---

# Examples

```
// Services: {Domain}Service
class BillingService { }
class InventoryService { }

// Actions: VerbNoun
class CreateInvoice { }
class ProcessRefund { }

// Events: NounPastTense
class OrderCreated { }
class PaymentFailed { }

// DTOs: NounData
class InvoiceData { }
class UserRegistrationData { }
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-04 Namespace conventions | SLP-07 Service naming | COS-12 File placement decision trees |
| COS-01 Default structure | SLP-08 Action naming | AEG-07 Team convention documentation |

---

# AI Agent Notes

- Use Verb-Noun for action classes, {Domain}Service for service classes, and past-tense for events.
- When generating new classes, follow the project's existing naming pattern — look at neighboring files for conventions.
- Never use `Manager`, `Helper`, or `Handler` as suffixes — suggest more specific role names.

---

# Verification

- [ ] All class names consistently use role-indicating suffixes
- [ ] Naming conventions are documented in project README or CONTRIBUTING.md
- [ ] No `Manager`, `Helper`, `Handler`, `Processor` classes
- [ ] Action classes follow Verb-Noun consistently
- [ ] Event classes use past-tense naming
