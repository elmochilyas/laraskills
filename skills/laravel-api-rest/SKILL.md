# Laravel 13 API: REST Architecture, HATEOAS, Versioning, Resource Transformation & Pagination

## When to Use

Use this skill when designing or building RESTful APIs in Laravel 13. It covers REST principles, resource naming, HTTP methods, status codes, HATEOAS hypermedia, API versioning strategies, resource transformation via API Resources, and all pagination strategies (offset, cursor, keyset, length-aware). Every AI agent must follow these standards for consistent, scalable, consumer-friendly APIs.

---

## REST Principles

### Resources Over Actions

Resources represent nouns. HTTP methods represent actions. Never encode actions in URLs.

```php
// CORRECT — resources as nouns, methods as actions
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{user}', [UserController::class, 'show']);
Route::patch('/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);

// FORBIDDEN — actions in URLs
Route::post('/getUsers', ...);
Route::post('/createUser', ...);
Route::post('/deleteUser', ...);
```

### Resource Naming Conventions

```php
// CORRECT — plural nouns, kebab-case for multi-word
Route::get('/users', ...);
Route::get('/blog-posts', ...);
Route::get('/order-items', ...);

// CORRECT — nested resources (max depth: 2)
Route::get('/users/{user}/orders', ...);
Route::get('/orders/{order}/items', ...);

// FORBIDDEN — singular nouns, camelCase, deep nesting
Route::get('/user', ...);
Route::get('/getBlogPosts', ...);
Route::get('/companies/1/users/1/orders/1/items/1', ...);
```

### API Route File Organization

```php
// routes/api.php
use Illuminate\Support\Facades\Route;

Route::name('api.')->group(function () {
    Route::prefix('v1')->name('v1.')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::apiResource('orders', OrderController::class);
        Route::apiResource('orders.items', OrderItemController::class)
            ->only(['index', 'show', 'store']);
    });
});
```

---

## HTTP Methods & Status Codes

### Method Semantics

```php
// GET — Read-only. Must never modify state.
#[Get(path: '/users/{user}')]
public function show(User $user): UserResource
{
    return new UserResource($user);
}

// POST — Create new resources. Non-idempotent.
#[Post(path: '/users')]
public function store(StoreUserRequest $request, CreateUserAction $action): UserResource
{
    $user = $action->execute($request->toDto());
    return UserResource::make($user);
}

// PUT — Full replacement. Idempotent.
#[Put(path: '/users/{user}')]
public function replace(ReplaceUserRequest $request, User $user): UserResource
{
    // ...
}

// PATCH — Partial update. Preferred for APIs.
#[Patch(path: '/users/{user}')]
public function update(UpdateUserRequest $request, User $user): UserResource
{
    // ...
}

// DELETE — Resource removal. Idempotent.
#[Delete(path: '/users/{user}')]
public function destroy(User $user): JsonResponse
{
    $user->delete();
    return response()->noContent();
}
```

### Status Code Usage

```php
// SUCCESS
200 OK          // Successful GET, PATCH
201 Created     // Successful POST (resource created)
202 Accepted    // Async operation accepted (queue job)
204 No Content  // Successful DELETE

// CLIENT ERRORS
400 Bad Request      // Malformed syntax, invalid input
401 Unauthorized     // Missing or invalid authentication
403 Forbidden        // Authenticated but not authorized
404 Not Found        // Resource does not exist
405 Method Not Allowed
409 Conflict         // Resource state conflict (e.g., duplicate)
422 Unprocessable Entity  // Validation failure
429 Too Many Requests     // Rate limit exceeded

// SERVER ERRORS
500 Internal Server Error
503 Service Unavailable
```

### Correct Status Code Mapping in Controllers

```php
class OrderController extends Controller
{
    public function index(): OrderCollection
    {
        return new OrderCollection(Order::paginate(20));
        // -> 200 OK
    }

    public function store(StoreOrderRequest $request, PlaceOrderAction $action): OrderResource
    {
        $order = $action->execute($request->toDto());
        return OrderResource::make($order);
        // -> 201 Created
    }

    public function update(UpdateOrderRequest $request, Order $order): OrderResource
    {
        // PATCH handler
        return new OrderResource($order->fresh());
        // -> 200 OK
    }

    public function destroy(Order $order): JsonResponse
    {
        $order->delete();
        return response()->noContent();
        // -> 204 No Content
    }
}
```

