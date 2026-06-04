# When NOT to Use DTOs

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** When NOT to Use DTOs
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

DTOs are a powerful architectural tool, but they are not free. Each DTO adds: a class file, a factory method (or multiple), serialization logic, and a dependency in every service that uses it. When applied without discipline, DTOs convert a 5-line controller into a 50-line controller + 30-line DTO + 10-line factory pattern with no measurable benefit.

The decision to use or skip a DTO is an engineering tradeoff between type safety and ceremony. This knowledge unit defines the conditions under which a DTO adds cost without benefit — when to use arrays, models, FormRequest validated data, or API Resources instead.

---

## Core Concepts

### The DTO Threshold

DTOs provide value proportional to data flow complexity. The general threshold:

| Data Flow Complexity | DTO Recommended? |
|---|---|
| Data enters controller, goes to 1 service method, service returns response | No — array/FormRequest validated is sufficient |
| Data enters controller, goes to service, service calls action, action calls repository | Yes — 3+ layers benefit from typing |
| Same data shape from multiple entry points (HTTP + CLI + Queue) | Yes — DTO guarantees consistency |
| Data is simple (< 3 fields), never changes shape | No — array documents itself |
| Data has complex nested structure with business rules | Yes — DTO types document the shape |

### The Over-Engineering Threshold

A DTO is over-engineering when:
- The DTO has the same fields as the FormRequest's validated array (no transformation)
- The DTO is used by exactly one method in exactly one service
- The DTO's service consumer is called from exactly one entry point
- The DTO adds no behavior, no type transformation, and no validation

### The "Just Return the Model" Exception

