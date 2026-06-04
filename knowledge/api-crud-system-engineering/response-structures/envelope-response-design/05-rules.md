# envelope-response-design Rules

## Rule 1: Always Wrap Errors Under the `errors` Key
---
## Category
Design
---
## Rule
Always return all error responses with a top-level `errors` key, never inside `data` or as a bare string.
---
## Reason
Clients must write a single error handler. When errors appear under a different key than success data, clients must conditionally parse the response, increasing complexity and error surface.
---
## Bad Example
```php
// Endpoint A — validation errors returned inside data
return response()->json(['data' => ['errors' => ['email' => 'required']]], 422);

// Endpoint B — error as bare string
return response()->json('Not found', 404);
```
---
## Good Example
```php
// Every error follows the same envelope shape
return response()->json([
    'errors' => [['title' => 'Validation Error', 'detail' => 'Email is required', 'status' => 422]],
], 422);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Client code must branch on endpoint to determine error shape. Error monitoring systems cannot aggregate error types. API gateway cannot route errors generically.

## Rule 2: Never Return Raw Arrays from Controllers
---
## Category
Framework Usage
---
## Rule
Always return `Resource` or `ResourceCollection` instances from controller methods, never raw arrays or Eloquent collections.
---
## Reason
Raw arrays bypass resource serialization entirely — they are returned as-is by Laravel, skipping the `data` wrapper, `with()`, and `additional()` methods. This creates endpoints that return unwrapped JSON from an otherwise enveloped API.
---
## Bad Example
```php
public function index()
{
    return User::all()->toArray(); // raw array — no envelope
}
```
---
## Good Example
```php
public function index()
{
    return UserResource::collection(User::all());
    // Enforced envelope with data wrapping
}
```
---
## Exceptions
Bare-body API design where all endpoints consistently return unwrapped responses.
---
## Consequences Of Violation
Inconsistent response structure: some endpoints have `data`, others return raw arrays. Clients must know which endpoints are wrapped and which are not.

## Rule 3: Keep the Envelope Shape Stable Across Versions
---
## Category
Architecture
---
## Rule
Never add, rename, or remove top-level envelope keys (`data`, `meta`, `links`, `errors`) within the same API version.
---
## Reason
The envelope is the outermost contract between server and client. Changing envelope keys within a version is always a breaking change. New keys in `meta` or `links` are additive and backward-compatible; new top-level keys are not.
---
## Bad Example
```php
// Version 1.0
return ['data' => $resource, 'meta' => [...], 'links' => [...]];

// Version 1.1 — added 'included' key, changed 'links' to 'navigation'
return ['data' => $resource, 'meta' => [...], 'navigation' => [...]]; // breaking
```
---
## Good Example
```php
// Additive changes only within a version
return ['data' => $resource, 'meta' => ['request_id' => ..., 'feature_flags' => [...]], 'links' => [...]];
```
---
## Exceptions
Version upgrade (v1 → v2) where the envelope deliberately changes shape.
---
## Consequences Of Violation
Existing clients crash because their parsing code expects keys that no longer exist. All clients must be updated simultaneously.

## Rule 4: Apply Envelope at a Centralized Layer
---
## Category
Code Organization
---
## Rule
Always apply envelope formatting at a single architectural layer — middleware, base response class, or formatter service — never per-controller.
---
## Reason
Per-controller envelope building guarantees inconsistency. One controller adds `request_id` to meta, another doesn't. A centralized layer ensures every response follows the exact same envelope contract.
---
## Bad Example
```php
class UserController
{
    public function index()
    {
        return UserResource::collection($users)->additional([
            'request_id' => Str::uuid(),
        ]);
    }
}

class PostController
{
    public function index()
    {
        return PostResource::collection($posts); // no request_id — inconsistent
    }
}
```
---
## Good Example
```php
// Middleware adds envelope-wide metadata
class EnvelopeMiddleware
{
    public function handle($request, $next)
    {
        $response = $next($request);
        $data = $response->getData(true);
        $data['meta']['request_id'] = (string) request()->header('X-Request-ID', Str::uuid());
        $response->setData($data);
        return $response;
    }
}
```
---
## Exceptions
Bare-body APIs where envelope is not used at all.
---
## Consequences Of Violation
New endpoints unintentionally omit envelope metadata. Auditing every controller for consistency becomes impractical as the API grows.

## Rule 5: Never Include Sensitive Data in `meta`
---
## Category
Security
---
## Rule
Never include session tokens, internal IDs, stack traces, database query details, or debug output in the `meta` object of any response.
---
## Reason
`meta` is serialized to every client. Any field added to `meta` is immediately visible to every API consumer. Debug information in `meta` leaks implementation details that aid attackers.
---
## Bad Example
```php
public function with($request)
{
    return [
        'request_id' => Str::uuid(),
        'debug_sql' => $this->getQueryLog(), // exposes query internals
        'session_token' => session()->getId(), // token leakage
    ];
}
```
---
## Good Example
```php
public function with($request)
{
    return [
        'request_id' => (string) Str::uuid(),
        'generated_at' => now()->toIso8601String(),
    ];
}
```
---
## Exceptions
Non-production environments where debug information is intentionally exposed for development purposes.
---
## Consequences Of Violation
Sensitive internal state exposed to all clients. Attackers gain insight into database structure, query patterns, and session management.

## Rule 6: Enforce 204 No Content Without an Envelope Body
---
## Category
Design
---
## Rule
Always return an empty body with 204 No Content for destructive actions (DELETE, logout), never `{data: null}` or `{data: []}`.
---
## Reason
204 No Content explicitly means "the server successfully processed the request, but there is no content to send." Returning an envelope body contradicts HTTP semantics and forces clients to parse a body when the spec says there is none.
---
## Bad Example
```php
public function destroy($id)
{
    $user = User::findOrFail($id);
    $user->delete();
    return response()->json(['data' => null]); // wrong — envelope body on 204
}
```
---
## Good Example
```php
public function destroy($id)
{
    $user = User::findOrFail($id);
    $user->delete();
    return response()->noContent(); // correct — empty body, 204 status
}
```
---
## Exceptions
When the API contract explicitly requires a body on 204 responses (legacy or migration scenarios).
---
## Consequences Of Violation
Client JSON parsing fails on empty expected body. Bandwidth wasted on unnecessary payload. HTTP semantics violated, causing issues with proxies and CDNs.

## Rule 7: Use `additional()` for Resource-Specific Data Only
---
## Category
Framework Usage
---
## Rule
Always use `additional()` only for resource-specific envelope data, never for response-wide metadata or overriding the `data` key.
---
## Reason
`additional()` merges at the top level of the entire response. Passing `['data' => ...]` overwrites the primary resource payload. Response-wide metadata belongs in middleware, not in per-resource calls.
---
## Bad Example
```php
return new UserResource($user)->additional([
    'data' => ['something' => 'else'], // overwrites the user resource
]);
```
---
## Good Example
```php
return new UserResource($user)->additional([
    'meta' => ['feature_flags' => ['dark_mode' => true]], // resource-specific meta
]);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Resource payload replaced with `additional()` data. Primary resource data is completely lost from the response. Clients receive empty or wrong data.