### Forbidden Anti-Pattern

```php
// FORBIDDEN — always 200 with embedded status
return response()->json([
    'status' => 'error',
    'message' => 'Validation failed',
], 200); // Must be 422

// FORBIDDEN — always 200 for deletions
return response()->json(['deleted' => true], 200); // Must be 204

// CORRECT — use proper status codes
return response()->json([
    'errors' => [['code' => 'VALIDATION_ERROR', 'detail' => 'Email is required']],
], 422);
```

---

## HATEOAS (Hypermedia As The Engine Of Application State)

### Definition

HATEOAS means resources expose related actions and navigation links so clients discover available actions dynamically without hardcoded routes.

### Implementation

```php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'links' => $this->getLinks(),
        ];
    }

    private function getLinks(): array
    {
        return array_filter([
            'self' => route('api.v1.users.show', $this->id),
            'orders' => route('api.v1.users.orders.index', $this->id),
            'profile' => $this->profile
                ? route('api.v1.profiles.show', $this->profile)
                : null,
        ]);
    }
}
```

### Collection with HATEOAS

```php
class UserCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'data' => $this->collection,
            'links' => [
                'self' => route('api.v1.users.index'),
                'create' => route('api.v1.users.store'),
            ],
            'meta' => [
                'total' => $this->total(),
                'per_page' => $this->perPage(),
                'current_page' => $this->currentPage(),
            ],
        ];
    }
}
```

### When to Use HATEOAS

```php
// USE HATEOAS for:
// - Public APIs
// - Enterprise APIs
// - Partner integrations
// - Any API where clients should discover actions dynamically

// SKIP HATEOAS for:
// - Internal microservice communication (use gRPC)
// - Simple CRUD backends
// - GraphQL APIs (schema is self-documenting)
```

---

## API Versioning

### URL Versioning (Preferred)

```php
// routes/api.php
Route::prefix('v1')->group(function () {
    Route::apiResource('users', V1\UserController::class);
});

Route::prefix('v2')->group(function () {
    Route::apiResource('users', V2\UserController::class);
});
```

### Version-Specific Namespaces

```php
// app/Http/Controllers/Api/V1/UserController.php
namespace App\Http\Controllers\Api\V1;

class UserController extends Controller
{
    public function index(): UserCollection { /* ... */ }
}

// app/Http/Controllers/Api/V2/UserController.php
namespace App\Http\Controllers\Api\V2;

class UserController extends Controller
{
    public function index(): UserCollection
    {
        return new UserCollection(
            User::with('profile')->paginate()
        );
    }
}
```

### Breaking vs Non-Breaking Changes

```php
// NON-BREAKING — can be done within same version
// - Adding optional fields to responses
// - Adding new endpoints
// - Adding metadata
// - Relaxing validation rules
// - Increasing rate limits

// BREAKING — REQUIRES new version
// - Removing fields
// - Renaming fields
// - Changing response structure
// - Making optional fields required
// - Changing validation behavior
// - Changing default pagination size
```

### Deprecation Strategy

```php
// 1. ANNOUNCE — Add deprecation header
class UserController extends Controller
{
    public function index(): UserCollection
    {
        return UserCollection::make(User::paginate())
            ->additional(['meta' => [
                'deprecated' => true,
                'sunset' => '2026-09-01',
                'migration' => 'Use /api/v2/users instead',
            ]]);
    }
}

// 2. WARN — Add Sunset header
return response()
    ->json($data)
    ->header('Sunset', 'Sun, 01 Sep 2026 00:00:00 GMT')
    ->header('Deprecation', 'true');
```

### Version Negotiation

```php
// Alternative: Accept header versioning
// GET /api/users
// Accept: application/vnd.api+json;version=2

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $version = $request->header('Accept');

        return match (true) {
            str_contains($version, 'version=2') => $this->v2Index(),
            default => $this->v1Index(),
        };
    }
}
```

