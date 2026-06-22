# Anti-Patterns for Package Wrapper / Boundary Pattern

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Package Wrapper/Boundary Pattern |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-WRP-001 | The Passthrough Wrapper | High | High |
| AP-WRP-002 | The Universal Gateway | Critical | Medium |
| AP-WRP-003 | Wrapper-in-Wrapper | Medium | Low |
| AP-WRP-004 | Retroactive Wrapper Extraction | High | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-CPR-001 (Blind Defaultism) — from KU 01
- AP-ESC-002 (Escape Hatch as Excuse for Poor Selection) — from KU 04
- AP-FNA-004 (Assumption Override Optimism) — from KU 02

---

## AP-WRP-001: The Passthrough Wrapper

### Category
Architecture | Abstraction

### Description
Creating a wrapper interface and adapter where every method signature, parameter, and return type is identical to the vendor package. The "wrapper" is pure indirection — same method names, same parameter types, same return types. It provides zero abstraction, zero vendor protection, and zero testability benefit beyond what the vendor already provides.

### Why It Happens
- Misunderstanding the wrapper's purpose: thinking the wrapper exists "because we should have an interface," not understanding it exists to abstract the vendor
- Laziness: copying the vendor's method signatures is faster than designing business-language methods
- Fear of "losing functionality": wanting to expose every vendor feature through the wrapper
- Lack of domain language: the team hasn't defined what business operations they actually perform

### Warning Signs
- Interface method names match vendor method names exactly: `createStripeCustomer()`, `createSubscription()`
- Interface parameters are vendor-specific: `string $priceId, string $paymentMethodId`
- All vendor methods are exposed — 30+ methods on the interface
- "If we ever switch providers, we'll just change the adapter implementation" — without realizing the interface is vendor-specific

### Why Harmful
The wrapper creates a false sense of security. The team believes they can swap providers because there's an interface, but the interface IS the vendor's API. Switching from Stripe to Paddle would require changing every method signature on the interface — which means changing every consumer too. The wrapper provides the illusion of abstraction with none of the protection. It adds indirection cost without abstraction benefit — the worst of both worlds.

### Real-World Consequences
- A team wraps Cashier with a `BillingGateway` interface that has methods `createStripeSubscription(string $priceId, string $paymentMethod)` and `cancelStripeSubscription(string $stripeSubscriptionId)`. When they later need Paddle support, they discover the interface is useless — Paddle doesn't have "price IDs" or "Stripe subscription IDs." They must redesign the interface AND update every consumer. The wrapper protected nothing.

### Preferred Alternative
Design the interface in business language: `subscribeUserToPlan(CreateSubscriptionData $data): SubscriptionResult`. The `CreateSubscriptionData` DTO contains the business-level subscription parameters. `SubscriptionResult` contains business-level response properties. Both are vendor-agnostic. The adapter translates between business DTOs and vendor API calls. When the vendor changes, only the adapter changes — the interface and all consumers remain untouched.

### Refactoring Strategy
1. Audit existing wrapper interfaces for vendor-specific method names, parameters, or return types.
2. For each vendor-specific element, identify the business concept it represents. `string $priceId` in Stripe might map to `Plan $plan` in business language.
3. Redesign the interface with business-language methods and application DTOs.
4. Update the adapter to translate between business DTOs and vendor API calls.
5. Update consumers to use the new business-language interface. This is the painful part — it's why day-one wrapper design matters.

### Detection Checklist
- [ ] Interface method names contain vendor names (Stripe, Cashier, Algolia, Twilio)
- [ ] Interface parameters are vendor-specific types or strings (price_id, pm_id, search_index)
- [ ] Interface return types are vendor classes (Cashier\Subscription, Stripe\Charge)
- [ ] Interface has more than 15 methods
- [ ] Switching providers would require changing the interface, not just the adapter

### Related Rules
- Design the Interface in Business Language, Not Vendor Language
- Return Application DTOs, Not Vendor Types
- Scope Interfaces to What the Application Actually Uses

### Related Skills
- Package Escape Hatch Strategy (KU 04)

### Related Decision Trees
- DT-WRP-002: How Many Methods Should the Wrapper Interface Expose?
- DT-WRP-004: Should the Wrapper Use Application DTOs or Pass Raw Vendor Types?

---

## AP-WRP-002: The Universal Gateway

### Category
Architecture | Abstraction

