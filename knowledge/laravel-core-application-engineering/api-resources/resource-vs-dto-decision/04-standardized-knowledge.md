# Resource vs DTO Decision

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource vs DTO Decision
- **Difficulty:** Expert
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
API Resources and DTOs (Data Transfer Objects) are both data transformation layers with distinct purposes. Resources transform data for HTTP response output — they are HTTP-aware, support conditional loading, and produce JSON responses. DTOs transport data between application layers — they are HTTP-agnostic, type-safe, and focused on internal data flow.

The engineering failure is using one where the other belongs. Using a DTO as a response formatter loses HTTP-specific features (conditional loading, pagination metadata). Using a Resource as an internal data carrier couples the service layer to HTTP. The correct architecture uses both: DTOs for internal transport, Resources for response shaping.

## Core Concepts
- **Resource purpose:** HTTP response transformation. HTTP-aware (`$request` available), supports conditional loading (`whenLoaded`), pagination metadata, JSON:API compliance.
- **DTO purpose:** Inter-layer data transport. HTTP-agnostic (pure data), type-safe (typed readonly properties), immutable.
- **Canonical flow:** `Client → Controller → FormRequest → [DTO] → Service/Action → [Model/DTO] → Resource → Client`. DTOs serve internal layers; Resources shape the final response.
- **Overlap zone:** Simple CRUD endpoints can use either. BFF APIs often use Resources only. Internal microservice communication often uses DTOs only.
- **Resource as DTO wrapper:** A Resource can wrap a DTO instead of an Eloquent model — useful when services return DTOs but response features are still needed.
- **Serialization path:** `DTO → toArray()` → `array → Resource → toArray($request)` → `enriched array → JsonResponse`.

## When To Use

### Use DTOs Only:
- Internal service-to-service communication (no HTTP response).
- CLI command outputs (formatted as plain text or JSON).
- Queue job payloads.
- When HTTP context is completely irrelevant.

### Use Resources Only:
- Simple CRUD endpoints with no service layer (one controller, direct model access).
- BFF (Backend for Frontend) APIs tailored to a single client.
- Prototypes and MVPs where speed matters over architecture purity.

### Use Both:
- Complex business logic with multiple layers (service, action, repository).
- Public APIs with external consumers.
- APIs supporting multiple client types (web, mobile, third-party).
- Long-lived applications evolving over multiple versions.

## When NOT To Use
- Do not use Resources as internal DTOs (passing them to services). Resources carry HTTP context that services should not depend on.
- Do not use DTOs as response formatters when Resources are available. DTOs lack conditional loading, pagination metadata, and JSON:API support.
- Do not force both everywhere — if an endpoint has no service layer (simple CRUD), do not force a DTO. If an internal component never produces HTTP output, do not force a Resource.
- Avoid circular dependencies: DTOs must never depend on Resources.

## Best Practices (WHY)
- **Prefer Resources for HTTP output.** Resources provide conditional field support, automatic pagination metadata, consistent error handling, and JSON:API compliance options.
- **Prefer DTOs for service input.** Services that receive HTTP requests as input are harder to test and reuse. Always convert to DTOs at the controller boundary.
- **Use the decision matrix for new endpoints.** Has a service layer? Multiple clients? Conditional response fields? The answers determine whether to use Resources, DTOs, or both.
- **Keep the dependency direction clear:** DTOs never depend on Resources. Resources can depend on DTOs (as wrappers). Services receive DTOs, return DTOs or models.
- **Test the full chain:** DTO → Resource → response in integration tests to catch schema drift between the two layers.

## Architecture Guidelines
- The controller is the boundary: it receives FormRequest, creates DTO, passes to service, receives result, wraps in Resource.
- When services return Eloquent models, Resources wrap them directly. When services return DTOs, Resources can wrap DTOs.
- For simple CRUD (no service layer), skip the DTO. The model goes directly to the Resource.
- For internal APIs where conditional response features are not needed, DTO-only responses are acceptable.
- The "both" pattern scales best for production APIs with >20 endpoints and >50k LOC. For smaller APIs, the overhead of maintaining both layers may outweigh the benefits.

## Performance
- Using both adds one extra object allocation (DTO) per request — ~0.002ms for single items, ~0.2ms for 100 items.
- DTOs can be more memory-efficient than carrying Eloquent models through internal layers — DTOs are plain value objects without the Eloquent overhead (change tracking, relationships, events).
- The DTO is freed after the response is built, while the Eloquent model persists through the full request lifecycle.
- In most applications, the performance difference between patterns is negligible compared to database and network latency.

## Security
- DTOs provide type safety — they guarantee that internal layers receive correctly typed data, preventing type confusion vulnerabilities.
- Resources control what is exposed — they act as a whitelist for API output. DTOs should also be explicit about what they carry.
- When both are used, there are two validation boundaries: FormRequest (input), and Resource (output). DTOs ensure type safety in between.
- Schema drift between DTO and Resource can silently expose or hide fields. Test the full chain to prevent this.

