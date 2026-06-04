# Phase 5: Rules — Middleware Ordering and Priority

---

## Rule Name

Add Custom Middleware to the Priority Array When Position Matters

---

## Category

Reliability

---

## Rule

When a custom middleware must execute before or after a specific framework middleware (e.g., before `Authenticate`, after `StartSession`), add it to the priority array using `prependToPriorityList` or `appendToPriorityList` (Laravel 12+) or by including it in the full priority list. Never assume that registration order in a group array determines execution order relative to priority middleware.

---

## Reason

The `SortedMiddleware` algorithm moves all priority-listed middleware to the front of the pipeline in priority order. Non-priority middleware (including custom middleware not in the priority array) runs after all priority middleware, regardless of its position in the group array. A custom middleware intended to run before `Authenticate` will run after all priority middleware if it is not in the priority array — defeating its purpose.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        EnsureUserIsActive::class, // Expected to run before auth
        // ... but runs after all priority middleware (including auth) because
        // it is not in the priority array
    ]);
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [EnsureUserIsActive::class]);

    // Laravel 12+: insert before Authenticate in priority
    $middleware->prependToPriorityList(
        before: \Illuminate\Auth\Middleware\Authenticate::class,
        prepend: EnsureUserIsActive::class,
    );
});
```

---

## Exceptions

Middleware whose relative position to framework middleware does not matter (e.g., a response-time header middleware) does not need priority placement.

---

## Consequences Of Violation

Reliability risks: middleware intended to gate or modify behavior before auth runs after auth. Security risks: middleware that checks user status before authentication can be bypassed if it runs after auth passes.

---

---

## Rule Name

Do Not Override the Entire Priority Array Without Including All Framework Middleware

---

## Category

Maintainability

---

## Rule

When overriding the entire priority array with `$middleware->priority([...])` (Laravel 11+) or `$middlewarePriority` (Laravel 10-), include every framework middleware that is in the default priority list. Never omit framework middleware — omitted items run at the end as non-priority, which may break version-specific behavior.

---

## Reason

`SortedMiddleware` sorts only the middleware present in the priority array to the front. All other middleware — including framework middleware omitted from the override — runs after priority items as non-priority, preserving their relative merge order. If `StartSession` is omitted from an overridden priority array, it runs after all priority middleware, which means it runs after middleware that depends on the session (CSRF, auth guards). This silently breaks session-dependent functionality.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->priority([
        EnsureUserIsActive::class, // Custom middleware
        \Illuminate\Auth\Middleware\Authenticate::class,
    ]);
    // All other framework middleware (StartSession, CSRF, etc.) runs as non-priority
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Start with the default priority array from the framework
    // and insert custom middleware at the correct position
    $middleware->priority([
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\EnsureUserIsActive::class, // Custom — before auth
        \Illuminate\Auth\Middleware\Authenticate::class,
        \Illuminate\Auth\Middleware\Authorize::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);
});
```

---

## Exceptions

In Laravel 12+, use `prependToPriorityList` and `appendToPriorityList` instead of full array override. These methods preserve the default priority array and insert custom middleware at specific positions.

---

## Consequences Of Violation

Reliability risks: framework middleware missing from priority causes incorrect execution order. Security risks: session-dependent middleware (CSRF, auth) may run before the session starts. Silent failures: no error is thrown — middleware simply runs in the wrong order.

---

---

## Rule Name

Use Exact FQCNs in the Priority Array

---

## Category

Reliability

---

## Rule

Always use exact fully qualified class names (FQCNs) when referencing middleware in the priority array. Never use aliases, shortened class names, or strings that do not match the exact class name used during middleware resolution.

---

## Reason

