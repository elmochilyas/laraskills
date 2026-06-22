# Decision Trees for Package Wrapper / Boundary Pattern

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Package Wrapper/Boundary Pattern |
| Related KUs | 03-package-wrapper-boundary, 04-package-escape-hatch-strategy, 05-when-not-to-build-custom |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-WRP-001 | Should this package be wrapped behind an interface? | P0 |
| DT-WRP-002 | How many methods should the wrapper interface expose? | P0 |
| DT-WRP-003 | Where should the adapter class live in the directory structure? | P1 |
| DT-WRP-004 | Should the wrapper use application DTOs or pass raw vendor types? | P0 |

---

## DT-WRP-001: Should This Package Be Wrapped Behind an Interface?

### Decision Context
Not every package warrants a wrapper. Wrapping a framework package is counterproductive; wrapping a third-party API integration is essential. The decision filters packages by: replaceability, testing impact, and architectural significance.

### Decision Criteria
- Does the package represent a replaceable infrastructure choice? (payment, search, SMS, file storage)
- Could the underlying provider change within the application's expected lifetime?
- Would testing without the wrapper require real API calls or complex mock setup?
- Is the package a framework core component (Eloquent, Blade, routing)?
- Does the package own database migrations and modify core models?

### Decision Tree

```
Is the package a framework-native component (Eloquent, Blade, routing, middleware)?
├── YES → DO NOT WRAP. Framework components are the framework — wrapping them creates abstraction for its own sake.
├── NO → Does the package represent a replaceable infrastructure choice?
    ├── YES → Does the package own database migrations AND modify core models?
    │   ├── YES → WRAP REQUIRED. Deep coupling demands a boundary.
    │   └── NO → Would testing without the wrapper require real API calls?
    │       ├── YES → WRAP RECOMMENDED. Test isolation justifies the wrapper.
    │       └── NO → Could the provider change within the application's lifetime?
    │           ├── YES → WRAP RECOMMENDED. Future-proofing justifies the cost.
    │           └── NO → OPTIONAL. Small benefit, small cost. Defer to team preference.
    └── NO → Is this a developer tooling package (Debugbar, Telescope, IDE helpers)?
        ├── YES → DO NOT WRAP. No business logic depends on these.
        └── NO → Is the package a trivial utility (single method, <20 lines if built custom)?
            ├── YES → DO NOT WRAP. Wrapper cost exceeds benefit.
            └── NO → WRAP OPTIONAL. Evaluate based on testing needs.
```

### Rationale
The wrapper's value is proportional to the cost of NOT having it. For a billing system where switching providers requires weeks of migration, the 30-minute wrapper investment is trivial. For a string formatting helper, the wrapper adds indirection without benefit. The decision tree weights replaceability and testing isolation most heavily — these are the dimensions where wrappers deliver the highest ROI.

### Recommended Default
**Wrap all external service integrations (payment, search, SMS, file storage) from day one.** For everything else, evaluate case by case but default to NOT wrapping unless there's a concrete future-switching plan or testing need.

### Risks Of Wrong Choice
- **Not wrapping a high-replaceability package**: When the provider changes, every file that imports the package must be updated. Migration cost scales with codebase size.
- **Wrapping a framework component**: Framework becomes unrecognizable, onboarding suffers, every framework upgrade requires adapter maintenance. The wrapper IS the maintenance burden.

### Related Rules
- Use the Wrapper from Day One, Not Retroactively
- Scope Interfaces to What the Application Actually Uses

### Related Skills
- Package Escape Hatch Strategy (KU 04)
- Calibrated Package Recommendation Writing (KU 01)

---

## DT-WRP-002: How Many Methods Should the Wrapper Interface Expose?

### Decision Context
A wrapper interface that mirrors the entire vendor API (50+ methods) is indirection without abstraction. A wrapper with too few methods forces business logic to bypass the wrapper for common operations. The sweet spot is the 3-7 methods the application actually calls.

### Decision Criteria
- Which vendor methods does business logic directly call today?
- Which methods are likely to be needed in the next 6 months (based on roadmap)?
- Does the team have prior experience with this vendor that suggests additional methods?
- Is this a multi-provider abstraction where different providers expose different capabilities?

### Decision Tree

```
Count the vendor methods business logic calls today.
├── 1-2 methods → Start with exactly those 2 methods. Add more when business logic needs them.
├── 3-7 methods → Include all 3-7 methods. This is the optimal wrapper size.
├── 8-15 methods → Are all 8-15 methods called from different business contexts?
│   ├── YES → Is this a multi-provider abstraction (multiple gateways implementing same interface)?
│   │   ├── YES → Larger interface is acceptable. Multi-provider interfaces are coordination contracts.
│   │   └── NO → CONSIDER SPLITTING. Can the interface be split by business capability?
│   │       (e.g., BillingSubscriptionGateway + BillingInvoiceGateway)
│   └── NO (several methods called from same context) → Consolidate. Multiple fine-grained methods can be one coarse method.
├── 16+ methods → INTERFACE IS TOO LARGE. You're mirroring the vendor API.
    └── Split into capability-specific interfaces or accept that the package IS the abstraction.
```

### Rationale
Interface size drives implementation cost. Every method on the interface must be implemented by every adapter: the primary adapter, the escape hatch adapter, and the test fake. A 5-method interface takes 30 minutes to implement for a new provider. A 50-method interface takes days to weeks. The 3-7 method sweet spot is derived from empirical observation: most business domains interact with external services through 3-7 distinct operations.

