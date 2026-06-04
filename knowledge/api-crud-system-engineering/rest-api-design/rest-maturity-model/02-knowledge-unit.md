# REST Maturity Model

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** REST Maturity Model
- **Last Updated:** 2026-06-02

---

## Executive Summary

The Richardson Maturity Model (RMM) classifies APIs into four levels of REST compliance, from Level 0 (plain XML-over-HTTP) through Level 3 (hypermedia-driven). The model provides a vocabulary for discussing API maturity and a roadmap for evolving APIs toward true REST compliance. Most production APIs operate at Level 2 (HTTP verbs + resources) with partial Level 3 adoption for navigation (pagination links).

The levels are cumulative — each level builds on the previous one. Level 2 is the pragmatic sweet spot where most development effort is best invested. Level 3 (HATEOAS) provides diminishing returns unless the client ecosystem is hypermedia-native. Level 1 (resources) and Level 2 (HTTP verbs) together are often called "RESTful," while Level 3 is "REST."

---

## Core Concepts

### The Four Levels

| Level | Name | Description | Example |
|---|---|---|---|
| 0 | The Swamp of POX | Single endpoint, all operations via POST, XML payload | `POST /api` with `<action>getUser</action>` |
| 1 | Resources | Multiple endpoints for different resources, still only POST | `POST /users/create`, `POST /users/42/update` |
| 2 | HTTP Verbs | Proper use of GET/POST/PUT/PATCH/DELETE, status codes | `GET /users/{id}`, `POST /users`, `DELETE /users/{id}` |
| 3 | Hypermedia Controls | Links guide client state transitions (HATEOAS) | `{"_links": {"self": "/users/42", "update": ...}}` |

### Level 0 — The Swamp of POX
Single URI endpoint, all operations tunneled through POST. The request body specifies the operation and parameters. This is RPC-style and predates RESTful design. Example: XML-RPC, SOAP, early web services.

**Characteristics:**
- One URI for everything
- Only POST method used
- Operation name in request body
- Response indicates success/failure

### Level 1 — Resources
Multiple URIs for different resources, but still using POST for all operations. The URI identifies the resource but not the operation.

**Characteristics:**
- `/users`, `/orders`, `/products` as distinct endpoints
- `/users/42` to address a specific user
- Operation semantics in payload or URI path segment
- No HTTP method differentiation

### Level 2 — HTTP Verbs
Proper HTTP method usage. GET for safe reads (cacheable), POST for creation, PUT/PATCH for updates, DELETE for removal. Status codes reflect outcome. This is the level most APIs target.

**Characteristics:**
- GET/POST/PUT/PATCH/DELETE used correctly
- Status codes: 200, 201, 204, 400, 404, 409, 422, 500
- Cache headers on GET responses
- Idempotency guarantees for PUT, DELETE

### Level 3 — Hypermedia Controls
Responses include links that guide clients to valid next actions. The client discovers URLs through links rather than constructing them. This is the level Fielding requires for REST compliance.

**Characteristics:**
- `self` link on every resource
- Action links based on resource state
- Pagination links on collections
- Conditional links based on authorization

---

## Mental Models

### The Ladder Model
Each level is a rung on a ladder. You can't skip levels — Level 2 presupposes Level 1 (resources exist) and builds HTTP verbs on top. Level 3 requires Level 2 (verbs work correctly) before links make sense.

### The Car Analogy
Level 0 is a car with only a forward pedal (POST everything). Level 1 adds a steering wheel (resources). Level 2 adds proper pedals (verbs). Level 3 adds a GPS that tells you where to go next (hypermedia).

### The ROI Curve
Level 0 → Level 2 provides 95% of REST's benefits (interoperability, caching, scalability). Level 2 → Level 3 provides the remaining 5% at significant cost. The ROI curve flattens dramatically after Level 2.

---

## Internal Mechanics

### How Laravel Supports Each Level

**Level 0:** Can be done but is counter to Laravel conventions. One controller method handling all operations:
```php
Route::post('/api', [RpcController::class, 'handle']);
```

**Level 1:** Multiple controllers, but POST only:
```php
Route::post('/users/create', [UserController::class, 'create']);
Route::post('/users/view', [UserController::class, 'view']);
```

