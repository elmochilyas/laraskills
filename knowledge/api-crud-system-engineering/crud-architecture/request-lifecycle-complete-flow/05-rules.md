# Request Lifecycle Complete Flow — Rules

## Rule 1: Respect the 12-Step Flow Order
---
## Category
Architecture
---
## Rule
Never reorder or skip the defined flow steps: Bootstrap → Router → Middleware → Controller → DTO → Action/Service → Data Access → Response. Each step occupies a fixed position in the sequence.
---
## Reason
Flow order encodes dependency direction — middleware must run before controllers, DTOs must be constructed before actions, data access must happen after business logic decisions. Reordering breaks these guarantees.
---
## Bad Example
```php
// Business logic before validation — violates flow order
class UserController
{
    public function store(Request $request): JsonResponse
    {
        $user = User::create($request->all()); // ❌ Data access before validation
        $validated = $request->validate([/* ... */]); // Validation after create
        return response()->json($user);
    }
}
```
---
## Good Example
```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse // Step 5: Middleware/Validation
    {
        $dto = CreateUserDto::fromRequest($request); // Step 8: DTO construction
        $user = $this->createUser->execute($dto); // Step 9: Action execution
        return response()->json($user, 201); // Step 11: Response
    }
}
```
---
## Exceptions
Operations that skip layers (see "When to Skip Layers") may omit specific steps, but the remaining steps must still execute in their defined order.
---
## Consequences Of Violation
Validation after persistence, business logic running on unvalidated data, inconsistent request processing.
</rule>

## Rule 2: Trace the Full Flow for Every New Endpoint
---
## Category
Maintainability
---
## Rule
Always mentally trace the 12-step flow for every new endpoint during design to ensure each concern is handled in its correct layer.
---
## Reason
Skipping the mental trace leads to misplacement of concerns — business logic in controllers, validation in actions, data access in middleware. Each misplaced concern creates technical debt.
---
## Bad Example
```php
// New endpoint designed without tracing the flow
Route::get('/dashboard/stats', function () { // ❌ Business logic in route closure
    return User::select(DB::raw('count(*) as total'))
        ->where('active', true)
        ->get();
});
```
---
## Good Example
```php
// Mental trace:
// Middleware: auth, throttle
// Controller: DashboardController@stats
// DTO: StatsRequestDto
// Action: GetDashboardStatsAction
// Response: StatsResource

class DashboardController
{
    public function stats(StatsRequest $request): JsonResponse
    {
        $dto = StatsRequestDto::fromRequest($request);
        $stats = $this->getDashboardStats->execute($dto);
        return response()->json(new StatsResource($stats));
    }
}
```
---
## Exceptions
No common exceptions. Every endpoint deserves a flow trace.
---
## Consequences Of Violation
Misplaced logic, code that is hard to find, architecture inconsistency across endpoints.
</rule>

## Rule 3: Never Pass Raw Validated Arrays Through All Layers
---
## Category
Architecture
---
## Rule
Never pass `$request->validated()` as an array beyond the controller; always construct a DTO and pass typed objects through the remaining layers.
---
## Reason
Raw arrays lose type safety — there is no compiler check that the array contains the expected keys with the expected types. Errors surface deep in service code instead of at the layer boundary.
---
## Bad Example
```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        return $this->createUser->execute($request->validated()); // ❌ Array passed
    }
}
// Action must guess array keys: $data['name'], $data['email']
```
---
## Good Example
```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        return $this->createUser->execute($dto);
    }
}
```
---
## Exceptions
Operations with 1-2 scalar parameters (simple lookups) may skip the DTO, but typed parameters must always be used over arrays.
---
## Consequences Of Violation
Runtime array key errors, no IDE autocompletion, undocumented method contracts, brittle refactoring.
</rule>

## Rule 4: Add Monitoring at Layer Boundaries
---
## Category
Reliability
---
## Rule
Always add timing and logging instrumentation at key layer boundaries — controller entry, action/service entry, and repository query execution.
---
## Reason
Layer-boundary monitoring pinpoints exactly which layer is slow or failing. Without it, a slow query in the repository appears as "the action is slow," wasting debugging time.
---
## Bad Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        // ❌ No timing — if this is slow, we don't know why
        return DB::transaction(fn() => User::create($dto->toArray()));
    }
}
```
---
## Good Example
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return Duration::measure('action.create_user', function () {
            return DB::transaction(fn() => User::create($this->dto->toArray()));
        });
    }
}
```
---
## Exceptions
Read-only endpoints under heavy load may skip verbose logging to reduce I/O, but should keep timing instrumentation.
---
## Consequences Of Violation
Inability to diagnose performance issues, production debugging without data, "ship first, add monitoring later" antipattern.
</rule>

## Rule 5: Business Logic Belongs in Actions/Services, Never Controllers
---
## Category
Layer Isolation
---
## Rule
Never implement business rules, conditional logic, data transformations, or database queries in a controller; controllers handle HTTP only.
---
## Reason
Business logic in controllers cannot be tested without HTTP scaffolding, cannot be reused from CLI/queue, and mixes HTTP concerns with domain concerns — violating every layer isolation principle.
---
## Bad Example
```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        if (User::where('email', $request->validated('email'))->exists()) { // ❌ Business rule
            return response()->json(['error' => 'Email taken'], 422);
        }
        $user = User::create($request->validated()); // ❌ Data access
        Mail::to($user)->send(new WelcomeMail($user)); // ❌ Side effect
        return response()->json($user, 201);
    }
}
```
---
## Good Example
```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->registerUserAction->execute($dto);
        return response()->json($user, 201);
    }
}
```
---
## Exceptions
No common exceptions. Business logic in controllers is never acceptable in a structured architecture.
---
## Consequences Of Violation
Fat controllers, untestable business logic, unreusable from CLI/queue, architecture collapse.
</rule>
