# Observer Anti-Patterns

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
Observers are a powerful abstraction, but their implicit, fire-and-forget nature leads to several well-documented anti-patterns. Overuse creates a "spooky action at a distance" effect where model operations trigger invisible side effects. Hidden dependencies, opaque observer chains, non-local behavior, and testing complexity are the primary costs. Recognizing these anti-patterns is essential for maintaining codebase clarity and preventing production incidents.

## Core Concepts
- **Spooky action at a distance:** Code that calls `$user->save()` has no local indication that 5 observers will fire, 3 API calls will be made, 2 caches cleared, and 1 email sent. The behavior is invisible at the call site.
- **Hidden side effects:** Observer methods that perform external API calls, send emails, write to third-party services, or modify other models introduce side effects invisible to developers reading the save/delete call.
- **Observer chain:** Observer A triggers an event on Model B, whose observer triggers an event on Model C. These chains are hard to trace and debug.
- **Non-local behavior:** An observer registered in `AppServiceProvider::boot()` affects the model everywhere â€” across controllers, commands, queues, and tests. There is no local opt-out.
- **Temporal coupling:** Observer methods that depend on the state of other services (current user, request, session) introduce hidden temporal coupling. The observer only works correctly when called within an HTTP request context.

## Mental Models
- **Observer as landmine:** Every observer registration is a landmine buried in the codebase. The developer calling `$model->save()` steps on it without warning. Landmines (observers) should be clearly marked.
- **Invisible tentacles:** Observers reach into other parts of the system like tentacles. When you save a model, you cannot see which tentacles (API calls, cache flushes, email sends) are activated.
- **Global callback trap:** Observers are global callbacks. Global callbacks are notoriously difficult to reason about, debug, and test. The same arguments against global variables apply to observers.

## Internal Mechanics

> **Reference:** 
- Observer registration happens via `Model::observe()` which uses reflection on the observer class to discover public methods, then binds each as a closure listener through `registerModelEvent()`.
- Observer instances are singletons resolved from the container â€” one instance per observer class per model class serves all events for the lifetime of the request.
- `fireModelEvent()` dispatches events through `$dispatcher->until()` (for `*ing` events) or `$dispatcher->dispatch()` (for `*ed` events). The `until()` method short-circuits on the first non-null return, enabling `return false` to halt persistence.
- The dispatcher uses the `eloquent.{event}: {class}` namespace. Any code path that triggers a model operation â€” `save()`, `delete()`, `update()`, `restore()` â€” goes through `fireModelEvent()`, making observer invocation invisible at the call site.
- Observer methods execute in registration order. Each method receives the model instance. Observers have no awareness of other registered observers or listeners for the same event.

## Patterns
- **Thin observer pattern:** Observers contain minimal logic â€” typically dispatching a queued job or calling a service class. Business logic belongs in service/action classes, not observers.
- **Documented observer pattern:** Maintain a manifest of all registered observers per model. Use `php artisan model:show {Model}` to inspect observers. Document side effects in the observer class docblock.
- **Flag-guarded observer pattern:** Guard against re-entrant calls using flags stored on the model instance (`$model->skipObserver = true`) rather than observer instance properties. This prevents state leakage across requests.
- **Environment-conditional observer pattern:** Register observers conditionally based on environment. Use `#[ObservedBy]` for essential observers and service provider registration for optional observers.
- **Queued observer pattern:** Always use queued jobs for side effects involving external I/O (API calls, email, file system). The observer's sole responsibility is dispatching the appropriate job.

## Common Anti-Patterns

### 1. The God Observer
An observer that handles multiple unrelated concerns â€” audit logging, cache invalidation, notification sending, search indexing, and relationship management â€” all in one class.

**Problem:** Violates Single Responsibility Principle. Testing requires mocking too many dependencies. Any change risks breaking unrelated features.

