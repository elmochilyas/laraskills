# response-format-decision-framework Rules

## Rule 1: Lock Response Format to API Version
---
## Category
Architecture
---
## Rule
Always lock the response format to a specific API version — never change format within a version and never detect format dynamically at runtime.
---
## Reason
Dynamic format selection per-request (based on User-Agent, feature flags, or client sniffing) creates untestable, non-deterministic response shapes. Clients must know the format upfront from the version contract.
---
## Bad Example
```php
if (str_contains($request->userAgent(), 'Mobile')) {
    return $bareBodyResponse; // untestable, unpredictable
}
return $envelopeResponse;
```
---
## Good Example
```php
// V1 contract: envelope format
// V2 contract: JSON:API format
// Route-based — deterministic per version

// routes/api/v1.php — always envelope
Route::get('/users', [UserControllerV1::class, 'index']);

// routes/api/v2.php — always JSON:API
Route::get('/users', [UserControllerV2::class, 'index']);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Same endpoint returns different response shapes for different clients. Cannot reproduce client bugs. Integration tests must mock every possible client type.

## Rule 2: Use RFC 9457 for ALL Error Responses Regardless of Success Format
---
## Category
Design
---
## Rule
Always format every 4xx and 5xx response as RFC 9457 Problem Details, even when the success response format is JSON:API, envelope, or bare-body.
---
## Reason
Error parsing should be a single code path in clients. Using different error formats for different endpoints forces clients to maintain multiple error handlers. RFC 9457 is the standard that HTTP libraries and API gateways parse generically.
---
## Bad Example
```php
// Success: JSON:API format
// Errors: custom {error: "message"} — inconsistent
throw new HttpException(400, 'Validation failed');
// Returns {error: "Validation failed"} — not RFC 9457
```
---
## Good Example
```php
// Success: JSON:API format
// Errors: RFC 9457 — consistent
return response()->json([
    'type' => '/errors/validation-error',
    'title' => 'Validation Error',
    'status' => 422,
    'detail' => 'The email field is required.',
], 422)->header('Content-Type', 'application/problem+json');
```
---
## Exceptions
Legacy systems with existing client error-parsing code that expects a different format.
---
## Consequences Of Violation
API gateways cannot parse errors generically. Client error handlers must branch per endpoint. Monitoring tools cannot aggregate errors by type.

## Rule 3: Start with Envelope, Optimize to Bare-Body Only When Measured
---
## Category
Architecture
---
## Rule
Always start API development with envelope format and migrate to bare-body only when performance metrics prove envelope overhead causes measurable problems.
---
## Reason
Envelope is extensible — adding wrapper keys later is a breaking change. Bare-body is simpler but locks out future metadata needs. Starting envelope and stripping it later is safe; starting bare-body and adding the envelope later is breaking.
---
## Bad Example
```php
// Started with bare-body for "simplicity"
UserResource::withoutWrapping();
return new UserResource($user);
// Later: need pagination metadata — must add wrapper, breaking all clients
```
---
## Good Example
```php
// Started with envelope — safe path
class BaseResource extends JsonResource
{
    public static $wrap = 'data';
}
// Later: can optimize specific endpoints to bare-body behind gateway or new version
```
---
## Exceptions
Internal microservices where all consumers are known and controlled — bare-body is safe from day one.
---
## Consequences Of Violation
Adding envelope metadata later requires a version bump, new clients, and concurrent support for old bare-body clients. Technical debt compounds.

## Rule 4: Never Determine Format via User-Agent or Client Sniffing
---
## Category
Architecture
---
## Rule
Always determine response format through explicit `Accept` header content negotiation, never through User-Agent parsing or other client fingerprinting.
---
## Reason
User-Agent strings are unreliable, spoofable, and create an implicit format contract that is invisible in the API documentation. Explicit `Accept` headers are the HTTP-standard way to negotiate content type and format.
---
## Bad Example
```php
if (preg_match('/Android|iOS/', $request->userAgent())) {
    $format = 'bare-body'; // unreliable, untestable
}
```
---
## Good Example
```php
$accept = $request->header('Accept', 'application/json');
$format = match (true) {
    str_contains($accept, 'vnd.api+json') => 'json-api',
    default => 'envelope',
};
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Spoofed User-Agent receives wrong format. New browser versions break format detection. Integration tests must mock dozens of User-Agent strings.

## Rule 5: Return 406 Not Acceptable for Unsupported Formats
---
## Category
Reliability
---
## Rule
Always return 406 Not Acceptable when a client requests a format via `Accept` header that the API does not support — never silently fall back to a default format.
---
## Reason
Silent fallback hides negotiation failures from clients. The client believes it received the requested format and may parse incorrectly, producing silent data corruption.
---
## Bad Example
```php
if ($request->header('Accept') === 'application/vnd.api+json') {
    // not supported — but returns envelope anyway
    return $envelopeResponse; // client expects JSON:API — parsing fails silently
}
```
---
## Good Example
```php
if ($request->header('Accept') === 'application/vnd.api+json') {
    return response()->json([
        'type' => '/errors/unsupported-format',
        'title' => 'Unsupported Media Type',
        'status' => 406,
        'detail' => 'This API version does not support application/vnd.api+json.',
    ], 406)->header('Content-Type', 'application/problem+json');
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Client silently parses wrong format. Data corruption goes undetected. Client-friendly error is never shown.

## Rule 6: Apply Format Transformation at Middleware Layer
---
## Category
Code Organization
---
## Rule
Always implement response format transformation in middleware or response adapters, never in controller logic.
---
## Reason
Controllers should be format-agnostic — they return data, not format. Middleware decouples format logic from business logic, making format changes possible without touching controllers.
---
## Bad Example
```php
class UserController
{
    public function index(Request $request)
    {
        $users = User::all();
        if ($request->header('Accept') === 'application/vnd.api+json') {
            return $this->formatAsJsonApi($users);
        }
        return $this->formatAsEnvelope($users);
    }
}
```
---
## Good Example
```php
// Controller — format agnostic
public function index()
{
    return UserResource::collection(User::all());
}

// Middleware — format transformation
return response()->json($data, $status, $headers);
// Transformed to target format by middleware
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Every new controller duplicates format negotiation logic. Format changes require updating every controller. Format bugs are scattered across the codebase.