### Recommended Default
**Target 3-5 methods for the initial wrapper.** Add methods when business logic concretely needs them, not speculatively. Prefer coarse-grained methods (`subscribeUserToPlan(CreateSubscriptionData)`) over fine-grained methods (`createCustomer()`, `createPaymentMethod()`, `createSubscription()`).

### Risks Of Wrong Choice
- **Too few methods**: Business logic bypasses the wrapper for common operations, creating parallel code paths. The wrapper provides partial protection.
- **Too many methods**: Wrapper becomes a maintenance burden. Adding a new provider requires implementing 50 methods, most throwing "not supported."

### Related Rules
- Scope Interfaces to What the Application Actually Uses

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## DT-WRP-003: Where Should the Adapter Class Live in the Directory Structure?

### Decision Context
Adapter placement communicates architectural intent. `App\Infrastructure\Billing\StripeCashierAdapter` signals "this is Stripe infrastructure." `App\Services\BillingService` blurs the line between business logic and vendor integration. The decision impacts discoverability and migration clarity.

### Decision Criteria
- Project size and complexity (small app vs. enterprise)
- Team familiarity with layered architecture
- Existing directory conventions
- Likelihood of provider switching

### Decision Tree

```
Does the project have an established directory convention for infrastructure code?
├── YES → FOLLOW EXISTING CONVENTION. Consistency trumps theoretical purity.
├── NO → Is the project a small application (<20 routes, <10 models)?
    ├── YES → Adapters may live alongside services IF clearly named with vendor prefix.
    │   └── Use naming: StripeBillingAdapter, TwilioSmsAdapter. Never: BillingService, SmsService.
    ├── NO (medium/large project) → Use the Infrastructure directory pattern:
        └── app/Infrastructure/{Domain}/{Vendor}Adapter.php
            - app/Infrastructure/Billing/StripeCashierAdapter.php
            - app/Infrastructure/Search/AlgoliaSearchAdapter.php
            - app/Infrastructure/Notifications/TwilioSmsAdapter.php
```

### Rationale
Directory structure is documentation. A new team member who sees `App\Infrastructure\Billing\StripeCashierAdapter` immediately understands: (1) this is infrastructure, not domain logic, (2) it's billing-related, (3) it uses Stripe/Cashier, and (4) if Stripe is replaced, this is the file to replace. A file named `App\Services\BillingService` provides none of these signals. The cost of the directory structure is zero; the benefit is clarity that compounds with every new team member.

### Recommended Default
**Use `app/Infrastructure/{Domain}/{Vendor}Adapter.php` for all projects with more than 20 routes.** Small projects may consolidate but must use vendor-prefixed naming.

### Risks Of Wrong Choice
- **Adapters in Services**: During provider migration, the team cannot quickly identify which files contain vendor-specific code. The migration becomes a codebase-wide grep, not a targeted file replacement.
- **Over-structured for small projects**: A `Support/Infrastructure/Notifications/Email/` directory for a single `MailgunAdapter` that sends 2 emails. Over-engineering the directory structure.

### Related Rules
- Put the Adapter in Infrastructure, Not Domain

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## DT-WRP-004: Should the Wrapper Use Application DTOs or Pass Raw Vendor Types?

### Decision Context
The return type of wrapper methods determines whether the wrapper is a true abstraction or a leaky passthrough. Returning vendor types (`Laravel\Cashier\Subscription`) makes every consumer dependent on the vendor. Returning application DTOs (`SubscriptionResult`) keeps consumers vendor-agnostic.

### Decision Criteria
- Does the vendor type expose 3+ properties that business logic needs?
- Is the vendor type a simple value that could be replaced without code changes?
- Does the team have an established DTO pattern already?
- Are there multiple adapter implementations that must return consistent data?

### Decision Tree

```
Does the vendor type have a stable, well-known interface (PSR standard)?
├── YES (e.g., PSR-7 Request, PSR-3 Logger) → Return the PSR type. It's already an abstraction.
├── NO → Will this return type be consumed by 3+ different classes?
    ├── NO (single consumer) → SIMPLE VALUE OK. Return primitives or a simple array if only one consumer exists.
    │   └── BUT: if a second consumer is added, refactor to a DTO immediately.
    ├── YES → Does the vendor type expose properties that are vendor-specific?
        ├── YES (e.g., stripe_status) → CREATE APPLICATION DTO. Map vendor-specific names to business names.
        └── NO (e.g., id, status, created_at — generic) → Is there more than one adapter implementation?
            ├── YES → CREATE APPLICATION DTO for consistency across adapters.
            └── NO → SIMPLE VALUE acceptable. But prefer DTO for future-proofing.
```

### Rationale
The cost of creating a DTO is 5-10 lines of code. The cost of migrating 20 files from `Cashier\Subscription` to `SubscriptionResult` when the provider changes is hours of find-and-replace with risk of missed references. DTOs are cheap insurance against vendor coupling. The only exception is PSR interfaces, which are already abstractions.

### Recommended Default
**Default to application DTOs** for all return types from wrapper interfaces. The 5-minute cost of creating a `SubscriptionResult` DTO is negligible compared to the migration cost of unwinding vendor type references.

### Risks Of Wrong Choice
- **Returning vendor types**: Every consumer imports vendor classes. Switching providers requires updating every consumer. The wrapper is a leaky abstraction that provides zero protection.
- **Over-DTO-ing**: Creating a DTO for every single-field return value when a primitive would suffice. Adds indirection without value.

### Related Rules
- Return Application DTOs, Not Vendor Types
- Design the Interface in Business Language, Not Vendor Language

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)
