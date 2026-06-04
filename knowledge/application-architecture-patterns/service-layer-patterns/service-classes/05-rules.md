## Prefer Service Classes For Business Logic
---
## Architecture
---
## Rule
Prefer service classes as the default location for business logic in Laravel projects. Always use a service class when you are unsure where to put business logic.
---
## Reason
Service classes provide a consistent, predictable location for business logic, preventing logic from scattering across controllers, models, or routes.
---
## Bad Example
```php
class UserController extends Controller
{
    public function register(Request $request)
    {
        // Business logic in controller instead of service
        $user = User::create($request->validated());
        $user->assignRole('member');
        Mail::to($user)->send(new WelcomeMail($user));
        event(new UserRegistered($user));
        return response()->json($user, 201);
    }
}
```
---
## Good Example
```php
class UserController extends Controller
{
    public function __construct(
        private UserService $userService
    ) {}

    public function register(RegisterUserRequest $request): JsonResponse
    {
        $user = $this->userService->register($request->validated());
        return response()->json($user, 201);
    }
}
```
---
## Exceptions
Prototype-stage applications where speed is more important than structure. Controllers that already delegate to model methods and are thin.
---
## Consequences Of Violation
Logic scattered across controllers, untestable business rules, duplicated code, difficult maintenance.

## One Responsibility Per Method
---
## Architecture
---
## Rule
Keep each service method responsible for exactly one complete business operation. Name the method after that operation.
---
## Reason
Methods with multiple responsibilities are harder to test, harder to understand, and harder to reuse. Single-responsibility methods can be composed by callers.
---
## Bad Example
```php
class UserService
{
    public function doUserStuff(array $data): User
    {
        $user = User::create($data);
        $user->assignRole('member');
        Mail::to($user)->send(new WelcomeMail($user));
        event(new UserRegistered($user));
        $this->notifySlack($user);
        return $user;
    }
}
```
---
## Good Example
```php
class UserService
{
    public function register(array $data): User { /* registration only */ }
    public function changePassword(User $user, string $newPassword): void { /* password only */ }
    public function suspend(User $user): void { /* suspension only */ }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Untestable god methods, hidden side effects, low reusability, difficult debugging.

## Services Must Return Data, Not HTTP Responses
---
## Architecture
---
## Rule
Services must return data, not HTTP responses. Return models, collections, DTOs, or primitive values. Response formatting belongs in controllers.
---
## Reason
A service returning `response()->json()` couples business logic to HTTP, preventing reuse from CLI commands, queue jobs, or other non-HTTP contexts.
---
## Bad Example
```php
class UserService
{
    public function register(array $data): JsonResponse
    {
        $user = User::create($data);
        return response()->json(['user' => $user, 'message' => 'Registered'], 201);
    }
}
```
---
## Good Example
```php
class UserService
{
    public function register(array $data): User
    {
        return User::create($data);
    }
}

// Controller handles response
return response()->json($user, 201);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Business logic coupled to HTTP, impossible to reuse from CLI/queue, testing requires HTTP simulation, violated separation of concerns.

## Limit Constructor Dependencies To Five
---
## Maintainability
---
## Rule
Limit constructor dependencies in service classes to five or fewer. A service with six or more dependencies is doing too much and should be split.
---
## Reason
Constructor dependencies are a count of a class's collaborators. Five-plus dependencies signal that the class has too many responsibilities and violates the Single Responsibility Principle.
---
## Bad Example
```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private OrderRepository $orders,
        private PaymentGateway $gateway,
        private Mailer $mailer,
        private AnalyticsService $analytics,
        private NotificationService $notifications,
        private AuditService $audit,
        private CacheService $cache,
    ) {}
}
```
---
## Good Example
```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private Mailer $mailer,
        private AuditService $audit,
    ) {}
}
// Split registration concerns into RegisterUserAction
```
---
## Exceptions
Infrastructure services that legitimately coordinate many adapters (e.g., a service orchestrating payment, notifications, and logging for a single workflow).
---
## Consequences Of Violation
God service classes, difficult testing (too many mocks), fragile constructor changes, unclear responsibility boundaries.

## Wrap Multi-Write Operations In Transactions
---
## Reliability
---
## Rule
Wrap service methods that perform multiple database writes in `DB::transaction()`. Single-write operations do not require explicit transactions.
---
## Reason
Multi-write operations must be atomic — all writes succeed or all fail together. Without a transaction, a partial failure leaves the system in an inconsistent state.
---
## Bad Example
```php
class OrderService
{
    public function placeOrder(array $data): Order
    {
        $order = Order::create($data);
        $order->items()->createMany($data['items']);
        Inventory::decrement($data['items']); // If this fails, order exists without inventory update
        return $order;
    }
}
```
---
## Good Example
```php
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function placeOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = Order::create($data);
            $order->items()->createMany($data['items']);
            Inventory::decrement($data['items']);
            return $order;
        });
    }
}
```
---
## Exceptions
Read-only operations. Single-write operations (each individual write is already atomic at the database level).
---
## Consequences Of Violation
Partial writes leading to inconsistent data, unrecoverable state, silent data corruption, difficult debugging.

