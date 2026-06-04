# Domain vs Application Services

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Domain vs Application Services
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-01

---

## Executive Summary

Domain services and application services represent two distinct architectural layers in Domain-Driven Design. A domain service contains pure business logic — calculations, validations, and workflows that are meaningful to domain experts. An application service orchestrates infrastructure — coordinating repositories, transactions, event dispatch, and external API calls. The domain service knows nothing about HTTP, databases, or the framework. The application service translates between the framework and the domain.

The engineering significance of this distinction is maintainability at scale. Domain services are the core of the application's business logic — they are framework-agnostic, testable in isolation, and can be reasoned about without understanding HTTP or database concerns. Application services are the adapters that make the domain logic available through the framework. Mixing them creates coupling — a domain decision (like "how is interest calculated?") becomes dependent on framework infrastructure (like "which database connection is used?").

In the Laravel community, the strict DDD distinction is controversial and often pragmatically relaxed. Eloquent models — which function as both domain entities and persistence models — are deeply embedded in the framework. Fighting this coupling by hiding Eloquent behind repository interfaces and creating pure domain models is seen by many as excessive ceremony for the typical Laravel application. The pragmatic compromise: keep the conceptual separation (domain logic vs application orchestration) even if the code separation is imperfect.

---

## Core Concepts

### Domain Service (DDD Definition)
A domain service contains business logic that does not naturally belong to an Entity or Value Object. Eric Evans defines it as "a process or transformation that is not a natural responsibility of an Entity or Value Object."

Characteristics:
- No infrastructure awareness (no HTTP, database, or framework imports)
- Stateless (no per-request mutable state)
- Named in Ubiquitous Language (terms meaningful to domain experts)
- Operates across multiple aggregates when an operation touches more than one
- Testable without booting the framework

Example: `TransferFundsService` that coordinates `Account::withdraw()` and `Account::deposit()` — pure domain logic across two aggregates.

### Application Service (DDD Definition)
An application service coordinates infrastructure to fulfill a use case. It does not contain business rules — it delegates to domain services for business logic and to repositories/APIs for infrastructure.

Characteristics:
- Infrastructure-aware (repositories, transactions, mail, queues)
- Orchestrates domain services and infrastructure
- Sets transaction boundaries
- Translates between HTTP/DTO and domain primitives
- Entry point for the controller

Example: `ProcessTransferApplicationService` that loads accounts (repository), executes the transfer (domain service), commits the transaction, and dispatches events.

### The Separation Litmus Test
"Could this logic function correctly if called from an Artisan command or a queue job without modification?"

- Yes → Domain service (no HTTP coupling)
- No → Application service (depends on Request, session, or response)

If logic depends on `Request`, `Session`, `Auth`, or `Cookie`, it is application-layer code, not domain code.

### Infrastructure Coupling Spectrum

| Code Pattern | Layer Classification | Common in Laravel? |
|-------------|---------------------|-------------------|
| `new Money(100)` | Domain (pure PHP) | Rare — often inlined |
| `interface AccountRepository` | Domain (contract) | Rare — repository interfaces not common |
| `User::find($id)` in service | Application (Eloquent coupling) | Very common |
| `new TransferService()` | Domain (instantiation) | Rare for domain services |
| `DB::transaction(...)` | Application | Very common |
| `throw InsufficientFundsException` | Domain | Medium |
| `Event::dispatch(...)` | Application | Very common |
| `Mail::send(...)` | Application | Very common |

---

## Mental Models

### Domain as the Brain, Application as the Body
The domain service decides WHAT to do (calculate interest, validate a transfer, determine eligibility). The application service decides HOW to do it (load from the database, wrap in a transaction, send a notification). The brain (domain) has no knowledge of the body's mechanisms.

### Eloquent as the Uncomfortable Middle
Eloquent models in Laravel are both domain entities (representing business concepts) and persistence models (knowing about database tables, relationships, and `save()`). This dual role blurs the domain/application boundary. A purist approach would separate them (Domain Entity + Persistence Model). A pragmatic approach acknowledges the coupling and places Eloquent models in the application layer, keeping only pure value objects and stateless logic in the domain.

