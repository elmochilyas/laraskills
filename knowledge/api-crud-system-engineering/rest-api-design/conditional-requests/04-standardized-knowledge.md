# Conditional Requests

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: conditional-requests
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Conditional requests use HTTP headers to make requests dependent on resource state. Clients can avoid re-downloading unchanged resources (cache validation) or prevent lost updates (optimistic concurrency). The mechanism uses ETags (entity tags) and timestamps (Last-Modified/If-Modified-Since) as condition indicators.

Two primary use cases exist: cache validation (GET with `If-None-Match` returns 304 Not Modified) and optimistic concurrency (PUT/PATCH with `If-Match` returns 412 Precondition Failed on conflict). Laravel provides ETag generation support via `SetCacheHeaders` middleware, but full conditional request handling for write operations requires custom middleware or manual header parsing.

## Core Concepts
- **ETag (Strong vs Weak)**: Strong ETags (`"abc123"`) require byte-for-byte equality; weak ETags (`W/"abc123"`) allow semantic equivalence. Use strong for binary content, weak for JSON where formatting differences are irrelevant.
- **If-Match**: "Only if ETag matches" — used with PUT, PATCH, DELETE for optimistic concurrency.
- **If-None-Match**: "Only if ETag doesn't match" — used with GET for cache validation.
- **If-Modified-Since**: "Only if modified after timestamp" — GET cache validation, simpler but less precise than ETag.
- **If-Unmodified-Since**: "Only if not modified after timestamp" — PUT/PATCH/DELETE concurrency.
- **304 Not Modified**: Empty-body response for cache validation — saves bandwidth when resource unchanged.
- **412 Precondition Failed**: Response when write condition fails — client must re-fetch and retry.

## When To Use
- **Cache validation**: Any GET endpoint where data changes less frequently than it is requested
- **Optimistic concurrency**: Write endpoints where concurrent updates are possible (orders, payments, profiles)
- **ETag-based caching**: Resources where bandwidth savings from 304 responses justify ETag computation
- **Last-Modified**: Resources with reliable timestamps and where second-level precision is sufficient

## When NOT To Use
- Write endpoints with no concurrent modification risk (append-only logs, event streams)
- Endpoints where data changes on every request (no benefit from conditional checks)
- Resources where computing ETag is more expensive than re-serializing the response
- Legacy systems with unreliable timestamps or no version tracking
- Streaming endpoints where conditional logic adds latency without value

## Best Practices (WHY)
- **Use ETags for writes, Last-Modified for reads**: ETags are more precise and required for If-Match concurrency. Last-Modified is simpler and sufficient for cache validation but has 1-second resolution.
- **Compute ETags from model timestamps**: `md5($model->updated_at->timestamp)` avoids serializing the resource just to compute the hash. An order of magnitude cheaper than full-content hashing.
- **Always return current ETag in 412 responses**: Include the current ETag and resource state so clients can merge changes or retry with the correct version.
- **Use If-Match only for high-contention resources**: Requiring If-Match on every write increases client complexity (two requests per write: read ETag, then write). Apply selectively.
- **Set Vary header correctly**: When content negotiation affects responses, set `Vary: Accept, Accept-Encoding` to tell caches to store different versions per header value.

## Architecture Guidelines
- Cache validation (GET + If-None-Match → 304) and optimistic concurrency (PUT + If-Match → 412) are separate concerns with different implementations.
- `SetCacheHeaders` middleware handles GET ETag generation. For write endpoints, implement custom middleware or handle in the controller.
- Always `fresh()` the model before attaching ETag to write responses — otherwise the returned ETag matches the old state.
- Strong ETags change when response formatting changes (e.g., adding a field). This is correct — representation changed, so clients should re-fetch.
- In multi-datacenter deployments, prefer ETags over Last-Modified to avoid clock synchronization issues.

## Performance
- MD5 hash of full response body: ~1-5µs per KB. For 100KB responses, this adds measurable time.
- Model-timestamp ETag: ~0.01ms — negligible. Prefer this over full-content hashing.
- 304 responses save ~99% of response bandwidth when content is unchanged.
- ETags must be recomputed on every request — cache computed ETags in Redis for resources with expensive computation.