**Solution:** Split into focused observers (`AuditObserver`, `CacheObserver`, `NotificationObserver`).

### 2. The API Caller
An observer that makes external HTTP requests (Slack notifications, CRM sync, email delivery) synchronously.

**Problem:** External API calls in observers block the response. If the API is slow or down, the model save fails or times out. API errors cascade into data persistence failures.

**Solution:** Dispatch a queued job from the observer. Never make synchronous external calls in observers.

### 3. The Silent Failure
An observer that wraps its logic in a try-catch and silently fails:

```php
public function saved(Model $model): void
{
    try {
        // Sync to external service
    } catch (\Exception $e) {
        // Silently ignored
    }
}
```

**Problem:** Failures are invisible. Data drift between systems goes undetected. Production incidents are hard to diagnose.

**Solution:** Log failures and alert. Let exceptions propagate in development. Use a dead-letter queue for retries.

### 4. The Stateful Observer
An observer that stores state on its instance properties across method calls:

```php
class PostObserver
{
    private bool $isProcessing = false;
    
    public function saved(Post $post): void
    {
        if ($this->isProcessing) return;
        $this->isProcessing = true;
        // ... logic
    }
}
```

**Problem:** Observers are singletons. Instance state leaks between requests. In concurrent environments (queue workers), state is shared across jobs.

**Solution:** Use local variables only. If guard flags are needed, store them on the model instance or use a static cache keyed by model ID.

### 5. The Conditional Observer
An observer that checks request context to decide behavior:

```php
public function created(User $user): void
{
    if (request()->is('admin/*')) {
        // Admin-created user behavior
    } else {
        // Public registration behavior
    }
}
```

**Problem:** Observer behavior depends on context not available in all environments (queues, commands, tests). Breaks encapsulation. Makes testing difficult.

**Solution:** Move conditional logic to the controller or service layer. Call different methods or dispatch different events from the call site.

### 6. The Cascade Trigger
An observer that saves or deletes other models, triggering their observers:

```php
public function deleted(Order $order): void
{
    $order->items()->delete(); // Triggers ItemObserver
    $order->invoice()->delete(); // Triggers InvoiceObserver
    $order->user->notify(new OrderCancelled($order)); // Triggers notification
}
```

**Problem:** Creates observer chains that are unpredictable and hard to trace. A single delete can cascade into dozens of observer methods across multiple models.

**Solution:** Use database-level cascading (`ON DELETE CASCADE`) or handle cascade logic in the service layer. Keep observers focused on the single model.

### 7. The Observed-By-Attribute Overuse
Using `#[ObservedBy]` on every model for every observer, making the model file a registry of cross-cutting concerns.

**Problem:** The model class becomes polluted with observer declarations. Adding/removing observers requires modifying the model file. Observers cannot be conditionally registered.

**Solution:** Use `#[ObservedBy]` sparingly (for essential observers). Register conditional, environment-specific, or optional observers in service providers.

### 8. The Early Return Abuser
Using `return false` from `*ing` observer methods as a validation mechanism:

```php
public function saving(Order $order): bool
{
    if ($order->total < 0) {
        return false;
    }
}
```

**Problem:** Silent failure. The caller has no indication that the save was suppressed. The application state is inconsistent.

**Solution:** Throw `ValidationException` for validation failures. Use `return false` only for internal operational guards (e.g., duplicate prevention), and always log the abort.

### 9. The Heavy Lifter
An observer that performs expensive computations, database queries, or resource-intensive operations synchronously.

**Problem:** Every save/delete becomes slow. Page load times increase. Queue jobs consume excessive resources.

**Solution:** Move heavy work to queued jobs. The observer's only job is to dispatch the job.

### 10. The God Class Registration
Registering all observers for all models in a single service provider method with no organization.

**Problem:** The registration block becomes unmanageable. It's unclear which observers exist and which models they affect.

**Solution:** Use dedicated observer service providers, group by domain, or use `#[ObservedBy]` for local registration.

