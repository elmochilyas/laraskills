# Phase 5: Rules — Authorization Error Responses

## Rule: Return 403 for Authenticated Users Who Lack Permission
---
## Category
Architecture | Framework Usage
---
## Rule
Always return HTTP 403 for authenticated users who fail authorization checks; never return 401, 500, or a generic error.
---
## Reason
HTTP 403 means "authenticated but not permitted"; 401 means "not authenticated." Using the wrong status breaks client-side routing and security logic.
---
## Bad Example
```php
// Returning 401 for a policy denial
abort(401, 'You cannot do this.');
```
---
## Good Example
```php
// AuthorizationException automatically becomes 403 via handler
public function renderAuthorizationError(AuthorizationException $e, Request $request): JsonResponse
{
    return response()->json(
        new ErrorEnvelope(ErrorCodes::USER_AUTH_FORBIDDEN, 'You do not have permission.', 403),
        403,
    );
}
```
---
## Exceptions
When the resource should be hidden entirely (see 404-vs-403 strategy rules); some hidden resources may use 404 instead.
---
## Consequences Of Violation
Clients incorrectly assume credentials are wrong; inifinite re-authentication loops; broken authorization UX.

---

## Rule: Distinguish Ownership Denial from Role Denial with Separate Codes
---
## Category
Design | Maintainability
---
## Rule
Always use distinct error codes for role-based denials vs. ownership-based denials; never use a single generic 403 code for all authorization failures.
---
## Reason
Role denials (insufficient role) and ownership denials (wrong resource owner) require different client-side responses — upgrade prompt vs. access request.
---
## Bad Example
```php
const USER_AUTH_FORBIDDEN = 'USER.AUTH_FORBIDDEN';
// Same code for "not admin" and "not your resource"
```
---
## Good Example
```php
const USER_AUTH_FORBIDDEN = 'USER.AUTH_FORBIDDEN';
const USER_AUTH_INSUFFICIENT_ROLE = 'USER.AUTH_INSUFFICIENT_ROLE';
const RESOURCE_ACCESS_DENIED = 'RESOURCE.ACCESS_DENIED';
```
---
## Exceptions
The application has a single authorization model (e.g., all users have same access or resource-level ownership doesn't apply).
---
## Consequences Of Violation
Clients cannot differentiate "upgrade needed" from "not your resource"; incorrect UI prompts frustrate users.

---

## Rule: Include Denied Policy Name in Machine-Readable Detail
---
## Category
Maintainability | Design
---
## Rule
Always include the denied policy or ability name in `detail.required_permission` of 403 responses; never include the user's current roles or permissions.
---
## Reason
The policy name tells the client what permission was required without revealing the user's permission set, preventing privilege enumeration.
---
## Bad Example
```php
// Reveals the user's current permissions
'detail' => ['your_roles' => ['viewer'], 'required' => 'editor']
```
---
## Good Example
```php
// Only shows what's required, not what's missing
'detail' => ['required_permission' => 'posts.update']
```
---
## Exceptions
Public APIs where resource types should remain hidden; omit `required_permission` in those cases.
---
## Consequences Of Violation
Permission enumeration vulnerability; attackers learn which permissions to target for escalation.

---

## Rule: Never Include the User's Current Roles or Permissions in the Response
---
## Category
Security
---
## Rule
Always exclude the authenticated user's current roles, permissions, and group memberships from any 403 error response.
---
## Reason
Exposing the user's current permission set tells attackers exactly which privileges they lack and which to target for escalation.
---
## Bad Example
```php
'detail' => [
    'message' => 'You have role "viewer" but need role "editor".',
    'your_permissions' => ['view_posts', 'view_comments'],
]
```
---
## Good Example
```php
'detail' => [
    'required_permission' => 'posts.update',
]
```
---
## Exceptions
Admin-only diagnostic endpoints where the requesting user already has full system access.
---
## Consequences Of Violation
Privilege escalation vulnerability; attackers can map the permission hierarchy and target specific gaps.

---

## Rule: Choose and Apply a Consistent 403 vs 404 Strategy Per Resource Type
---
## Category
Architecture | Security
---
## Rule
Always document and enforce a per-resource-type strategy for whether denied resources return 403 or 404; never vary the response per-endpoint.
---
## Reason
Inconsistent 403/404 responses across endpoints enable attackers to map resource existence by observing which status code is returned for different identifiers.
---
## Bad Example
```php
// Endpoint A: returns 403 for denied access to /api/users/{id}
// Endpoint B: returns 404 for denied access to /api/posts/{id}
// Attacker can infer existence by testing both
```
---
## Good Example
```php
// All hidden resources consistently return 404
// All known resources consistently return 403
// Strategy documented in a single place:
enum AuthorizationVisibility
{
    case HIDE_RESOURCE;    // Return 404
    case ACKNOWLEDGE;      // Return 403
}
```
---
## Exceptions
No common exceptions — consistency is the rule.
---
## Consequences Of Violation
Resource enumeration vulnerability; attackers can map user existence, resource existence, and permission boundaries.

---

## Rule: Map AuthorizationException Explicitly in the Handler
---
## Category
Framework Usage | Code Organization
---
## Rule
Always register an explicit `renderable` callback for `AuthorizationException` in the global exception handler; never let it fall through to the generic 500 fallback.
---
## Reason
Without explicit mapping, `AuthorizationException` returns a generic 500 or default framework error instead of a structured 403 with proper error codes.
---
## Bad Example
```php
// No mapping — AuthorizationException becomes 500
public function register(): void
{
    $this->renderable(function (Throwable $e, Request $request) {
        // Returns 500 for everything
    });
}
```
---
## Good Example
```php
public function register(): void
{
    $this->renderable(function (AuthorizationException $e, Request $request) {
        if (! $request->expectsJson()) return null;
        return $this->handleAuthorizationError($e);
    });
}
```
---
## Exceptions
No common exceptions — all authorization exceptions must be mapped.
---
## Consequences Of Violation
Authorization failures return 500 status; client cannot distinguish "not allowed" from "server error"; false-positive monitoring alerts.

---

## Rule: Map Spatie's UnauthorizedException Separately
---
## Category
Framework Usage | Maintainability
---
## Rule
Always register an explicit mapping for `Spatie\Permission\Exceptions\UnauthorizedException` in the handler when using the spatie/laravel-permission package; never rely on it being caught by the `AuthorizationException` mapping.
---
## Reason
Spatie's exception extends a different base class than Laravel's `AuthorizationException` and is not caught by the default `AuthorizationException` renderable.
---
## Bad Example
```php
// Only maps Laravel's AuthorizationException
$this->renderable(function (AuthorizationException $e, $request) {
    return $this->handleAuthorizationError($e);
});
// Spatie's UnauthorizedException falls through to 500
```
---
## Good Example
```php
$this->renderable(function (AuthorizationException $e, $request) {
    return $this->handleAuthorizationError($e);
});
$this->renderable(function (\Spatie\Permission\Exceptions\UnauthorizedException $e, $request) {
    if (! $request->expectsJson()) return null;
    return $this->handleAuthorizationError($e, ErrorCodes::USER_AUTH_INSUFFICIENT_ROLE);
});
```
---
## Exceptions
The spatie/laravel-permission package is not used in the project.
---
## Consequences Of Violation
Role-based authorization failures produce 500 errors instead of 403; silent authorization failures degrade API reliability.

---

## Rule: Log Authorization Failures for Audit Trail
---
## Category
Security | Reliability
---
## Rule
Always log authorization failures with user ID, denied policy/ability, resource ID, and timestamp; never log the user's full permission set.
---
## Reason
Authorization failures are key audit events for security incident detection (insider threat, lateral movement); missing context prevents forensic analysis.
---
## Bad Example
```php
// Logged without context — cannot audit
Log::warning('Authorization denied');
```
---
## Good Example
```php
Log::warning('Authorization denied', [
    'user_id' => $request->user()->id,
    'ability' => $e->ability(),
    'resource_type' => $resourceType,
    'resource_id' => $resourceId,
    'ip' => $request->ip(),
]);
```
---
## Exceptions
GDPR/CCPA compliance requirements may limit retention of authorization audit logs; apply retention policies without removing the audit trail.
---
## Consequences Of Violation
Inability to detect and investigate insider threats; compliance audit failure; inability to identify compromised accounts attempting unauthorized access.

---

## Rule: Use 403 over 401 for Authenticated Requests with Invalid CSRF Tokens
---
## Category
Framework Usage | Security
---
## Rule
Always treat CSRF token validation failures as authentication errors (returning 401 or session-based handling), never as authorization errors (403).
---
## Reason
CSRF is an authentication concern — the request lacks proof of intent — not an authorization concern. Treating it as 403 confuses CSRF failures with permission denials.
---
## Bad Example
```php
// CSRF failure handled as authorization
abort(403, 'CSRF token mismatch.');
```
---
## Good Example
```php
// Let Laravel's default CSRF middleware handle it (419 PAGE_EXPIRED for session-based, 401 for API)
// Add explicit handling:
$this->renderable(function (TokenMismatchException $e, Request $request) {
    return $request->expectsJson()
        ? response()->json(new ErrorEnvelope('USER.AUTH_CSRF_MISMATCH', 'Session expired.', 401), 401)
        : null;
});
```
---
## Exceptions
Stateless API routes using token-based auth (Sanctum, Passport) where CSRF protection is disabled.
---
## Consequences Of Violation
Confused error handling; CSRF failures counted as authorization failures in monitoring; incorrect incident routing.