### Description
Creating a single giant interface that wraps every external service: `ExternalGateway` with methods for billing, notifications, search, file storage, SMS, and analytics — all in one interface. The interface becomes a god-object that's impossible to implement, test, or replace.

### Why It Happens
- Premature abstraction: "all external services are similar, let's unify them"
- Desire for a single injection point: "just inject Gateway everywhere"
- Over-reading the wrapper pattern: applying it to everything external without considering separation of concerns
- Architectural over-engineering in early project phases

### Warning Signs
- Interface name is generic: `ExternalGateway`, `ServiceGateway`, `ThirdPartyGateway`
- Interface methods span multiple unrelated domains (billing methods next to SMS methods next to search methods)
- Single adapter implements methods for 4+ different services
- Interface has 20+ methods covering 3+ distinct business capabilities

### Why Harmful
The Universal Gateway violates the Interface Segregation Principle catastrophically. Every consumer that needs billing also gets SMS and search methods in its type hints. Testing a service that depends on `ExternalGateway` requires mocking 20 methods when the service only calls 3. Adding a new external service requires modifying the giant interface — a breaking change for every existing consumer. The interface becomes the most coupled class in the entire codebase.

### Real-World Consequences
- A team creates a `ServiceGateway` interface with 35 methods covering billing, email, SMS, Slack notifications, file storage, and search. A feature test for user registration (which only sends a welcome email) must mock all 35 methods because the controller's constructor type-hints `ServiceGateway`. The test's arrange phase is 50 lines of mock setup for 3 lines of actual test logic.

### Preferred Alternative
One interface per business capability. `BillingGateway`, `NotificationGateway`, `SearchGateway`, `StorageGateway`. Each interface has 3-7 methods specific to its domain. Consumers depend only on the interfaces they actually need. A `RegistrationService` depends on `UserRepository` and `NotificationGateway` — not on billing, search, or storage. This is standard Interface Segregation Principle applied to package wrappers.

### Refactoring Strategy
1. Split the monolithic interface into capability-specific interfaces.
2. Split the monolithic adapter into capability-specific adapters, one per interface.
3. Update consumers to depend only on the interfaces they actually use.
4. Delete the original monolithic interface and adapter.

### Detection Checklist
- [ ] Interface name is generic (Gateway, ServiceGateway, ExternalService)
- [ ] Interface methods span 3+ distinct business domains
- [ ] Consumers use fewer than 20% of the interface's methods
- [ ] Adding a new external service requires modifying an existing interface

### Related Rules
- Scope Interfaces to What the Application Actually Uses
- Design the Interface in Business Language, Not Vendor Language

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## AP-WRP-003: Wrapper-in-Wrapper

### Category
Architecture | Indirection

### Description
Wrapping a package that itself is a wrapper around another package or service. For example, creating a custom `SearchWrapperInterface` around Laravel Scout, which is already a wrapper around Algolia/Meilisearch. Each layer adds indirection without adding abstraction, making the codebase harder to navigate and debug.

### Why It Happens
- Organizational standards that mandate "everything must be wrapped" without considering pre-existing abstractions
- Misunderstanding that Scout, Cashier, and Socialite are already wrappers/adapters
- Framework-agnostic architecture enthusiasts applying patterns blindly
- "The wrapper pattern says wrap third-party packages — Scout is a third-party package"

### Warning Signs
- The package being wrapped is already described as an "adapter," "wrapper," or "abstraction layer"
- The wrapper's methods add nothing beyond what the underlying package already provides
- Debugging requires stepping through 3+ layers of delegation: business logic → wrapper → Laravel package → vendor SDK → API
- New team members cannot trace execution flow because of excessive indirection

