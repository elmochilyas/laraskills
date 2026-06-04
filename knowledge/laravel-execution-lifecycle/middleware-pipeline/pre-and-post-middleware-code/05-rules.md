# Pre-and-Post-Middleware Code — Rules

## Always Understand That Post-Code Only Runs on Successful Completion
---
## Category
Reliability
---
## Rule
Design post-middleware code with the understanding that it executes only if all downstream middleware and the controller complete without short-circuiting or throwing.
---
## Reason
A middleware that returns early (auth failure, rate limit) prevents post-code in all downstream middleware from executing. Logging, auditing, or response-transformation middleware placed after a short-circuit point will silently miss requests.
---
## Bad Example
```php
class LogRequest
{
    public function handle($request, $next)
    {
        $response = $next($request);
        // Post-code: log the request
        Log::info('Request completed', ['status' => $response->status()]);
        return $response;
    }
}

// Pipeline: [Authenticate, LogRequest]
// Auth fails — $next never called — LogRequest post-code never runs
// Failed auth requests are not logged
```
---
## Good Example
```php
class LogRequest
{
    public function handle($request, $next)
    {
        // Pre-code: log before authentication
        Log::info('Request started', ['path' => $request->path()]);
        return $next($request);
    }
}

// Pipeline: [LogRequest, Authenticate]
// Log runs pre-code before auth — all requests are logged
```
---
## Exceptions
Middleware that intentionally only logs successful requests is correct with post-only placement.
---
## Consequences Of Violation
Missing audit trails; incomplete metrics; silent failure to log critical security events.

---

## Keep Pre-Middleware Fast to Minimize TTFB Impact
---
## Category
Performance
---
## Rule
Limit pre-middleware code to fast, synchronous operations (header checks, token validation, simple lookups). Avoid database queries or external API calls.
---
## Reason
The request cannot proceed to the controller until all pre-middleware code completes. Heavy pre-middleware (DB queries, API calls) directly increases Time to First Byte (TTFB) for every request.
---
## Bad Example
```php
public function handle($request, $next)
{
    // Heavy pre-middleware: blocks every request
    $user = User::with('subscriptions', 'permissions')->find(auth()->id());
    $request->attributes->set('user_data', $user);
    
    return $next($request);
}
```
---
## Good Example
```php
public function handle($request, $next)
{
    // Fast pre-middleware: defer heavy work to post-middleware or lazy load
    if (auth()->guest()) {
        return $next($request); // No work for guests
    }
    
    return $next($request);
}
```
---
## Exceptions
Middleware that must load data for request processing (e.g., tenant resolution) — minimize the query scope.
---
## Consequences Of Violation
High TTFB; poor user experience; server resource exhaustion from blocked workers.

---

## Keep Post-Middleware Fast to Minimize TTLB Impact
---
## Category
Performance
---
## Rule
Limit post-middleware code to lightweight response modifications (header additions, small transformations). Avoid heavy processing, compression, or external calls.
---
## Reason
The response cannot be sent to the client until all post-middleware code completes. Heavy post-processing directly increases Time to Last Byte (TTLB).
---
## Bad Example
```php
public function handle($request, $next)
{
    $response = $next($request);
    
    // Heavy post-middleware: client waits for this to complete
    $compressed = gzencode($response->getContent(), 9);
    $response->setContent($compressed);
    $response->headers->set('Content-Encoding', 'gzip');
    
    return $response;
}
```
---
## Good Example
```php
public function handle($request, $next)
{
    $response = $next($request);
    
    // Lightweight post-middleware: add cache headers only
    $response->headers->set('X-Response-Time', $this->getDuration());
    
    return $response;
}
```
---
## Exceptions
When response transformation is a business requirement and the performance cost is accepted and measured.
---
## Consequences Of Violation
High TTLB; poor perceived performance; connection timeouts on slow clients.

---

