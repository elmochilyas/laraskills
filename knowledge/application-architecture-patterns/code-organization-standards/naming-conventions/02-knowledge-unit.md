# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Feature-based naming conventions for classes and files
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Naming conventions in Laravel architecture are not cosmetic—they are communication. A class named `ProcessPayment` vs. `PaymentService` vs. `PaymentProcessor` conveys different intent, responsibility, and level of abstraction. The Laravel ecosystem has converged on naming patterns that consistently communicate the class's role, its domain, and its action. Consistent naming is the lowest-cost architectural enforcement: when files are named predictably, developers find code without documentation, and code reviews catch misplaced logic based on name alone.

---

# Core Concepts

Naming conventions encode three dimensions:
1. **Domain/Feature:** What business area does this belong to? (`Billing`, `Catalog`, `Auth`)
2. **Role/Pattern:** What architectural role does this play? (`Controller`, `Service`, `Action`, `Model`, `Event`, `Job`, `DTO`)
3. **Operation:** What specific thing does it do? (`CreateInvoice`, `ProcessPayment`, `GenerateReport`)

Consistent conventions follow: `{Domain}/{Role}/{Operation}{Role}` or `{Role}{Domain}{Operation}`.

Common Laravel patterns:
- **Models:** Singular PascalCase (`User`, `Invoice`, `Subscription`)
- **Controllers:** Plural with `Controller` suffix (`UsersController`, `InvoicesController`)
- **Services:** Entity or domain + `Service` (`UserService`, `BillingService`)
- **Actions:** Verb-Noun (`CreateUser`, `ProcessPayment`, `GenerateInvoice`)
- **Events:** Past-tense verb describing something that happened (`UserRegistered`, `PaymentFailed`)
- **Jobs:** Noun + `Job` or Verb-Noun (`SendWelcomeEmail`, `ProcessBatchUpload`)
- **DTOs:** Noun + `Data` or `Dto` (`UserData`, `CreateInvoiceDto`)

---

# Mental Models

**The "Self-Documenting Name" model:** A developer reading a file list should understand what each class does without opening it. `Billing/CreateInvoiceAction` needs no explanation.

**The "Name is the Contract" model:** If a class is named a Service, it should behave as a Service (orchestrate operations). If it's named an Action, it should execute a single operation. The name constrains the implementation.

**The "Directory as Modifier" model:** A file's directory determines its domain; the filename determines its role and operation. `app/Actions/Billing/CreateInvoice.php` reads as: "In the Billing domain, an Action that creates invoices."

---

# Internal Mechanics

Laravel doesn't enforce naming conventions—they are community standards. However, certain conventions are required by Laravel internals:
- Model class names map to table names via snake_case pluralization.
- Controllers referenced in routes must match the class name.
- Event/Listener discovery via `EventServiceProvider` uses class names.
- Jobs queued by class name must have the same FQCN when dequeued.

---

# Patterns

**Verb-Noun for operations:** `CreateOrder`, `ProcessRefund`, `SendEmailNotification`. This is the Action class naming convention (see SLP-08).

**Domain prefix for service classes:** `BillingService`, `InventoryService`, `NotificationService`. Avoid generic `Service` without domain qualification.

**Past-tense for events:** `OrderCreated`, `PaymentFailed`, `UserSubscribed`. The event name describes what already happened.

**Form Request suffix:** `StoreInvoiceRequest`, `UpdateUserRequest`. Matches the artisan convention.

**Resource suffix:** `InvoiceResource`, `UserCollection`. Matches API resource conventions.

---

# Architectural Decisions

**Adopt action naming when:** You use action classes (SLP-02). Every action is a verb-noun command. This is the strongest convention because it prevents ambiguous names.

**Adopt service naming when:** You use service classes for orchestration. Service names are domain-qualified: not `Service` but `PaymentService`.

**Adopt hyphenated filenames:** Some teams prefer `create-invoice-action.php` (kebab-case) for filenames with class `CreateInvoice` inside. This is controversial—most Laravel projects use PascalCase for filenames matching class names.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Files are self-documenting | Convention establishment takes effort | Without documented conventions, naming is inconsistent |
| Code review catches misuse | Long file names with deep namespaces | `app/Domains/Billing/Actions/CreateInvoiceAction.php` is verbose |
| IDE completion works predictably | Conventions must be shared and enforced | New developers bring their own conventions |
| Searchability improves | Tooling doesn't enforce | Convention violations are only caught manually |

---

# Performance Considerations

No performance impact. However, very long file paths can cause Windows MAX_PATH issues (260 characters). Deeply nested domains with long class names can approach this limit on Windows systems.

---

# Production Considerations

Document naming conventions in a CONTRIBUTING.md or ADVENT.md (Architecture Decision Record). Include examples of good and bad names. Review naming in code review—it catches architectural confusion early.

Consider a `conventions.php` or `coding-standards.md` file that lists:
- Service names: `{Domain}Service`
- Action names: `{Verb}{Noun}`
- Event names: `{Noun}{PastTenseVerb}`
- DTO names: `{Entity}Data`

---

# Common Mistakes

**Inconsistent suffix usage:** `UserCreation`, `CreateUserAction`, `UserCreateService` used interchangeably for similar operations. Pick one pattern and apply it universally.

**Generic naming:** `Manager`, `Helper`, `Handler`, `Processor` as class name suffixes. These don't communicate architectural role. Prefer `Service`, `Action`, `UseCase`.

**Name drift:** A class named `UserService` that now handles invoices and payments. The name no longer reflects what it does. Rename or split.

**Plural vs. singular inconsistency:** `app/Services/UserService.php` vs. `app/Services/UsersService.php`. Establish: services are singular (one service per domain entity).

---

# Failure Modes

**Class name collision:** Two classes with the same FQCN but different purposes. Eg, `App\Services\PaymentService` and `Vendor\Package\PaymentService`. Namespaces prevent this but FQCN confusion still occurs.

**Case sensitivity bugs:** `app/Services/UsersService.php` with class `UsersService`—works on Windows but fails on Linux if the import uses `usersservice`.

---

# Ecosystem Usage

Laravel itself uses consistent naming: Artisan commands are `make:model`, `make:controller`. First-party packages (Horizon, Telescope) follow `{Package}{Role}` naming. Spatie packages use descriptive, role-indicating class names consistently.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-04 Namespace conventions | SLP-07 Service naming | COS-12 File placement decision trees |
| COS-01 Default structure | SLP-08 Action naming | AEG-07 Team convention documentation |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