### Layers as Categorization, Not Enforcement
In many production Laravel applications, the domain/application distinction is maintained as a directory structure convention without strict PHP-level enforcement. Code in `app/Domain/` is expected to have minimal framework imports. Code in `app/Application/` can use Eloquent, facades, and framework services. The directory structure communicates intent, even if the PHP code could technically violate the boundary.

---

## Internal Mechanics

### Import-Based Layer Detection

The cleanest heuristic for determining whether a class belongs in the domain or application layer is its import statements:

```php
// Domain service — zero framework imports
namespace App\Domain\Billing;

use App\Domain\Billing\ValueObjects\Money;
use App\Domain\Billing\Contracts\InvoiceRepositoryInterface;

class InvoiceCalculationService
{
    public function calculateTotal(Money $subtotal, Money $tax, Money $discount): Money
    {
        return $subtotal->add($tax)->subtract($discount);
    }
}
```

```php
// Application service — framework imports for infrastructure
namespace App\Application\Billing;

use App\Domain\Billing\InvoiceCalculationService;
use App\Domain\Billing\Contracts\InvoiceRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class InvoiceProcessingService
{
    public function __construct(
        private InvoiceCalculationService $calculator,
        private InvoiceRepositoryInterface $invoices,
    ) {}

    public function processInvoice(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            $invoice = $this->invoices->create($data);
            // ...
            DB::afterCommit(fn () => Event::dispatch(new InvoiceProcessed($invoice)));
            return $invoice;
        });
    }
}
```

The domain service imports only domain concepts (value objects, interfaces). The application service imports framework bindings for transactions and events.

### Repository Interface Placement

In strict DDD, repository interfaces belong in the domain layer (they express a domain concept: "we can retrieve and persist users"). Repository implementations belong in the infrastructure layer (they use database-specific code).

```php
// Domain — interface only (no implementation)
namespace App\Domain\Billing\Contracts;

interface InvoiceRepositoryInterface
{
    public function find(string $id): Invoice;
    public function save(Invoice $invoice): void;
}
```

```php
// Infrastructure — framework-dependent implementation
namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\Billing\Contracts\InvoiceRepositoryInterface;

class EloquentInvoiceRepository implements InvoiceRepositoryInterface
{
    public function find(string $id): Invoice
    {
        return Invoice::findOrFail($id); // Eloquent coupling is OK here
    }
}
```

In practice, most Laravel applications skip this separation and inject Eloquent models directly into the "application service" layer, treating the service as the boundary.

### Framework Dependency Detection

A domain service must not import:
- `Illuminate\*` — any framework namespace
- `App\Http\*` — HTTP layer
- `Symfony\Component\HttpFoundation\*` — HTTP primitives
- Facades (`\Auth`, `\Cache`, `\Mail`)
- Eloquent model concrete classes

It MAY import:
- Domain value objects
- Domain interfaces
- `Carbon\Carbon` (date library — framework-agnostic)
- PHP standard library classes
- `\DomainException`, `\InvalidArgumentException` — domain exceptions

---

## Patterns

### Pure Domain Service Pattern

```php
namespace App\Domain\Billing;

use App\Domain\Billing\ValueObjects\Money;
use App\Domain\Billing\Contracts\InvoiceRepositoryInterface;

class PricingService
{
    public function __construct(
        private TaxCalculator $taxCalculator,
        private DiscountCalculator $discountCalculator,
    ) {}

    public function calculateTotal(Money $subtotal, string $customerTier, string $country): array
    {
        $discount = $this->discountCalculator->apply($subtotal, $customerTier);
        $afterDiscount = $subtotal->subtract($discount);
        $tax = $this->taxCalculator->calculate($afterDiscount, $country);
        $total = $afterDiscount->add($tax);

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'total' => $total,
        ];
    }
}
```

Zero framework imports. Pure business logic. Testable with `new PricingService(...)` — no Laravel bootstrap needed.

### Application Service Pattern

