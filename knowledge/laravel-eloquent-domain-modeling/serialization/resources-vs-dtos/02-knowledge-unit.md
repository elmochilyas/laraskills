# resources-vs-dtos

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

Laravel API Resources and Data Transfer Objects (DTOs) are two approaches for shaping and serializing data at application boundaries. Resources are HTTP-aware, request-context aware, and deeply integrated with Laravel's response system. DTOs are channel-agnostic, immutable typed contracts that work across API responses, queue jobs, broadcast events, and CLI output. The decision between them is not binary — they can coexist in a layered architecture where DTOs handle domain-boundary serialization and Resources handle HTTP-specific presentation. Understanding the tradeoffs enables selecting the right tool for each serialization context.

## Core Concepts

- **API Resources** — Laravel-native, HTTP-specific, request-aware transformation layer (`JsonResource`).
- **DTOs** — Framework-agnostic, typed, immutable data containers (plain PHP or packages like `spatie/laravel-data`).
- **Channel-agnostic vs HTTP-specific** — DTOs work anywhere; Resources only at the HTTP layer.
- **Request awareness** — Resources receive `$request` in `toArray($request)`, enabling context-dependent output.
- **Type safety** — DTOs enforce typed properties; Resources return arrays (with conditional wrappers).
- **Serialization pipeline** — Both eventually produce arrays. Resources have built-in pagination, wrapping, conditional attributes.
- **Coexistence pattern** — Use DTOs at domain boundaries, then wrap in Resources for HTTP presentation.

## Mental Models

1. **DTOs = Contract, Resources = Presentation** — DTOs define what data exists; Resources define how it looks over HTTP.
2. **Resources are HTTP-specific DTOs** — A resource is essentially a DTO that knows about the current HTTP request and Laravel's response system.
3. **Layered serialization** — Model → DTO (domain boundary) → Resource (HTTP boundary) → JSON response.
4. **Same data, different channels** — DTOs serialize for queue, broadcast, CLI, and API. Resources add HTTP-only features (headers, status codes, pagination links).

## Internal Mechanics

The serialization flow differs significantly between Resources and DTOs. Resources operate within Laravel's HTTP layer: they receive the request, resolve conditional attributes, apply wrapping, and return a `JsonResponse` via the `Responsable` interface. The resource's `toArray($request)` is called during response resolution, with the request object available for context-aware decisions.

DTOs bypass the HTTP layer entirely — they are plain PHP objects serialized via explicit `toArray()` calls or package-provided serialization. This makes them usable outside HTTP contexts (queues, events, CLI) but removes access to request-level context.

At the type safety boundary, DTOs enforce structure at the language level through typed properties and readonly modifiers. Resources return arrays — the structure is enforced only by convention and tests. Framework coupling follows from this: Resources are inseparable from Laravel's HTTP kernel, while DTOs work in any PHP context, making them suitable for hexagonal architectures where framework coupling must be minimized.

## Comparison Matrix

| Dimension | API Resources | DTOs |
|---|---|---|
| **HTTP awareness** | Yes (`$request` in `toArray`) | No |
| **Type safety** | Arrays (dynamic) | Typed properties (static) |
| **Immutability** | No (resource is mutable) | Yes (readonly properties) |
| **Validation integration** | Via Form Requests only | Inline (`rules()`) or separate |
| **Pagination** | Built-in (`ResourceCollection`) | Manual (collection mapping) |
| **Conditional attributes** | Built-in (`when`, `whenLoaded`, etc.) | Manual (ternary, conditional) |
| **Channel support** | HTTP only | HTTP, queue, events, CLI |
| **Nested resources** | Built-in automatic | Manual (or package auto-resolve) |
| **Casting** | Via Eloquent casts (indirect) | Direct (manual or package casters) |
| **Boilerplate** | Minimal per resource | Moderate to high (without package) |
| **Testing** | HTTP feature tests | Unit tests |
| **Cache/optimization** | Resolved per request | Can be cached/serialized |

## Decision Framework

**Use API Resources when:**
- The serialization is exclusively for HTTP API responses.
- You need request-aware output (e.g., include admin fields based on auth).
- You need built-in pagination, conditional attributes, and wrapping.
- The serialization logic is simple shape transformation (rename keys, nest data).
- You want to minimize files and leverage Laravel conventions.

**Use DTOs when:**
- The same data must be serialized for multiple channels (API + queue + events).
- You need strict typing and immutability at application boundaries.
- You want to decouple domain models from external contracts.
- You need validation integrated with the data structure.
- You're using Domain-Driven Design or Hexagonal Architecture patterns.

**Use Both when:**
- You need typed domain contracts (DTOs) plus HTTP-specific features (Resources).
- The DTO handles cross-channel serialization; the Resource adds metadata, pagination, and status codes.

## Patterns

