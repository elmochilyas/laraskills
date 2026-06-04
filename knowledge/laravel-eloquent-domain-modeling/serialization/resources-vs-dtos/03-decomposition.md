# resources-vs-dtos — Decomposition

## Implementation Patterns

| Pattern | When to Use | Complexity |
|---|---|---|
| Resources only | Simple CRUD API, no other channels | Low |
| DTOs only | Multi-channel (API + queue + events) | Medium |
| DTO → Resource layered | Complex app needing both contracts and HTTP features | High |
| Model → Response directly | Prototype, internal admin panels | Very Low |
| spatie/laravel-data as replacement | Replace Resources entirely with Data + response | Medium |
| Per-endpoint decision | Each endpoint chooses based on needs (rare) | High (inconsistent) |

## Decision Matrix

| Application Type | Recommended Approach |
|---|---|
| Simple CRUD API (one channel) | API Resources |
| API + Queue jobs | DTOs |
| API + Broadcasting | DTOs |
| API + CLI commands | DTOs |
| Enterprise DDD / Hexagonal | DTOs + Resources (layered) |
| Microservice (single channel) | API Resources |
| BFF (Backend for Frontend) | API Resources (request-aware) |
| Package / SDK | DTOs (framework-agnostic) |

## Production Checklist

- [ ] Serialization strategy is documented in project ADR or README.
- [ ] One consistent approach is followed (don't mix Resources and DTOs for the same entity).
- [ ] If using both, layering is enforced: DTO from services, Resource wraps DTO in controllers.
- [ ] Resources are not serialized to queues/events.
- [ ] DTOs contain no business logic.
- [ ] Serialization contracts are versioned (v1 vs v2 contracts).
- [ ] Controller tests verify final HTTP response shape.
- [ ] Unit tests verify DTO mapping and serialization.
- [ ] Profile before adding intermediate DTO layer in hot paths.

## When to Avoid Each

**Avoid Resources when:**
- Same data is needed in queue payloads.
- Your application has no HTTP layer (CLI-only, package development).
- You need strict type enforcement (static analysis).
- You want immutable data objects.

**Avoid DTOs (vanilla PHP) when:**
- You need pagination, conditional attributes, wrapping — implement manually.
- Your team is unfamiliar with the pattern.
- Application is simple CRUD with no multi-channel needs.
- You want maximum development speed with minimum files.

## Migration Path

1. **Start with Resources** — Simplest path; use for initial API development.
2. **Introduce DTOs at service boundaries** — When queue/events join the app, add DTOs for service responses.
3. **Layer Resources on DTOs** — Resources now wrap DTOs instead of Eloquent models; DTOs handle cross-channel serialization.
4. **Version contracts** — Version DTOs for domain contracts; version Resources for HTTP presentation separately.

## Related Tests

- Decision audit: verify serialization approach matches project complexity
- Migration test: verify both old (Resources-only) and new (DTO+Resource) endpoints produce same output
- Feature test: controller returning DTO-wrapped-in-Resource
- Unit test: DTO used in queue job serialization
- Unit test: Resource (not DTO) serialization in queue — verify it fails or is avoided

## Common Anti-Patterns

1. **Resource + Eloquent in queue** — Queuing a `JsonResource` causes full Eloquent model to be serialized; use DTOs.
2. **DTO everywhere** — Even in internal service classes where a simple array would suffice — over-engineering.
3. **No serialization layer at all** — Returning `$model->toArray()` from controllers — coupling API to DB schema.
4. **DTO with business logic** — DTO computes totals, formats dates, validates complex rules — it's now a domain object.
5. **Resource doing DTO's job** — Resource used across channels (HTTP + queue) — Resource is HTTP-specific by design.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization