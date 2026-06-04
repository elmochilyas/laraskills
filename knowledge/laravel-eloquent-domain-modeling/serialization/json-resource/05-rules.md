# JSON Resource — Rules

## Rule 1: Use `Resource::collection()` for All Listing Endpoints
---
## Category
Code Organization
---
## Rule
Always return `Resource::collection($paginator)` or `new ResourceCollection($paginator)` from listing endpoints, never a manually constructed array of resources.
---
## Reason
`Resource::collection()` auto-detects paginators, includes pagination metadata, wraps items in a `data` key, and maintains consistent response structure across all listing endpoints.
---
## Bad Example
```php
return response()->json([
    'data' => User::all()->map(fn ($u) => (new UserResource($u))->toArray($request)),
]);
```
---
## Good Example
```php
return UserResource::collection(User::paginate());
```
---
## Exceptions
Non-HTTP channels (queue, broadcast, CLI) where resource wrapping and pagination metadata are not applicable.
---
## Consequences Of Violation
Inconsistent response structures across endpoints; missing pagination metadata; manual construction errors.

---

## Rule 2: Always Guard Nested Resource Calls with `whenLoaded()`
---
## Category
Performance
---
## Rule
Every nested `Resource::collection($this->relation)` or `Resource::make($this->relation)` inside `toArray()` must be wrapped in `$this->whenLoaded('relation')`.
---
## Reason
Direct access on an unloaded relationship triggers lazy loading, causing N+1 queries during serialization that are invisible during development when data is small.
---
## Bad Example
```php
return [
    'posts' => PostResource::collection($this->posts),
    'profile' => ProfileResource::make($this->profile),
];
```
---
## Good Example
```php
return [
    'posts' => PostResource::collection($this->whenLoaded('posts')),
    'profile' => ProfileResource::make($this->whenLoaded('profile')),
];
```
---
## Exceptions
Relationships guaranteed to be loaded on every request (e.g., always eager-loaded in a global scope).
---
## Consequences Of Violation
N+1 query explosion on listing endpoints; performance degradation that scales with page size; difficult-to-debug query patterns.

---

## Rule 3: Never Put Business Logic or SQL Queries Inside `toArray()`
---
## Category
Architecture
---
## Rule
Keep `toArray()` purely transformational — no database queries, service calls, or business computations. Extract complex logic to private methods or service classes.
---
## Reason
Resources are a presentation layer. Mixing logic into `toArray()` violates separation of concerns, makes testing harder, and couples HTTP serialization to business operations.
---
## Bad Example
```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'eligibility' => $this->checkEligibility(), // Queries DB
        'score' => ScoreService::compute($this->resource), // Business logic
    ];
}
```
---
## Good Example
```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'eligibility' => $this->whenLoaded('eligibility'),
        'score' => $this->score,
    ];
}
```
---
## Exceptions
Trivial computed fields that use only in-memory data from the model (e.g., `$this->first_name . ' ' . $this->last_name`).
---
## Consequences Of Violation
Untestable resource logic; database queries hidden in serialization; difficult-to-debug performance issues; resources that break when called outside HTTP context.

---

## Rule 4: Version Resources by Separate Classes, Not by Conditional Logic
---
## Category
Maintainability
---
## Rule
Create separate resource classes for different API versions (e.g., `V1\UserResource`, `V2\UserResource`) instead of adding version checks inside a single class.
---
## Reason
Conditional version logic inside `toArray()` grows with every release, creating unreadable, brittle code that is hard to remove when old versions are deprecated.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            $this->when($request->version() >= 2, fn () => [
                'email' => $this->email,
            ]),
            $this->when($request->version() >= 3, fn () => [
                'phone' => $this->phone,
            ]),
        ];
    }
}
```
---
## Good Example
```php
// V1/UserResource
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name];
    }
}