---

## Resource Transformation

### Never Expose Models Directly

```php
// FORBIDDEN — exposing Eloquent models directly
Route::get('/users', fn () => User::all());
Route::get('/users/{user}', fn (User $user) => $user);

// CORRECT — always use API Resources
Route::get('/users', fn () => UserResource::collection(User::paginate()));
Route::get('/users/{user}', fn (User $user) => new UserResource($user));
```

### Resource Responsibilities

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'avatar' => $this->avatar_url,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}

// Resources MAY:
// - Transform data (cast types, format dates)
// - Hide fields (conditional visibility)
// - Include metadata
// - Load relationships selectively

// Resources MUST NOT:
// - Query databases
// - Perform business logic
// - Trigger side effects
```

### Conditional Attributes

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_admin' => $this->when($request->user()?->is_admin, $this->is_admin),
            'ssn_last_four' => $this->when($request->user()?->is_admin, $this->ssn_last_four),
            'profile' => ProfileResource::make($this->whenLoaded('profile')),
            'orders_count' => $this->when($this->relationLoaded('orders'), $this->orders->count()),
        ];
    }
}
```

### Consistent Response Envelope

```php
// SUCCESS response structure
{
    "data": {},
    "meta": {},
    "links": {}
}

// COLLECTION response structure
{
    "data": [],
    "meta": {
        "total": 100,
        "per_page": 20,
        "current_page": 1,
        "last_page": 5
    },
    "links": {
        "first": "/api/v1/users?page=1",
        "last": "/api/v1/users?page=5",
        "prev": null,
        "next": "/api/v1/users?page=2"
    }
}

// ERROR response structure
{
    "errors": [
        {
            "code": "VALIDATION_ERROR",
            "status": "422",
            "title": "Validation Failed",
            "detail": "The email field is required.",
            "source": {
                "pointer": "/data/attributes/email"
            }
        }
    ]
}
```

---

## Pagination Strategies

### Offset Pagination (Simple, Length-Aware)

```php
use App\Models\User;

class UserController extends Controller
{
    public function index(Request $request): UserCollection
    {
        $users = User::paginate(
            perPage: $request->integer('per_page', 20),
            page: $request->integer('page', 1),
        );

        return new UserCollection($users);
    }
}

// HTTP Request:
// GET /api/users?page=3&per_page=20

// Response:
{
    "data": [...],
    "meta": {
        "total": 1000,
        "per_page": 20,
        "current_page": 3,
        "last_page": 50
    },
    "links": {
        "first": "/api/users?page=1",
        "last": "/api/users?page=50",
        "prev": "/api/users?page=2",
        "next": "/api/users?page=4"
    }
}
```

### When to Use Offset

```php
// USE OFFSET for:
// - Admin dashboards (need page jumping)
// - Search results (need total count)
// - Small to medium datasets (< 100K rows)
// - Paginated tables with page number navigation

// AVOID OFFSET for:
// - Large datasets (performance degrades at high offsets)
// - Real-time feeds (data shifting causes duplicates/skips)
// - Infinite scroll UIs
```

### Cursor Pagination (Preferred for Large Datasets)

```php
use App\Models\User;

class UserController extends Controller
{
    public function index(Request $request): UserCollection
    {
        $users = User::orderBy('id')
            ->cursorPaginate(
                perPage: $request->integer('per_page', 20),
                cursor: $request->string('cursor'),
            );

        return new UserCollection($users);
    }
}

// HTTP Request:
// GET /api/users?cursor=eyJpZCI6MTAwfQ==&per_page=20

// Response:
{
    "data": [...],
    "meta": {
        "per_page": 20,
        "has_more": true,
        "next_cursor": "eyJpZCI6MTIwfQ==",
        "prev_cursor": "eyJpZCI6ODB9"
    },
    "links": {
        "next": "/api/users?cursor=eyJpZCI6MTIwfQ==&per_page=20",
        "prev": "/api/users?cursor=eyJpZCI6ODB9&per_page=20"
    }
}
```

