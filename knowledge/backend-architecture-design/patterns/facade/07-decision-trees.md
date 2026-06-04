# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Facade pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Facade vs direct subsystem access
* Decision 2: GoF Facade vs Laravel Facade
* Decision 3: Facade granularity — coarse vs fine operation grouping

---

# Architecture-Level Decision Trees

---

## Decision: Facade vs Direct Subsystem Access

---

## Decision Context

Choose between providing a unified Facade class over a complex subsystem and allowing client code to interact with subsystem components directly.

---

## Decision Criteria

* performance considerations: single facade call vs N subsystem calls — negligible difference (same operations, different entry point)
* architectural considerations: facade decouples clients from subsystem complexity; direct access couples to subsystem internals
* security considerations: facade provides a single security boundary; direct access requires security in each component
* maintainability considerations: facade centralizes coordination logic; direct access distributes it across clients

---

## Decision Tree

Do clients need to execute multi-step operations involving several subsystem classes?
↓
YES → Facade (coordinate multi-step operations in one place)
    ↓
    Example: `OrderFacade::placeOrder($data)` coordinates: validate cart, create order, charge payment, send email, update inventory
    VS clients calling `CartValidator`, `OrderCreator`, `PaymentProcessor`, `EmailService`, `InventoryUpdater` individually
    ↓
    Does every client need to perform the same multi-step operations?
    YES → Facade (DRY — operation definition in one place)
        ↓
        All clients use `OrderFacade::placeOrder()` — consistent behavior
        Without facade: each client must implement the same 5-step process — duplicated, inconsistent
        NO → Facade still beneficial (simplifies the common case, specialized operations go direct)
    NO → Is the subsystem large (5+ classes, complex API)?
        YES → Facade (simplify the subsystem for common use cases)
            ↓
            Facade exposes 3-5 methods that cover 80% of use cases
            Uncommon use cases can still access subsystem directly
            NO → Is the subsystem expected to change (refactoring, replacement)?
                YES → Facade (shield clients from subsystem changes)
                    ↓
                    Subsystem refactoring only affects the facade implementation
                    Client code unchanged — interface is stable
                    NO → Direct access (facade adds unnecessary indirection)
NO → Direct access to subsystem (facade not needed)
    ↓
    Single-class subsystem, simple API, stable, or rarely used
    Facade would be a pass-through with no value
    ↓
    Monitor: if usage patterns emerge where the same 3+ subsystem calls are repeated → extract facade

---

## Rationale

Facade is valuable when subsystem complexity makes client code hard to write or when multi-step operations need to be consistent across callers. The facade should not be a pass-through (every subsystem method exposed via delegation) — it should simplify. If it's not simplifying, it's not adding value.

---

## Recommended Default

**Default:** Facade when clients coordinate 3+ subsystem classes or the subsystem is large (5+ classes). Direct access for simple, stable subsystems with single-class clients.
**Reason:** Facade reduces client complexity and centralizes coordination. Direct access is simpler when the subsystem is small and stable.

---

## Risks Of Wrong Choice

Facade as pass-through (just delegates every method): adds indirection without simplification, violates DRY. No facade for complex subsystem: each client duplicates multi-step coordination, inconsistent behavior, changes in 5 places. Facade hiding necessary flexibility: clients forced through facade for operations that need direct access — facade leaks or becomes bloated.

---

## Related Rules

- Rule 1: Facade must simplify — if not simplifying, it's not a facade
- Rule 2: Clients should be able to bypass the facade for uncommon operations

---

## Related Skills

- Implement GoF Facade
- Design Subsystem Access Boundaries
- Detect Pass-Through Facade (Anti-Pattern)

---

## Decision: GoF Facade vs Laravel Facade

---

## Decision Context

Choose between the GoF Facade pattern (an explicit class that wraps subsystem complexity) and Laravel Facades (static proxy access to container services).

---

## Decision Criteria

* performance considerations: GoF Facade has no container overhead (direct method call); Laravel Facade resolves from container per call (unless singleton)
* architectural considerations: GoF Facade is explicit; Laravel Facade provides static-like access with dynamic resolution
* security considerations: GoF Facade enforces entry points; Laravel Facade is globally accessible
* maintainability considerations: GoF Facade is testable via DI; Laravel Facility tests with `shouldReceive()`

---

## Decision Tree

Does the facade encapsulate business logic or domain coordination?
↓
YES → GoF Facade (explicit class, injected via DI, testable without framework)
    ↓
    Example: `OrderFacade` is a service class with domain and application logic
    Injected into controllers: `__construct(private OrderFacade $orderFacade)`
    ↓
    Does the facade need to remain framework-agnostic?
    YES → GoF Facade (domain/application layer — no framework coupling)
        ↓
        GoF Facade defined in application layer, injected via constructor
        Laravel Facade would couple the facade to the framework
        NO → Either works; GoF Facade preferred by convention
    NO → Is the facade purely an infrastructural shorthand (static-like access to a service)?
        YES → Laravel Facade can be appropriate (if already following Laravel conventions)
            ↓
            Laravel Facades provide convenient static access to container services
            Example: `Cache::get('key')`, `Queue::push($job)` — syntactic sugar
            ↓
            Are the underlying services injected consistently elsewhere?
            YES → Laravel Facade is acceptable sugar for commonly used infrastructure services
                ↓
            Should be used sparingly — constructor injection is preferred
            Laravel's built-in facades (Cache, Queue, Mail, Storage) are good examples
            NO → Prefer constructor injection (explicit dependencies, better testability)
                ↓
                Laravel Facades create implicit dependencies
                `shouldReceive()` in tests hides the coupling