## Architectural Decisions
- **Why thin observers?** â€” Observers are a cross-cutting concern mechanism, not a business logic layer. Business logic belongs in services/actions. Observers should dispatch jobs, not execute logic.
- **Why no request dependency?** â€” Observers execute in any context (HTTP, CLI, queue). Request dependencies introduce temporal coupling and make observers untestable outside HTTP context.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Observers centralize cross-cutting concerns | Observers hide side effects from call sites | Document all observers; make registration discoverable |
| Observers keep models clean | Overuse leads to "spooky action at a distance" | Limit observers to infrastructure concerns (cache, audit, search) |
| Observer chains can automate complex workflows | Chains are unpredictable and hard to debug | Test observer chains end-to-end; log observer execution |

## Performance Considerations
- **Synchronous external calls:** An HTTP request in an observer adds 100ms-5s to every save. Always queue external calls.
- **Observer chaining overhead:** A cascade of 5 observers each making DB queries multiplies response time. Profile observer-heavy models.
- **Queue dispatch overhead:** Dispatching a job from an observer adds minimal overhead (1-5ms). This is far less than the cost of synchronous execution.

## Production Considerations
- **Observer logging:** Log every observer method entry and exit with timing. This is critical for debugging production issues.
- **Observer monitoring:** Track observer execution time, error rates, and cascading effects. Alert on observer failures.
- **Kill switch:** Provide a mechanism to disable specific observers in production (via config flag) for emergency incident response.
- **Observer testing:** Test observers in isolation (direct method calls) and integration (full lifecycle). Ensure queued observers work correctly.

## Common Mistakes
- **Creating observers too early:** Adding observers before understanding the domain flow leads to over-engineering. Start with explicit calls in services; extract to observers only when cross-cutting concerns emerge.
- **Not testing observer behavior:** Observers are production code. Every observer method should have unit and integration tests.
- **Observer as service replacement:** Using observers to orchestrate business logic instead of keeping logic in service classes. This couples business rules to persistence events.

## Failure Modes
- **Cascading failure from external dependency:** An observer that calls a slow/unavailable API causes the model save to fail. The user sees a 500 error for what should be a simple save.
- **Observer deadlock:** Observer A saves Model B, whose observer saves Model A. This creates a deadlock or infinite loop that crashes the request.
- **Silent data corruption:** An observer that modifies model state in `saving` without the caller's knowledge can corrupt data or violate business invariants.
- **Observer-dependent feature degradation:** Disabling an observer (e.g., during maintenance) breaks features that depend on its side effects, with no warning.

## Ecosystem Usage
- **Laravel Horizon:** Uses observers internally but follows best practices â€” observers dispatch jobs rather than executing work synchronously.
- **Spatie Packages:** Provide observer traits that developers explicitly register, making observer presence visible.
- **Laravel Nova:** Uses observers heavily for resource lifecycle, but within a controlled framework context where observer behavior is well-documented.

## Related Knowledge Units

### Prerequisites
- Observer Pattern
- Observer Registration

### Related Topics
- Event Propagation
- Event Control (Quiet Operations)

### Advanced Follow-up Topics
- Service Layer Pattern
- Domain Events
- CQRS

## Research Notes
- **Source Analysis:** Community experience reports from Laravel-focused blogs, conference talks, and open-source codebase reviews. The anti-patterns described here are distilled from observed behavior in production codebases.
- **Key Insight:** The fundamental tension with observers is between convenience (automatic side effects) and explicitness (visible side effects). The best practices center on making observer behavior as visible and controlled as possible â€” through logging, queuing, thin implementations, and clear documentation.
- **Version-Specific Notes:** These anti-patterns apply across all Laravel versions. The `#[ObservedBy]` attribute (Laravel 10+) introduces a new vector for the "invisible registration" anti-pattern since the registration is in the model file rather than a central service provider.
