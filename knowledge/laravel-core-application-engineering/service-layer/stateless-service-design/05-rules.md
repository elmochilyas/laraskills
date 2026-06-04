# Stateless Service Design — Engineering Rules

---

## Rule 1: Services Must Be Stateless

Service classes must capture no per-request or per-call state on `$this`. All operational data must be received as method parameters and returned as results.

---

## Category

Design

---

## Rule

Service methods must not set mutable instance properties during execution. Every method must accept all required data as parameters and return results explicitly. The only properties a service class may have are injected dependencies (repositories, gateways, other services) which are stable across all calls.

---

## Reason

Stateless services are safe in any runtime (PHP-FPM, Octane, RoadRunner), composable without side effects, and trivially testable. Stateful services leak data across requests in long-lived processes, causing data corruption and concurrency bugs that are extremely difficult to reproduce and debug.

---

## Bad Example

```php
class UserService
{
    private ?User $lastCreated = null;
    private int $operationCount = 0;

    public function register(string $name, string $email): void
    {
        $this->lastCreated = User::create(['name' => $name, 'email' => $email]);
        $this->operationCount++;
    }

    public function getLastCreated(): ?User
    {
        return $this->lastCreated;
    }

    public function getOperationCount(): int
    {
        return $this->operationCount;
    }
}
```

---

## Good Example

```php
class UserService
{
    public function __construct(
        private UserRepository $users,
    ) {}

    public function register(string $name, string $email): User
    {
        return $this->users->create(['name' => $name, 'email' => $email]);
    }
}
```

---

## Exceptions

No common exceptions. All services must be stateless.

---

## Consequences Of Violation

Reliability risks: state leakage across requests in Octane/RoadRunner causes data corruption. Testing risks: tests must be carefully ordered and isolated. Debugging risks: concurrency bugs are non-deterministic and extremely hard to reproduce.

---

## Rule 2: Use `final readonly class` for Compiler Enforcement

All service classes must be declared `final readonly class` to prevent property mutation at the compiler level.

---

## Category

Design

---

## Rule

Every service class must be declared as `final readonly class`. The `readonly` keyword ensures all properties are set at construction time and cannot be mutated afterward. The `final` keyword prevents inheritance, which is unnecessary for service classes and would break the readonly contract.

---

## Reason

`readonly class` provides compiler-level enforcement of immutability. Any attempt to assign a property after construction becomes a compile-time error. This catches accidental statefulness before it reaches production. `final` prevents inheritance which is not needed for service classes.

---

## Bad Example

```php
class UserService // Mutable — properties can be reassigned
{
    public function __construct(
        private UserRepository $users,
    ) {}
}
```

---

## Good Example

```php
final readonly class UserService // Immutable — enforced by compiler
{
    public function __construct(
        private UserRepository $users,
    ) {}
}
```

---

## Exceptions

Services that must be mocked in tests may omit `final`, but `readonly` must still be used. Consider using interfaces for testability instead.

---

## Consequences Of Violation

Reliability risks: accidental property mutation goes undetected until runtime in production. Design risks: mutable services invite stateful patterns. Testing risks: mutable state causes test pollution.

---

## Rule 3: Never Use Class Properties as Scratch Space

Class properties must not be used as temporary accumulators, intermediate storage, or scratch variables during method execution.

---

## Category

Design

---

## Rule

Class properties must not be assigned intermediate or temporary values during method execution. All temporary values must be stored as local variables within the method scope. Using `$this->property` for accumulators (counters, totals, intermediate results) is prohibited.

---

## Reason

Class properties persist beyond the method call. In Octane/RoadRunner, the next request sees stale scratch values from the previous request, causing data corruption. Local variables are scoped to the method and safely garbage-collected after execution.

---

## Bad Example

```php
final readonly class InvoiceService
{
    private float $runningTotal; // Will this work with readonly? No — can't compile.

    public function generate(Order $order): Invoice
    {
        $this->runningTotal = 0; // Would fail: readonly property
        foreach ($order->items as $item) {
            $this->runningTotal += $item->price * $item->quantity;
        }
        // ...
    }
}
```

---

## Good Example

```php
final readonly class InvoiceService
{
    public function generate(Order $order): Invoice
    {
        $runningTotal = 0; // Local variable — safe
        foreach ($order->items as $item) {
            $runningTotal += $item->price * $item->quantity;
        }
        return new Invoice(['total' => $runningTotal]);
    }
}
```

---

## Exceptions

No common exceptions. Scratch space on class properties is never acceptable.

---

## Consequences Of Violation

Reliability risks: stale data from previous request corrupts current request. Debugging risks: concurrency bugs are intermittent and non-deterministic. Testing risks: tests may pass in isolation but fail in sequence.

---

## Rule 4: Return Results, Do Not Store Them

Service methods must return results as return values. Storing results on the instance for later retrieval via getters is prohibited.

---

## Category

Design

---

## Rule

Every service method must return its result directly as a return value. The pattern of `doSomething()` → `getResult()` — where one method performs an operation and a separate method retrieves the result — is prohibited. Results must be returned from the method that produces them.

---

## Reason

Two-step execute-then-retrieve patterns create stateful services. In long-lived processes, the next request may call `getResult()` before the first request's result is retrieved, mixing data across requests. Returning results directly is stateless, explicit, and type-safe.

