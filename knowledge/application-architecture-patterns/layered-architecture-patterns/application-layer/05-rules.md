# Rules for Application layer: use cases, DTOs, application services

## One Use Case Per User Goal
---
## Category
Architecture | Design
---
## Rule
Each use case class MUST represent exactly one user goal with a single public method; do not combine multiple operations in one class.
---
## Reason
Single-goal use cases are independently testable, deployable, and understandable. Combined use cases lead to god classes with branching logic and unclear responsibility boundaries.
---
## Bad Example
```php
class InvoiceUseCase {
    public function create(CreateInvoiceDto $dto): InvoiceDto { /* ... */ }
    public function cancel(CancelInvoiceDto $dto): void { /* ... */ }
    public function sendReminder(RemindInvoiceDto $dto): void { /* ... */ }
}
```
---
## Good Example
```php
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceDto { /* ... */ }
}
class CancelInvoiceUseCase {
    public function execute(CancelInvoiceDto $dto): void { /* ... */ }
}
class SendInvoiceReminderUseCase {
    public function execute(RemindInvoiceDto $dto): void { /* ... */ }
}
```
---
## Exceptions
CRUD-style read operations (list, show, search) may share a single query class when they share query logic — but prefer separate queries for distinct concerns.
---
## Consequences Of Violation
God use case classes; difficult testing; merge conflicts; unclear boundaries; branching complexity.

## No Business Rules in Use Cases
---
## Category
Architecture | Design
---
## Rule
Use cases MUST NOT contain business rule logic (conditional checks on domain state, calculations, validations); delegate all business decisions to Domain entities and services.
---
## Reason
Use cases orchestrate — they coordinate domain objects, manage transactions, and handle infrastructure. Business rules in use cases become duplicated across operations and are missed when new code paths are added.
---
## Bad Example
```php
class CancelInvoiceUseCase {
    public function execute(CancelInvoiceDto $dto): void {
        $invoice = $this->invoices->find($dto->invoiceId);
        if ($invoice->status() !== 'pending') { // Business rule in use case!
            throw new \DomainException('Only pending invoices can be cancelled');
        }
        $invoice->cancel();
        $this->invoices->save($invoice);
    }
}
```
---
## Good Example
```php
class CancelInvoiceUseCase {
    public function execute(CancelInvoiceDto $dto): void {
        $invoice = $this->invoices->find($dto->invoiceId);
        $invoice->cancel(); // Business rule enforced inside entity
        $this->invoices->save($invoice);
    }
}
```
---
## Exceptions
Orchestration-level decisions (e.g., "if this is a premium user, apply express shipping") that coordinate multiple domain objects may involve conditional logic — but the actual business rule should still live in Domain.
---
## Consequences Of Violation
Business rules duplicated across use cases; new code paths bypass rules; domain entities become anemic; use cases become fat.

## Specific DTOs Per Use Case
---
## Category
Design | Maintainability
---
## Rule
Create a specific input DTO for each use case with only the fields that use case needs; do not share fat DTOs across multiple use cases.
---
## Reason
A DTO per use case provides a clear contract of exactly what that use case requires. Shared DTOs accumulate optional fields, creating confusion about which fields are required for which operation.
---
## Bad Example
```php
class InvoiceDto {
    public function __construct(
        public ?int $customerId,       // Optional: used in create only
        public ?int $invoiceId,         // Optional: used in cancel only
        public ?string $status,         // Optional: used in update only
        public ?array $items,           // Optional: used in create only
        public ?string $reason,         // Optional: used in cancel only
    ) {}
}
```
---
## Good Example
```php
class CreateInvoiceDto {
    public function __construct(
        public readonly int $customerId,
        public readonly array $items,
    ) {}
}
class CancelInvoiceDto {
    public function __construct(
        public readonly int $invoiceId,
        public readonly ?string $reason,
    ) {}
}
```
---
## Exceptions
Read-model DTOs (query results) may be shared across multiple query use cases when they return identical data shapes.
---
## Consequences Of Violation
Unclear DTO contracts; unused fields in DTOs; confusion about required vs optional fields; fragile code when shared DTO changes.

