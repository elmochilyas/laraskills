# REST Maturity Model

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: rest-maturity-model
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Target Level 2 As The Default Maturity
---
## Category
Architecture
---
## Rule
Always target Level 2 of the Richardson Maturity Model as the default for new API endpoints — proper HTTP methods, status codes, and resource URLs — never start at Level 0 or Level 1 unless legacy constraints require it.
---
## Reason
Level 2 provides approximately 95% of REST's benefits (caching, idempotency, uniform interface) with manageable implementation effort. Laravel's `Route::apiResource()` naturally produces Level 2 endpoints. Level 3 (HATEOAS) provides diminishing returns. Level 0/1 lose HTTP caching and idempotency benefits.
---
## Bad Example
```php
// Level 0 — single POST endpoint for everything
Route::post('/api', [RpcController::class, 'handle']);
```

## Good Example
```php
// Level 2 — proper verbs and resources
Route::apiResource('users', UserController::class);
// GET /users, POST /users, GET /users/{id}, PUT/PATCH /users/{id}, DELETE /users/{id}
```

## Exceptions
Legacy system integration where the consumer cannot support HTTP methods beyond POST (SOAP migration, webhook receivers). Document these as Level 0 exceptions.

## Consequences Of Violation
Lost caching benefits; no idempotency guarantees; poor alignment with HTTP infrastructure; wasted development effort on suboptimal architecture that must be migrated later.
---

## Add Level 3 Elements Incrementally
---
## Category
Maintainability
---
## Rule
Always add Level 3 hypermedia elements incrementally — start with self links, then pagination links, then state-driven action links — never implement full HATEOAS from day one.
---
## Reason
Full HATEOAS requires significant design and implementation effort, and most clients don't use hypermedia navigation. Incremental adoption lets you validate that clients actually use each element before investing in more. Self links are universally useful. Pagination links benefit all collection consumers. State-driven action links only help if clients follow them instead of hardcoding URLs.
---
## Bad Example
```php
// Full HATEOAS from day one — links for every possible action
return [
    'data' => $user,
    '_links' => [
        'self' => [...], 'update' => [...], 'delete' => [...],
        'posts' => [...], 'comments' => [...], 'profile' => [...],
        'activate' => [...], 'deactivate' => [...], 'archive' => [...],
        // 12 more links — most never used by clients
    ],
];
```

## Good Example
```php
// Phase 1: self link only
return ['data' => $user, '_links' => ['self' => [...]]];
// Phase 2: add pagination links on collections
// Phase 3: add state-driven action links
// Phase 4: add API root entry points
```

## Exceptions
When the consumer is a hypermedia-native client that requires full HATEOAS from the start. In that case, build Level 3 from day one but still ensure Level 2 correctness first.

## Consequences Of Violation
Wasted development effort on unused links; increased payload size without client benefit; complex code that is harder to maintain; potential bugs in link generation that don't affect core functionality.
---

## Never Skip Levels — Build Cumulatively
---
## Category
Architecture
---
## Rule
Always build maturity levels cumulatively — identify resources (Level 1) before applying HTTP verbs (Level 2) — never jump to Level 2 without Level 1 foundation.
---
## Reason
Each maturity level builds on the previous one. HTTP verbs (Level 2) require resources (Level 1) to operate on. Skipping Level 1 produces Level 2 verbs applied to a Level 0 single endpoint — a Level 2 facade on Level 0 architecture. Without resource identification, verbs have no meaningful target.
---
## Bad Example
```php
// Level 2 facade on Level 0 — verbs with no resource identification
Route::get('/api', [UserController::class, 'handle']);
Route::post('/api', [UserController::class, 'handle']);
// Single endpoint — verbs don't create Level 2 without resources
```

## Good Example
```php
// Level 1 first — identify resources
Route::post('/users', [UserController::class, 'handle']);
Route::post('/orders', [OrderController::class, 'handle']);
// Then Level 2 — add proper verbs
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
```

## Exceptions
When migrating an existing Level 0/1 API to Level 2 incrementally. Add verbs one resource at a time during the migration — the transitional state may skip levels temporarily.

## Consequences Of Violation
Verbs applied to nothing; confusing API where methods differentiate but resources don't; migration path requires fundamental restructuring rather than incremental improvement.
---

## Call Level 2 APIs "RESTful", Not "REST"
---
## Category
Maintainability
---
## Rule
Always describe Level 2 APIs as "RESTful" or "HTTP API" — never claim "REST" compliance for APIs without hypermedia controls (Level 3).
---
## Reason
Roy Fielding, REST's author, explicitly states that only Level 3 (HATEOAS) qualifies as "REST." Calling Level 2 "REST" creates false expectations for hypermedia discovery. Accurate terminology sets correct expectations for consumers — they know the API uses HTTP semantics properly but cannot be navigated via hypermedia alone.
---
## Bad Example
```php
// OpenAPI description claims "REST" for Level 2 API
info:
  title: My REST API
  description: A fully REST-compliant API
  // Level 2 — no hypermedia, not truly REST
```

