# Top-Level Meta Data — Engineering Rules

---

## Rule: Standardize Metadata Structure via a Base Resource Class

---

## Category

Code Organization

---

## Rule

Define a base resource class with a standardized `with()` implementation that all resources extend. Every resource must produce a consistent top-level metadata structure.

---

## Reason

When each resource defines its own `with()` independently, top-level metadata keys differ across endpoints. Clients must parse different structures for every resource. A base class centralizes the metadata contract, ensuring version information, request IDs, and other shared metadata appear consistently.

---

## Bad Example

```php
class UserResource extends JsonResource
{
    public function with($request): array
    {
        return ['api_version' => '1.0', 'request_id' => request()->id()];
    }
}

class PostResource extends JsonResource
{
    public function with($request): array
    {
        return ['version' => '1.0', 'rid' => request()->id()];
    }
    // Different key names — clients need per-resource parsing
}
```

---

## Good Example

```php
abstract class ApiResource extends JsonResource
{
    public function with($request): array
    {
        return [
            'api_version' => config('api.version'),
            'request_id' => $request->header('X-Request-ID'),
        ];
    }
}

class UserResource extends ApiResource { }
class PostResource extends ApiResource { }
// Consistent metadata across all endpoints
```

---

## Exceptions

APIs with fewer than 5 resources where the duplication is minimal and acceptable.

---

## Consequences Of Violation

Inconsistent metadata keys across endpoints; client parsing complexity; maintenance overhead when shared metadata changes.

---

## Rule: Use Middleware for Global Metadata; Use with() for Endpoint-Specific

---

## Category

Architecture

---

## Rule

Use HTTP middleware for response-wide concerns (CORS headers, global content-type). Use `with()` only for resource-specific metadata that varies by endpoint.

---

## Reason

Middleware handles cross-cutting concerns consistently without requiring every resource to implement them. `with()` should carry context specific to the resource or endpoint (applied filters, cache timestamps). Duplicating middleware-level concerns in every resource's `with()` violates DRY and creates maintenance overhead.

---

## Bad Example

```php
// CORS header added in every resource's withResponse() instead of middleware
class UserResource extends JsonResource
{
    public function withResponse($request, $response): void
    {
        $response->header('Access-Control-Allow-Origin', '*'); // Should be middleware
    }
}
```

---

## Good Example

```php
// Middleware handles global concerns
class CorsMiddleware
{
    public function handle($request, Closure $next): Response
    {
        return $next($request)->header('Access-Control-Allow-Origin', '*');
    }
}

// with() handles endpoint-specific metadata
public function with($request): array
{
    return [
        'cached_at' => now()->toIso8601String(),
        'applied_filters' => $request->only(['status', 'role']),
    ];
}
```

---

## Exceptions

No common exceptions. Global response concerns always belong in middleware.

---

## Consequences Of Violation

Code duplication of global concerns across resources; maintenance overhead when global headers change; inconsistent header application if some resources miss the `withResponse()` call.

---

## Rule: Avoid Key Conflicts with Pagination Metadata

---

## Category

Design

---

## Rule

Use unique key names in `with()` that will not collide with pagination's built-in `data`, `links`, and `meta` keys.

---

## Reason

When a resource defines `with()` and the response is paginated, the `with()` array is merged with the pagination structure using array union (`+`). If a `with()` key matches `data`, `links`, or `meta`, the pagination value takes precedence and the metadata key silently disappears.

---

## Bad Example

```php
public function with($request): array
{
    return [
        'meta' => ['cached_at' => now()], // Collides with pagination's 'meta' key
        'data' => ['extra' => 'value'],    // Collides with pagination's 'data' key
    ];
}
// Both keys are silently overwritten by pagination structure
```

---

## Good Example

```php
public function with($request): array
{
    return [
        'cache_info' => ['cached_at' => now()], // Unique key
        'request_meta' => ['applied_filters' => $request->only(['status'])], // Unique key
    ];
}
```

---

## Exceptions

Non-paginated responses where no pagination structure exists to conflict with.

---

## Consequences Of Violation

Silent disappearance of metadata keys from responses; debugging overhead tracing missing metadata; client confusion when documented keys are absent.

---

