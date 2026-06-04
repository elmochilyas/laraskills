# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Action class naming: verb-noun commands
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Action classes follow a strict verb-noun naming convention that immediately communicates what they do. `CreateUser`, `ProcessPayment`, `GenerateInvoice`, `SendWelcomeEmail`, `CancelSubscription`. The verb is the operation (Create, Process, Generate, Send, Cancel, Update, Delete). The noun is the target (User, Payment, Invoice, Email, Subscription). This naming is self-documenting: developers reading a directory of actions see a list of business operations.

---

# Core Concepts

Verb-noun naming:
```
CreateUserAction       — Creates a user
ProcessPaymentAction   — Processes a payment
GenerateInvoiceAction  — Generates an invoice
CancelSubscriptionAction — Cancels a subscription
```

The `Action` suffix is optional but recommended. It distinguishes action classes from services, models, and other classes. Some conventions omit it: `CreateUser` vs `CreateUserAction`. Either is acceptable; consistency matters more than the specific choice.

---

# Mental Models

**The "Command" model:** Action classes are commands. The name IS the instruction. `CreateUser` means "Create a User." There's no ambiguity about what the class does.

**The "Directory as Menu" model:** Opening `app/Actions/` should read like a menu of business operations. `CreateUser`, `ProcessPayment`, `GenerateReport`—you know what the application does by reading the action names.

**The "No Verbs Left Behind" model:** Every business operation should have a corresponding action class. If the business says "we need to archive old orders," that's `ArchiveOldOrdersAction`.

---

# Internal Mechanics

```php
// Verb-Noun + Action suffix
class CreateUserAction {
    public function execute(CreateUserDto $dto): User { ... }
}
class SendWelcomeEmailAction {
    public function execute(User $user): void { ... }
}

// Verb-Noun (no suffix)
class CreateUser {
    public function handle(array $data): User { ... }
}
```

Directory organization:
```
app/Actions/Billing/CreateInvoiceAction.php
app/Actions/Billing/ProcessRefundAction.php
app/Actions/Auth/RegisterUserAction.php
app/Actions/Auth/ResetPasswordAction.php
```

---

# Patterns

**Domain subdirectories:** Actions are grouped by domain within the Actions directory. Each action belongs to exactly one domain.

**Consistent verb choices:** Establish a controlled vocabulary of verbs. Common: `Create`, `Update`, `Delete`, `Process`, `Send`, `Generate`, `Cancel`, `Approve`, `Reject`, `Archive`.

**Invokable classes:** Some teams use `__invoke()` instead of `handle()` or `execute()`:
```php
class CreateUserAction {
    public function __invoke(CreateUserDto $dto): User { ... }
}
```

---

# Architectural Decisions

**Use Action suffix:** Reduces naming conflicts (no collision with model names) and makes action classes immediately identifiable.

**Use no suffix:** Shorter filenames, more natural reading. Risk of collision: `app/Models/User.php` and `app/Actions/User.php`.

**Use `handle()` vs `execute()`:** Both are widely used. `handle()` aligns with Job/Listener conventions. `execute()` is more generic. Choose one and be consistent.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Self-documenting names | Can lead to very long names | `ProcessAndNotifyPaymentAction.php` — too long, split it |
| Action directory is a business glossary | Verb choices must be consistent | `Create` vs `Make` vs `Build` confusion |
| Immediate discoverability | Naming collisions | `User` as model and action requires `UserAction` suffix |

---

# Performance Considerations

No impact from naming.

---

# Production Considerations

Use a spelling/grammar checker in CI to catch inconsistent verb forms (`Create` vs `Creates`, `Send` vs `Sends`).

---

# Common Mistakes

**Generic action names:** `ProcessAction`, `HandleAction`, `ExecuteAction`. These don't communicate what the action does.

**Inconsistent verb choices:** Team members using `MakeOrder`, `CreateOrder`, and `GenerateOrder` interchangeably for the same kind of operation.

**Action names that are too specific:** `CreateUserWithWorkspaceAndSendWelcomeEmailAction`. The action is doing too much. Split into separate actions orchestrated by a service.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-02 Action classes | SLP-07 Service naming | COS-08 Naming conventions |
| COS-04 Namespace conventions | SLP-10 Decision criteria | AEG-07 Team convention docs |

---

## Failure Modes

**Action name collision:** Two actions with the same name in different domains (CreateOrder in Billing and CreateOrder in Fulfillment) cause ambiguity. Prefix with domain: Billing_CreateOrder.

**Verb inconsistency:** Half the team uses Create, the other half uses Make or Generate. Establish a controlled verb vocabulary documented in the project README.

---

## Ecosystem Usage

Lorisleiva's laravel-actions package pioneered the action class pattern in Laravel. Spatie's packages use action-like classes internally. The community convention favors the Action suffix to distinguish action classes from Eloquent models. The __invoke() pattern for single-action controllers has influenced action class design.

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