- **DTO → Resource adapter** — Create a DTO at the domain boundary, then wrap it in an API Resource for HTTP presentation. The resource's `toArray()` delegates to the DTO's `toArray()` and adds HTTP-specific fields (links, meta).
- **Resource → DTO bridge** — For incoming data, validate via Form Request, create a DTO from the validated data, and pass the DTO to the action/service layer. The controller never receives raw Eloquent models.
- **Channel-based selection** — Use DTOs for any serialization that crosses channels (queue, broadcast, CLI, API). Only add a Resource wrapper when HTTP-specific features (pagination, conditional attributes, request awareness) are required.
- **Consistent boundary pattern** — All application boundaries (controllers, queue listeners, event subscribers) receive or return DTOs. Controllers additionally wrap in Resources for the HTTP response. This keeps the domain isolated from serialization concerns.
- **Shared contract pattern** — Define a DTO that serves as the canonical data shape, then use it across all channels. Resources become thin wrappers that only add transport-specific metadata.

## Architectural Decisions

- API Resources were built to solve the specific problem of HTTP API serialization — they are not designed for general-purpose DTO use.
- DTOs predate API Resources as a pattern and serve a broader purpose in application architecture.
- Laravel explicitly chose not to ship a built-in DTO class — the ecosystem (particularly `spatie/laravel-data`) filled this gap.
- The coexistence pattern (DTO → Resource) adds indirection but maximizes both type safety and HTTP feature support.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Resources integrate with Laravel's response system seamlessly | Resources are HTTP-coupled — unusable for queues/events | Use DTOs for multi-channel serialization |
| DTOs provide type safety and immutability | DTOs require more boilerplate | Use `spatie/laravel-data` to reduce boilerplate |
| Both can be combined in layered architecture | Two classes per entity = more files to maintain | Worthwhile for complex, multi-channel applications |
| Resources have built-in conditionals, pagination, wrapping | Resources lack type safety — arrays are dynamic | Add PHPStan/Psalm to catch array shape drift |
| DTOs are pure PHP — testable without Laravel | DTOs don't auto-detect paginators or request context | Handle pagination manually or in presentation layer |

## Performance Considerations

- Resources are created per-request and garbage-collected — minimal overhead.
- DTOs are similar in creation cost but can be cached/serialized for reuse across processes.
- Layered approach (DTO → Resource) doubles object count but each layer is lightweight.
- DTOs with `spatie/laravel-data` use reflection on first creation; subsequent creations are faster with cached type metadata.
- For high-throughput APIs, consider whether the intermediate DTO layer adds meaningful value (profile first).

## Production Considerations

- Establish a clear project convention: when to use Resources, when to use DTOs, when to use both.
- Document the serialization architecture in the project README or ADR.
- If using both, enforce the layering — DTO returns from services/actions; Resources wrap DTOs in controllers.
- Test serialization at the controller level (feature tests) for Resources and at the unit level for DTOs.
- Versioning strategy applies to both — version Resources or DTOs based on which represents the external contract.

## Common Mistakes

- Using Resources for serialization that crosses channels (e.g., queuing a Resource — it's serializable but heavy).
- Using DTOs for every internal method call — adds indirection without benefit.
- Building a Resource that contains complex business logic — Resources should only transform, not compute.
- Forgetting that DTOs and Resources can coexist — choosing one exclusively when both would be ideal.
- Not versioning serialization contracts — changing a Resource or DTO breaks external consumers.

## Failure Modes

- **Resource leak into queue** — A `JsonResource` is serialized and queued — includes unnecessary HTTP context.
- **DTO domain leak** — DTO starts containing business logic, becoming an anemic domain model.
- **Over-engineering** — Three-layer serialization (Model → DTO → Resource) for a simple CRUD app adds unnecessary complexity.
- **Under-engineering** — Returning Eloquent models directly from controllers because "Resources are overkill."
- **Inconsistent pattern** — Some endpoints use Resources, others use DTOs, others return models directly.

## Ecosystem Usage

- **Laravel API Resources** — Standard for first-party Laravel API packages (Forge, Envoyer).
- **spatie/laravel-data** — Standard DTO package for Laravel DDD/Hexagonal projects.
- **Laravel Nova** — Mix of both: internal data objects with HTTP-specific resource presentation.
- **Laravel Horizon** — Jobs use array serialization (not Resources or DTOs) — considers which approach fits the channel.
- **Enterprise Laravel** — Typically uses DTOs at the service layer, Resources at the HTTP boundary.

## Related Knowledge Units

### Prerequisites

- **json-resource** — The API Resource serialization layer; understanding single-resource mechanics is needed before comparing with DTOs.
- **dto-patterns** — The foundational DTO pattern; core concepts of immutable typed data containers.

### Related Topics

- **spatie-laravel-data** — The formalized DTO package that automates DTO creation and casting.
- **resource-collection** — Collection handling in Resources, relevant when comparing collection serialization approaches.

### Advanced Follow-up Topics

- **conditional-attributes** — Resource-specific features missing from DTOs, useful when evaluating feature parity.

## Research Notes

- The Resources-vs-DTOs discussion is one of the most debated topics in the Laravel community.
- The Laravel documentation recommends Resources for API responses but does not address DTOs — it's ecosystem knowledge.
- Many senior Laravel developers advocate for DTOs at service boundaries regardless of project size.
- The trend in 2024-2026 is towards layered serialization (DTOs for contracts, Resources for HTTP) as applications grow in complexity.
- Serverless Laravel deployments (Vapor) favor lightweight serialization — DTOs are preferred over Resources for cold start optimization.