```php
namespace App\Application\Billing;

use App\Domain\Billing\PricingService;
use App\Domain\Billing\ValueObjects\Money;
use App\Domain\Billing\Contracts\InvoiceRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class CheckoutService
{
    public function __construct(
        private PricingService $pricingService,
        private InvoiceRepositoryInterface $invoices,
        private InventoryService $inventory,
    ) {}

    public function processCheckout(Cart $cart, User $user): Invoice
    {
        $pricing = $this->pricingService->calculateTotal(
            new Money($cart->total()),
            $user->tier,
            $user->country,
        );

        return DB::transaction(function () use ($cart, $user, $pricing) {
            $this->inventory->reserve($cart->items());
            $invoice = $this->invoices->create([...$pricing, 'user_id' => $user->id]);

            DB::afterCommit(fn () => Event::dispatch(
                new CheckoutCompleted($invoice)
            ));

            return $invoice;
        });
    }
}
```

The application service coordinates: calls domain services for business rules, uses repositories for persistence, manages transactions and events.

### Pragmatic Laravel Pattern (Domain Directory Without Strict Separation)

Most production Laravel applications use a softer separation:

```php
// app/Domain/Billing/ — still uses Eloquent but conceptually domain
namespace App\Domain\Billing;

class PaymentService
{
    public function __construct(
        private PaymentGateway $gateway,      // External system — interface
        private LoggerInterface $logger,
    ) {}

    public function charge(Order $order): Payment // Accepts Eloquent model
    {
        $charge = $this->gateway->charge(
            $order->total,
            $order->paymentToken
        );

        $payment = $order->payments()->create([
            'charge_id' => $charge->id,
            'amount' => $charge->amount,
            'status' => $charge->status,
        ]);

        $this->logger->info('Payment processed', [
            'order' => $order->id,
            'charge' => $charge->id,
        ]);

        return $payment;
    }
}
```

Not pure DDD (uses Eloquent models as parameters), but the conceptual grouping is domain-specific. The compromise: it's in the Domain directory, but it's not framework-agnostic.

### Interface-Based Domain Service

For strict separation, the domain service depends on an interface, not on Eloquent:

```php
// Domain
namespace App\Domain\Billing\Contracts;

interface PaymentGatewayInterface
{
    public function charge(Money $amount, string $token): Charge;
}

// Infrastructure
namespace App\Infrastructure\Payment;

class StripePaymentGateway implements PaymentGatewayInterface
{
    public function charge(Money $amount, string $token): Charge
    {
        $result = \Stripe\Charge::create([
            'amount' => $amount->cents(),
            'source' => $token,
        ]);
        return new Charge($result->id, $result->status);
    }
}
```

The domain service depends on the interface. The infrastructure implementation depends on the framework/SDK. The service provider binds them:

```php
$this->app->bind(PaymentGatewayInterface::class, StripePaymentGateway::class);
```

---

## Architectural Decisions

### Why Strict Separation Is Rare in Laravel
The framework actively discourages strict layer separation. Eloquent models are simultaneously domain entities and persistence models. Facades are globally available. The service container auto-resolves concrete classes without binding. Fighting these design choices to create a pure domain layer requires significant boilerplate (repository interfaces, model mapping, DTO translation) that provides diminishing returns for most applications.

### When Strict Separation Is Worth the Cost

| Scenario | Separation Required | Boilerplate Justified? |
|----------|---------------------|----------------------|
| Simple CRUD, <10 entities | No | Overkill |
| Complex business rules, >20 entities | Medium | Yes — protects domain logic |
| Multiple entry points (HTTP + CLI + queue) | Medium | Yes — avoids duplication |
| External system integrations | Yes — at interface boundary | Yes — enables testing |
| Team of 10+ developers | Medium | Yes — enforces boundaries |

### The Pragmatic Middle Ground
The most common production pattern in the Laravel community:
- Keep the `/Domain/` directory for conceptual separation
- Use Eloquent models in domain directory — accept the coupling
- Extract pure business logic into value objects (framework-agnostic)
- Use interfaces at external system boundaries (payment, email, SMS)
- Do NOT use repository interfaces for Eloquent — use Eloquent directly
- Application services coordinate, domain services contain logic

---

## Tradeoffs

