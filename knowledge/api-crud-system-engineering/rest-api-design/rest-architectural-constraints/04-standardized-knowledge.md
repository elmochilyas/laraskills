# REST Architectural Constraints

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: rest-architectural-constraints
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
REST (Representational State Transfer) is defined by six architectural constraints that collectively produce the properties of scalability, simplicity, modifiability, visibility, portability, and reliability. The six constraints are: client-server separation, statelessness, cacheability, layered system, uniform interface, and code on demand (optional).

In Laravel applications, statelessness is the most practically impactful constraint — every request must carry all information the server needs. Laravel's API middleware stack (`api` guard) excludes session and cookie middleware, enforcing statelessness by default. The uniform interface constraint is further decomposed into four sub-constraints: resource identification in requests, resource manipulation through representations, self-descriptive messages, and HATEOAS.

## Core Concepts
- **Client-Server**: Separation of concerns between UI (client) and data storage (server). Enables independent evolution.
- **Stateless**: Every request contains all information needed — no server-side session state. Enables horizontal scaling.
- **Cacheable**: Responses must explicitly declare cacheability. Enables performance optimization via intermediaries.
- **Layered System**: Intermediaries (proxies, gateways, load balancers) can be inserted transparently.
- **Uniform Interface**: Consistent contract — same URI structure, methods, status codes. Four sub-constraints.
- **Code on Demand (optional)**: Servers can extend client functionality via downloadable code.
- **Statelessness in Practice**: No `session()` in API routes, token-based auth, request validation includes all context, rate limiting by IP/token not session.

## When To Use
- **All six constraints**: Building a true REST API per Fielding's definition — rare in practice
- **Statelessness + Cacheability + Client-Server**: The pragmatic core that most production APIs implement
- **Uniform interface (without HATEOAS)**: Level 2 REST — proper HTTP methods, status codes, and resource URLs
- **Layered system**: Any API behind a reverse proxy, CDN, or load balancer (most production deployments)

## When NOT To Use
- **Full REST with HATEOAS**: If clients are not hypermedia-aware — the effort exceeds the benefit
- **Code on demand**: Almost never used in API design — introduces security risks from arbitrary code execution
- **Strict uniform interface**: If the domain operations don't map to CRUD — action endpoints are acceptable
- **Statelessness for session-dependent workflows**: Multi-step wizards may benefit from server-side session state (but model as resources)

## Best Practices (WHY)
- **Apply constraints together**: Partial application (using HTTP methods without statelessness or cacheability) produces an HTTP API that doesn't qualify as REST. The constraints work as a system.
- **Enforce statelessness via middleware stack**: Use the `api` middleware group that excludes `StartSession` and `ShareErrorsFromSession`. Never add session middleware to API routes.
- **Set explicit cache headers on every response**: Even if the answer is "do not cache" (`no-cache, no-store`), explicit headers prevent unpredictable caching behavior.
- **Use token-based authentication**: Sanctum tokens or Passport OAuth — never sessions for API auth. Tokens enable horizontal scaling without session affinity.
- **Model client-specific state as resources**: Shopping carts, wizards, and multi-step forms should store state as server resources (`/carts/abc123`), not in server-side sessions.

## Architecture Guidelines
- Laravel's dual middleware stacks (`api` and `web`) reflect the client-server constraint. Never mix them.
- The layered system constraint maps to Laravel's middleware pipeline — each layer transforms request/response independently.
- For cacheability, use `SetCacheHeaders` middleware or explicit headers on every GET response.
- Use correlation IDs (generated client-side or by load balancer) for production debugging — without sessions, correlating requests requires this.
- Stateless servers allow round-robin load balancing with no session affinity — ensure the load balancer doesn't pin clients to specific servers.

## Performance
- Token validation on every request adds 1-5ms (Sanctum token lookup) or ~0.5ms (JWT validation without DB lookup).
- Proper cache headers enable 90%+ cache hit ratios on read-heavy endpoints — reducing server load by 90%.
- The `api` middleware stack is typically shallower than `web`, contributing to faster API response times.
- Each middleware layer adds ~0.1-0.5ms per request — keep the pipeline minimal for APIs.

