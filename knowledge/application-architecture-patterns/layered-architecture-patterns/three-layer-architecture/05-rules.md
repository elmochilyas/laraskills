# Rules for Three-layer architecture: Presentation, Business, Data

## Controller Delegates to Service
---
## Category
Architecture
---
## Rule
Controllers MUST delegate business logic to Service classes; NEVER contain business rules, calculations, or data access calls.
---
## Reason
Controllers are HTTP adapters. Business logic in controllers makes the logic untestable without HTTP bootstrapping, couples business rules to request/response cycles, and violates the single responsibility of the Presentation layer.
---
## Bad Example
```php
class InvoiceController {
    public function pay($id) {
        $invoice = Invoice::findOrFail($id);
        if ($invoice->status !== 'pending') { abort(400); }
        $invoice->update(['status' => 'paid', 'paid_at' => now()]);
        Log::info("Invoice {$id} paid");
        return redirect()->route('invoices.show', $id);
    }
}
```
---
## Good Example
```php
class InvoiceController {
    public function pay($id, PayInvoiceService $service) {
        $service->execute($id);
        return redirect()->route('invoices.show', $id);
    }
}
```
---
## Exceptions
Prototypes or single-use admin panels where speed trumps testability. Document the exception and plan to refactor.
---
## Consequences Of Violation
Fat, untestable controllers; duplicated business logic across controllers; inability to reuse business rules from CLI or queue contexts.

## Form Request Encapsulates Validation
---
## Category
Architecture | Maintainability
---
## Rule
Use Form Request classes for all validation with 3+ rules; NEVER call `$request->validate()` in controller bodies.
---
## Reason
Inline validation scatters validation rules, cannot be reused across endpoints, and is untestable in isolation. Form Requests provide self-contained, testable, and reusable validation with automatic authorization via `authorize()`.
---
## Bad Example
```php
public function store(Request $request) {
    $validated = $request->validate([
        'email' => 'required|email|unique:users',
        'name' => 'required|string|max:255',
        'password' => 'required|min:8|confirmed',
    ]);
    // ...
}
```
---
## Good Example
```php
public function __invoke(StoreUserRequest $request, CreateUserService $service) {
    return new UserResource($service->execute($request->toDto()));
}
```
---
## Exceptions
Single-field validation (e.g., `$request->validate(['email' => 'required|email'])`) may use inline validation.
---
## Consequences Of Violation
Validation logic duplicated across controllers; harder to unit test; missed edge cases; controllers remain fat.

