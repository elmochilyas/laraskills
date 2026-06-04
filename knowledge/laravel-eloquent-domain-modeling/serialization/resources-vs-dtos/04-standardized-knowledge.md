# Resources vs DTOs — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Resources vs DTOs
- **ECC Version:** 1.0

## Overview
Laravel API Resources and Data Transfer Objects (DTOs) are two approaches for shaping and serializing data at application boundaries. Resources are HTTP-aware, request-context aware, and deeply integrated with Laravel's response system. DTOs are channel-agnostic, immutable typed contracts that work across API responses, queue jobs, broadcast events, and CLI output. They can coexist in a layered architecture where DTOs handle domain-boundary serialization and Resources handle HTTP-specific presentation.

## Core Concepts
- API Resources — Laravel-native, HTTP-specific, request-aware (`JsonResource` with `toArray($request)`)
- DTOs — framework-agnostic, typed, immutable data containers (plain PHP or `spatie/laravel-data`)
- Channel-agnostic vs HTTP-specific — DTOs work anywhere; Resources only at the HTTP layer
- Request awareness — Resources receive `$request` in `toArray($request)` for context-dependent output
- Type safety — DTOs enforce typed properties; Resources return arrays (with conditional wrappers)
- Serialization pipeline — both eventually produce arrays; Resources have built-in pagination, wrapping, conditionals
- Coexistence pattern — DTOs at domain boundaries, Resources at HTTP boundary for presentation

## When To Use
**Use API Resources when:**
- Serialization is exclusively for HTTP API responses
- You need request-aware output (admin fields based on auth)
- You need built-in pagination, conditional attributes, and wrapping
- The serialization is simple shape transformation

**Use DTOs when:**
- The same data must serialize for multiple channels (API + queue + events)
- You need strict typing and immutability at application boundaries
- You want to decouple domain models from external contracts
- You're using Domain-Driven Design or Hexagonal Architecture

**Use Both when:**
- You need typed domain contracts (DTOs) plus HTTP-specific features (Resources)
- DTOs handle cross-channel serialization; Resources add metadata, pagination, status codes

## When NOT To Use
- Do NOT use Resources when the same data goes to queue/events/CLI — they are HTTP-coupled
- Do NOT use DTOs for simple CRUD APIs with a single channel — Resources are simpler
- Do NOT use DTOs for every internal method call — adds indirection without benefit
- Do NOT use both for every entity — if the entity never crosses channels, Resources alone suffice
- Do NOT queue a `JsonResource` — it carries HTTP context and serializes the full Eloquent model

## Best Practices (WHY)
- Establish a clear project convention: when to use Resources, when to use DTOs, when to use both
- If using both, enforce the layering — DTOs from services/actions, Resources wrap DTOs in controllers
- Test serialization at the controller level (feature tests) for Resources and at the unit level for DTOs
- Version serialization contracts — version Resources or DTOs based on which represents the external contract
- Keep the layering clean — don't mix DTO and Resource concerns in the same class

## Architecture Guidelines
- DTOs are the contract at domain boundaries; Resources are the presentation at the HTTP boundary
- Service/action classes return DTOs (not Eloquent models, not Resources)
- Controllers receive DTOs from services and wrap them in Resources for HTTP response
- For multi-channel applications, start with DTOs at the service layer, add Resources only for HTTP
- Document the serialization architecture in the project README or ADR
- Profile before adding an intermediate DTO layer in hot paths — the overhead is usually negligible

## Performance
- Resources are created per-request and garbage-collected — minimal overhead
- DTOs have similar creation cost but can be cached/serialized for reuse across processes
- Layered approach (DTO → Resource) doubles object count but each layer is lightweight
- DTOs with `spatie/laravel-data` use reflection on first creation; subsequent creations are faster with cached metadata
- For high-throughput APIs, consider whether the intermediate DTO layer adds meaningful value

## Security
- DTOs provide safer boundaries — only explicitly mapped data passes through
- Resources are safer for HTTP — request-aware conditionals prevent over-exposure
- Layered approach gives defense in depth — DTO contract + Resource presentation filters
- DTOs prevent Eloquent lazy loading from leaking into serialization
- Resources can leak data through conditional logic errors — test both branches

## Common Mistakes
- Using Resources for serialization that crosses channels (queuing a Resource — it's serializable but heavy)
- Using DTOs for every internal method call — adds indirection without benefit
- Building a Resource that contains complex business logic — Resources should only transform
- Forgetting that DTOs and Resources can coexist — choosing one exclusively when both would be ideal
- Not versioning serialization contracts — changing a Resource or DTO breaks external consumers

## Anti-Patterns
- **Resource in queue**: serializing a `JsonResource` to a queue job — includes unnecessary HTTP context
- **DTO domain leak**: DTO starts containing business logic, becoming an anemic domain model
- **Over-engineering**: three-layer serialization (Model → DTO → Resource) for a simple CRUD app
- **Under-engineering**: returning Eloquent models directly from controllers because "Resources are overkill"
- **Inconsistent pattern**: some endpoints use Resources, others use DTOs, others return models directly

## Examples
```php
// Service returning DTO
class UserService
{
    public function getProfile(int $id): UserDTO
    {
        $user = User::with('posts')->findOrFail($id);
        return UserDTO::fromModel($user);
    }
}

// Controller wrapping DTO in Resource
class UserController extends Controller
{
    public function show(int $id, UserService $service): UserResource
    {
        $dto = $service->getProfile($id);
        return UserResource::make($dto);
    }
}

// Resource that wraps DTO
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}

// DTO used in queue
class SendWelcomeEmail implements ShouldQueue
{
    public function __construct(
        public UserDTO $user,
    ) {}
}
```

## Related Topics
- json-resource — the API Resource serialization layer
- dto-patterns — the foundational DTO pattern
- spatie-laravel-data — formalized DTO package
- resource-collection — collection handling in Resources
- conditional-attributes — Resource-specific features missing from DTOs

## AI Agent Notes
- Simple CRUD API with one channel → Use Resources
- Multi-channel (API + queue + events) → Use DTOs
- Enterprise/DDD → Use DTOs + Resources (layered)
- Never queue a `JsonResource` — it carries HTTP baggage
- DTOs are framework-agnostic; Resources are Laravel-specific
- The coexistence pattern (DTO → Resource) maximizes both type safety and HTTP features

## Verification
- [ ] Serialization strategy is documented in project ADR or README
- [ ] One consistent approach is followed (don't mix for the same entity)
- [ ] If using both, layering is enforced: DTO from services, Resource wraps DTO in controllers
- [ ] Resources are not serialized to queues/events
- [ ] DTOs contain no business logic
- [ ] Serialization contracts are versioned (v1 vs v2 contracts)
- [ ] Controller tests verify final HTTP response shape
- [ ] Unit tests verify DTO mapping and serialization