## Common Mistakes

### Resource as DTO (desc)
Passing a Resource to a service or using it as an internal data carrier.
- **Cause:** Convenience — the Resource already has the data, so why create another class?
- **Consequence:** The service depends on HTTP context (`$request`). The service is harder to test and cannot be used from CLI or queues.
- **Better:** Convert to a DTO at the controller boundary. Services receive typed DTOs, not HTTP-aware objects.

### DTO as Response (Missing Features) (desc)
Returning a DTO directly from a controller without a Resource wrapper.
- **Cause:** Assuming the DTO's `toArray()` or `jsonSerialize()` is sufficient for the response.
- **Consequence:** No conditional field support, no pagination metadata, no JSON:API compliance. Adding these later requires refactoring.
- **Better:** Wrap the DTO in a Resource even for simple responses — the Resource provides future flexibility.

### Over-Thinking the Decision (desc)
Spending excessive time choosing between Resource-only, DTO-only, or both for a trivial endpoint.
- **Cause:** Trying to apply the "perfect" architecture to every endpoint regardless of complexity.
- **Consequence:** Decision paralysis and unnecessary ceremony.
- **Better:** For small features (<50 lines, single file), pick one pattern. The cost of choosing wrong is a small refactoring when the feature grows.

## Anti-Patterns
- **Resource-as-DTO circular dependency:** A Resource that depends on a DTO that returns a Resource. DTOs must never depend on Resources.
- **DTO-as-resource with conditional logic:** Adding HTTP-aware conditional logic inside a DTO's `toArray()` — DTOs should be pure data carriers.
- **Both-layers-without-need:** Creating both a DTO and a Resource for a simple CRUD endpoint with no service layer. The overhead of maintaining two extra classes is not justified.

## Examples

### DTO for Internal, Resource for External
```php
class UserController
{
    public function store(StoreUserRequest $request): UserResource
    {
        // 1. FormRequest → DTO (internal transport)
        $dto = CreateUserDto::fromRequest($request);

        // 2. Service receives DTO, returns model
        $user = $this->userService->register($dto);

        // 3. Model → Resource (response shaping)
        return new UserResource($user);
    }
}
```

### DTO-Only Response (No Resource)
```php
class InternalUserController
{
    public function show(User $user): JsonResponse
    {
        $dto = UserDto::fromModel($user);
        return response()->json($dto->toArray());
    }
}
// Suitable for internal APIs with no conditional response needs
```

### Resource-Only (No DTO)
```php
class UserController
{
    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }
}
// Suitable for simple CRUD without a service layer
```

### Resource Wrapping a DTO
```php
class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        // $this->resource is an OrderDto
        return [
            'id' => $this->id,
            'total' => $this->total,
            'items_count' => count($this->items),
            'status' => $this->status,
        ];
    }
}

// Controller
$dto = $this->orderService->process($requestDto);
return new OrderResource($dto);
```

### Decision Matrix Reference
| Has Service Layer? | Multiple Clients? | Conditional Fields? | Pattern |
|---|---|---|---|
| No | No | No | Resource only |
| No | Yes | Yes | Resource only (conditionals in resource) |
| Yes | No | No | DTO only (or DTO + simple JSON response) |
| Yes | Yes | No | DTO + Resource |
| Yes | Yes | Yes | DTO + Resource (conditionals in resource) |
| Yes | No | Yes | DTO + Resource (or DTO with conditional toArray) |

## Related Topics
- DTO Fundamentals (this domain) — DTO purpose and definition
- Resource Fundamentals — Resource purpose and definition
- DTO vs Form Request (this domain) — input boundary decisions
- Resource Collections — collection responses
- Form Request DTO Integration (Form Requests & Validation) — bridging input to DTO

## AI Agent Notes
- **Generate:** Create DTOs as readonly classes with typed properties. Create Resources extending `JsonResource`.
- **Key constraint:** DTOs must never depend on Resources. Resources can wrap DTOs or models.
- **Validation:** Verify the dependency direction — services receive DTOs, controllers return Resources.
- **Common fix:** If a service method receives a Resource, refactor to accept a DTO instead.
- **Testing pattern:** Test the full chain (FormRequest → DTO → Service → Resource → response) in integration tests.

## Verification
- [ ] Services receive typed DTOs, not Resources or raw Request objects.
- [ ] Controllers return Resources (or ResourceCollections), not bare DTOs.
- [ ] DTOs do not depend on HTTP context or Resources.
- [ ] The pattern choice (Resource-only, DTO-only, or both) is justified by endpoint complexity.
- [ ] For simple CRUD without a service layer, DTOs are not forced.
- [ ] For public APIs with complex logic, both DTOs and Resources are used.
- [ ] The full chain (DTO → Resource → response) is tested in integration tests.