**Level 2:** Laravel's native pattern — resource controllers, proper methods:
```php
Route::apiResource('users', UserController::class);
// GET /users → index, POST /users → store, GET /users/{user} → show
// PUT/PATCH /users/{user} → update, DELETE /users/{user} → destroy
```

**Level 3:** Custom implementation in resource classes (see HATEOAS KU):
```php
class UserResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            ...$this->attributesToArray(),
            '_links' => [
                'self' => ['href' => route('users.show', $this), 'method' => 'GET'],
            ],
        ];
    }
}
```

### Detecting Maturity Level in Laravel
- Check if `apiResource()` is used (Level 2 indicator)
- Check if POST is used for reads (Level 0-1 indicator)
- Check if resources include `_links` or `links` (Level 3 indicator)
- Check if `create` and `edit` routes are used in API (Level 2 violation)

---

## Patterns

### Progressive Enhancement
Start at Level 2, add Level 3 elements incrementally:
1. Add `self` links to all resources
2. Add pagination links to collections
3. Add state-driven action links
4. Add top-level API root with entry points

### API Maturity Assessment
Before designing new endpoints, assess their target maturity:
- Simple CRUD: Level 2 is sufficient
- Complex state machines: Level 3 adds value (links encode valid transitions)
- Public APIs: Level 2 minimum, Level 3 for discoverability
- Internal microservices: Level 1-2 is often sufficient

### Level-Skipping Pitfall
Never jump from Level 0 directly to Level 2 without Level 1 — verbs require resources to operate on. Implementing verbs on a single endpoint produces a Level 2 facade over Level 0 architecture.

---

## Architectural Decisions

### Target Maturity Level
Decision framework:
- Level 0: Only for legacy system integration or SOAP-to-REST migration
- Level 1: Only for extremely simple internal services (1-2 resources, few operations)
- Level 2: Default target for all new APIs (80% of the benefit)
- Level 3: Target when client teams request it, or when API is public and discoverability matters

### When to Invest in Level 3
Level 3 adds significant server complexity. Invest when:
- API has a complex state machine with many valid transitions
- API is consumed by automated clients that can follow links
- Multiple Client teams need to discover functionality dynamically
- API tooling (Postman, generated clients) benefits from link metadata

### When Level 2 Is Sufficient
Level 2 is the pragmatic choice when:
- API has simple CRUD operations
- Clients are developed in-house and can be coordinated
- Documentation is the primary discoverability mechanism
- Response size constraints matter (links add bandwidth)

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Level 2: Standard HTTP semantics understood globally | Level 2: No dynamic discovery | Clients need documentation for URL construction |
| Level 3: Clients discover URLs dynamically | Level 3: Responses are 10-30% larger | Bandwidth increases, parsing complexity rises |
| Level 3: Server can change URLs freely | Level 3: Requires hypermedia-aware clients | Most HTTP clients are not hypermedia-aware |
| Higher maturity: More REST "correctness" | Higher maturity: More server implementation effort | Decreasing ROI as maturity increases |

---

## Performance Considerations

### Level 0/1 Performance
Single-endpoint Level 0 APIs can be optimized with a single route registration (fast), but the controller must dispatch to handlers internally (slow). Performance degrades as the number of operations grows.

### Level 2 Performance
Route registration is proportional to the number of endpoints. `php artisan route:cache` mitigates this. Method-based dispatching (GET/POST/etc.) is optimized in Laravel's router.

### Level 3 Performance
Link generation in each resource adds serialization time. For collections of 100 items, iterating to add links adds ~5-15ms. Conditional link computation (authorization checks per link) adds database queries.

---

## Production Considerations

### Maturity Documentation
Document the target maturity level for each API version. Include:
- What level(s) the API operates at per endpoint
- What clients can expect in terms of discovery
- Migration plan for advancing maturity levels

### Client Capability Assumptions
Assume most clients operate at Level 2 comprehension even if the API provides Level 3 features. Clients will hardcode URLs from documentation rather than discovering them dynamically. Do not require Level 3 for basic operation.