// V2/UserResource
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}
```
---
## Exceptions
Minor additive-only changes (new fields) where a single resource with sensible defaults is simpler than class duplication.
---
## Consequences Of Violation
Unmaintainable resource files with nested version conditions; difficult removal of old version paths; increased risk of regressions when modifying shared logic.

---

## Rule 5: Never Serialize `JsonResource` Instances to Queues or Broadcast Events
---
## Category
Architecture
---
## Rule
Do not pass `JsonResource` objects to queue jobs, broadcast events, or any non-HTTP serialization channel.
---
## Reason
`JsonResource` carries HTTP context (`$request` references, response metadata) and serializes the full underlying Eloquent model, defeating the purpose of lightweight payloads.
---
## Bad Example
```php
class SendReport implements ShouldQueue
{
    public function __construct(
        public UserResource $resource, // Carries HTTP baggage
    ) {}
}
```
---
## Good Example
```php
class SendReport implements ShouldQueue
{
    public function __construct(
        public UserDTO $user, // Lightweight, channel-agnostic
    ) {}
}
```
---
## Exceptions
No common exceptions. Use DTOs or plain model IDs for queue and broadcast serialization.
---
## Consequences Of Violation
Oversized queue payloads; serialization errors from resource-baggage; coupling HTTP and queue layers; difficult debugging.

---

## Rule 6: Always Verify Resource Output Structure in Feature Tests
---
## Category
Testing
---
## Rule
Write feature tests that assert the JSON structure of every resource endpoint using `assertJsonStructure()` or `assertJsonPath()`.
---
## Reason
Resource output silently changes when model attributes, appends, or conditional logic are modified. Tests catch regressions before they reach consumers.
---
## Bad Example
```php
// Controller test only checks HTTP status
$response->assertOk();
```
---
## Good Example
```php
public function test_user_resource_structure(): void
{
    $user = User::factory()->hasPosts(3)->create();

    $response = $this->getJson("/api/users/{$user->id}");

    $response->assertJsonStructure([
        'data' => [
            'id',
            'name',
            'email',
            'posts' => [
                '*' => ['id', 'title'],
            ],
        ],
    ]);
}
```
---
## Exceptions
No common exceptions. Every exposed endpoint requires structural tests.
---
## Consequences Of Violation
Breaking API changes deployed without detection; consumer integration failures; time wasted debugging schema mismatches.

---

## Rule 7: Keep Resources at the HTTP Boundary Only
---
## Category
Architecture
---
## Rule
Never pass resource instances to service layers, repositories, or domain logic. Resources belong exclusively in controllers and HTTP-specific code.
---
## Reason
Resources are presentation-layer objects coupled to HTTP (`$request`, `Responsable`, response metadata). Passing them to non-HTTP code creates hidden dependencies on the request lifecycle.
---
## Bad Example
```php
class UserService
{
    public function getProfile(int $id): UserResource // Resource in service layer
    {
        $user = User::findOrFail($id);
        return new UserResource($user);
    }
}
```
---
## Good Example
```php
class UserService
{
    public function getProfile(int $id): User // Returns model or DTO
    {
        return User::with('posts')->findOrFail($id);
    }
}

// Controller wraps in resource
class UserController
{
    public function show(int $id, UserService $service): UserResource
    {
        return new UserResource($service->getProfile($id));
    }
}
```
---
## Exceptions
No common exceptions. Resources are an HTTP concern.
---
## Consequences Of Violation
Coupling between HTTP layer and business logic; inability to reuse services in non-HTTP contexts; resource testing requiring HTTP mocking.

---

## Rule 8: Use `with()` for Top-Level Metadata, Not for Data
---
## Category
Code Organization
---
## Rule
Use the `with($request)` method to return top-level metadata (version, timestamps, status), not to duplicate or augment the primary resource data.
---
## Reason
`with()` merges at the response root level alongside `data`. Using it for data creates confusion about where consumers should find core fields.
---
## Bad Example
```php
public function with(Request $request): array
{
    return [
        'summary' => ['total' => 42], // Data-like content in metadata
    ];
}
```
---
## Good Example
```php
public function with(Request $request): array
{
    return [
        'meta' => [
            'version' => '1.0',
            'timestamp' => now()->toIso8601String(),
        ],
    ];
}
```
---
## Exceptions
Endpoints where the API specification explicitly places certain fields at the root level alongside the data key.
---
## Consequences Of Violation
Inconsistent API response structure; consumer confusion about field locations; metadata mixed with data making parsing harder.

---

## Rule 9: Always Eager-Load Relationships Used in Nested Resources
---
## Category
Performance
---
## Rule
At every query site that returns models consumed by a resource, eager-load all relationships referenced by the resource's nested resource calls.
---
## Reason
Without eager loading, each model's nested resource triggers a lazy-load query during serialization, producing N+1 queries per relationship per model in the collection.
---
## Bad Example
```php
// Controller
$users = User::all(); // No eager loading
return UserResource::collection($users);