NO → Is the purpose to provide a static-like API to a container-resolved service?
    YES → Laravel Facade (if you have a strong reason — not the default)
        ↓
        Laravel Facade requires: a Service class bound in container, a Facade class with `getFacadeAccessor()`
        ↓
        Does the team understand facades and their testability tradeoffs?
        YES → Acceptable for infrastructural shorthand
        NO → Use constructor injection (clearer, team-friendly)
    NO → Constructor injection (not using either facade pattern)
        ↓
        For most application code, constructor injection is the simplest, most testable approach
        No facade pattern needed

---

## Rationale

GoF Facade and Laravel Facades solve different problems. GoF Facade simplifies complex subsystems. Laravel Facades provide convenient static access to container services. GoF Facades belong in the application/domain layer. Laravel Facades are infrastructure-layer syntactic sugar. For most code, constructor injection is simpler than either facade approach.

---

## Recommended Default

**Default:** GoF Facade for simplifying complex business operations. Constructor injection for most service access. Laravel Facades only for infrastructure-wide services (like Laravel's built-in facades) where the team explicitly prefers them.
**Reason:** GoF Facade improves architecture. Laravel Facades are convenience — used sparingly. Constructor injection is the clearest dependency contract.

---

## Risks Of Wrong Choice

Laravel Facade for domain logic: hidden dependencies in domain, can't test without framework boot. GoF Facade where Laravel Facade suffices: unnecessary class for simple container access. Overuse of Laravel Facades: implicit coupling, difficult refactoring, obscured service dependencies.

---

## Related Rules

- Rule 3: GoF Facade for domain/application coordination logic
- Rule 4: Laravel Facades are syntactic sugar — use sparingly, prefer constructor injection

---

## Related Skills

- Implement GoF Facade
- Create Laravel Facade
- Choose Between Facade Types

---

## Decision: Facade Granularity — Coarse vs Fine Operation Grouping

---

## Decision Context

Choose whether the facade exposes coarse-grained methods (one method per use case) or fine-grained methods (exposing subsystem steps individually).

---

## Decision Criteria

* performance considerations: coarse method may do unnecessary work for some callers; fine methods let callers choose exact operations
* architectural considerations: coarse = simpler client code; fine = more flexible but more coupling
* security considerations: coarse methods can enforce use-case-level security; fine methods require per-operation security
* maintainability considerations: coarse methods may grow large (God method risk); fine methods push orchestration to clients

---

## Decision Tree

Does each client need the same sequence of subsystem operations?
↓
YES → Coarse-grained (one method per common operation — DRY)
    ↓
    `placeOrder()` — always runs validate, create, charge, email, inventory
    All clients get the same consistent behavior
    ↓
    Do some clients need subsets of the coarse operation?
    YES → Consider providing both coarse (for standard flow) and fine (for customization)
        ↓
        Coarse: `placeOrder()` — standard flow
        Fine: `validateCart()`, `createOrder()` — for custom flows
        ↓
        Are 80%+ of clients using the coarse method?
        YES → Coarse default + fine access for the 20% edge case
            ↓
            The 80/20 rule: coarse for common case, fine for power users
            NO → Fine-grained (clients have diverse needs — facade can't predict the common case)
    NO → Does a single coarse method risk becoming a God method (20+ steps)?
        YES → Split into multiple coarse facades by subdomain
            ↓
            `CheckoutFacade` (order, payment), `FulfillmentFacade` (inventory, shipping), `NotificationFacade` (email, SMS)
            NO → Single coarse facade — manageable size
NO → Fine-grained (clients need different combinations of subsystem operations)
    ↓
    Facade exposes subsystem steps as individual methods
    Clients orchestrate their own sequences
    ↓
    Are we fine-grained because we're too lazy to design proper use-case methods?
    YES → Design coarse methods for the 80% use case first
        ↓
        Fine-grained facade that mirrors the subsystem is a pass-through facade
        It adds no value — just exposes every subsystem method with delegation
        NO → Fine-grained with clear documentation of each method's purpose

---

## Rationale

Coarse-grained facade methods are the default — they provide real value by simplifying client code. Fine-grained methods are needed when client requirements are diverse. A facade that simply mirrors every subsystem method (pass-through facade) is an anti-pattern — it adds indirection without simplification.

---

## Recommended Default

**Default:** Coarse-grained methods that represent complete use cases (placeOrder, processRefund, generateInvoice). Add fine-grained methods only when 20%+ of clients need non-standard sequences.
**Reason:** Coarse methods provide the real benefit of facade — simplifying client code. Fine methods risk becoming pass-through.

---

## Risks Of Wrong Choice

Coarse God method: 50-step method that's impossible to test, breaks SRP. Pass-through facade: every subsystem method exposed, no simplification, just delegation. Fine-grained that no client uses: speculative generality — added complexity with no current benefit. Coarse with dead options: unused parameters that control which steps run — facade becomes complicated.

---

## Related Rules

- Rule 5: Design facade methods as complete use cases (coarse-grained)
- Rule 6: Pass-through facade (every subsystem method delegated) is an anti-pattern

---

## Related Skills

- Design Coarse-Grained Facade Methods
- Split Facade by Subdomain
- Avoid Pass-Through Facade