### Strict Separation vs Pragmatic Approach

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Strict: Domain is framework-agnostic, testable without Laravel, portable to other frameworks | Strict: Boilerplate — interfaces, bindings, DTO mapping for every entity | Justified only for complex domains with long lifespans |
| Pragmatic: Fast development, minimal files, full Laravel productivity | Pragmatic: Domain logic depends on Eloquent, cannot run without Laravel | Acceptable for most Laravel applications |

### Interface at Every Boundary vs Only at External Boundaries

| Approach | Benefit | Cost |
|----------|---------|------|
| Interface at every boundary | Maximum testability, clean swapping | Ceremony: 3 files (interface + impl + binding) for every dependency |
| Interface only at external boundaries | Minimal ceremony, only true polymorphism is abstracted | Internal services are coupled to concrete implementations |

### Value Objects vs Primitives

| Pattern | Benefit | Cost |
|---------|---------|------|
| Value Objects (Email, Money, Phone) | Type safety, self-validating, domain language | More classes, more files, more mapping code |
| Primitives (string, int, float) | Zero ceremony | Type errors, validation scattered, no domain language |

---

## Performance Considerations

### Domain Service Resolution Cost
Domain services are framework-agnostic PHP classes. They have zero framework resolution cost when instantiated directly (`new PricingService(...)`). When resolved through the container, the resolution cost is the same as any Laravel service (~0.01ms).

### Interface Resolution Cost
Interface binding adds one additional container lookup per resolution. The container must look up the interface's concrete binding before resolving. The cost is negligible (~0.001ms per resolution) but accumulates across all interface-bound dependencies.

### Value Object Construction
Value objects constructed per-call (e.g., `new Money(100)`) are inexpensive (~0.0001ms per object). The total overhead of converting primitives to value objects in a typical request is well under 0.1ms.

---

## Production Considerations

### Detecting Domain Layer Violations
Static analysis tools (PHPStan, Psalm) can detect framework imports in domain code:

```php
// PHPStan rule: No Illuminate imports in App\Domain\*
// Psalm: forbid facades in domain directory
```

Without static analysis, code review must watch for:
- `use Illuminate\*` in domain directory files
- Facade usage in domain logic
- Eloquent queries in methods labeled as "domain"

### Migration Path to Separation
If a codebase has no domain/application separation, the incremental migration:
1. Create `app/Domain/` and `app/Application/` directories
2. Move pure business logic (calculations, validations) to domain
3. Move orchestration (transactions, events, repositories) to application
4. Extract interfaces for external system boundaries
5. Add static analysis rules to prevent regression

Each step is independently deployable. The migration can take weeks to months depending on codebase size.

---

## Common Mistakes

### Treating All Services as Domain Services
Why it happens: Following DDD terminology without understanding the distinction. Why it's harmful: An "application service" labeled as "domain service" gives false confidence that business logic is framework-agnostic. A developer who modifies the service may introduce database queries or HTTP calls, assuming they are safe because it's "domain." Better approach: Explicitly label directories as `Domain/` and `Application/` to communicate intent.

### Creating Repository Interfaces for Every Model
Why it happens: Following strict DDD patterns from blog posts without considering the application's complexity. Why it's harmful: Every model needs an interface (in Domain), an Eloquent implementation (in Infrastructure), and a service provider binding. For a 20-model application, that's 60 extra files. Better approach: Use repository interfaces only at external system boundaries. Accept Eloquent coupling for internal domain logic.

### Making Domain Services Too Pure to Be Useful
Why it happens: Removing all framework imports from domain services means they cannot use Eloquent, facades, or any framework feature. Why it's harmful: The domain service becomes a useless pass-through that just calls the application service back. Pure domain services work when the domain has genuinely framework-independent business logic. For simple CRUD, there is no domain logic to extract. Better approach: Do not create domain services for entities that have no complex business rules. Application services with Eloquent are fine for simple operations.

### Interface Explosion
Why it happens: Every service gets an interface "for testability." Why it's harmful: Interface-per-service creates 3 files (interface + impl + binding) for every service. Most services have a single implementation. The interface adds no value — the container can mock concrete classes directly. Better approach: Use interfaces only where multiple implementations exist or at architectural boundaries.

---

## Failure Modes