### Gradual Maturity Advancement
Advancing maturity level should not break existing clients. Adding links (L2 → L3) is backward-compatible — it adds new fields without changing existing ones. Avoid moving backward (removing links, collapsing resources).

---

## Common Mistakes

### Claiming REST Compliance at Level 2
Why it happens: Most tutorials teach Level 2 as "REST API." Why it's harmful: Creates a gap between developer understanding and Fielding's definition. Better approach: Call Level 2 APIs "RESTful" or "HTTP API" rather than "REST API."

### Attempting Level 3 Without Level 2 Foundation
Why it happens: Teams want "true REST" and implement links without getting verbs and status codes right first. Why it's harmful: Links lead to endpoints with inconsistent behavior; the hypermedia layer is wasted. Better approach: Nail Level 2 correctness before adding Level 3 features.

### Ignoring Level 0 as a Valid Pattern
Why it happens: REST enthusiasm dismisses older patterns. Why it's harmful: Level 0 is appropriate for some contexts (webhook callbacks, legacy integration). Better approach: Choose the maturity level that fits the use case, not the trend.

### Over-Engineering to Level 3
Why it happens: Technical enthusiasm for hypermedia. Why it's harmful: Significant server complexity for no client benefit (clients don't follow links). Better approach: Start at Level 2 and add Level 3 features only when clients demonstrate usage.

---

## Failure Modes

### Mixed Maturity Within Same API
Some endpoints at Level 2, others at Level 0, some at Level 1. Clients cannot predict the behavior of each endpoint. This creates confusion and per-endpoint learning curves. Standardize within each API version.

### Level 3 Client Dependence Without Client Buy-In
Server requires clients to follow links (no URL documentation), but clients hardcode URLs from documentation. The result is broken clients when links change. Communicate hypermedia requirements clearly.

### Regression in Maturity
URL restructuring removes links (L3 → L2) or collapses resources (L1 → L0). Existing clients break. Maintain backward compatibility or version the API.

---

## Ecosystem Usage

### GitHub API
GitHub operates at Level 2 with Level 3 pagination links (Link header). Resources have `url` fields (self-like) but not full state-driven action links. GitHub is the classic example of pragmatic Level 2.

### Stripe API
Stripe operates at Level 2 (proper HTTP verbs, status codes, resource URLs). Stripe has pagination links on list responses. Stripe does not implement Level 3 hypermedia.

### Twilio API
Twilio operates at Level 0-1 (POST for all operations, resource URLs) with some Level 2 characteristics (proper status codes). Twilio demonstrates that Level 0-1 can be successful for operation-oriented APIs.

### PayPal REST API
PayPal explicitly targets Level 2 with HATEOAS links (Level 3). PayPal provides `links` arrays on all resources with `rel`, `href`, and `method`. PayPal is one of the few major APIs that consistently implements Level 3.

---

## Related Knowledge Units

### Prerequisites
- REST Architectural Constraints — The constraints each level represents
- HTTP Method Semantics — Level 2 verb usage
- HATEOAS / Hypermedia Controls — Level 3 link implementation

### Related Topics
- REST Purity vs Pragmatic — When lower maturity is acceptable
- Resource vs Action Orientation — Level 1 resource identification
- URL Structure Design — Level 1-2 URL patterns

### Advanced Follow-up Topics
- API Lifecycle Governance — Maturity evolution over API versions
- API Testing Strategy — Testing each maturity level appropriately

---

## Research Notes

### Source Analysis
- Richardson, Leonard. "Justice Will Take Us Millions Of Moves?" 2008 presentation introducing the maturity model
- Fowler, Martin. "Richardson Maturity Model." 2010 — Popularized the model in enterprise contexts
- Fielding, Roy. "[REST APIs must be hypertext-driven]" blog post — Only Level 3 qualifies as REST

### Key Insight
The Richardson Maturity Model describes what REST is, not what APIs should be. The model is descriptive, not prescriptive. Most successful production APIs operate at Level 2, and that is a valid engineering choice.

### Version-Specific Notes
- Laravel's routing and controller conventions naturally guide toward Level 2
- No framework-level support for advancing to Level 3 — must be implemented manually
- Laravel 11's `api` route file as opt-in has no impact on maturity level support
