# Skill: Select Appropriate Response Type in Controllers
## Purpose
Choose the correct response helper or class — `JsonResponse`, Eloquent API Resource, Collection, paginated response, or custom Response — based on the action's purpose and data shape.
## When To Use
Every controller action that returns a response; when standardizing API output format across endpoints.
## When NOT To Use
Non-API responses (blade views, redirects); file downloads (use StreamedResponse or BinaryFileResponse).
## Prerequisites
Laravel API Resources; JSON Response helpers; Pagination; Response Structure patterns.
## Inputs
Return data type (model, collection, paginator, array, null); HTTP status code; response format conventions.
## Workflow
1. For single model: return `new ResourceType($model)` with 200
2. For collection: return `ResourceType::collection($models)` with 200
3. For paginated: return `ResourceType::collection($paginator)` — pagination meta auto-included
4. For created resource: return `new ResourceType($model)` with 201
5. For no-content actions (delete, update with no body): `response()->noContent()` with 204
6. For validation errors: throw `ValidationException` or return `response()->json()` with 422
7. For conditional responses (cache hit vs miss): use `ResourceType::make()` with `->additional()`
8. For custom status/data: `response()->json(['message' => '...'], $status)`
## Validation Checklist
- [ ] Store returns 201 with resource JSON (not 200)
- [ ] Destroy returns 204 with no body (not 200 with null data)
- [ ] Update returns 200 with resource JSON (or 204 if convention says no body)
- [ ] Index returns 200 with collection/paginator
- [ ] Show returns 200 with single resource
- [ ] Paginated responses include pagination meta automatically
- [ ] Error responses return consistent error shape
- [ ] No response returns raw `json_encode()` output
- [ ] API Resource classes are used for model responses — not manual arrays
## Common Failures
- Store returns 200 instead of 201 — client can't distinguish creation from retrieval
- Destroy returns `['message' => 'deleted']` with 200 — 204 is the correct convention
- Manual JSON construction instead of API Resources — inconsistent output
- Not wrapping single resources in a Resource class — missing envelope keys
- Using `response()->json($model)` — serializes all model attributes including hidden
## Decision Points
- 200 + resource body vs 204 no-content for update actions
- Paginated resource collection vs manual pagination meta construction
- JSON:API envelope (`data` wrapper) vs bare response per endpoint
## Performance/Security Considerations
API Resources are lazily loaded — only serialize attributes defined in the resource. Security: Resource classes control which attributes are exposed — never use `response()->json($model)` directly.
## Related Rules/Skills
Laravel API Resources; Pagination Metadata Design; JSON:API Compound Documents; Response Status Codes.
## Success Criteria
Every controller action returns the correct response type and status code; API Resources handle serialization; no raw model exposure; consistency across endpoints.
