# conditional-field-inclusion Rules

## Rule 1: Wrap Every Optional Field in `when()`
---
## Category
Design
---
## Rule
Always wrap every resource field that is not guaranteed to be present in every response with an explicit `when()` or `whenHas()` call.
---
## Reason
Directly returning a nullable field leaks the internal state (missing attribute, null value, unloaded relation) to the client. `when()` documents optionality explicitly and omits the key rather than returning null.
---
## Bad Example
```php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'nickname' => $this->nickname, // null when user has no nickname
    ];
}
```
---
## Good Example
```php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'nickname' => $this->whenNotNull($this->nickname),
    ];
}
```
---
## Exceptions
Fields that are always populated (e.g., `id`, `created_at` on persisted models).
---
## Consequences Of Violation
Null keys appear in every response, forcing clients to handle null values. Missing attributes silently produce `null` instead of omitting the key, masking schema issues.

## Rule 2: Use `whenHas()` for Model Attribute Existence Checks
---
## Category
Reliability
---
## Rule
Always use `whenHas()` to check whether a model attribute exists before including it, rather than `when(isset($this->attribute), ...)`.
---
## Reason
`whenHas()` checks both existence and non-null on the model's attributes array. Bare `when()` with a truthy check silently omits the field for legitimate empty values like `0`, `false`, or `''`.
---
## Bad Example
```php
'is_active' => $this->when($this->is_active, $this->is_active),
// Omits field when is_active = false, even though the field is meaningful
```
---
## Good Example
```php
'is_active' => $this->whenHas('is_active') ? $this->is_active : null,
// Includes key when attribute exists, regardless of truthiness
```
---
## Exceptions
When the condition is purely authorization-based or request-driven, not attribute-existence-based.
---
## Consequences Of Violation
Boolean false, numeric zero, and empty string values cause silent field omission. Clients receive incomplete data without any error indication.

## Rule 3: Never Use `when()` as a Standalone Statement
---
## Category
Framework Usage
---
## Rule
Always return `when()` as an array value inside `toArray()`'s return statement, never call it as a standalone statement.
---
## Reason
`when()` returns a `Conditional` proxy object that is lazily evaluated during `toResponse()`. Calling it as a statement discards the proxy, and the field is never evaluated.
---
## Bad Example
```php
public function toArray($request)
{
    $this->when($request->user()->isAdmin(), [
        'internal_note' => $this->internal_note,
    ]); // discard — does nothing

    return ['id' => $this->id];
}
```
---
## Good Example
```php
public function toArray($request)
{
    return [
        'id' => $this->id,
        $this->mergeWhen($request->user()->isAdmin(), [
            'internal_note' => $this->internal_note,
        ]),
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Conditional fields silently never appear in responses regardless of the condition. Developers waste hours debugging why `when()` appears to have no effect.

## Rule 4: Use `whenNotNull()` for Computed or Accessor Values
---
## Category
Design
---
## Rule
Always use `whenNotNull()` for any field whose value comes from a computed attribute, accessor, or method that may return null.
---
## Reason
Model accessors and computed values can return null for some records. Without `whenNotNull()`, null appears in the response, forcing clients to distinguish between "field exists but is null" and "field is absent."
---
## Bad Example
```php
'last_login_at' => $this->last_login_at,
// Returns null for users who never logged in — key present, value null
```
---
## Good Example
```php
'last_login_at' => $this->whenNotNull($this->last_login_at),
// Key omitted entirely for users who never logged in
```
---
## Exceptions
When the API contract explicitly states that the field always exists and may be null.
---
## Consequences Of Violation
Every client must handle nullable fields with conditional checks. Response payloads include null keys that add bytes without conveying information.

## Rule 5: Never Substitute `when()` for Authorization Middleware
---
## Category
Security
---
## Rule
Never use `when(auth()->user()->can(...), ...)` as the sole mechanism for hiding sensitive fields — always enforce authorization at the controller or middleware layer.
---
## Reason
`when()` controls field visibility at the presentation layer. It does not prevent the data from being loaded, logged, cached, or exposed through other channels. Authorization middleware is the enforcement boundary.
---
## Bad Example
```php
public function toArray($request)
{
    return [
        'ssn' => $this->when($request->user()->isAdmin(), $this->ssn),
        // SSN still loaded from DB, cached, and logged — just hidden from response
    ];
}
```
---
## Good Example
```php
// Controller — authorization gate
$this->authorize('viewSensitiveFields', $user);

// Resource — presentation only
public function toArray($request)
{
    return [
        'ssn' => $this->whenNotNull($this->ssn), // already authorized
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Sensitive data remains in server logs, query logs, cache stores, and debug toolbars. A cache misconfiguration or log leak exposes data that was only visually hidden.

## Rule 6: Pre-compute Expensive Conditions Once
---
## Category
Performance
---
## Rule
Always compute complex or expensive boolean conditions once before the `toArray()` return, rather than recomputing them inside multiple `when()` calls.
---
## Reason
Each `when()` closure or condition is evaluated independently during serialization. Repeated authorization checks, database calls, or string operations inside multiple `when()` calls multiply execution time.
---
## Bad Example
```php
public function toArray($request)
{
    return [
        'internal_notes' => $this->when(
            $this->expensivePermissionCheck($request->user()), $this->notes
        ),
        'risk_score' => $this->when(
            $this->expensivePermissionCheck($request->user()), $this->score
        ),
    ];
}
```
---
## Good Example
```php
public function toArray($request)
{
    $isAdmin = $this->expensivePermissionCheck($request->user());

    return [
        'internal_notes' => $this->when($isAdmin, $this->notes),
        'risk_score' => $this->when($isAdmin, $this->score),
    ];
}
```
---
## Exceptions
Trivial conditions like `$this->relationLoaded('x')` that are constant-time property checks.
---
## Consequences Of Violation
Serialization time grows linearly with each duplicate expensive check. Response times for resources with 10+ conditional fields degrade noticeably under load.

## Rule 7: Vary Cache Keys by All Conditional Factors
---
## Category
Scalability
---
## Rule
Always include all factors that affect conditional field inclusion (user role, request parameters, loaded relations) in the response cache key.
---
## Reason
Conditional fields produce different response shapes for different request states. Without varying cache keys by all factors, a cached response for an admin (with sensitive fields) may be served to a regular user.
---
## Bad Example
```php
Cache::put('users:list', $response, 3600);
// No cache key variation — admin responses served to regular users
```
---
## Good Example
```php
$role = $request->user()->isAdmin() ? 'admin' : 'user';
$cacheKey = "users:list:role:{$role}";
Cache::put($cacheKey, $response, 3600);
```
---
## Exceptions
Endpoints where conditional field inclusion depends only on the request parameters already present in the URL.
---
## Consequences Of Violation
Cache poisoning: lower-privilege users receive responses containing sensitive admin-only fields. Security breach through cache misconfiguration.