The `SortedMiddleware` algorithm matches priority items against resolved middleware using exact class name string comparison. If the priority array uses `'auth'` (an alias) but the middleware is resolved to `\Illuminate\Auth\Middleware\Authenticate::class`, the string comparison fails and the middleware becomes non-priority. Alias-to-FQCN resolution happens before priority matching, but the priority array itself is compared against the resolved FQCNs, not the aliases.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: ['auth']); // Uses alias 'auth'
    $middleware->priority([
        'auth', // String compared against resolved FQCN — mismatch!
    ]);
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [\App\Http\Middleware\EnsureUserIsActive::class]);
    $middleware->prependToPriorityList(
        before: \Illuminate\Auth\Middleware\Authenticate::class, // Exact FQCN
        prepend: \App\Http\Middleware\EnsureUserIsActive::class, // Exact FQCN
    );
});
```

---

## Exceptions

No common exceptions. Always use FQCNs in priority configuration.

---

## Consequences Of Violation

Reliability risks: priority placement silently fails — middleware runs as non-priority. Debugging difficulty: the middleware appears in the correct registration position but executes in the wrong order with no error or warning.

---

---

## Rule Name

Document Why Each Custom Middleware Is Placed at Its Priority Position

---

## Category

Maintainability

---

## Rule

Every addition to the priority array must be accompanied by a comment explaining why the middleware must run at that specific position relative to framework middleware. Include the consequence of incorrect positioning.

---

## Reason

Priority positioning is a configuration-level constraint that is invisible in the middleware source code. Without documentation, future developers cannot determine why a middleware runs before or after another middleware. This leads to incorrect modifications — a developer may remove a priority entry thinking it is unnecessary, breaking the pipeline's safety guarantees without any obvious indicator.

---

## Bad Example

```php
$middleware->prependToPriorityList(
    before: \Illuminate\Auth\Middleware\Authenticate::class,
    prepend: \App\Http\Middleware\EnsureUserIsActive::class,
);
// No documentation — why does this need to run before auth?
```

---

## Good Example

```php
// EnsureUserIsActive must run before Authenticate because:
// - inactive users should not be able to authenticate at all
// - without this ordering, a deactivated user could still log in
//   before this middleware rejects their session
$middleware->prependToPriorityList(
    before: \Illuminate\Auth\Middleware\Authenticate::class,
    prepend: \App\Http\Middleware\EnsureUserIsActive::class,
);
```

---

## Exceptions

No common exceptions. Every priority entry requires documentation.

---

## Consequences Of Violation

Maintenance risks: future developers cannot understand the ordering constraint and may break it. Onboarding friction: new team members cannot reason about the pipeline's execution order. Security risks: incorrectly removed or reordered priority entries create security gaps.

---

---

## Rule Name

Review the Priority Array on Every Major Laravel Upgrade

---

## Category

Maintainability

---

## Rule

When upgrading to a new major Laravel version, compare the default priority array against the application's overridden priority array. Add any new framework middleware that appears in the default and is missing from the override.

---

## Reason

Laravel adds new middleware to the default priority array across major versions. Applications that override the entire priority array (Laravel 11-) or have `prependToPriorityList`/`appendToPriorityList` entries referencing specific framework middleware may need adjustment. New framework middleware (e.g., `HandlePrecognitiveRequests` added in Laravel 11) that is missing from the override runs as non-priority — at the end of the pipeline — which may break the framework's intended security or behavior guarantees.

---

## Bad Example

```php
// After upgrading to Laravel 12, the application's priority array
// still uses the Laravel 11 list. New middleware added in Laravel 12
// is missing and runs as non-priority.
$middleware->priority([
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\Auth\Middleware\Authenticate::class,
    // Missing: new Laravel 12 security middleware
]);
```

---

## Good Example

```php
// Review the default priority array from the new version:
// vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php
// Add any new middleware at the correct position

$middleware->priority([
    \Illuminate\Session\Middleware\StartSession::class,
    \App\Http\Middleware\CustomBeforeAuth::class,
    \Illuminate\Auth\Middleware\Authenticate::class,
    \Illuminate\Auth\Middleware\Authorize::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
    // Added: new framework middleware from Laravel 12
    \Illuminate\Http\Middleware\NewFeature::class,
]);
```

---

## Exceptions

Applications that do not override the priority array (relying entirely on `prependToPriorityList`/`appendToPriorityList` in Laravel 12+) do not need to review the full array. However, they should verify that the middleware they reference before/after still exists with the same class name.

---

## Consequences Of Violation

Reliability risks: new framework middleware runs in the wrong position, potentially breaking new framework features. Security risks: middleware intended to run early in the pipeline runs at the end.

---

---

## Rule Name

Do Not Rely on Registration Order for Execution Order When Priority Items Are Present

---

## Category

Reliability

---

## Rule

Never assume that the order middleware appears in a group array, route definition, or controller configuration determines its execution order. The priority array overrides registration order. Always check the priority array to determine actual execution order.

---

## Reason

The merged middleware list (controller + route + group) is sorted by the `SortedMiddleware` algorithm using the priority array. Any middleware in the priority array moves to its priority position regardless of where it appeared in the merge order. A developer who registers `SetLocale` before `StartSession` in the web group, expecting locale to be set before the session starts, will find that `StartSession` (in priority) runs before `SetLocale` (non-priority, runs at end). This is only visible by checking the priority array.

---

## Bad Example

```php
$middleware->web(append: [
    SetLocale::class,  // Registered first — expected to run first
    StartSession::class, // Registered second
]);
// Actual order: StartSession (priority) → ... → SetLocale (non-priority, runs last)
```

---

## Good Example

```php
// Always check the priority array or add to priority if order matters
$middleware->web(append: [SetLocale::class]);
$middleware->appendToPriorityList(
    after: \Illuminate\Session\Middleware\StartSession::class,
    prepend: SetLocale::class,
);
// Actual order: StartSession → SetLocale
```

---

## Exceptions

Middleware that is not in the priority array preserves its relative merge order. The merge order is: controller middleware first, then route middleware, then group middleware.

---

## Consequences Of Violation

Reliability risks: middleware executes in unexpected order based on priority, not registration. Debugging difficulty: the discrepancy between registration order and execution order is not visible in the source code without checking the priority configuration.
