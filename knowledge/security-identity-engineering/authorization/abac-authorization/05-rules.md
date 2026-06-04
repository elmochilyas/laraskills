# Rules: ABAC (Attribute-Based Access Control)

## Start With RBAC, Add ABAC Only Where Needed
---
## Category
Architecture
---
## Rule
Implement RBAC (roles/permissions) as the primary authorization model. Add ABAC only for edge cases requiring attribute-based conditions that RBAC cannot express.
---
## Reason
RBAC is simpler, well-understood, and covers 80% of authorization requirements. ABAC introduces policy engines, attribute collection, and complex evaluation logic. Premature ABAC adoption adds unnecessary complexity when simple role checks suffice.
---
## Bad Example
```php
// ABAC for every check — over-engineering
$decision = $abacService->evaluate($userAttrs, $resourceAttrs, $action, $env);
```
---
## Good Example
```php
// RBAC for simple checks
$user->can('edit-articles');
// ABAC only for edge cases
if ($user->can('view-document') && $document->classification === 'public') { ... }
```
---
## Exceptions
Applications with inherently attribute-based authorization from day one (e.g., multi-dimensional data access).
---
## Consequences Of Violation
Unnecessary policy engine complexity, slower development, harder debugging.
---

## Resolve Attributes Server-Side, Never Trust Client-Provided Values
---
## Category
Security
---
## Rule
Collect all attribute context (user department, resource classification, environment) from trusted server-side sources. Never accept attribute values from client request payloads.
---
## Reason
If attribute values come from the client, a user can forge attributes (e.g., claim department = "executive" or clearance = "top-secret") to bypass ABAC policies. Server-side resolution ensures attribute integrity.
---
## Bad Example
```php
$decision = $abacService->evaluate([
    'user' => ['department' => $request->input('department')], // Client-provided — forgeable
]);
```
---
## Good Example
```php
$decision = $abacService->evaluate([
    'user' => ['department' => $user->department], // Server-resolved
    'resource' => ['classification' => $document->classification],
]);
```
---
## Exceptions
No common exceptions — attributes must always come from trusted sources.
---
## Consequences Of Violation
Attribute forgery, privilege escalation, authorization bypass.
---

## Default Deny When No ABAC Policy Matches
---
## Category
Security
---
## Rule
Configure the ABAC policy decision point (PDP) to return "deny" when no policy matches the given attribute context. Fail closed when the PDP is unavailable.
---
## Reason
A default-allow policy means any unauthenticated or unexpected attribute combination grants access. Default-deny ensures that unimplemented policy areas, unknown resources, or misconfigured attributes result in denial — a safe failure mode.
---
## Bad Example
```php
// PDP returns 'permit' when no policy matches — default-allow
if ($decision === 'permit' || $decision === null) { // null = allow
    // Access granted
}
```
---
## Good Example
```php
// PDP returns 'deny' when no policy matches — default-deny
return $decision === 'permit'; // Only true if explicitly permitted
```
---
## Exceptions
No common exceptions — ABAC must default to deny.
---
## Consequences Of Violation
Unintended access grant for unconfigured attribute combinations.
---

## Cache PDP Decisions With Appropriate TTL
---
## Category
Performance
---
## Rule
Cache ABAC PDP evaluation results with a cache key scoped to user, resource, action, and environment attributes. Set TTL based on attribute volatility.
---
## Reason
PDP evaluation — especially with external PDPs (Permit.io, OPA) — adds 10-100ms HTTP call latency. Without caching, every request evaluates the same user+resource+action combination repeatedly, multiplying latency. Caching reduces this to a single evaluation per TTL window.
---
## Bad Example
```php
// PDP called on every request — no caching
$decision = $pdp->evaluate($attributes); // 50ms every time
```
---
## Good Example
```php
$cacheKey = "abac:{$user->id}:{$resource->id}:{$action}";
$decision = cache()->remember($cacheKey, 300, function () use ($attributes, $pdp) {
    return $pdp->evaluate($attributes);
});
```
---
## Exceptions
Highly dynamic attributes (e.g., time-of-day) that change every request — cache for shorter TTL or skip.
---
## Consequences Of Violation
10-100ms added to every request, PDP rate limits hit, degraded performance.
---

## Audit All ABAC Authorization Decisions
---
## Category
Audit Logging
---
## Rule
Log every ABAC evaluation including the attributes evaluated, policy matched, and decision rendered. Include a correlation ID for traceability.
---
## Requirement
ABAC decisions can be complex and policies can interact in unexpected ways. Audit logs enable forensic investigation of access decisions, compliance reporting, and debugging of unexpected denials or grants.
---
## Bad Example
```php
// ABAC decision not logged — no audit trail
if ($decision === 'permit') { /* grant access */ }
```
---
## Good Example
```php
Log::info('ABAC decision', [
    'user_id' => $user->id,
    'action' => $action,
    'resource' => get_class($resource) . ':' . $resource->id,
    'decision' => $decision,
    'correlation_id' => request()->correlationId,
]);
```
---
## Exceptions
No common exceptions — ABAC decisions must always be auditable.
---
## Consequences Of Violation
No forensic trail for access decisions, compliance audit failures.
---

## Use External PDP Over Custom In-App Policy Engine
---
## Category
Architecture
---
## Rule
Use a dedicated external policy decision point (Permit.io, OPA, or Cedar) for ABAC policy evaluation. Do not implement a PDP from scratch in application code.
---
## Reason
Building a PDP requires policy language design, rule combination logic, attribute resolution, and evaluation engines — all complex and error-prone. External PDPs provide battle-tested policy engines with features like policy versioning, dry-run evaluation, and audit logs.
---
## Bad Example
```php
// Custom PDP built in application code
class CustomPdp {
    public function evaluate($attrs) {
        // Complex custom policy logic — error-prone
    }
}
```
---
## Good Example
```php
// Use Permit.io or OPA
$permit = new \Permit\Permit(env('PERMIT_API_KEY'));
$decision = $permit->check($user, $action, $resource);
```
---
## Exceptions
Very simple attribute checks (few attributes, static rules) that can be expressed in Laravel Policies.
---
## Consequences Of Violation
Buggy policy evaluation, missing edge cases, maintenance burden.
