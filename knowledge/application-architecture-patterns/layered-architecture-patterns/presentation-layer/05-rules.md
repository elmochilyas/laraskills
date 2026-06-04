# Rules for Presentation layer: controllers, requests, resources, routes

## No Business Logic in Controllers
---
## Category
Architecture | Code Organization
---
## Rule
Controllers MUST contain zero business logic; they MUST delegate all business operations to use cases or service classes.
---
## Reason
Controllers are HTTP adapters. Business logic in controllers makes the logic untestable without HTTP bootstrapping, couples business rules to request/response cycles, and violates the Presentation layer's single responsibility.
---
## Bad Example
```php
class InvoiceController {
    public function pay($id) {
        $invoice = Invoice::findOrFail($id);
        if ($invoice->status !== 'pending') { return back()->withErrors('Cannot pay'); }
        if ($invoice->total->amount > $this->user->creditLimit()) { return back()->withErrors('Over limit'); }
        $invoice->update(['status' => 'paid', 'paid_at' => now()]);
        return redirect()->route('invoices.show', $id);
    }
}
```
---
## Good Example
```php
class PayInvoiceController {
    public function __construct(private PayInvoiceUseCase $useCase) {}
    public function __invoke(PayInvoiceRequest $request, int $id): RedirectResponse {
        $this->useCase->execute(new PayInvoiceDto($id, $request->user()->id));
        return redirect()->route('invoices.show', $id);
    }
}
```
---
## Exceptions
No common exceptions. Controllers must always delegate business logic.
---
## Consequences Of Violation
Fat, untestable controllers; business logic duplication across endpoints; business rules unreachable from CLI/queue.

## Use Form Requests for All Validation
---
## Category
Architecture | Maintainability
---
## Rule
Use dedicated Form Request classes for all HTTP request validation with 3+ rules; do not use `$request->validate()` in controller bodies.
---
## Reason
Form Requests encapsulate validation rules in self-contained, testable classes. They can be reused across endpoints, provide automatic authorization via `authorize()`, and keep controllers focused on delegation.
---
## Bad Example
```php
public function store(Request $request) {
    $validated = $request->validate([
        'email' => 'required|email|unique:users',
        'name' => 'required|string|max:255',
        'password' => 'required|min:8|confirmed',
        'role' => 'required|in:admin,user',
    ]);
    // ...
}
```
---
## Good Example
```php
public function __invoke(StoreUserRequest $request, RegisterUserUseCase $useCase): UserResource {
    return new UserResource($useCase->execute($request->toDto()));
}
```
---
## Exceptions
Single-field validation (one rule on one field) may be inline. Temporary prototypes where speed trumps structure.
---
## Consequences Of Violation
Validation logic scattered across controllers; untestable validation rules; validation duplication across endpoints.

## Inject Dependencies in Controllers
---
## Category
Framework Usage | Testing
---
## Rule
Inject dependencies via constructor or method injection in controllers; do not resolve from `app()` container or use Facades.
---
## Reason
Injected dependencies are explicit, testable, and swappable. Container resolution and Facades create hidden dependencies that cannot be mocked in controller tests without bootstrapping the full application.
---
## Bad Example
```php
public function show(int $id) {
    $invoice = app(InvoiceService::class)->find($id); // Hidden dependency
    return view('invoices.show', compact('invoice'));
}
```
---
## Good Example
```php
public function __construct(private InvoiceService $service) {}
public function show(int $id): View {
    return view('invoices.show', ['invoice' => $this->service->find($id)]);
}
```
---
## Exceptions
Middleware parameters and route-model binding are acceptable Laravel conventions that are not dependency resolution.
---
## Consequences Of Violation
Controller untestable without full app bootstrap; dependencies invisible; Facade calls can't be mocked in unit tests.