## Security
- Never trust client-supplied ETags for write operations without validation against current server state.
- Weak ETags can cause false positives in monitoring systems that check exact response equality.
- 412 responses should include the current ETag and resource state — never expose internal version identifiers or database state.
- ETag computation from user-controlled fields must be consistent — a field change must change the ETag regardless of authorization context.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Fixed ETag string | Using a constant or request-based ETag | Misunderstanding ETag purpose | ETag doesn't change when content changes, or changes spuriously | Hash content or `updated_at` timestamp |
| Not handling 412 gracefully | 412 with no explanation or current state | Focus on success path only | Clients cannot resolve conflict without re-fetching | Return current ETag and resource state in 412 body |
| If-Match on all endpoints | Requiring If-Match for low-contention resources | "Optimistic concurrency is good everywhere" | Doubles request count for simple updates | Require If-Match only for high-contention resources |
| Stale ETag after write | Setting ETag before refreshing model | Order of operations in controller | Next conditional request incorrectly detects match | `fresh()` the model before attaching ETag |
| No ETag on cache-variable responses | Responses that vary by user/permissions without ETag differentiation | Assuming ETag is content-only | One user's cached response served to another | Include user context in ETag computation |
| HEAD with conditional | Not handling If-None-Match on HEAD requests | HEAD is treated separately from GET | HEAD requests bypass cache validation | Apply same conditional logic to HEAD as GET |

## Anti-Patterns
- **ETag as Security Token**: Using ETags for authorization — ETags are cache validators, not access controls.
- **ETag on POST**: POST is not cacheable by default; ETags on POST provide no value.
- **Stateless ETag Without Cache**: Recomputing expensive ETags on every request without caching the result.
- **Last-Modified Without ETag**: Using only timestamps loses precision for concurrent modification detection.
- **Ignoring If-None-Match for Conditional GET**: The server generates ETag but never checks incoming conditional headers.

## Examples
```php
// ETag from model timestamp for GET
public function show(User $user)
{
    $response = response()->json(new UserResource($user));
    $etag = '"' . md5($user->updated_at->timestamp) . '"';
    $response->setEtag($etag);
    $response->setLastModified($user->updated_at);
    return $response;
}

// Optimistic concurrency for PATCH
public function update(Request $request, User $user)
{
    $etag = $request->header('If-Match');
    if ($etag) {
        $currentEtag = '"' . md5($user->updated_at->timestamp) . '"';
        if ($etag !== $currentEtag) {
            return response()->json([
                'message' => 'Stale resource version.',
                'current_etag' => $currentEtag,
            ], 412);
        }
    }
    $user->update($request->validated());
    $response = response()->json(new UserResource($user->fresh()));
    $response->setEtag('"' . md5($user->fresh()->updated_at->timestamp) . '"');
    return $response;
}

// Using Laravel's SetCacheHeaders middleware
Route::get('users', [UserController::class, 'index'])
    ->middleware('cache.headers:public;max_age=3600;etag');
```

## Related Topics
- **Prerequisites**: http-method-semantics, http-status-code-selection
- **Related**: idempotency-semantics, response-caching-headers
- **Advanced**: distributed-caching-strategies, event-sourcing-cqrs

## AI Agent Notes
- Use model timestamp ETags (`md5($updated_at)`) instead of full-content hashing for performance.
- Handle If-Match on write endpoints to prevent lost updates — return 412 with current ETag on conflict.
- Always `fresh()` the model before setting ETag on write responses.
- Apply same conditional logic to HEAD as GET (Laravel converts HEAD to GET automatically).
- Cache computed ETags in Redis for resources with expensive ETag computation.

## Verification
- Every GET response includes `ETag` and/or `Last-Modified` headers.
- `If-None-Match` requests return 304 when resource is unchanged.
- PUT/PATCH/DELETE with `If-Match` return 412 when resource has been modified.
- 412 responses include the current ETag and resource state.
- ETag changes when resource representation changes.
- `Vary` header is set correctly for content-negotiated responses.