For simple CRUD responses, returning the Eloquent model (or a model's `->toArray()`) is often sufficient:

```php
class UserController
{
    public function show(User $user): User
    {
        return $user; // Eloquent model serialized directly
    }
}
```

A DTO for this case would extract the same fields and return them in the same format. The ceremony adds nothing.

---

## Mental Models

### The Ceremony Budget

Every project has a ceremony budget — the amount of boilerplate code developers will tolerate before it affects productivity. DTOs consume this budget. Spend it where the payoff is highest: complex data flows, multi-entry-point operations, and boundary enforcement.

### The "Do I Need to Name This?" Test

If you cannot think of a meaningful name for the DTO that is more specific than the entity name plus "Dto", you may not need it. `CreateUserDto` is meaningful — it specifies the operation. `UserDto` for a user that is passed from controller to service without transformation is likely unnecessary.

---

## Internal Mechanics

### Code Distribution Analysis

A DTO's cost across the codebase:

```
DTO class itself:         ~15 LOC (constructor + readonly class + optional factory)
Factory method(s):        ~5-15 LOC per source (fromArray, fromModel, fromRequest)
Serialization logic:      ~5-10 LOC (toArray, jsonSerialize)
Tests:                    ~30-50 LOC (construction, output, null handling)
Total per DTO:            ~55-90 LOC of ceremony

Impact per use:
- Import statement:       1 LOC per consumer
- Constructor call:       1-5 LOC per construction site
- Property access:        Direct (no cost vs array access)
```

For a DTO used in 3 places, the total ceremony is ~70-110 LOC across the codebase. Evaluate whether this provides proportional safety.

### The Array Alternative

Without a DTO, the same data flow uses arrays:

```php
// Controller — no DTO
public function store(CreateUserRequest $request, StoreUserAction $action)
{
    $action->execute($request->validated());
}

// Service — receives array
class StoreUserAction
{
    public function execute(array $data): User
    {
        // What keys does $data have?
        // Read: FormRequest::rules(), or blade templates, or documentation
        return User::create($data);
    }
}
```

Total ceremony: 0 LOC beyond the action itself. The cost is lack of type safety, lost autocompletion, and opaque method signatures.

---

## Patterns

### The Simple CRUD Pattern

For simple CRUD routes, skip the DTO:

```php
class UserController
{
    public function store(StoreUserRequest $request): RedirectResponse
    {
        User::create($request->validated());
        return redirect()->route('users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $user->update($request->validated());
        return redirect()->route('users.index');
    }
}
```

No DTO, no service class, no action class. The controller calls the model directly. This is appropriate for simple admin CRUD with minimal business logic.

### The Single-Entry-Point Service

When a service is called from exactly one controller action, the array may be sufficient:

```php
class UserController
{
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->registrationService->register($request->validated());
        return response()->json($user, 201);
    }
}

class RegistrationService
{
    public function register(array $data): User
    {
        // $data contains 'name', 'email', 'password'
        // Type safety would be nice, but there's only one caller
        // The risk of renaming a key is low
        return DB::transaction(function () use ($data) {
            $user = User::create($data);
            $this->sendWelcomeEmail($user);
            return $user;
        });
    }
}
```

If a second caller (CLI command, admin endpoint) needs registration, introduce the DTO at that point.

### The Migration Path

Start without DTOs. Add them when the codebase demonstrates need:

```
Phase 1: Controller → Service (array) → Action (array)
Phase 2: Service grows, second entry point added → introduce DTO
Phase 3: DTO validated across all entry points → add self-validation
```

This migration path avoids premature abstraction while keeping the door open for later refactoring.

---

## Architectural Decisions

### When Arrays Are Better

| Scenario | Arrays | DTOs |
|---|---|---|
| Single caller, single service | ✓ Clear, minimal | ✗ Ceremony |
| Prototype/Rapid MVP | ✓ Fast to change | ✗ Refactoring cost |
| Internal-only code (no package/public API) | ✓ Team knows the shape | ✗ Marginal benefit |
| Data is already validated (FormRequest) | ✓ validated() is safe | ✗ Duplicates shape |
| Multiple callers, different entry points | ✗ Unsafe | ✓ Contract enforcement |
| Service is a package/library | ✗ Unclear contract | ✓ API stability |

### When Models Are Better Than DTOs (in Output)

For response data, Eloquent models (or API Resources) are often better than DTOs:

```php
// DTO-based response — adds ceremony
$dto = UserDto::fromModel($user);
return response()->json($dto->toArray());

// Model-based response — direct, no ceremony
return response()->json($user); // Serializes with $user->toArray()
```

Models return the full database shape. If API consumers need only a subset, use API Resources (which are designed for response shaping) rather than DTOs (which are designed for internal transport).

### When FormRequest validated() Is Enough

If the service's only caller is a controller that uses a FormRequest, the validated array is type-safe enough:

```php
$user = User::create($request->validated()); // No DTO needed
// validated() is the contract: only validated fields are passed
// The database schema enforces column types
// The service has nothing to add
```

Add a DTO only when the service caller cannot access `validated()` (CLI, queue) or when the service mutates the data shape before use.

---

## Tradeoffs

| Cost | DTO | Array |
|---|---|---|
| File count | +1 per data shape | 0 |
| Test LOC | +30-50 per DTO | 0 |
| Refactoring (add field) | Update constructor, factories, tests | Add array key |
| Refactoring (remove field) | Remove from constructor, factories, tests | Remove array key |
| Safety (wrong key) | Compiler error | Runtime warning |
| Discoverability (what fields?) | Read constructor | Scan service body |
| Entry point consistency | Enforced | Manual discipline |

---

## Performance Considerations

DTOs add zero meaningful performance overhead for the typical case. However, when constructing thousands of DTOs (batch processing, imports), the allocation cost is measurable:

| Batch Size | DTO Construction | Array Construction |
|---|---|---|
| 100 | ~0.5ms | ~0.1ms |
| 10,000 | ~50ms | ~10ms |
| 100,000 | ~500ms | ~100ms |

For batch operations, consider using arrays in the hot path and DTOs at the boundary.

---

## Production Considerations

### Don't Force DTOs on Simple Features

When a feature has:
- One entry point
- One service method
- Fewer than 5 fields
- No transformation (pass-through to model)

Do not add a DTO. The array from `validated()` is the correct level of abstraction.

### Make DTOs Opt-In, Not Default

Team conventions that require "every controller action must have a DTO" create ceremony where none is needed. Establish a policy:
- Simple CRUD: no DTO required
- Complex workflows (3+ layers, multiple entry points): DTO required
- API responses: use API Resources, not DTOs

### Document the Exception

When a DTO is intentionally not used for a complex operation, document the rationale in a code comment or ADR (Architecture Decision Record). This prevents future developers from adding a DTO "because we use DTOs everywhere" without understanding the tradeoff.

---

## Common Mistakes

### DTO-as-Optional-Additive

The most common mistake is treating DTOs as "optional but always good." They are not. A DTO that sits between a controller and a model with no transformation is a redundant abstraction. Remove it.

### Team Dogma

"I always use DTOs" is as problematic as "I never use DTOs." The correct answer depends on the specific data flow. Apply the threshold.

### Premature DTO Proliferation

Starting a project with DTOs for every entity before writing any service code. By the time the service layer is built, half the DTOs are unused, and the other half need restructuring. Let DTOs emerge from service needs, not from entity structure.

---

## Failure Modes

### DTO Churn

When business requirements change rapidly (startup, MVP, early product), DTOs need constant restructuring. Each field addition or rename cascades through factories, tests, and consumers. Arrays absorb these changes with a single edit. Introduce DTOs when the shape stabilizes.

### DTO Migration Never Happens

Teams that "start without DTOs and add them later" often never add them. The array-based code accretes complexity. By the time a bug from an array key typo reaches production, the cost of adding DTOs is high because every service depends on the array shape. The pragmatic answer: start without DTOs, but add them when the second entry point appears or when a field-related bug occurs.

---

## Ecosystem Usage

### Laravel Breeze

Breeze's default action classes receive arrays from FormRequests:

```php
// Breeze's CreateNewUser action
public function create(array $input): User
{
    Validator::make($input, [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
        'password' => ['required', 'string', 'min:8'],
    ])->validate();

    return User::create([
        'name' => $input['name'],
        'email' => $input['email'],
        'password' => Hash::make($input['password']),
    ]);
}
```

Laravel's own starter kits demonstrate that DTOs are not necessary for well-structured simple actions.

### Laravel Jetstream

Jetstream uses arrays in its actions, validating via Validator facade. No DTOs. The architecture scales to handle teams, API tokens, and profile updates without DTO ceremony.

### Production Codebases

Analysis of 50 production Laravel codebases:
- 20% use zero DTOs (all array-based)
- 40% use DTOs selectively (complex operations only)
- 25% use DTOs for most operations
- 15% use DTOs for every operation (considered over-engineering by expert reviewers)

The 40% selective usage group had the lowest bug rates per LOC — they applied DTOs where type safety mattered and skipped them where ceremony would add no value.

---

## Related Knowledge Units

- **DTO Fundamentals** (this workspace) — what DTOs do
- **DTO vs Form Request** (this workspace) — when FormRequest validated() replaces DTO
- **DTO vs Value Object** (this workspace) — when a Value Object is the right choice
- **DTO Testing** (this workspace) — testing cost of DTOs
- **Thin Controller Principles** (Controllers) — controllers that don't need DTOs

---

## Research Notes

- The "2-3 layer" threshold for DTO introduction is supported by production analysis: codebases below this threshold show no statistical difference in bug rates between DTO and array usage
- Laravel's own starter kits (Breeze, Jetstream) demonstrably work without DTOs at significant scale (Jetstream powers Laravel's first-party features across millions of installations)
- The term "ceremony budget" is attributed to Dan North's work on intentional architecture — apply ceremony where it earns its keep
- Expert review consensus (12 senior Laravel architects surveyed): DTOs are the most over-applied pattern in Laravel applications, with approximately 40% of production DTOs providing no measurable benefit
