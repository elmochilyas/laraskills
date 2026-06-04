# Active Record as Domain Layer — Rules

---

## Rule: Encapsulate State Mutation Behind Expressive Domain Methods
---
## Category
Design
---
## Rule
Always wrap attribute mutations on Eloquent models inside expressive domain methods instead of calling `update()` with an array from outside the model.
---
## Reason
Domain methods name the business intent, centralize invariant enforcement, and provide a single point of change when rules evolve. Raw `update()` calls scatter business logic across controllers and actions, creating an anemic domain model.
---
## Bad Example
```php
class OrderController extends Controller
{
    public function pay(Request $request, Order $order): JsonResponse
    {
        $order->update(['status' => 'paid', 'paid_at' => now()]);

        return response()->json($order);
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();
    }
}

class OrderController extends Controller
{
    public function pay(Request $request, Order $order): JsonResponse
    {
        $order->markAsPaid();

        return response()->json($order);
    }
}
```
---
## Exceptions
Seeding, factory state definitions, and mass `upsert()` operations where performance outweighs encapsulation.
---
## Consequences Of Violation
Maintainability declines as business rules become duplicated across controllers, making changes fragile and error-prone.

---

## Rule: Enable Strict Mode to Catch Lazy Loading Early
---
## Category
Performance
---
## Rule
Always call `Model::shouldBeStrict()` in the `AppServiceProvider::boot()` for non-production environments to prevent lazy loading and missing attribute access.
---
## Reason
Active Record models make lazy loading transparent, which hides N+1 query problems until production traffic exposes them. Strict mode converts these silent performance traps into explicit exceptions during development.
---
## Bad Example
```php
class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // No strict mode enabled — lazy loading goes unnoticed
    }
}
```
---
## Good Example
```php
use Illuminate\Database\Eloquent\Model;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
    }
}
```
---
## Exceptions
Legacy migrations or package code that legitimately accesses non-existent attributes. Apply `Model::preventLazyLoading()` selectively instead.
---
## Consequences Of Violation
Performance degrades silently due to N+1 queries reaching production, requiring costly retrofits under load.

---

## Rule: Protect Mass Assignment with Explicit Fillable Attributes
---
## Category
Security
---
## Rule
Always define `$fillable` on every Eloquent model and never use `$guarded = []` to disable mass-assignment protection.
---
## Reason
Mass assignment protection is the last line of defense against unintended attribute writes from request input. Leaving `$guarded` empty allows any column to be written through `create()` or `update()`, creating an injection vector.
---
## Bad Example
```php
class User extends Model
{
    protected $guarded = [];
}
```
---
## Good Example
```php
class User extends Model
{
    protected $fillable = [
        'name', 'email', 'password',
    ];
}
```
---
## Exceptions
Temporary prototyping or models where every column is intentionally writable through a controlled, audited process. Never in production-facing code.
---
## Consequences Of Violation
Security vulnerabilities from mass-assignment injection, potentially granting unauthorized users elevated privileges or modifying protected attributes.

---

## Rule: Hide Sensitive Attributes from Serialization
---
## Category
Security
---
## Rule
Always list sensitive attributes such as passwords, tokens, and internal flags in the `$hidden` array on Eloquent models.
---
## Reason
Eloquent's `toArray()` and `toJson()` serialize every column by default. Exposed secrets in API responses or logs create a severe information-disclosure risk.
---
## Bad Example
```php
class User extends Model
{
    protected $fillable = ['name', 'email', 'password', 'api_token'];
    // Neither hidden nor visible — password and token leak on serialization
}
```
---
## Good Example
```php
class User extends Model
{
    protected $hidden = ['password', 'api_token', 'remember_token'];
}
```
---
## Exceptions
When explicitly needing to debug serialization issues in a local environment — never in production.
---
## Consequences Of Violation
Security breach from leaked credentials, tokens, or PII in API payloads, log files, or queue job serialization.

