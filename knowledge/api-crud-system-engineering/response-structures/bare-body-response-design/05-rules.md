# bare-body-response-design Rules

## Rule 1: Prefer Bare-Body Only for Known Consumers
---
## Category
Architecture
---
## Rule
Prefer bare-body responses only for internal microservices, BFF endpoints, or APIs where every consumer is known and controlled by the same team.
---
## Reason
Bare-body removes the envelope extensibility layer. Unknown third-party clients cannot tolerate schema changes without breaking, since there is no wrapper key to evolve.
---
## Bad Example
```php
// Public API exposing bare-body to unknown clients
class PublicUserController
{
    public function index()
    {
        UserResource::withoutWrapping();
        return new UserResource($user);
    }
}
```
---
## Good Example
```php
// Internal microservice — consumer is the same team
class InternalUserController
{
    public function index()
    {
        UserResource::withoutWrapping();
        return new UserResource($user);
    }
}
```
---
## Exceptions
Gateway architectures where an outer layer adds the envelope before reaching external consumers.
---
## Consequences Of Violation
Every schema change (field rename, deletion, type change) breaks all clients. Cannot add metadata later without a version bump.

## Rule 2: Always Include Pagination Headers on Bare-Body Collections
---
## Category
Reliability
---
## Rule
Always include `Link` (RFC 5988) and `X-Total-Count` headers on every paginated bare-body collection response.
---
## Reason
Without envelope metadata, pagination information moves entirely to HTTP headers. Omitting these headers leaves clients unable to navigate pages or build UI controls.
---
## Bad Example
```php
return UserResource::collection(User::paginate());
// No Link header, no X-Total-Count — clients cannot paginate
```
---
## Good Example
```php
$users = User::paginate();
$response = UserResource::collection($users);
$response->withHeaders([
    'Link' => '< /users?page=2 >; rel="next", < /users?page=1 >; rel="first"',
    'X-Total-Count' => $users->total(),
]);
return $response;
```
---
## Exceptions
Non-paginated collection endpoints.
---
## Consequences Of Violation
Clients receive data but cannot implement "load more," page navigation, or progress indicators. Mobile UIs display empty screens at the end of data.

## Rule 3: Return Objects for Singles, Arrays for Collections
---
## Design
---
## Rule
Always return a JSON object for single resources and a JSON array for collections in bare-body responses.
---
## Reason
Bare-body removes the `data` wrapper, so the distinction between single and collection is the only structural signal. Returning an array for a singleton forces clients to destructure unnecessarily.
---
## Bad Example
```php
// Returns [ {...} ] for a single user
UserResource::withoutWrapping();
return response()->json([new UserResource($user)]);
```
---
## Good Example
```php
// Returns { ... } for a single user
UserResource::withoutWrapping();
return new UserResource($user);
```
---
## Exceptions
Endpoints that return zero or one record from a filtered collection — maintain the array shape for consistency.
---
## Consequences Of Violation
Client code must handle both array and object shapes for what is semantically a single resource, increasing parsing complexity and bug surface.

## Rule 4: Enforce a Consistent Error Schema Across All Endpoints
---
## Category
Reliability
---
## Rule
Always define and return a single, documented error structure from every bare-body endpoint regardless of the error type.
---
## Reason
Bare-body has no built-in error envelope. Without a standardized error shape, clients must write conditional error parsing per endpoint, which is brittle and error-prone.
---
## Bad Example
```php
// Endpoint A
return response()->json(['error' => 'Not found'], 404);

// Endpoint B
return response()->json(['message' => 'Validation failed', 'details' => [...]], 422);
```
---
## Good Example
```php
// Every endpoint uses the same structure
return response()->json([
    'message' => 'Validation failed.',
    'errors' => ['email' => ['The email field is required.']]
], 422);

// Another endpoint — same shape
return response()->json([
    'message' => 'Resource not found.',
    'errors' => []
], 404);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients cannot write reusable error handling code. Error monitoring tools cannot aggregate errors by type. Integration tests require per-endpoint assertions.

## Rule 5: Define OpenAPI Schema for Every Bare-Body Resource
---
## Category
Maintainability
---
## Rule
Always maintain a complete OpenAPI schema for every bare-body resource response, documenting every field name, type, format, and optionality.
---
## Reason
Bare-body couples clients directly to the schema. Without a machine-readable contract, clients have no reliable reference, and schema drift between documentation and implementation goes undetected.
---
## Bad Example
```php
// No OpenAPI schema — clients reverse-engineer from response samples
UserResource::withoutWrapping();
return new UserResource($user);
// Schema never documented externally
```
---
## Good Example
```php
// OpenAPI schema documented alongside the resource
/**
 * @OA\Schema(
 *     schema="User",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="email", type="string")
 * )
 */