## Never Pass Request Object to Service
---
## Category
Architecture | Framework Usage
---
## Rule
NEVER pass `Illuminate\Http\Request` objects to Service layer methods; extract only needed data in the Controller and pass primitives or DTOs.
---
## Reason
Passing Request objects leaks HTTP concerns into the Business layer, coupling business logic to Laravel's HTTP kernel and making services untestable without HTTP mocks.
---
## Bad Example
```php
class InvoiceService {
    public function create(Request $request) {
        $total = $request->input('items') * $request->input('price');
        // ...
    }
}
```
---
## Good Example
```php
class InvoiceService {
    public function create(CreateInvoiceDto $dto) {
        $total = $dto->quantity * $dto->unitPrice;
        // ...
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Business layer coupled to HTTP; services cannot be tested without bootstrapping Laravel HTTP kernel; CLI or queue usage of the same service requires fake Request construction.

## Extract Services at Controller Growth
---
## Category
Maintainability | Code Organization
---
## Rule
Extract Service classes when Controllers exceed 200 lines; do not let controllers grow into untestable god classes.
---
## Reason
200-line controllers typically indicate multiple responsibilities. Extracting services keeps controllers focused on HTTP delegation and enables business logic to be tested independently.
---
## Bad Example
A 500-line `UserController` handling registration, login, profile updates, password resets, and admin user management — all business logic inline.
---
## Good Example
A 50-line `UserController` that delegates to `RegisterUserService`, `UpdateProfileService`, `ResetPasswordService` — each a focused, testable class.
---
## Exceptions
Controllers that are inherently thin wrappers over simple CRUD (e.g., a 30-line resource controller) do not need services.
---
## Consequences Of Violation
Fat controllers; business logic duplication; low test coverage; onboarding friction; high merge conflict probability.

## Never Call Eloquent from Controllers
---
## Category
Architecture | Framework Usage
---
## Rule
NEVER call Eloquent models directly from Controllers; ALWAYS delegate through a Service class.
---
## Reason
Direct Eloquent calls from controllers bypass the Business layer, making business rules optional and untestable. Every `Model::find()` in a controller is a potential layer violation.
---
## Bad Example
```php
public function show($id) {
    $invoice = Invoice::with('items')->findOrFail($id);
    return view('invoices.show', compact('invoice'));
}
```
---
## Good Example
```php
public function show($id, InvoiceService $service) {
    return new InvoiceResource($service->findById($id));
}
```
---
## Exceptions
Prototypes or ultra-simple CRUD with zero business logic. Never in production applications with layered architecture.
---
## Consequences Of Violation
Business logic bypassed; layer boundaries meaningless; architecture degrades; untestable data access paths.

## Business Layer Testable Without Laravel
---
## Category
Testing | Architecture
---
## Rule
Design the Business layer so it can be unit-tested without bootstrapping the Laravel application or database.
---
## Reason
Tests that require Laravel bootstrap take 10-100x longer to run, reducing development velocity and discouraging thorough testing. A testable Business layer uses dependency injection and avoids facades.
---
## Bad Example
```php
class InvoiceService {
    public function calculateTotal($items) {
        return collect($items)->sum(fn($i) => $i['price'] * $i['qty']);
    }
}
// Test requires Laravel bootstrap because of collect() helper
```
---
## Good Example
```php
class InvoiceService {
    public function calculateTotal(array $items, PricingCalculator $calculator): Money {
        return $calculator->sum($items);
    }
}
// Test: new InvoiceService(new PricingCalculator())->calculateTotal(...)
```
---
## Exceptions
Integration tests that intentionally test infrastructure (database queries, API calls) should bootstrap Laravel.
---
## Consequences Of Violation
Slow test suites; developers skip testing; business logic bugs reach production.

## Security at Presentation Boundary
---
## Category
Security | Architecture
---
## Rule
Apply authentication and authorization at the Presentation layer boundary (middleware, Form Requests); NEVER rely on the Business layer as the primary security enforcement point.
---
## Reason
The Business layer should receive already-authenticated context. Security enforcement in the Presentation layer ensures consistent application of policies before any business logic executes.
---
## Bad Example
```php
class InvoiceService {
    public function cancel($invoiceId, $userId) {
        $user = User::find($userId); // Auth check inside business layer
        if (!$user->can('cancel-invoices')) { abort(403); }
        // ...
    }
}
```
---
## Good Example
```php
// Controller / Form Request handles authorization
class CancelInvoiceRequest extends FormRequest {
    public function authorize(): bool {
        return $this->user()->can('cancel-invoices');
    }
}
```
---
## Exceptions
Business-level security invariants (e.g., "an invoice cannot be paid twice") belong in the Domain layer, not Presentation.
---
## Consequences Of Violation
Inconsistent authorization; security logic scattered; potential bypass paths; auth logic duplicated across delivery mechanisms.

## Three Layers Before More
---
## Category
Architecture | Code Organization
---
## Rule
Start with three-layer architecture (Presentation → Business → Data) before adding additional layers or architectural patterns.
---
## Reason
Three layers handle the vast majority of Laravel application needs. Adding Clean Architecture or Hexagonal layers preemptively increases complexity without proven benefit. Evolve architecture based on demonstrated pain.
---
## Bad Example
Implementing Clean Architecture with ports, adapters, and entity mapping on day one of a 5-table CRUD application with no business logic.
---
## Good Example
Starting with `Controller → Service → Model`, then evolving to Clean Architecture when the application grows to 20+ tables with complex business rules and multiple delivery mechanisms.
---
## Exceptions
Projects explicitly designed as framework-independent libraries or packages may start with layered architecture.
---
## Consequences Of Violation
Premature over-engineering; team frustration with ceremony over value; architectural abandonment.

## Architecture Tests Enforce Boundaries
---
## Category
Testing | Architecture
---
## Rule
Write architecture tests that enforce layer boundaries in CI; do not rely on team discipline or code review alone.
---
## Reason
Layer bypass under time pressure is the most common violation. Only automated enforcement prevents degradation. Architecture tests are living documentation of the intended structure.
---
## Bad Example
No arch tests. A developer under deadline calls `Model::find()` from a controller. Code review misses it. Six months later, 40 controllers make direct Eloquent calls.
---
## Good Example
```php
arch('presentation')
    ->expect('App\Http\Controllers')
    ->not->toUse(['App\Models', 'Illuminate\Support\Facades\DB']);
```
---
## Exceptions
Prototypes or proof-of-concept projects where speed is the only priority.
---
## Consequences Of Violation
Architecture degrades silently; layer boundaries become meaningless; refactoring to restore boundaries requires significant effort.

## Services Add Business Value
---
## Category
Architecture | Design
---
## Rule
Service classes MUST encapsulate meaningful business logic or orchestration; do NOT create services that merely wrap Eloquent CRUD without adding value.
---
## Reason
Services that only delegate `User::create($data)` or `Product::find($id)` are anemic — they add ceremony without benefit. Services should justify their existence with business rules, orchestration, or cross-cutting coordination.
---
## Bad Example
```php
class UserService {
    public function create(array $data): User {
        return User::create($data);
    }
    public function find(int $id): User {
        return User::findOrFail($id);
    }
}
```
---
## Good Example
```php
class UserService {
    public function register(RegisterUserDto $dto): User {
        $user = User::create($dto->toArray());
        $this->assignDefaultRole($user);
        $this->sendWelcomeNotification($user);
        return $user;
    }
}
```
---
## Exceptions
Proxy services that exist exclusively for testability (e.g., injecting a service to allow mocking) are acceptable when the alternative is untestable code.
---
## Consequences Of Violation
Ceremony without benefit; developer frustration with unnecessary abstractions; architectural skepticism from the team.