## Security
- Statelessness prevents session hijacking (no session ID to steal) but requires secure token storage on the client.
- Cache headers must distinguish public vs private data — `Cache-Control: private` for user-specific responses.
- The layered system constraint allows security layers (WAF, rate limiting, auth) to be inserted transparently without modifying application code.
- Never add `StartSession` middleware to API routes — it introduces session state and CSRF requirements.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Mixing API and web middleware | Adding `web` middleware to API routes to access `session()` | Convenience | Breaks statelessness, prevents horizontal scaling | Use token-based auth for APIs; never add session middleware to API routes |
| Assuming REST = HTTP API | Treating any HTTP API as REST | Tutorials conflate HTTP and REST | API lacks caching, statelessness, uniform interface | Apply all six constraints, not just HTTP verbs |
| Ignoring cache headers | No Cache-Control on API responses | Cache headers invisible in development | Production traffic hits server for every request | Set explicit cache headers on every response |
| Server-side session in APIs | Using `session()` in API routes | Convenience over correctness | Prevents horizontal scaling, complicates deployment | Model state as resources or pass context with each request |
| No correlation IDs | No request tracking across layers | Statelessness means no session to correlate | Cannot debug multi-step failures | Add correlation ID header generated by load balancer or client |
| Partial constraint adoption | Using HTTP methods and resources but not statelessness or caching | Cherry-picking easy constraints | Missing the key benefits of REST architecture | Apply constraints as a system |

## Anti-Patterns
- **REST as HTTP Checklist**: Thinking REST = GET/POST/PUT/DELETE + status codes. The constraints are the definition.
- **Session-Auth for APIs**: Using Laravel's session-based authentication on API routes. Breaks statelessness.
- **No Cache Headers**: Assuming browsers won't cache API responses. They will, unpredictably.
- **Server-Side Session State**: Storing client context in server sessions for API clients.
- **Layered System Violation**: Writing application code that depends on specific intermediary behavior.

## Examples
```php
// Laravel's API middleware stack enforces statelessness
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'throttle:api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
];
// Note: No StartSession, ShareErrorsFromSession, or EncryptCookies

// Stateless authentication via token
public function login(Request $request)
{
    $user = User::where('email', $request->email)->first();
    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json(['message' => 'Invalid credentials.'], 401);
    }
    $token = $user->createToken('api-token')->plainTextToken;
    return response()->json(['token' => $token]);
}

// Explicit cache declaration
return response()->json($data)
    ->header('Cache-Control', 'public, max-age=3600');

// Model state as resource (stateless alternative to session)
Route::post('carts', [CartController::class, 'store']);
Route::post('carts/{cart}/items', [CartItemController::class, 'store']);
```

## Related Topics
- **Prerequisites**: http-protocol-fundamentals, client-server-architecture
- **Related**: resource-vs-action-orientation, rest-maturity-model, hateoas-hypermedia-controls, url-structure-design
- **Advanced**: cqrs-event-sourcing, graphql, grpc

## AI Agent Notes
- Use the `api` middleware group — never add session middleware to API routes.
- Use token-based auth (Sanctum) — never session-based auth for APIs.
- Set explicit `Cache-Control` headers on every response.
- Use correlation IDs for request tracing across layers.
- Model client-specific state as resources, not server sessions.
- The six constraints must be applied together — partial adoption weakens the architecture.

## Verification
- API routes use the `api` middleware group (no `StartSession` or `ShareErrorsFromSession`).
- Authentication is token-based (Sanctum/Passport), not session-based.
- Every GET response includes explicit `Cache-Control` header.
- No `session()` calls appear in API route handlers or controllers.
- Correlation IDs are present in request/response for tracing.
- The application scales horizontally without session affinity.
- Cache headers correctly distinguish public and private responses.