## Keep Related Pre/Post Logic in the Same Middleware
---
## Category
Maintainability
---
## Rule
Co-locate related pre- and post-processing in a single middleware class when the logic is a single cross-cutting concern (e.g., CORS checks origin inbound, sets headers outbound).
---
## Reason
Splitting related inbound/outbound logic across separate middleware makes the relationship harder to trace and maintain. A single middleware with clear `// Pre` / `// Post` sections keeps the concern encapsulated.
---
## Bad Example
```php
// Two middleware for one concern — relationship is invisible
class CheckCorsOrigin
{
    public function handle($request, $next) { /* check origin */ }
}

class SetCorsHeaders
{
    public function handle($request, $next)
    {
        $response = $next($request);
        /* set headers */
    }
}
```
---
## Good Example
```php
class CorsMiddleware
{
    public function handle($request, $next)
    {
        // Pre: Check Origin header
        $origin = $request->header('Origin');
        if (!in_array($origin, config('cors.allowed'))) {
            return response('Forbidden', 403);
        }
        
        $response = $next($request);
        
        // Post: Set CORS headers
        $response->headers->set('Access-Control-Allow-Origin', $origin);
        
        return $response;
    }
}
```
---
## Exceptions
When pre-processing and post-processing are independently reusable (e.g., auth check inbound, response compression outbound) — split for reusability.
---
## Consequences Of Violation
Harder to understand the full scope of a concern; fragmented middleware that must be kept in sync.

---

## Never Modify or Access the Response in Pre-Middleware Code
---
## Category
Reliability
---
## Rule
Do not attempt to read or modify the response object before calling `$next($request)`.
---
## Reason
Before `$next($request)` executes, the response does not exist — it is the closure that produces the response. Any attempt to access `$response` properties or methods before `$next()` either accesses the closure itself or causes a runtime error.
---
## Bad Example
```php
public function handle($request, $next)
{
    $response->headers->set('X-Custom', 'value'); // Error: $response is undefined
    return $next($request);
}
```
---
## Good Example
```php
public function handle($request, $next)
{
    $response = $next($request); // Execute pipeline first
    
    // Then modify response
    $response->headers->set('X-Custom', 'value');
    
    return $response;
}
```
---
## Exceptions
No common exceptions — the response is unavailable before `$next()`.
---
## Consequences Of Violation
Runtime errors; undefined variable access; middleware crashes.

---

## Understand That Outermost Post-Middleware Runs Last and Has Final Say
---
## Category
Architecture
---
## Rule
When multiple middleware modify the response, recognize that the outermost middleware's post-code produces the final response the client sees.
---
## Reason
The nested closure model means outermost middleware's post-code wraps all inner modifications. This middleware's response is returned to the client — any response returned earlier (by inner middleware) is overridden or wrapped.
---
## Bad Example
```php
// Middleware A (outer): post-code sets header X-A: 1
// Middleware B (inner): post-code sets header X-A: 2
// Client sees X-A: 1 (outer wins), not X-A: 2
// Developer expects B's header to take effect
```
---
## Good Example
```php
// Order middleware with awareness of post-code finality
// Put persistent-header middleware on the outside
// Put transient-header middleware on the inside

// Pipeline: [PersistentHeaders, TransientHeaders, Controller]
// PersistentHeaders post-code runs last — its headers are final
```
---
## Exceptions
When middleware explicitly decides not to override existing response values (checks `$response->headers->has()`).
---
## Consequences Of Violation
Unexpected response content; header values overwritten by outer middleware; confusion about which modification takes effect.

---

## Separate Pre and Post Code Sections with Clear Comments
---
## Category
Maintainability
---
## Rule
Use `// Pre` and `// Post` comments to visually separate inbound and outbound code sections within `handle()`.
---
## Reason
The single-method design places pre- and post-code in the same function, separated only by `$next($request)`. Without visual markers, it is hard to distinguish which code runs on which leg of the journey, leading to bugs when developers add code in the wrong section.
---
## Bad Example
```php
public function handle($request, $next)
{
    Log::info('Request started');
    $response = $next($request);
    Log::info('Response sent');
    $response->headers->set('X-Duration', ...);
    return $response;
}
// No markers — difficult to scan intent quickly
```
---
## Good Example
```php
public function handle($request, $next)
{
    // Pre: Inbound — runs before controller
    Log::info('Request started', ['path' => $request->path()]);

    $response = $next($request);

    // Post: Outbound — runs after controller
    $response->headers->set('X-Duration', $this->duration());
    Log::info('Response sent', ['status' => $response->status()]);

    return $response;
}
```
---
## Exceptions
Very simple middleware with only pre- or only post-code.
---
## Consequences Of Violation
Accidental placement of post-code in pre-section (cannot modify response) or pre-code in post-section (runs too late).