## Avoid God Service Classes
---
## Maintainability
---
## Rule
Avoid god service classes that accumulate methods across unrelated domains. Split services when they exceed 20-30 methods or cover multiple domain concerns.
---
## Reason
God service classes are untestable, have unclear responsibility, and accumulate by accretion. Each addition makes the class harder to maintain.
---
## Bad Example
```php
class UserService
{
    public function register(): void {}
    public function login(): void {}
    public function changePassword(): void {}
    public function updateProfile(): void {}
    public function uploadAvatar(): void {}
    public function processPayment(): void {}
    public function generateInvoice(): void {}
    public function sendNewsletter(): void {}
    public function manageSubscriptions(): void {}
    public function handleBilling(): void {}
    // 30+ unrelated methods
}
```
---
## Good Example
```php
class UserService { /* user-related operations only */ }
class BillingService { /* billing-related operations only */ }
class NewsletterService { /* newsletter-related operations only */ }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Untestable classes, unclear responsibility, difficult onboarding, merge conflicts, resistance to change.

## Avoid Anemic Services
---
## Architecture
---
## Rule
Avoid anemic services that simply call model methods without adding orchestration value. Only extract logic to a service when it adds coordination, transaction management, or side-effect handling.
---
## Reason
Anemic services add boilerplate without benefit, increasing the class count and indirection without improving testability or maintainability.
---
## Bad Example
```php
class UserService
{
    public function findById(int $id): ?User
    {
        return User::find($id); // No orchestration, no added value
    }

    public function create(array $data): User
    {
        return User::create($data); // Just wrapping Eloquent
    }
}
```
---
## Good Example
```php
// No service needed for simple operations — use model directly
$user = User::find($id);

// Service only when orchestration is needed
class RegistrationService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create($data);
            $this->mailer->sendWelcome($user);
            $this->analytics->trackRegistration($user);
            event(new UserRegistered($user));
            return $user;
        });
    }
}
```
---
## Exceptions
Team conventions that mandate a service layer for all operations, including simple CRUD (consistency over optimization).
---
## Consequences Of Violation
Unecessary boilerplate, class explosion without benefit, indirection that hides intent, wasted maintenance overhead.

## Avoid Service-To-Service Deep Call Chains
---
## Architecture
---
## Rule
Avoid deep service-to-service call chains. A service calling a service that calls another service creates implicit coupling. Use action classes for leaf-node operations.
---
## Reason
Deep call chains create opaque dependency graphs where a change in a leaf service can break multiple upstream callers. Actions as leaf nodes keep the graph shallow.
---
## Bad Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return $this->orderService->createOrder($data);
        // OrderService calls InventoryService
        // InventoryService calls WarehouseService
        // WarehouseService calls ShippingService
    }
}
```
---
## Good Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            $this->reserveInventoryAction->execute($order);
            return $order;
        });
    }
}
// Actions are leaf nodes — they don't call other actions or services
```
---
## Exceptions
Cross-cutting infrastructure services (logging, auditing, caching) that legitimately wrap other services without adding domain coupling.
---
## Consequences Of Violation
Opaque call graphs, implicit coupling between services, difficult testing, cascading failures, resistance to refactoring.

## Group Services By Entity Or Domain
---
## Code Organization
---
## Rule
Group services by entity or domain rather than by operation type. Name services after the entity they operate on (e.g., `UserService`, `OrderService`).
---
## Reason
Entity-based grouping keeps related operations together, making it easy to find all operations for a given domain. Operation-based grouping scatters logic across files.
---
## Bad Example
```php
// Grouped by operation type
app/Services/CreateService.php
app/Services/UpdateService.php
app/Services/DeleteService.php
app/Services/SearchService.php
```
---
## Good Example
```php
// Grouped by entity/domain
app/Services/UserService.php
app/Services/OrderService.php
app/Services/PaymentService.php
app/Services/InventoryService.php
```
---
## Exceptions
Domain-level services that span multiple entities (e.g., `BillingService`, `AuthService`, `NotificationService`).
---
## Consequences Of Violation
Scattered logic, hard to find operations for a given entity, inconsistent organization, onboarding friction.

## Delegate Implementation To Models, Events, Jobs
---
## Architecture
---
## Rule
Services should orchestrate, not implement. Delegate actual work to models (for domain logic), events (for side effects), jobs (for async work), and external services.
---
## Reason
Services that do the work themselves become monolithic. Delegation keeps each component focused on its responsibility and allows independent testing.
---
## Bad Example
```php
class UserService
{
    public function register(array $data): User
    {
        DB::beginTransaction();
        $user = new User();
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = Hash::make($data['password']);
        $user->status = 'pending';
        $user->email_verification_token = Str::random(32);
        $user->save();
        DB::commit();
        Mail::raw('Welcome', function ($msg) use ($user) {
            $msg->to($user->email);
        });
        Http::post('https://slack.com/api/notify', ['text' => "New user: $user->email"]);
        return $user;
    }
}
```
---
## Good Example
```php
class UserService
{
    public function register(array $data): User
    {
        $user = DB::transaction(fn() => $this->users->create($data));
        event(new UserRegistered($user));
        SendWelcomeMail::dispatch($user);
        return $user;
    }
}
```
---
## Exceptions
Trivial operations where delegation overhead is not justified.
---
## Consequences Of Violation
Monolithic services, untestable orchestration, difficulty replacing implementation details, hidden side effects.
