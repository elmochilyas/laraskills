# When NOT to Use DTOs

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** When NOT to Use DTOs
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

DTOs are a powerful architectural tool, but they are not free. Each DTO adds: a class file, a factory method (or multiple), serialization logic, and a dependency in every service that uses it. When applied without discipline, DTOs convert a 5-line controller into a 50-line controller + 30-line DTO + 10-line factory pattern with no measurable benefit.

The decision to use or skip a DTO is an engineering tradeoff between type safety and ceremony. This knowledge unit defines the conditions under which a DTO adds cost without benefit — when to use arrays, models, FormRequest validated data, or API Resources instead.

## Core Concepts

- **The DTO Threshold:** DTOs provide value proportional to data flow complexity. 2-3+ layers → DTO recommended. Single controller-to-service flow → array/FormRequest is sufficient. Same data shape from multiple entry points → DTO guarantees consistency.
- **The Over-Engineering Threshold:** A DTO is over-engineering when it has the same fields as the FormRequest's validated array (no transformation), is used by exactly one method in one service, and adds no behavior, type transformation, or validation.
- **The Ceremony Budget:** Every project has a ceremony budget — the amount of boilerplate code developers tolerate. DTOs consume this budget. Spend it where the payoff is highest.
- **The "Do I Need to Name This?" Test:** If you cannot think of a meaningful name more specific than the entity name plus "Dto", you may not need it.

## When To Use

- Data crosses 2-3+ application layers
- Same data shape from multiple entry points (HTTP + CLI + Queue)
- Complex nested structure with business rules
- Service method signature needs to be self-documenting with typed parameters

## When NOT To Use

- Simple CRUD: controller calls model directly with FormRequest validated data
- Single entry point with one service method (no expected additional callers)
- Fewer than 3 fields, no transformation, pass-through to model
- Prototype/MVP where data shapes change rapidly
- Data is already validated and shaped by FormRequest (validated() is sufficient)

## Best Practices (WHY)

- **Why skip DTOs for simple CRUD:** The array from `validated()` is already type-safe enough. The database schema enforces column types. The DTO adds ceremony without value.
- **Why make DTOs opt-in, not default:** Team conventions requiring "every controller action must have a DTO" create ceremony where none is needed. Apply DTOs only when the threshold is met.
- **Why start without DTOs and add them later:** Let DTOs emerge from service needs, not from entity structure. Half the DTOs created upfront will be unused or need restructuring.
- **Why document the exception:** When a DTO is intentionally not used for a complex operation, document the rationale. Prevents future developers from adding DTOs without understanding the tradeoff.

## Architecture Guidelines

- Apply the 2-3 layer threshold before introducing a DTO
- Simple CRUD: no DTO required — `$request->validated()` is sufficient
- Complex workflows (3+ layers, multiple entry points): DTO required
- API responses: use API Resources, not DTOs (Resources are designed for response shaping)
- Migration path: Start without DTOs → Add when second entry point appears or field-related bug occurs

## Performance

DTOs add zero meaningful overhead for typical cases. For batch processing (10,000+ DTOs), allocation cost is measurable (~50ms vs ~10ms for arrays). For batch operations, consider arrays in the hot path and DTOs at the boundary.

| Batch Size | DTO Construction | Array Construction |
|---|---|---|
| 100 | ~0.5ms | ~0.1ms |
| 10,000 | ~50ms | ~10ms |
| 100,000 | ~500ms | ~100ms |

## Security

- FormRequest validated data passes through `validated()` which strips unvalidated fields — this provides a security boundary without a DTO
- When skipping DTOs, ensure the service layer does not accept raw `$request->all()` — always use validated data
- DTOs add an additional layer of protection against mass-assignment vulnerabilities, but validated arrays are already safe

## Common Mistakes

1. **DTO-as-Optional-Additive:** Treating DTOs as "optional but always good." A DTO between a controller and a model with no transformation is a redundant abstraction. Remove it.

2. **Team Dogma:** "I always use DTOs" is as problematic as "I never use DTOs." The correct answer depends on the specific data flow. Apply the threshold.

3. **Premature DTO Proliferation:** Starting a project with DTOs for every entity before writing any service code. Half the DTOs are unused, and the other half need restructuring.

4. **DTO Churn:** When business requirements change rapidly (startup, MVP), DTOs need constant restructuring. Each field addition or rename cascades through factories, tests, and consumers. Arrays absorb these changes with a single edit.

## Anti-Patterns

- **The Dogmatic DTO:** "Every controller action must have a DTO" regardless of complexity. Creates ceremony without benefit for simple operations. The 2-3 layer threshold should govern.
- **The Premature Abstraction:** Creating DTOs for every entity before any service code exists. By the time the service layer is built, half the DTOs are unused. Let DTOs emerge from service needs.
- **The Echo Chamber DTO:** A DTO whose properties exactly mirror the FormRequest's validated keys with no transformation. The DTO adds ceremony but no value. Either transform or skip it.

## Examples

### Simple CRUD — No DTO Needed
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

### Single-Entry-Point Service — No DTO Needed
```php
class RegistrationService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create($data);
            $this->sendWelcomeEmail($user);
            return $user;
        });
    }
}

// Controller
public function store(StoreUserRequest $request): JsonResponse
{
    $user = $this->registrationService->register($request->validated());
    return response()->json($user, 201);
}
```

### Migration Path (Start Simple, Add DTO Later)
```
Phase 1: Controller → Service (array) → Action (array)
Phase 2: Service grows, second entry point added → introduce DTO
Phase 3: DTO validated across all entry points → add self-validation
```

## Related Topics

- **DTO Fundamentals** — what DTOs do
- **DTO vs Form Request** — when FormRequest validated() replaces DTO
- **DTO vs Value Object** — when a Value Object is the right choice
- **DTO Testing** — testing cost of DTOs
- **Thin Controller Principles** — controllers that don't need DTOs

## AI Agent Notes

- Apply the 2-3 layer threshold: only create a DTO when data crosses multiple layers
- For simple CRUD, use `$request->validated()` directly — no DTO needed
- Start without DTOs and introduce them when a second entry point appears
- Use API Resources for output instead of DTOs for HTTP response shaping
- Document rationale when intentionally skipping DTOs for complex operations

## Verification

- [ ] The 2-3 layer threshold is met before introducing a DTO
- [ ] DTOs are not created for simple CRUD with a single entry point
- [ ] DTOs transform/rename fields — they don't just mirror FormRequest keys
- [ ] Team convention makes DTOs opt-in, not required for every controller
- [ ] API responses use API Resources, not DTOs
- [ ] Migration path is available: start without DTOs, add when needed
- [ ] Rationale is documented when DTOs are intentionally skipped