### Domain Logic Hidden in Application Services
A business rule (discount calculation, eligibility check) implemented inside an application service alongside transaction coordination and event dispatch. The rule is invisible to developers looking for domain logic — it's mixed with infrastructure code. When the rule needs to change, the developer must navigate orchestration code to find the buried business logic.

### Eloquent Coupling in Domain Services
A domain service that calls `User::where(...)->get()` directly. The domain service is now coupled to the Eloquent query builder. It cannot be tested without a database. It cannot be reused with a different data source. If the query schema changes, the domain logic must change — even though the business rule hasn't changed.

### Transaction in the Wrong Layer
A domain service that manages its own transactions (`DB::transaction(...)`) inside a method that should be pure business logic. The domain service now has side effects and cannot be called multiple times within a single application transaction. The transaction coupling prevents composition.

---

## Ecosystem Usage

### Laravel Framework
The framework itself does not enforce or promote the domain/application distinction. Laravel's philosophy is pragmatic: Eloquent models, facades, and the service container are designed for productivity, not for strict layering. The domain/application distinction is an architectural choice, not a framework recommendation.

### Spatie (Laravel Beyond CRUD)
Spatie's premium course advocates for domain-oriented structure with DDD/hexagonal principles. Their approach is pragmatic — they keep Eloquent models but organize by domain. The "Application" vs "Domain" distinction is about directory structure and mental models, not strict PHP-level framework decoupling.

### morphling-dev/3d (DDD Framework)
The `3d` package provides DDD scaffolding for Laravel with strict domain/application/infrastructure separation. It generates repository interfaces, value objects, and DTOs. This represents the strictest end of the spectrum — appropriate for complex enterprise applications.

### Community Standard
The dominant community standard (2024–2026) is pragmatic separation: domain directory for conceptual grouping, Eloquent models accepted in the domain layer, no repository interfaces for pure Eloquent, value objects for typed data (Email, Money, Phone). Strict DDD separation is reserved for applications with complex business rules that justify the boilerplate.

---

## Related Knowledge Units

### Prerequisites
- Service Class Design — General service design principles
- Service Orchestration — Orchestration patterns that belong in application services

### Related Topics
- Service vs Action Decision — Choosing between service and action patterns
- Stateless Service Design — Statelessness requirements apply to both layers
- Directory Conventions — Where domain and application services live

### Advanced Follow-up Topics
- Feature-based Application Structure — Modular monolith with per-module domain/application layers
- DTOs — Data transfer between application and domain layers
- Value Objects — Framework-agnostic domain primitives
- Hexagonal Architecture — Ports and adapters pattern for strict separation

---

## Research Notes

### Source Analysis
- Eric Evans, "Domain-Driven Design" (2003) — Foundational definition of domain vs application services
- Spatie, "Laravel Beyond CRUD" — Pragmatic DDD with Laravel, domain-oriented structure
- morphling-dev/3d — Strict DDD scaffolding for Laravel
- Xebia DDD Guide — Application services vs domain services in DDD theory
- Steve McDougall, "Thinking In Layers" — Pragmatic layering for Laravel

### Key Insight
The domain vs application service distinction is a continuum, not a binary. Between the extremes of "pure framework-agnostic PHP" (strict DDD) and "Eloquent methods everywhere" (full framework coupling) lies a pragmatic middle ground that most production Laravel applications occupy. The value is in the conceptual separation — having clear boundaries between business logic and infrastructure coordination — not in achieving perfect decoupling.

### Key Controversy
The most contentious point in the Laravel community is whether Eloquent models can be domain entities. Purists say no — Eloquent couples to the database, so any class using it is infrastructure. Pragmatists say yes — Eloquent is the primary domain modeling tool in Laravel, and fighting it with repository abstractions for every entity adds cost without commensurate benefit. The debate has no resolution because there is no single correct answer — it depends on the application's complexity and lifespan expectations.

### Version-Specific Notes
- No version-specific changes to domain/application service concepts in Laravel 10–13
- PHP 8.0+ constructor property promotion: useful for clean value object and domain service definitions
- The domain/application distinction is project-architecture-dependent, not version-dependent
