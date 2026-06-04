# Rules: COS-02 — Layer-Based Organization

## R01: Keep Controllers Free of Business Logic Beyond HTTP Orchestration
---
## Category
Architecture
---
## Rule
Limit controllers to HTTP concerns only — input validation, calling services, and returning responses. Never embed business logic.
---
## Reason
Controllers with business logic become untestable (require HTTP stack) and unmaintainable (mixing validation, orchestration, and domain rules). Service extraction is the first architectural step every Laravel project needs.
---
## Bad Example
```php
class OrderController {
    public function store(Request $request) {
        $order = new Order();
        $order->user_id = auth()->id();
        $order->total = collect($request->items)->sum(fn($i) => $i['price'] * $i['qty']);
        $order->discount = $order->total > 500 ? $order->total * 0.1 : 0;
        $order->save();
        // Send email logic inline...
        return redirect()->route('orders.show', $order);
    }
}
```
---
## Good Example
```php
class OrderController {
    public function store(StoreOrderRequest $request, OrderService $service) {
        $order = $service->createOrder($request->validated(), auth()->user());
        return redirect()->route('orders.show', $order);
    }
}
```
---
## Exceptions
Trivial CRUD operations (simple resource creation with no business rules) may stay in controllers temporarily.
---
## Consequences Of Violation
Untestable business logic coupled to HTTP. Fat controllers that grow beyond 300 lines with no clear refactoring path.
---

## R02: Extract Every Non-Trivial Business Operation to a Service Class
---
## Category
Code Organization
---
## Rule
Establish a delegation rule: all non-trivial business logic lives in a service class, not in a controller or model.
---
## Reason
Inconsistent extraction creates unpredictability — some controllers use services, others inline logic. A team-wide rule eliminates ambiguity and ensures testable business logic.
---
## Bad Example
```php
// Some controllers use services, some don't — no standard
class UserController {
    public function update(Request $request, User $user) {
        $user->update($request->validated());
        // Business logic inline!
        if ($request->has('email') && $user->wasChanged('email')) {
            Mail::to($user)->send(new EmailChangeNotification($user));
        }
        return back();
    }
}
```
---
## Good Example
```php
class UserController {
    public function update(UpdateUserRequest $request, User $user, UserService $service) {
        $service->updateProfile($user, $request->validated());
        return back();
    }
}
```
---
## Exceptions
Single-line helper methods (e.g., formatting a date) may stay in the controller or model.
---
## Consequences Of Violation
Inconsistent codebase where some operations are testable and others require full HTTP integration tests.
---

## R03: Avoid Catch-All Directories Like `app/Helpers/` or `app/Common/`
---
## Category
Code Organization
---
## Rule
Never create catch-all directories such as `app/Helpers/`, `app/Utilities/`, or `app/Common/`.
---
## Reason
Catch-all directories lack clear ownership criteria. Any file that doesn't fit elsewhere ends up there, creating dumping grounds with unrelated code that no team owns and nobody maintains.
---
## Bad Example
```php
// app/Helpers/ contains:
// formatDate.php, calculateTax.php, sendEmail.php, validatePhone.php,
// generatePdf.php, logActivity.php — 30+ unrelated functions
```
---
## Good Example
```php
// app/Support/DateFormatter.php (specific)
// app/Services/TaxService.php (specific)
// app/Actions/SendEmailNotification.php (specific)
// Each directory name describes exactly what it contains
```
---
## Exceptions
Temporary scaffolding during active refactoring, with a deadline to eliminate.
---
## Consequences Of Violation
Untestable global functions. No ownership — bugs go unaddressed as "someone else's code."
---

## R04: Enforce Layer Boundaries via Architecture Tests
---
## Category
Testing
---
## Rule
Write architecture tests that enforce layer isolation — controllers should not call Eloquent models directly, and services should not reference HTTP concerns.
---
## Reason
Directory structure alone does not prevent layer leakage. Without enforcement, `User::where(...)` queries appear in controllers despite having a service layer. Automated tests catch violations in CI.
---
## Bad Example
```php
// No architecture tests — layer boundaries are "convention only"
// Months later: 30% of controllers call Eloquent directly
```
---
## Good Example
```php
// Pest architecture test
test('controllers do not call eloquent directly')
    ->expect('App\Http\Controllers')
    ->not->toUse('Illuminate\Database\Eloquent\Model');
```
---
## Exceptions
Projects with fewer than 50 files where direct oversight suffices.
---
## Consequences Of Violation
Architectural drift — layer boundaries become meaningless within 6 months. Refactoring becomes impossible without touching every file.
---

