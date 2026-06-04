# REST Maturity Model

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: rest-maturity-model
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
The Richardson Maturity Model (RMM) classifies APIs into four levels of REST compliance, from Level 0 (plain XML-over-HTTP) through Level 3 (hypermedia-driven). The model provides a vocabulary for discussing API maturity and a roadmap for evolving APIs toward true REST compliance. Most production APIs operate at Level 2 (HTTP verbs + resources) with partial Level 3 adoption for navigation (pagination links).

The levels are cumulative — each builds on the previous one. Level 2 is the pragmatic sweet spot where most development effort is best invested. Level 3 (HATEOAS) provides diminishing returns unless the client ecosystem is hypermedia-native.

## Core Concepts
- **Level 0 — The Swamp of POX**: Single endpoint, all operations via POST. RPC-style. Example: XML-RPC, SOAP.
- **Level 1 — Resources**: Multiple endpoints for different resources, but still only POST for operations.
- **Level 2 — HTTP Verbs**: Proper GET/POST/PUT/PATCH/DELETE usage, correct status codes. Most APIs target this level.
- **Level 3 — Hypermedia Controls**: Responses include links guiding client state transitions (HATEOAS).
- **Cumulative Levels**: Each level presupposes the previous — Level 2 requires Level 1 (resources exist) before verbs apply.
- **ROI Curve**: Level 0 → Level 2 provides ~95% of REST's benefits. Level 2 → Level 3 provides ~5% at significant cost.
- **RESTful vs REST**: Level 2 APIs are "RESTful." Only Level 3 qualifies as "REST" per Fielding's definition.

## When To Use
- **Level 0**: Legacy system integration, SOAP migration, webhook callbacks, simple internal tools
- **Level 1**: Extremely simple internal services (1-2 resources, few operations), legacy API facades
- **Level 2**: Default target for all new APIs — 80% of the benefit with manageable effort
- **Level 3**: Complex state machines where links encode valid transitions, public APIs with discoverability goals, hypermedia-native client ecosystems

## When NOT To Use
- **Level 0 for new APIs**: Avoid unless required by legacy integration — Laravel conventions naturally guide away from this
- **Level 1 for public APIs**: Lack of HTTP method differentiation limits caching and idempotency
- **Level 2 without resources**: Applying verbs to a single endpoint produces a Level 2 facade over Level 0 architecture
- **Level 3 without client buy-in**: Server requires clients to follow links, but clients hardcode URLs from documentation

## Best Practices (WHY)
- **Target Level 2 as the default**: Proper HTTP methods, status codes, and resource URLs provide 95% of REST's benefits. The effort to reach Level 3 is rarely justified.
- **Add Level 3 elements incrementally**: Start with self links, add pagination links, then state-driven action links, then API root entry points. Don't implement full HATEOAS from day one.
- **Don't skip levels**: Each level builds on the previous. Implementing verbs (Level 2) without resources (Level 1) produces a Level 2 facade on Level 0 — endpoints are verbs, not resources.
- **Call Level 2 APIs "RESTful", not "REST"**: Fielding explicitly states that only Level 3 qualifies as REST. Accurate terminology sets correct expectations for consumers.
- **Document target maturity per API version**: Specify what level each version operates at — helps clients understand discoverability expectations.

## Architecture Guidelines
- Laravel's `Route::apiResource()` naturally targets Level 2 — use it as the default for CRUD endpoints.
- Check API maturity: `apiResource()` usage indicates Level 2; POST for reads indicates Level 0-1; `_links` in resources indicates Level 3.
- Never skip from Level 0 to Level 2 without Level 1 — verbs require resources to operate on.
- Level 3 links must be backward-compatible — adding links (L2 → L3) adds fields without changing existing ones. Don't remove links after adding them.
- Mixed maturity within the same API version confuses clients — standardize per version.

## Performance
- Level 0/1 with single endpoint can optimize route registration but controller dispatch becomes complex.
- Level 2 benefits from `php artisan route:cache` — route registration overhead is proportional to endpoint count.
- Level 3 link generation adds ~5-15ms for collections of 100 items. Authorization checks per link add additional queries.
- Level 2 GET endpoints can be cached at CDN/reverse proxy — Level 0/1 POST endpoints cannot.