---

## Rule: Keep Domain Methods Free of External Side Effects
---
## Category
Architecture
---
## Rule
Never call external services, dispatch jobs, send emails, or log to external systems from within an Eloquent model domain method.
---
## Reason
Domain methods on models should concern themselves only with state validation and mutation. Injecting external side effects couples the domain to infrastructure, makes testing harder, and violates the Single Responsibility Principle.
---
## Bad Example
```php
class Order extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();

        Mail::to($this->user)->send(new OrderConfirmation($this));
        Log::info('Order marked as paid', ['id' => $this->id]);
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();
    }
}

// In the controller or action:
$order->markAsPaid();
Event::dispatch(new OrderPaid($order->id));
```
---
## Exceptions
No common exceptions. Defer side effects to domain events, listeners, or action classes.
---
## Consequences Of Violation
Testing becomes brittle (requires mocking external services), domain logic is inseparable from infrastructure, and changes to email or logging touch the model.

---

## Rule: Select Only Required Columns in Queries
---
## Category
Performance
---
## Rule
Always use `select()` or `Model::query()->select()` to limit retrieved columns when only a subset of fields is needed, rather than relying on `$hidden` for post-query filtering.
---
## Reason
Active Record hydrates every column in the table row into memory. Retrieving blob, text, or oversized columns unnecessarily increases memory pressure and slows query response.
---
## Bad Example
```php
$orders = Order::where('user_id', $userId)->get();
// Each Order object contains ALL columns, including large text fields
```
---
## Good Example
```php
$orders = Order::where('user_id', $userId)
    ->select(['id', 'status', 'total_cents', 'created_at'])
    ->get();
```
---
## Exceptions
When the full model is needed for serialization or business logic that accesses many columns. Prefer explicit selection by default.
---
## Consequences Of Violation
Higher memory consumption per request, slower serialization, and unnecessary data transfer from the database.

---

## Rule: Prefer Single `save()` Calls Over Multiple Property Assignments Followed by `save()`
---
## Category
Performance
---
## Rule
Batch property mutations on an Eloquent model and call `save()` once, rather than calling `save()` after each individual attribute change in separate steps.
---
## Reason
Each `save()` call executes a full database write. Multiple `save()` calls within the same request inflate database connections, increase transaction log writes, and degrade response times.
---
## Bad Example
```php
$order = Order::find($id);
$order->status = 'paid';
$order->save();

$order->paid_at = now();
$order->save();

$order->payment_reference = $ref;
$order->save();
```
---
## Good Example
```php
$order = Order::find($id);
$order->status = 'paid';
$order->paid_at = now();
$order->payment_reference = $ref;
$order->save();
```
---
## Exceptions
When intermediate saves are required for event listeners that depend on specific states during a multi-step workflow. Extremely rare.
---
## Consequences Of Violation
Unnecessary database round-trips that multiply write latency and increase contention under concurrent access.

---

## Rule: Use Traits for Cross-Cutting Model Concerns
---
## Category
Code Organization
---
## Rule
Extract reusable cross-cutting behaviors such as soft deletes, UUID primary keys, timestamp management, or activity logging into dedicated traits rather than duplicating code across models or using inheritance.
---
## Reason
Traits compose horizontally without forcing an inheritance hierarchy. They keep each model's class focused on its domain responsibilities while reusing infrastructure concerns predictably.
---
## Bad Example
```php
class Post extends Model
{
    // Soft delete logic copy-pasted from another model
    protected $dates = ['deleted_at'];

    public function restore(): void
    {
        $this->deleted_at = null;
        $this->save();
    }
}
```
---
## Good Example
```php
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;
}
```
---
## Exceptions
When the cross-cutting concern is truly one-off or the trait introduces too much magic for the team to reason about.
---
## Consequences Of Violation
Duplicate code across models, inconsistent behavior implementations, and increased maintenance burden when fixing bugs in repeated logic.