### Why Harmful
Scout is already an abstraction over search engines. Cashier is already an abstraction over Stripe billing. Wrapping them again adds a layer that provides no additional value — Scout already abstracts Algolia vs. Meilisearch. The wrapper-in-wrapper pattern adds complexity (more files, more interfaces, more bindings) without improving testability (Scout provides fakes), swapability (Scout already supports multiple drivers), or business language (Scout's API is already clean). It's indirection for indirection's sake.

### Real-World Consequences
- A team wraps Scout in a `SearchGateway` interface that has methods `search(string $query)` and `index(Model $model)`. These are identical to Scout's `search()` and `makeSearchable()` methods. When a new developer joins, they trace `SearchGateway::search()` → adapter → `Scout::search()` → Algolia driver. "Why do we have this extra layer?" Nobody can answer because there is no answer — the wrapper provides zero architectural value.

### Preferred Alternative
If the underlying package is already a well-designed abstraction (Scout, Cashier, Socialite), use it directly BUT still follow the wrapper principles that matter: use application DTOs for return types (don't let Algolia result objects leak into views), and keep vendor-specific configuration isolated. The distinction is: you don't need an interface + adapter when the package IS the interface + adapter. You DO need to prevent vendor types from leaking into business logic through your own DTOs.

### Refactoring Strategy
1. Identify wrappers that wrap existing abstraction packages (Scout, Cashier, Socialite).
2. If the wrapper provides more than 80% pass-through with no behavioral difference, remove the wrapper.
3. Move any legitimate wrapper functions (vendor type → DTO mapping, exception translation) directly into the service that uses the package.
4. Keep the DTOs — they protect business logic from vendor types. Remove the interface + adapter — they protect nothing.

### Detection Checklist
- [ ] The wrapped package's documentation describes it as an "abstraction," "adapter," or "wrapper"
- [ ] Wrapper method names are identical to the underlying package method names
- [ ] Deleting the wrapper would require changing only import paths, not logic
- [ ] The wrapper provides no exception translation, DTO mapping, or behavioral difference

### Related Rules
- Design the Interface in Business Language, Not Vendor Language
- Scope Interfaces to What the Application Actually Uses

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## AP-WRP-004: Retroactive Wrapper Extraction

### Category
Architecture | Risk Management

### Description
Waiting until provider switching is imminent before creating a wrapper, then attempting to extract the package from every business logic file, controller, and service simultaneously. The extraction becomes a big-bang migration instead of a gradual, safe refactoring.

### Why It Happens
- "We'll wrap it when we need to switch" — treating the wrapper as a migration tool, not an architectural seam
- Optimism bias: "we'll never need to switch from Stripe"
- Underestimating how many files directly reference the package
- Deadline pressure: "we don't have time for a wrapper, we need to ship"

### Warning Signs
- Business logic files contain direct `$user->newSubscription(...)` calls in 15+ files
- Controllers import `Laravel\Cashier\Subscription` for return types
- Event listeners depend on Cashier's `WebhookReceived` event class directly
- The team says "we'll add the wrapper as part of the Paddle migration"

### Why Harmful
Retroactive wrapper extraction is a big-bang operation. Every file that references the package must be changed simultaneously — there's no incremental path. If 30 files reference Cashier directly, 30 files must be refactored in one coordinated change. This is high-risk: a single missed reference causes a runtime error. Compare to day-one wrapper: 0 files reference Cashier directly, ever. The cost of the wrapper is 30 minutes; the cost of retroactive extraction is days of risky refactoring.

### Real-World Consequences
- A SaaS company uses Cashier directly for 18 months across 40+ files. A business decision requires adding Paddle. The "wrapper first, then migration" plan becomes "40-file refactor under deadline pressure." Three missed Cashier references cause production errors after the migration. The migration takes 3 weeks instead of 1 if a wrapper had existed from day one.

### Preferred Alternative
Create the wrapper on day one, before the first integration. Even if the wrapper doesn't seem necessary, it costs 30 minutes to set up the interface + adapter + binding. That 30 minutes buys: (1) zero business logic files ever reference the package, (2) provider switching is a one-line container binding change, (3) tests mock the interface, not the package. The wrapper is insurance — cheap when bought early, expensive when bought under pressure.

### Refactoring Strategy
1. If already in the retroactive situation, do NOT attempt a big-bang extraction. Instead:
2. Create the wrapper interface and adapter.
3. Migrate one business logic file at a time from direct package usage to the wrapper.
4. Run tests after each file migration. The wrapper and direct package usage coexist during migration.
5. Once all files use the wrapper, remove the last direct package references.

### Detection Checklist
- [ ] Package is used directly in more than 5 business logic files with no wrapper
- [ ] "We'll wrap it when we need to" is the stated plan
- [ ] Provider switching conversation triggers panic about "how many files reference this?"
- [ ] Provider migration estimates include "refactor all references" as a major work item

### Related Rules
- Use the Wrapper from Day One, Not Retroactively

### Related Skills
- Package Escape Hatch Strategy (KU 04)
- When NOT To Build Custom (KU 05)

### Related Decision Trees
- DT-WRP-001: Should This Package Be Wrapped Behind an Interface?