---

## Bad Example

```php
class OrderService
{
    private ?OrderResult $lastResult = null;

    public function placeOrder(PlaceOrderData $data): void
    {
        $this->lastResult = // ... process order ...
    }

    public function getResult(): ?OrderResult
    {
        return $this->lastResult;
    }
}

// Caller must know two-step protocol:
$this->orderService->placeOrder($data);
$result = $this->orderService->getResult();
```

---

## Good Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return // ... process order and return result ...
    }
}

// Single call:
$result = $this->orderService->placeOrder($data);
```

---

## Exceptions

No common exceptions. Results must always be returned directly from the producing method.

---

## Consequences Of Violation

Reliability risks: timing-dependent bugs in concurrent environments. Usability risks: callers must know internal implementation details (the two-step protocol). Testing risks: tests must call two methods in the correct order.

---

## Rule 5: Constructor Injection Is for Stable Dependencies Only

Service constructors must only receive stable, reusable dependencies (repositories, gateways, services). Per-request data must never be passed to the constructor.

---

## Category

Design

---

## Rule

The service constructor must only accept dependencies that are stable across all method calls: repositories, gateways, loggers, other services, and configuration. Per-request, per-call, or per-user data must be passed as method parameters, not constructor parameters.

---

## Reason

Constructor dependencies are set once per service instance. If per-request data is passed to the constructor, the instance becomes tied to that request's context, breaking reusability across requests in Octane/RoadRunner and making the service stateful.

---

## Bad Example

```php
final readonly class OrderService
{
    public function __construct(
        private User $currentUser,           // per-request data in constructor
        private OrderRepository $orders,
    ) {}

    public function place(PlaceOrderData $data): Order
    {
        return $this->orders->create([...'user_id' => $this->currentUser->id]);
    }
}
```

---

## Good Example

```php
final readonly class OrderService
{
    public function __construct(
        private OrderRepository $orders,     // stable dependency only
    ) {}

    public function place(User $user, PlaceOrderData $data): Order
    {
        return $this->orders->create([...'user_id' => $user->id]);
    }
}
```

---

## Exceptions

Configuration values (e.g., `maxRetries`, `timeout`) that are stable across requests may be constructor-injected as primitives.

---

## Consequences Of Violation

Reliability risks: service instance is bound to a specific request context. Reusability risks: service cannot be reused across different contexts. Testing risks: constructor setup requires request-specific data.

---

## Rule 6: Do Not Define Getter Methods for Execution Results

A service class must not define getter methods that return data produced by previous method calls.

---

## Category

Design

---

## Rule

Service classes must not contain getter methods (e.g., `getLastCreated()`, `getResult()`, `getErrors()`) that retrieve state set during a previous method call. All data produced by a method must be returned by that method, not stored for later retrieval.

---

## Reason

Getter methods for execution results require storing mutable state on the instance, violating statelessness. In concurrent environments, a getter call may retrieve data from a different request's execution. Return values are the only safe, stateless mechanism.

---

## Bad Example

```php
final readonly class UserImportService
{
    private array $errors = []; // Can't be readonly and mutable

    public function import(array $users): int
    {
        // Would fail with readonly — can't reassign $this->errors
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getImportedCount(): int
    {
        return $this->importedCount;
    }
}
```

---

## Good Example

```php
final readonly class UserImportResult
{
    public function __construct(
        public int $importedCount,
        public array $errors,
    ) {}
}

final readonly class UserImportService
{
    public function import(array $users): UserImportResult
    {
        $errors = [];
        $count = 0;
        // ... process and collect errors ...
        return new UserImportResult(importedCount: $count, errors: $errors);
    }
}
```

---

## Exceptions

No common exceptions. Getter methods for execution results are prohibited.

---

## Consequences Of Violation

Reliability risks: concurrent request may overwrite stored state. Testing risks: getter-based assertions require calling methods in specific order. Debugging risks: state may be from a different request than expected.

---

## Rule 7: Methods Must Be Safe to Call Multiple Times

Calling the same service method multiple times on the same instance must produce the same result (given same inputs) and must not leave residual state.

---

## Category

Reliability

---

## Rule

Every service method must be idempotent with respect to instance state: calling the same method twice with the same inputs on the same instance must produce the same result and leave no residual state on the instance. The method must not store any data in properties, increment counters, or change the service's internal state.

---

## Reason

In Octane/RoadRunner, a service instance handles multiple requests. If a method modifies instance state, the second request sees state from the first. Methods that are safe to call multiple times are composable, predictable, and safe in any runtime.

---

## Bad Example

```php
final readonly class EmailService
{
    private int $sentCount = 0; // Cannot exist with readonly

    public function send(Email $email): void
    {
        Mail::send($email);
        // Would fail — can't increment readonly property
    }
}
```

---

## Good Example

```php
final readonly class EmailService
{
    public function send(Email $email): SentResult
    {
        Mail::send($email);
        return new SentResult(success: true, timestamp: now());
    }
}
```

---

## Exceptions

Memoization of expensive computations within a single request's lifetime is acceptable if the service is never used in Octane/RoadRunner and the memoization is documented.

---

## Consequences Of Violation

Reliability risks: data leakage and corruption across requests. Debugging risks: non-reproducible bugs that depend on request ordering. Performance risks: unexpected state accumulation in long-lived processes.