// UserResource::toArray() references $this->whenLoaded('posts')
// This returns empty for all users — posts never loaded
```
---
## Good Example
```php
// Controller
$users = User::with('posts', 'profile')->get();
return UserResource::collection($users);

// UserResource::toArray() uses whenLoaded('posts') — posts appear correctly
```
---
## Exceptions
Relationships used with `whenLoaded()` that are intentionally optional and only loaded on specific endpoints.
---
## Consequences Of Violation
N+1 query explosion; high database load on listing endpoints; API response times degrading proportionally to page size.

---

## Rule 10: Use Private Methods to Extract Complex Transformation Logic
---
## Category
Maintainability
---
## Rule
Extract any `toArray()` logic beyond simple field mapping into named private methods that describe the transformation.
---
## Reason
A `toArray()` method with inline loops, conditionals, and computed values becomes unreadable and untestable. Named methods document intent and enable focused testing.
---
## Bad Example
```php
public function toArray(Request $request): array
{
    $fields = ['id', 'name', 'email'];
    if ($request->user()?->isAdmin()) {
        $fields[] = 'ssn';
    }
    $result = [];
    foreach ($fields as $field) {
        $result[$field] = $this->{$field} ?? $this->resource->{$field};
    }
    return $result;
}
```
---
## Good Example
```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        $this->mergeWhen($request->user()?->isAdmin(), $this->adminFields()),
    ];
}

private function adminFields(): array
{
    return ['ssn' => $this->ssn];
}
```
---
## Exceptions
Simple resources with 3–5 direct field mappings and no conditional logic.
---
## Consequences Of Violation
Unreadable resource files; difficulty reviewing changes; inability to unit-test transformation logic without HTTP request mocking.

---

## Rule 11: Never Return Raw Eloquent Models from Controller Methods
---
## Category
Architecture
---
## Rule
Always wrap Eloquent models in a `JsonResource` when returning from HTTP controller actions, even for simple endpoints.
---
## Reason
Returning raw models exposes the full model serialization pipeline, including all attributes, relations, and appends. Resources provide explicit control over the output contract.
---
## Bad Example
```php
class UserController
{
    public function show(int $id): array
    {
        return User::findOrFail($id)->toArray();
    }
}
```
---
## Good Example
```php
class UserController
{
    public function show(int $id): UserResource
    {
        return new UserResource(User::with('posts')->findOrFail($id));
    }
}
```
---
## Exceptions
Internal/admin-only endpoints where full model data access is intentional and documented.
---
## Consequences Of Violation
Accidental exposure of model attributes; coupling internal model structure to API contract; missing pagination, wrapping, and conditional support.

---

## Rule 12: Test That Resources Contain No SQL Queries
---
## Category
Testing
---
## Rule
Write tests that assert no unexpected database queries are executed during resource serialization by capturing the query log before and after serialization.
---
## Reason
Resources that lazily load relationships, trigger accessor queries, or execute logic that hits the database silently degrade performance. Query-count assertions catch these regressions.
---
## Bad Example
```php
// No query count assertion — resource may trigger N+1 silently
$response = $this->getJson('/api/users');
```
---
## Good Example
```php
public function test_user_resource_does_not_query_database(): void
{
    DB::enableQueryLog();
    $users = User::with('posts')->get();

    $response = UserResource::collection($users)->toArray(request());

    $queries = count(DB::getQueryLog());
    $this->assertLessThanOrEqual(2, $queries); // Initial load + no extra
}
```
---
## Exceptions
Resources that intentionally access additional data through documented and expected database calls.
---
## Consequences Of Violation
Silent performance degradation; N+1 queries deployed without detection; increased database load from serialization paths assumed to be in-memory.