## Transaction Boundaries in Application Layer
---
## Category
Architecture | Reliability
---
## Rule
Place `DB::transaction()` boundaries in the Application layer (use cases), not in Controllers and not in Repositories.
---
## Reason
The use case orchestrating the business operation understands the full scope of work that must be atomic. Controllers should not manage DB concerns (they are HTTP adapters). Repositories should remain composable — wrapping each repository method in its own transaction prevents composition.
---
## Bad Example
```php
// Transaction in Controller
class InvoiceController {
    public function create(CreateInvoiceRequest $request) {
        DB::transaction(function () use ($request) {
            // ...
        });
    }
}
```
---
## Good Example
```php
// Transaction in Use Case
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceDto {
        return DB::transaction(function () use ($dto) {
            $invoice = Invoice::create(/* ... */);
            $this->invoices->save($invoice);
            return new InvoiceDto($invoice);
        });
    }
}
```
---
## Exceptions
Standalone repository operations (single aggregate, no cross-aggregate consistency) may manage their own transaction if the operation is genuinely atomic and standalone.
---
## Consequences Of Violation
Transactions in controllers leak persistence concerns into Presentation; transaction-per-method in repositories prevents composition across multiple repositories.

## Use Cases Do Not Call Other Use Cases
---
## Category
Architecture | Design
---
## Rule
Use cases MUST NOT call other use cases directly; extract shared orchestration logic into Application Services or Domain Services.
---
## Reason
Use case calling use case creates opaque dependency chains that are hard to trace, test, and reason about. The caller use case is coupled to the callee's implementation details.
---
## Bad Example
```php
class RegisterUserUseCase {
    public function execute(RegisterUserDto $dto): UserDto {
        // ...
        $this->sendWelcomeEmail->execute(new WelcomeEmailDto($user->id())); // Use case calling use case
    }
}
```
---
## Good Example
```php
class RegisterUserUseCase {
    public function __construct(
        private UserRepository $users,
        private WelcomeEmailService $welcomeEmail, // Application Service
    ) {}
    public function execute(RegisterUserDto $dto): UserDto {
        $user = User::fromDto($dto);
        $this->users->save($user);
        $this->welcomeEmail->send($user);
        return new UserDto($user);
    }
}
```
---
## Exceptions
Workflow or saga orchestrators that coordinate multiple use cases are an acceptable exception — but they belong in a dedicated infrastructure class, not in a use case.
---
## Consequences Of Violation
Opaque call chains; difficult to test individual use cases; coupling between use cases; orchestration logic scattered.

## Log Use Case Entry and Exit
---
## Category
Maintainability | Reliability
---
## Rule
Log the entry, exit, timing, and result of each use case execution to provide a built-in audit trail for business operations.
---
## Reason
Use cases are the atomic unit of business operations. Logging their execution provides a natural audit trail, aids debugging, and enables monitoring of business operation patterns without adding instrumentation to every method.
---
## Bad Example
No logging in use cases. When a business operation fails, developers must search through controller logs, service logs, and database queries to understand what happened.
---
## Good Example
```php
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceDto {
        Log::info('Creating invoice', ['customer' => $dto->customerId]);
        $start = microtime(true);
        try {
            $result = DB::transaction(function () use ($dto) { /* ... */ });
            Log::info('Invoice created', ['id' => $result->id, 'duration' => microtime(true) - $start]);
            return $result;
        } catch (\Throwable $e) {
            Log::error('Invoice creation failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
```
---
## Exceptions
High-throughput endpoints where logging overhead is significant may use sampling or defer to structured logging middleware.
---
## Consequences Of Violation
No audit trail for business operations; debugging requires stitching together infrastructure logs; difficult to monitor business operation health.

## Validate at Every Layer Boundary
---
## Category
Architecture | Security
---
## Rule
Validate input at every architectural layer boundary (Presentation Form Request AND Application DTO); do not assume validation from outer layers is sufficient.
---
## Reason
Each layer boundary is an attack surface. An Application layer invoked from CLI or queue bypasses HTTP Form Request validation. Every delivery mechanism must receive valid input — the Application layer must defend itself independently.
---
## Bad Example
```php
class CreateInvoiceDto {
    public function __construct(public int $customerId, public array $items) {}
    // No validation — assumes Presentation validated everything
}
```
---
## Good Example
```php
class CreateInvoiceDto {
    public function __construct(public readonly int $customerId, public readonly array $items) {
        if ($customerId <= 0) throw new \InvalidArgumentException('Invalid customer');
        if (empty($items)) throw new \InvalidArgumentException('Invoice must have items');
    }
}
```
---
## Exceptions
Internal calls within the same process where trust is established may skip redundant validation — but defensive validation at boundaries is the safer default.
---
## Consequences Of Violation
Invalid data reaches domain layer when bypassing Presentation; inconsistent validation across delivery mechanisms; data corruption.
