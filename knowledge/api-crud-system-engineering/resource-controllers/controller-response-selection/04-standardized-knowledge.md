| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Response Selection |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | API Resource Controllers, Eloquent API Resources |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Controller actions must return appropriate HTTP responses that communicate success, failure, or resource state to the client. Laravel provides multiple response mechanisms — `response()->json()`, Eloquent API resources, `response()->noContent()`, `response()->accepted()`, and custom response macros — each suited to different scenarios within the resource controller pattern.

## Core Concepts

- **Status Code Semantics**: Each action has a semantically appropriate code: 200 (OK), 201 (Created), 204 (No Content), 422 (Validation), 403 (Forbidden).
- **Eloquent API Resources**: `PhotoResource` and `PhotoResourceCollection` transform models into consistent JSON.
- **noContent()**: 204 response for DELETE — explicitly communicates "action performed, nothing to return."
- **Response Macros**: Custom methods via `Response::macro()` for team-standardized response envelopes.
- **Controller Status Code Table**: `index` → 200 + collection, `store` → 201 + resource, `show` → 200 + resource, `update` → 200 + resource, `destroy` → 204 + no body.

## When To Use

- All API resource controller actions — use the standardized status code per action.
- `response()->noContent()` for all DELETE operations.
- Eloquent API resources for any response returning model data.
- `response()->accepted()` for asynchronous operations (202 Accepted).
- Response macros for team-standardized response envelopes.

## When NOT To Use

- Returning 200 with null body for DELETE — use 204.
- Returning models directly instead of API resources — inconsistent, may leak attributes.
- Using `response()->json()` with raw model data — always use API resources.
- Returning 200 with an error body — use the appropriate 4xx/5xx code.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always return the created resource on store (201) | Clients need the resource ID for immediate use |
| Always return the updated resource on update (200) | Confirms changes; client doesn't need a follow-up GET |
| Use `response()->noContent()` for delete | REST convention — 204, no body |
| Never return 200 with an error body | Status code is the primary signal; body is secondary |
| Always wrap models in API resources | Consistent JSON structure; controls exposed attributes |
| Use `response()->accepted()` for async operations | Signals "request accepted but not yet processed" |

## Architecture Guidelines

- Standardize the response structure across all API controllers with a custom response macro or trait.
- Chain `->response()->setStatusCode(201)` on API resources for store actions.
- Use `PhotoResource::collection($photos)` for index instead of manually mapping.
- Never return views, redirects, or HTML from API controllers.
- Return `$photo->fresh()` after update to ensure the response has the latest data.

## Performance Considerations

- API resource serialization overhead is proportional to loaded relationships — preload to avoid N+1.
- `response()->noContent()` is the fastest response (no body, no serialization).
- Response macros add negligible overhead (one extra method call).
- JSON encoding time scales with payload size — paginate collections.

## Security Considerations

- API resources control attribute exposure — never return raw models.
- Status codes can leak information (e.g., 403 vs 404 for resource existence).
- Ensure `Content-Type: application/json` is set on all API responses.
- Debug output (debugbar, whoops) must be disabled for API requests.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Returning 200 with null body for DELETE | Habitual use of `json()` | 200 with null is ambiguous | `response()->noContent()` |
| Forgetting 201 status on store | Default returns 200 | Clients can't distinguish created from fetched | Chain `->response()->setStatusCode(201)` |
| Returning models directly | Works for simple cases | Inconsistent JSON; may leak sensitive attributes | Always wrap in API resources |

## Anti-Patterns

- **200 OK with error in body**: Clients expect 200 to mean success; error bodies on 200 confuse clients.
- **Naked model returns**: `return $photo` instead of `return new PhotoResource($photo)`.
- **Inconsistent status codes**: Different endpoints returning different codes for the same action.
- **204 for update**: Clients need the updated resource; 204 forces a follow-up request.

## Examples

- **Index**: `return PhotoResource::collection(Photo::paginate());` → 200
- **Store**: `return new PhotoResource($photo)->response()->setStatusCode(201);` → 201
- **Show**: `return new PhotoResource($photo);` → 200
- **Update**: `return new PhotoResource($photo->fresh());` → 200
- **Destroy**: `return response()->noContent();` → 204
- **Async**: `return response()->accepted();` → 202

## Related Topics

- API Resource Controllers — The five-method pattern
- Eloquent API Resources — Transforming models to JSON
- Controller Action Delegation — Delegation keeps response selection simple

## AI Agent Notes

- Always use the standardized status code table for resource controller actions.
- Use `response()->noContent()` for destroy, not `response()->json(null, 204)`.
- Chain `->response()->setStatusCode(201)` on API resources for store.
- Return `$photo->fresh()` after update to ensure response freshness.

## Verification

- [ ] index returns 200 with resource collection
- [ ] store returns 201 with the created resource
- [ ] show returns 200 with the resource
- [ ] update returns 200 with the updated resource (using fresh())
- [ ] destroy returns 204 via `response()->noContent()`
- [ ] All model responses use API resources, not raw models
- [ ] Response structure is consistent across all endpoints
- [ ] No 200 responses with error bodies