## Good Example
```php
// Accurate description for Level 2 API
info:
  title: My RESTful API
  description: A RESTful HTTP API (Level 2 Richardson Maturity Model)
  // Honest about capabilities
```

## Exceptions
When marketing requirements demand "REST" terminology. Push back with "RESTful" and document the distinction internally.

## Consequences Of Violation
False client expectations for hypermedia discovery; negative reviews from technically knowledgeable consumers; confusion about API capabilities; potential contractual issues when "REST" compliance is specified.
---

## Ensure Level 2 Correctness Before Adding Level 3
---
## Category
Architecture
---
## Rule
Always verify Level 2 correctness (correct HTTP methods, status codes, and resource URLs) before implementing any Level 3 hypermedia features — never build links on top of broken HTTP semantics.
---
## Reason
Hypermedia links (Level 3) guide clients to endpoints. If those endpoints use incorrect HTTP methods or return wrong status codes, the links lead to broken operations. Level 3 compounds Level 2 errors by making them navigable. A solid Level 2 foundation ensures that when clients follow links, the endpoints behave correctly.
---
## Bad Example
```php
// Level 3 links on Level 2 foundation with wrong status codes
public function toArray($request)
{
    return [
        '_links' => [
            'delete' => ['href' => route('users.destroy', $this), 'method' => 'DELETE'],
        ],
    ];
    // But destroy() returns 200 instead of 204 — link leads to wrong behavior
}
```

## Good Example
```php
// First fix Level 2 — correct status code
public function destroy(User $user)
{
    $user->delete();
    return response(null, 204);
}
// Then add Level 3 links
```

## Exceptions
When the API is built by separate teams — one team owns HTTP semantics, another owns hypermedia layers. Even then, integration testing should verify Level 2 correctness of linked endpoints.

## Consequences Of Violation
Links that lead to broken or incorrect operations; clients that follow links encounter wrong status codes or methods; wasted Level 3 implementation on defective foundation.
---

## Validate Maturity Consistency Per API Version
---
## Category
Maintainability
---
## Rule
Always maintain a consistent maturity level across all endpoints within the same API version — never mix Level 0, Level 2, and Level 3 endpoints arbitrarily.
---
## Reason
Mixed maturity levels force clients to learn which maturity pattern each endpoint follows. Some endpoints use proper verbs (Level 2), others use POST for everything (Level 0), some include links (Level 3). Clients cannot write generic handling code and must understand each endpoint's individual behavior. Consistency within a version enables predictable client integration.
---
## Bad Example
```php
// Mixed maturity in v1
// Users: Level 2
Route::apiResource('v1/users', UserController::class);
// Orders: Level 0
Route::post('v1/orders', [RpcController::class, 'handle']);
// Clients must learn each endpoint's pattern individually
```

## Good Example
```php
// Consistent Level 2 in v1
Route::prefix('v1')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('orders', OrderController::class);
});
// All endpoints follow the same pattern
```

## Exceptions
During version migration (V1→V2), where V1 contains legacy Level 0 endpoints and V2 uses Level 2. Document V1's mixed maturity and encourage migration to V2.

## Consequences Of Violation
Clients must handle multiple interaction patterns; client code complexity increases with each endpoint; API documentation requires per-endpoint maturity notes; migration to consistent pattern requires version bump.
---

## Document Target Maturity Per API Version
---
## Category
Maintainability
---
## Rule
Always document the target maturity level (Level 0/1/2/3) for each API version in the API documentation — never leave clients to discover maturity through trial and error.
---
## Reason
Clients need to know what interaction patterns to expect. A Level 2 API supports HTTP caching, idempotency for PUT/DELETE, and standard status codes. A Level 3 API supports hypermedia navigation. Documenting the target maturity level sets expectations for client integration patterns, testing strategies, and error handling approaches.
---
## Bad Example
```php
// No maturity documentation — clients don't know what to expect
info:
  title: My API
  version: v1
```

## Good Example
```php
// Documented maturity level
info:
  title: My API
  version: v1
  x-maturity-level: 2
  x-maturity-description: >
    This API operates at Level 2 of the Richardson Maturity Model.
    Use proper HTTP methods, status codes, and resource URLs.
    No hypermedia navigation is supported.
```

## Exceptions
Internal APIs consumed exclusively by the same team. Even then, document maturity in internal notes to maintain consistency.

## Consequences Of Violation
Client integration errors from assumed interaction patterns; developers waste time discovering maturity by testing; unclear expectations about caching, idempotency, and navigation support.
---