## Rule: Keep with() Computation Light

---

## Category

Performance

---

## Rule

Do not perform expensive database queries, external API calls, or heavy computations inside `with()`. Pre-compute values in the controller and pass them to the resource, or cache the results.

---

## Reason

`with()` is called on every resource response. Expensive operations inside `with()` execute on every request, even when the consumer does not use the metadata. A database query in `with()` multiplies the endpoint's query count and adds latency to every response.

---

## Bad Example

```php
public function with($request): array
{
    return [
        'total_revenue' => Order::sum('amount'),      // Expensive query every request
        'user_count' => User::count(),                 // Expensive query every request
        'recent_orders' => Order::latest()->take(5)->get(), // Multiple queries
    ];
}
```

---

## Good Example

```php
// Controller pre-computes metadata
class DashboardController
{
    public function index(Request $request): DashboardResource
    {
        $metadata = Cache::remember('dashboard-meta', 3600, function () {
            return [
                'total_revenue' => Order::sum('amount'),
                'user_count' => User::count(),
            ];
        });

        return (new DashboardResource($this->data))->additional($metadata);
    }
}
```

---

## Exceptions

Trivial operations (string formatting, reading config values, reading request headers) that involve no external I/O.

---

## Consequences Of Violation

Performance risks from redundant queries on every request; scalability risks as metadata computation cost increases; database load spikes from repeated expensive aggregations.

---

## Rule: Never Include Sensitive Data in with() Output

---

## Category

Security

---

## Rule

The `with()` output is visible to every API consumer. Never include internal state, server paths, configuration values, query logs, or debug information in metadata.

---

## Reason

Unlike `toArray()` which can use conditional `when()` to restrict field visibility, `with()` metadata is unconditional and visible to all consumers. Every key in `with()` is assumed to be public. Including internal information creates a data leakage vector.

---

## Bad Example

```php
public function with($request): array
{
    return [
        'debug' => [
            'memory_usage' => memory_get_usage(),  // Internal server info
            'query_log' => DB::getQueryLog(),      // SQL exposure
            'server_path' => base_path(),           // Server file structure
            'config' => config('app.key'),          // Application secret
        ],
    ];
}
```

---

## Good Example

```php
public function with($request): array
{
    return [
        'api_version' => config('api.version'),
        'request_id' => $request->header('X-Request-ID'),
        'cached_at' => now()->toIso8601String(),
    ];
}
```

---

## Exceptions

No common exceptions. Sensitive data in metadata is never acceptable.

---

## Consequences Of Violation

Security risks from internal information leakage; data breach liability from exposed configuration or secrets; regulatory compliance violations.

---

## Rule: Use withResponse() for HTTP Headers, with() for JSON Body

---

## Category

Framework Usage

---

## Rule

Use `with()` to add data to the JSON response body. Use `withResponse()` to modify HTTP headers and status codes. Never mix their purposes.

---

## Reason

`with()` returns an array that becomes part of the JSON body. `withResponse()` modifies the `JsonResponse` instance (headers, status). Confusing the two causes metadata intended for the body to appear as headers and vice versa, creating hard-to-debug response format issues.

---

## Bad Example

```php
// Header data in JSON body
public function with($request): array
{
    return [
        'deprecation_date' => '2027-01-01', // Should be an HTTP header
    ];
}

// JSON body data as header
public function withResponse($request, $response): void
{
    $response->header('api_version', '1.0'); // Should be in JSON body
}
```

---

## Good Example

```php
// JSON body metadata
public function with($request): array
{
    return [
        'api_version' => '1.0',
        'request_id' => $request->header('X-Request-ID'),
    ];
}

// HTTP header modifications
public function withResponse($request, $response): void
{
    $response->header('Deprecation', 'Sun, 01 Jan 2027 00:00:00 GMT');
    $response->header('Sunset', 'Sun, 01 Jan 2028 00:00:00 GMT');
}
```

---

## Exceptions

No common exceptions. `with()` and `withResponse()` have distinct purposes and must not be conflated.

---

## Consequences Of Violation

Response format confusion (body data in headers, header data in body); client parsing errors; debugging overhead from misplaced metadata.

---