## Use Invokable Controllers for Distinct Dependencies
---
## Category
Architecture | Maintainability
---
## Rule
Use single-action (invokable) controllers when each endpoint has distinct dependencies; use resource controllers only for standard CRUD with shared dependencies.
---
## Reason
Multi-method controllers with 5+ injected dependencies in the constructor inject everything for every method, even when only one method uses each dependency. Invokable controllers inject only what the single action needs.
---
## Bad Example
```php
class InvoiceController {
    public function __construct(
        private CreateInvoiceService $createService,  // Only used by create()
        private CancelInvoiceService $cancelService,   // Only used by cancel()
        private SendInvoiceService $sendService,       // Only used by send()
    ) {}
    public function create(CreateInvoiceRequest $r) { $this->createService->execute($r->toDto()); }
    public function cancel(int $id) { $this->cancelService->execute($id); }
    public function send(int $id) { $this->sendService->execute($id); }
}
```
---
## Good Example
```php
class CreateInvoiceController {
    public function __construct(private CreateInvoiceUseCase $useCase) {}
    public function __invoke(CreateInvoiceRequest $r): InvoiceResource { /* ... */ }
}
class CancelInvoiceController {
    public function __construct(private CancelInvoiceUseCase $useCase) {}
    public function __invoke(int $id): RedirectResponse { /* ... */ }
}
```
---
## Exceptions
Standard CRUD resource controllers (index, create, store, show, edit, update, destroy) naturally share dependencies and benefit from the resource controller pattern.
---
## Consequences Of Violation
Constructor pollution with unused dependencies; wasted memory allocation for every request; unclear which actions depend on which services.

## Use API Resources for Response Shape
---
## Category
Architecture | Security
---
## Rule
Use API Resource classes to control JSON response serialization; do not return Eloquent models or pass them directly to views.
---
## Reason
API Resources define the exact shape of responses, controlling which fields are exposed and how they're formatted. Returning Eloquent models directly risks leaking internal or sensitive model attributes.
---
## Bad Example
```php
public function show(int $id): JsonResponse {
    return response()->json(Invoice::with('user')->findOrFail($id)); // Exposes all model attributes
}
```
---
## Good Example
```php
public function show(int $id): InvoiceResource {
    $invoice = $this->useCase->execute($id);
    return new InvoiceResource($invoice);
}
```
---
## Exceptions
Simple API responses with 2-3 fields that exactly match the entity may return directly — but Resources are preferred for consistency.
---
## Consequences Of Violation
Sensitive data leaks (password hashes, internal IDs, pivot data); inconsistent response shapes; breaking API changes when model changes.

## Never Call Eloquent from Controllers
---
## Category
Architecture | Framework Usage
---
## Rule
Controllers MUST NOT call Eloquent models or query builder directly; always delegate to a use case or service.
---
## Reason
Direct Eloquent calls from controllers bypass the Application and Domain layers, skipping business rules, validation, and transaction management. This makes business rules optional and untestable.
---
## Bad Example
```php
public function show(int $id): View {
    $invoice = Invoice::with('items.product')->findOrFail($id); // Bypasses all layers
    return view('invoices.show', compact('invoice'));
}
```
---
## Good Example
```php
public function show(int $id): View {
    $invoice = $this->useCase->execute($id);
    return view('invoices.show', ['invoice' => $invoice]);
}
```
---
## Exceptions
No common exceptions in layered architecture. In default MVC without a business layer, controllers calling Eloquent is the accepted norm — but this rule applies when layers exist.
---
## Consequences Of Violation
Business rules bypassed; transaction boundaries ignored; layer abstraction invalidated.

## Keep Routes Focused and Grouped
---
## Category
Code Organization | Maintainability
---
## Rule
Group routes by concern (web, api, admin) and apply middleware at the group level; do not scatter route definitions across multiple files with overlapping responsibilities.
---
## Reason
Centralized, grouped route files make the application's HTTP surface clear. Middleware applied at group level is automatically inherited, preventing security gaps from missing middleware on individual routes.
---
## Bad Example
```php
// routes/web.php and routes/api.php both contain admin routes
// Middleware applied individually on each route — easy to miss
Route::get('/admin/users', [UserController::class, 'index'])->middleware('auth', 'admin');
Route::get('/api/users', [ApiUserController::class, 'index']);
```
---
## Good Example
```php
// routes/web.php — public web routes
// routes/api.php — public API routes
// routes/admin.php — admin routes with group middleware
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```
---
## Exceptions
Feature-flagged routes may need separate files for conditional loading — but the group structure should still be consistent.
---
## Consequences Of Violation
Inconsistent middleware application; security gaps from missing auth middleware; confusing route organization.