### Cursor Pagination with Custom Sort

```php
class PostController extends Controller
{
    public function index(Request $request): PostCollection
    {
        $query = Post::query();

        // Must have a tiebreaker for stable cursors
        $query->orderBy('created_at', 'desc')
              ->orderBy('id', 'desc');

        $posts = $query->cursorPaginate(
            perPage: $request->integer('per_page', 20),
            cursor: $request->string('cursor'),
        );

        return new PostCollection($posts);
    }
}

// Cursor pagination advantages:
// - Constant performance regardless of position
// - Stable under writes (no skipping/duplicates)
// - No total count query needed
// - Ideal for infinite scroll

// Requirements:
// - At least one unique column in ORDER BY
// - Columns with NULL values not supported
// - Must have an ORDER BY clause
```

### Transforming Paginated Responses

```php
class UserCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        $meta = $this->resource instanceof LengthAwarePaginator
            ? [
                'total' => $this->total(),
                'per_page' => $this->perPage(),
                'current_page' => $this->currentPage(),
                'last_page' => $this->lastPage(),
            ]
            : ($this->resource instanceof CursorPaginator
                ? [
                    'per_page' => $this->perPage(),
                    'has_more' => $this->hasMorePages(),
                    'next_cursor' => $this->nextCursor()?->encode(),
                    'prev_cursor' => $this->previousCursor()?->encode(),
                ]
                : []);

        return [
            'data' => $this->collection,
            'meta' => $meta,
            'links' => [
                'self' => $request->url(),
                'next' => $this->nextPageUrl(),
                'prev' => $this->previousPageUrl(),
            ],
        ];
    }
}
```

### Pagination Decision Matrix

```php
// DECISION MATRIX — choose your strategy:

// ┌───────────────────────┬──────────────┬────────────────┐
// │ Use Case              │ Strategy     │ Why            │
// ├───────────────────────┼──────────────┼────────────────┤
// │ Admin table           │ Offset       │ Page jumping   │
// │ Infinite scroll       │ Cursor       │ Stable, fast   │
// │ Activity feed         │ Cursor       │ Real-time data │
// │ Search results        │ Length-Aware │ Total count    │
// │ Mobile API            │ Cursor       │ Perf at scale  │
// │ Export all records    │ Cursor       │ No total limit │
// └───────────────────────┴──────────────┴────────────────┘
```

### Pagination Validation

```php
class PaginationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'cursor' => ['sometimes', 'string'],
        ];
    }

    public function perPage(): int
    {
        return min(
            $this->integer('per_page', 20),
            100 // Hard upper limit
        );
    }
}
```

---

## Enterprise API Checklist

Before deploying any REST API:

- [ ] Resources use plural nouns
- [ ] HTTP methods map to correct actions
- [ ] Every endpoint returns proper status codes
- [ ] No actions embedded in URLs
- [ ] Models never returned directly (API Resources used)
- [ ] HATEOAS links included for discoverability
- [ ] Versioning strategy documented and implemented
- [ ] Deprecation headers set on old versions
- [ ] Pagination strategy chosen per use case
- [ ] Cursor pagination preferred for large datasets
- [ ] Page size has hard upper limit (max 100)
- [ ] Error format is consistent across all endpoints
- [ ] Response envelope is consistent (data/meta/links)
- [ ] N+1 queries eliminated
- [ ] Sparse fieldsets supported (optional but recommended)
- [ ] Rate limiting applied to all endpoints
- [ ] Input validated on every request
- [ ] Output sanitized (no secrets exposed)

---

## References

- See skill: `laravel-api-jsonapi` for JSON:API specification resources
- See skill: `laravel-api-graphql` for GraphQL with Lighthouse
- See skill: `laravel-api-grpc` for gRPC microservice communication
- See skill: `laravel-api-microservices` for internal service boundaries
- See skill: `laravel-patterns` for Action/Services/DTOs patterns
- See skill: `laravel-security` for API authentication and rate limiting
- See rule: `rules/laravel/api-rest.md` for enforced REST rules
- See rule: `rules/laravel/architecture.md` for architecture flow rules