## Security
- Level 0/1 APIs obscure operations — security auditing is harder when all operations are tunneled through POST.
- Level 2 with proper status codes enables automated security tooling (WAF rules based on status code patterns).
- Level 3 links must respect authorization — never include links to actions the client cannot perform.
- Higher maturity levels don't inherently improve security — authentication and authorization are orthogonal.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Claiming REST at Level 2 | Calling Level 2 API "REST API" | Tutorials teach Level 2 as REST | Creates expectations for hypermedia that aren't met | Call Level 2 "RESTful" or "HTTP API" |
| Level 3 without Level 2 foundation | Implementing links without correct verbs/status codes | Enthusiasm for "true REST" | Hypermedia layer is wasted — links lead to broken endpoints | Nail Level 2 correctness before adding Level 3 |
| Skipping Level 1 | Using verbs on a single endpoint | Jumping straight to method usage | No resource identification — verbs applied to nothing | Identify resources first, then apply verbs |
| Over-engineering to Level 3 | Full hypermedia with no client usage | Technical enthusiasm | Server complexity without client benefit | Start at Level 2; add Level 3 only when clients demonstrate usage |
| Mixed maturity per endpoint | Some endpoints Level 2, others Level 0, some Level 1 | No centralized design standards | Clients cannot predict any endpoint's behavior | Standardize maturity within each API version |
| Regression in maturity | Removing links (L3 → L2) without version bump | URL restructuring | Existing clients that followed links break | Maintain backward compatibility or version change |

## Anti-Patterns
- **Level 3 Without Client Buy-In**: Full HATEOAS when clients hardcode URLs from documentation.
- **Level 2 Facade on Level 0**: Using verbs on a single endpoint (`GET /api?action=getUser`). Resources must exist.
- **Cherry-Picking Levels**: Using HTTP verbs (L2) but no resources (L1) or status codes.
- **Ignoring Level 0's Validity**: Dismissing Level 0 entirely — it's appropriate for webhooks and legacy integration.
- **Rigid Maturity Dogma**: Insisting on Level 3 for a simple CRUD API with one consumer.

## Examples
```php
// Level 0 — Single endpoint
Route::post('/api', [RpcController::class, 'handle']);

// Level 1 — Multiple endpoints, POST only
Route::post('/users/create', [UserController::class, 'create']);
Route::post('/users/view', [UserController::class, 'view']);

// Level 2 — Proper verbs (Laravel's native pattern)
Route::apiResource('users', UserController::class);
// GET /users → index
// POST /users → store
// GET /users/{user} → show
// PUT/PATCH /users/{user} → update
// DELETE /users/{user} → destroy

// Level 3 — With hypermedia links
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            '_links' => [
                'self' => ['href' => route('users.show', $this), 'method' => 'GET'],
                'update' => ['href' => route('users.update', $this), 'method' => 'PUT'],
            ],
        ];
    }
}

// Progressive enhancement to Level 3:
// Phase 1: Level 2 — resource endpoints with correct methods
// Phase 2: L2 + self links on all resources
// Phase 3: L2 + pagination links on collections
// Phase 4: L2 + state-driven action links
// Phase 5: L2 + API root with entry point links
```

## Related Topics
- **Prerequisites**: rest-architectural-constraints, http-method-semantics, hateoas-hypermedia-controls
- **Related**: rest-purity-vs-pragmatic, resource-vs-action-orientation, url-structure-design
- **Advanced**: api-lifecycle-governance, api-testing-strategy

## AI Agent Notes
- Target Level 2 as the default — proper HTTP methods, status codes, and resource URLs.
- Add Level 3 elements incrementally: self links → pagination links → state-driven links.
- Level 3 is rarely justified — invest in Level 2 correctness first.
- Call Level 2 APIs "RESTful", not "REST". Reserve "REST" for Level 3.
- Laravel's `apiResource()` naturally targets Level 2 — use it.
- Don't skip levels — verbs require resources to operate on.

## Verification
- All CRUD endpoints use proper HTTP methods (Level 2) — not POST for everything.
- Status codes are correct per operation: 201 for create, 204 for delete, etc.
- Resources are identified by URI paths (Level 1) — not a single endpoint for everything.
- Level 3 elements (self links, pagination links) are additive — they don't break Level 2 behavior.
- No `create` or `edit` routes exist in API endpoints.
- The target maturity level is documented per API version.
- Maturity level is consistent across endpoints within each version.
