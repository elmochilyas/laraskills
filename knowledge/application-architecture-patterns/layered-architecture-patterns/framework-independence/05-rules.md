# Rules for Framework independence of domain layer in practice

## Be Intentional About Independence Level
---
## Category
Architecture | Design
---
## Rule
Explicitly decide and document the framework independence level (full, partial, or none) for the Domain layer; do not let coupling happen accidentally.
---
## Reason
Accidental coupling (using Facades or Carbon in Domain because they're convenient) creates the worst outcome: the cost of framework coupling without the productivity benefit of deliberate usage. An explicit decision allows architecture tests to enforce the chosen level.
---
## Bad Example
```php
class Invoice {
    public function isOverdue(): bool {
        return $this->dueDate->lt(Carbon::now()); // Accidental coupling — no decision was made
    }
}
```
---
## Good Example
```php
// ADR-001 documents: "We choose partial independence — Eloquent coupling is accepted, HTTP coupling is not."
// Architecture tests enforce: no HTTP imports in Domain, but Eloquent usage is allowed
```
---
## Exceptions
No common exceptions. The absence of an explicit decision IS the accidental-coupling path.
---
## Consequences Of Violation
Worst of both worlds: framework coupling without intentional design; architecture tests cannot enforce an undefined standard; inconsistent coupling across the codebase.

## Keep Value Objects Framework-Agnostic
---
## Category
Architecture | Design
---
## Rule
Value objects (`Money`, `Email`, `DateRange`) MUST always be plain PHP classes with no framework dependencies, regardless of the chosen independence level.
---
## Reason
Value objects are universally useful and trivial to keep framework-independent. They provide clear benefit (encapsulated validation, type safety, immutable state) and cost nothing to decouple. There is no valid reason to couple a value object to a framework.
---
## Bad Example
```php
use Illuminate\Support\Carbon;

class DateRange {
    public function __construct(
        public Carbon $start,  // Coupled to Laravel
        public Carbon $end,    // Coupled to Laravel
    ) {}
}
```
---
## Good Example
```php
class DateRange {
    public function __construct(
        public readonly \DateTimeImmutable $start,
        public readonly \DateTimeImmutable $end,
    ) {
        if ($start >= $end) throw new \InvalidArgumentException('Start must be before end');
    }
}
```
---
## Exceptions
No common exceptions. Value objects must always be framework-agnostic.
---
## Consequences Of Violation
Unnecessary framework coupling in the simplest domain objects; value objects cannot be reused outside Laravel context; validation logic cannot be tested without framework bootstrap.

## Use Interfaces for Infrastructure Concerns
---
## Category
Architecture | Design
---
## Rule
Define interfaces (ports) for all infrastructure concerns (repositories, event buses, mailers) in the Domain or Application layer; implement them in Infrastructure.
---
## Reason
Interface-based abstraction is the minimum viable architecture for any project that may benefit from framework independence. It enables testing without real infrastructure and allows swapping implementations without modifying business logic.
---
## Bad Example
```php
class RegisterUserUseCase {
    public function execute(RegisterUserDto $dto): void {
        User::create($dto->toArray()); // Direct Eloquent call — no abstraction
    }
}
```
---
## Good Example
```php
interface UserRepository {
    public function save(User $user): void;
}
class RegisterUserUseCase {
    public function __construct(private UserRepository $users) {}
    public function execute(RegisterUserDto $dto): void {
        $this->users->save(User::fromDto($dto));
    }
}
```
---
## Exceptions
Three-layer architecture where the Business layer deliberately uses Eloquent — this is a documented partial-independence tradeoff.
---
## Consequences Of Violation
Business logic coupled to specific infrastructure; testing requires real database/API; swapping infrastructure requires changing business code.

## Write Domain Tests Without Laravel Bootstrap
---
## Category
Testing | Architecture
---
## Rule
Domain unit tests MUST run without bootstrapping Laravel; if tests still use `RefreshDatabase` or `CreatesApplication`, framework independence is unrealized.
---
## Reason
The primary practical benefit of framework independence is millisecond-speed unit tests. Tests that bootstrap Laravel take 10-100x longer. If Domain tests still require full Laravel bootstrap, the independence effort has not paid off.
---
## Bad Example
```php
class InvoiceTest extends TestCase { // Extends Laravel TestCase — slow bootstrap
    use RefreshDatabase; // Database needed because Domain uses Eloquent
    /** @test */
    public function it_can_be_marked_as_paid(): void { /* ... */ }
}
```
---
## Good Example
```php
class InvoiceTest extends \PHPUnit\Framework\TestCase { // Pure PHPUnit — no bootstrap
    /** @test */
    public function it_can_be_marked_as_paid(): void {
        $invoice = new Invoice(InvoiceId::generate(), Money::zero());
        $invoice->markAsPaid(new \DateTimeImmutable());
        $this->assertTrue($invoice->isPaid());
    }
}
```
---
## Exceptions
Infrastructure tests that exercise database or API code SHOULD bootstrap Laravel — these are integration tests, not unit tests.
---
## Consequences Of Violation
Slow test suite; developers skip Domain tests; false sense of framework independence; testing bottleneck slows CI.

## Map Domain Entities to Eloquent Explicitly for Full Independence
---
## Category
Architecture | Performance
---
## Rule
When pursuing full framework independence, implement an explicit mapping layer between Domain entities and Eloquent models; do not skip the mapping layer under time pressure.
---
## Reason
The mapping layer is where coupling is managed. Skipping it means Eloquent models become domain entities, defeating framework independence. The mapping layer absorbs the complexity of the translation so Domain stays clean.
---
## Bad Example
```php
// No mapping layer — Domain entities are Eloquent models
namespace App\Domain\Entities;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model {
    // Domain behavior mixed with persistence concerns
}
```
---
## Good Example
```php
// Domain: pure entity
namespace App\Domain\Entities;
class Invoice { /* pure PHP */ }

// Infrastructure: mapper
namespace App\Infrastructure\Persistence;
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice { /* ... */ }
    public function toEloquent(Invoice $invoice): array { /* ... */ }
}
```
---
## Exceptions
When mapping overhead is not justified and partial independence is acceptable — make this a conscious, documented decision rather than an accidental omission.
---
## Consequences Of Violation
Framework independence is cosmetic; repository abstraction is bypassed; domain entities accumulate Eloquent dependencies.

## Prefer Partial Independence for Most Laravel Apps
---
## Category
Architecture | Design
---
## Rule
Default to partial independence (Eloquent coupling in Domain, no HTTP coupling) for most Laravel applications; only pursue full independence when explicitly justified.
---
## Reason
Full framework independence carries significant cost (mapping layer, interface proliferation, architectural discipline) that most applications never recoup. Partial independence gives 80% of the benefit (no HTTP coupling, testable services) at 40% of the cost.
---
## Bad Example
Full Clean Architecture with ports, adapters, and entity mapping for a 15-table CRM application with standard CRUD operations and a single web UI.
---
## Good Example
Service layer with Eloquent models containing business logic, Form Request validation, API Resource responses — no ports, no mappers, no domain entities separate from models.
---
## Exceptions
Fintech, healthcare, compliance applications with genuinely complex business rules and multi-delivery mechanisms may justify full independence.
---
## Consequences Of Violation
Unnecessary architectural overhead for applications that don't need it; team frustration; architecture abandonment; cost paid daily for benefit that never materializes.