## Rule: Only Expect with() on the Outer Resource

---

## Category

Design

---

## Rule

Only define `with()` on top-level (outer) resources. Do not expect `with()` on nested sub-resources to appear in the final response.

---

## Reason

During serialization, `with()` is only called on the outermost resource. Sub-resources nested inside a parent resource have their `with()` output discarded. Defining `with()` on sub-resources creates the illusion of metadata that never materializes in the response.

---

## Bad Example

```php
class PostResource extends JsonResource
{
    public function with($request): array
    {
        return ['post_meta' => 'value']; // Discarded when nested
    }
}

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
// 'post_meta' never appears in the response
```

---

## Good Example

```php
class PostResource extends JsonResource
{
    // No with() — this resource is always nested
    public function toArray($request): array
    {
        return ['title' => $this->title];
    }
}

class UserResource extends JsonResource
{
    // Only top-level resource defines with()
    public function with($request): array
    {
        return ['api_version' => '1.0'];
    }
}
```

---

## Exceptions

When a sub-resource is used both as nested and as a top-level response. In that case, the `with()` applies only when it is the outer resource.

---

## Consequences Of Violation

Developer confusion about missing metadata; wasted code in sub-resources that never takes effect; debugging overhead tracing why metadata does not appear.

---

## Rule: Test That Metadata Keys Appear in the Response

---

## Category

Testing

---

## Rule

Write tests that explicitly assert the presence and value of metadata keys returned by `with()`. Do not assume array union preserves them.

---

## Reason

Array union (`+`) in the serialization pipeline can silently drop `with()` keys that match existing keys. Without explicit assertions, metadata can disappear from the response without any error or warning. Tests must verify that each expected metadata key is present with the correct value.

---

## Bad Example

```php
public function test_user_resource(): void
{
    $user = User::factory()->make();
    $response = (new UserResource($user))->response()->getData(true);

    $this->assertArrayHasKey('data', $response);
    // Never verifies that metadata keys like 'api_version' are present
}
```

---

## Good Example

```php
public function test_user_resource_includes_metadata(): void
{
    $user = User::factory()->make();
    $response = (new UserResource($user))->response()->getData(true);

    $this->assertArrayHasKey('api_version', $response);
    $this->assertSame('1.0', $response['api_version']);
    $this->assertArrayHasKey('request_id', $response);
}

public function test_header_set_via_withResponse(): void
{
    $user = User::factory()->make();
    $response = (new UserResource($user))->response();

    $this->assertTrue($response->headers->has('Deprecation'));
    $this->assertStringContainsString('GMT', $response->headers->get('Deprecation'));
}
```

---

## Exceptions

No common exceptions. Metadata presence must always be explicitly tested.

---

## Consequences Of Violation

Silent disappearance of metadata from responses; client-facing contract violations caught only in production; regression bugs when metadata keys are accidentally dropped.

---

## Rule: Use Unique Key Names to Avoid Array Union Surprises

---

## Category

Reliability

---

## Rule

Use unique, resource-specific key names in `with()` output. Never use generic names like `meta`, `data`, or `links` that may collide with pagination or wrapping keys.

---

## Reason

The serialization pipeline merges `with()` output with pagination structure using array union (`+`), where the first array's keys take precedence. If `with()` uses the same key name as pagination (`meta`), the pagination version wins because it is added first. The `with()` version is silently dropped with no warning.

---

## Bad Example

```php
public function with($request): array
{
    return [
        'meta' => [  // Collides with pagination 'meta'
            'cached_at' => now()->toIso8601String(),
        ],
        'links' => [ // Collides with pagination 'links'
            'api_docs' => 'https://docs.example.com',
        ],
    ];
}
// Pagination's meta and links overwrite these
```

---

## Good Example

```php
public function with($request): array
{
    return [
        'cache_info' => [
            'cached_at' => now()->toIso8601String(),
        ],
        'api_docs_url' => 'https://docs.example.com',
    ];
}
// No collision — all keys appear in response
```

---

## Exceptions

Non-paginated responses where no collision with pagination keys is possible.

---

## Consequences Of Violation

Silent metadata loss when collisions occur; debugging overhead from missing keys; client confusion when documented metadata does not appear.