## R05: Split Services When They Handle Multiple Unrelated Operations
---
## Category
Maintainability
---
## Rule
Split a service class when it handles operations for multiple unrelated entities or domains.
---
## Reason
God service classes recreate the fat-controller problem in a different layer. A `UserService` handling registration, password reset, billing, and notifications is a maintenance liability — changes to billing risk breaking registration.
---
## Bad Example
```php
class UserService {
    public function register(array $data): User { ... }
    public function resetPassword(User $user, string $token): void { ... }
    public function chargeUser(User $user, int $amount): Invoice { ... }
    public function sendNotification(User $user, string $type): void { ... }
}
```
---
## Good Example
```php
class RegistrationService { public function register(array $data): User { ... } }
class PasswordResetService { public function reset(User $user, string $token): void { ... } }
class BillingService { public function charge(User $user, int $amount): Invoice { ... } }
class NotificationService { public function send(User $user, string $type): void { ... } }
```
---
## Exceptions
Services that legitimately coordinate multiple sub-operations (orchestration services) may have multiple method groups.
---
## Consequences Of Violation
God classes with high coupling. Changes to unrelated features risk regression in the same file.
---

## R06: Never Create Repository-Wrapper Service Classes
---
## Category
Architecture
---
## Rule
Do not create service classes that merely wrap Eloquent CRUD operations without adding business value.
---
## Reason
`UserService::find()`, `UserService::create()`, `UserService::update()` that delegate directly to `User::find()`, `User::create()`, `User::update()` add ceremony without value. Only introduce a service when it orchestrates multiple operations or enforces business rules.
---
## Bad Example
```php
class UserService {
    public function find(int $id): ?User { return User::find($id); }
    public function create(array $data): User { return User::create($data); }
    public function update(User $user, array $data): bool { return $user->update($data); }
    public function delete(User $user): bool { return $user->delete(); }
}
```
---
## Good Example
```php
// No service — call Eloquent directly in controller for simple CRUD
$user = User::find($id);

// Service only when business logic exists
class RegistrationService {
    public function register(array $data): User {
        $user = User::create($data);
        $this->sendWelcomeEmail($user);
        $this->assignDefaultRole($user);
        return $user;
    }
}
```
---
## Exceptions
Projects migrating from a different ORM where a repository abstraction is a transitional necessity.
---
## Consequences Of Violation
Unnecessary abstraction layer adding maintenance burden with zero encapsulation benefit.
---

## R07: Use Sub-Layer Grouping Within Large Layer Directories
---
## Category
Code Organization
---
## Rule
Create sub-layer directories (e.g., `app/Http/Controllers/Api/`, `app/Http/Controllers/Web/`) when a single layer directory exceeds 20-30 files.
---
## Reason
Large flat directories slow navigation and make it hard to distinguish related groups of files. Sub-directories within layers preserve discoverability while maintaining the layer-based paradigm.
---
## Bad Example
```php
// app/Http/Controllers/ with 45 files:
// UserController.php, ApiUserController.php, AdminUserController.php,
// ProductController.php, ApiProductController.php, AdminProductController.php
```
---
## Good Example
```php
// app/Http/Controllers/
// ├── Web/UserController.php
// ├── Web/ProductController.php
// ├── Api/UserController.php
// └── Admin/UserController.php
```
---
## Exceptions
Projects where the layer directory naturally stays under 20 files.
---
## Consequences Of Violation
File name collisions requiring prefixes (`ApiUserController`, `AdminUserController`). Reduced scanability and increased cognitive load.

---

## R08: Keep Models Focused on Eloquent Concerns Only
---
## Category
Framework Usage
---
## Rule
Limit Eloquent models to data mapping, relationships, scopes, and accessors/mutators. Extract business logic to services or actions.
---
## Reason
Fat models with business logic (event dispatching, external API calls, complex validation) violate the Single Responsibility Principle and make models untestable outside a database context.
---
## Bad Example
```php
class User extends Authenticatable {
    public function RegisterWithExternalApi(array $data): void {
        DB::beginTransaction();
        $this->fill($data)->save();
        Http::post('https://api.example.com/users', $this->toArray());
        Mail::to($this)->send(new WelcomeMessage());
        DB::commit();
    }
}
```
---
## Good Example
```php
class User extends Authenticatable {
    // Relationships, scopes, accessors only
    public function posts(): HasMany { return $this->hasMany(Post::class); }
    public function scopeActive(Builder $query): void { $query->where('active', true); }
}
// Business logic in service:
class UserRegistrationService { ... }
```
---
## Exceptions
Simple Eloquent event observers (created, updated) that trigger email notifications or cache clearing.
---
## Consequences Of Violation
Models with 500+ lines mixing persistence, business rules, and external communication. Untestable outside database.