UserResource::withoutWrapping();
return new UserResource($user);
```
---
## Exceptions
Prototype or exploration-phase endpoints not yet consumed by any client.
---
## Consequences Of Violation
Schema drift between implementation and documentation. Client developers reverse-engineer from sample responses and break on unannounced changes. Contract testing cannot catch regressions.

## Rule 6: Never Mix Bare-Body and Envelope Endpoints
---
## Category
Code Organization
---
## Rule
Never use bare-body on some endpoints and envelope on others within the same API surface.
---
## Reason
Mixed wrapping forces every client to know which endpoints return which shape, creating conditional parsing logic and increasing integration test complexity.
---
## Bad Example
```php
// Endpoint A — bare-body
UserResource::withoutWrapping();
return new UserResource($user);

// Endpoint B — envelope
return new PostResource($post); // wrapped in "data"
```
---
## Good Example
```php
// All endpoints — bare-body
UserResource::withoutWrapping();
PostResource::withoutWrapping();
return new UserResource($user);
return new PostResource($post);
```
---
## Exceptions
API gateway architectures where internal services are bare-body and the gateway adds the envelope externally.
---
## Consequences Of Violation
Client code becomes littered with conditional parsing. Each new endpoint requires client-side changes. API surface becomes unpredictable.

## Rule 7: Protect Top-Level Arrays Against JSON Hijacking
---
## Category
Security
---
## Rule
Always serve top-level JSON arrays at the bare root with `X-Content-Type-Options: nosniff` and appropriate CORS headers to prevent JSON hijacking on legacy browsers.
---
## Reason
Top-level JSON arrays are valid JavaScript and can be captured by a `<script>` tag in older browsers (JSON hijacking). Proper headers prevent this attack without changing the response shape.
---
## Bad Example
```php
UserResource::withoutWrappingCollection();
return UserResource::collection($users);
// No X-Content-Type-Options header set
```
---
## Good Example
```php
UserResource::withoutWrappingCollection();
return UserResource::collection($users)
    ->header('X-Content-Type-Options', 'nosniff');
```
---
## Exceptions
Internal-only APIs on isolated networks where no browser client exists.
---
## Consequences Of Violation
Sensitive user data exposed via cross-origin script inclusion on outdated browsers. Application fails security audits.

## Rule 8: Apply `withoutWrapping()` at the Resource Class Level
---
## Category
Framework Usage
---
## Rule
Always call `withoutWrapping()` statically on the resource class definition, never conditionally per-instance or inside `toArray()`.
---
## Reason
`withoutWrapping()` is a static configuration that affects how `ResourceResponse` builds the wire format. Calling it conditionally or late leads to inconsistent wrapping behavior across instances of the same resource.
---
## Bad Example
```php
public function toArray($request)
{
    if ($request->is('api/v2/*')) {
        UserResource::withoutWrapping(); // conditional — too late
    }
    return ['id' => $this->id];
}
```
---
## Good Example
```php
// At class level — deterministic
class UserResource extends JsonResource
{
    public static $wrap = null; // or call in service provider
}

// Or declaratively before use
UserResource::withoutWrapping();
return new UserResource($user);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Some response instances wrap, others don't, depending on request-time conditions. Clients encounter unpredictable response shapes from the same endpoint.
