# Controller Response Selection

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Response Selection
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Controller actions must return appropriate HTTP responses that communicate success, failure, or resource state to the client. Laravel provides multiple response mechanisms—`response()->json()`, Eloquent API resources, `response()->noContent()`, `response()->redirectTo()`, and custom response macros—each suited to different scenarios within the resource controller pattern.

Selecting the correct response type is as important as writing correct business logic. Returning a 200 with an empty body for a DELETE operation confuses clients. Returning a 201 with the created resource for a store operation enables optimistic UI updates. The response is the contract between the server and client; choosing the right response for each controller action ensures that contract is clear and correct.

---

## Core Concepts

- **Status Code Semantics**: Each controller action has a semantically appropriate HTTP status code: 200 (OK), 201 (Created), 204 (No Content), 422 (Validation Error), 403 (Forbidden), 404 (Not Found), 500 (Server Error).
- **Eloquent API Resources**: `PhotoResource` and `PhotoResourceCollection` transform models into JSON with structural consistency.
- **Conditional Responses**: `json()` vs `noContent()` vs `response()->make()` for different response scenarios.
- **Response Macros**: Custom response methods registered via `Response::macro()` for team-standardized response envelopes.
- **Redirect Responses**: Web controllers return redirects (`redirect()->route()`); API controllers never redirect.

---

## Mental Models

- **Status Code as Signal**: The HTTP status code is the primary signal; the body is the payload. A 201 says "created" before the client reads the body.
- **Resource as Envelope**: Eloquent API resources are the envelope that wraps the model data. The controller constructs the envelope, not the raw data.
- **No Content Means Done**: `204 No Content` means "the action was performed, there is nothing to return." Standard for DELETE.

---

## Internal Mechanics

Laravel's response system is built on `Illuminate\Http\Response` and `Illuminate\Http\JsonResponse`. The `response()` helper returns a `ResponseFactory` instance that provides convenience methods.

**Status code conventions for resource controllers:**

| Action | Status Code | Body | Response Method |
|--------|-------------|------|----------------|
| index | 200 | Collection | `PhotoResource::collection(...)` |
| store | 201 | Single resource | `new PhotoResource(...)` |
| show | 200 | Single resource | `new PhotoResource(...)` |
| update | 200 | Single resource | `new PhotoResource(...)` |
| destroy | 204 | Empty | `response()->noContent()` |

Eloquent API resources extend `Illuminate\Http\Resources\Json\JsonResource`. The `toArray()` method defines the JSON structure. Wrapping a model in a resource calls `toArray()` during JSON serialization, ensuring consistent output across controllers.

Response macros are registered in `AppServiceProvider::boot()`:
```php
use Illuminate\Support\Facades\Response;

Response::macro('success', function ($data, $status = 200) {
    return response()->json(['data' => $data, 'status' => 'ok'], $status);
});
```

---

## Patterns

- **Standard API Responses**:
  ```php
  public function index()
  {
      return PhotoResource::collection(Photo::paginate());
  }

  public function store(StorePhotoRequest $request)
  {
      $photo = Photo::create($request->validated());
      return new PhotoResource($photo)->response()->setStatusCode(201);
  }

  public function show(Photo $photo)
  {
      return new PhotoResource($photo);
  }

  public function update(UpdatePhotoRequest $request, Photo $photo)
  {
      $photo->update($request->validated());
      return new PhotoResource($photo->fresh());
  }

  public function destroy(Photo $photo)
  {
      $photo->delete();
      return response()->noContent();
  }
  ```
- **Custom Response Envelope**:
  ```php
  public function index()
  {
      return response()->success(PhotoResource::collection(Photo::paginate()));
  }
  ```
- **Conditional Response for Update (202 Accepted)**:
  ```php
  public function update(UpdatePhotoRequest $request, Photo $photo)
  {
      $this->dispatcher->dispatch(new UpdatePhotoJob($photo, $request->validated()));
      return response()->accepted();
  }
  ```

---

## Architectural Decisions

- **Why `response()->noContent()` over `response()->json(null, 204)`?** `noContent()` explicitly communicates intent and avoids serialization overhead of `json(null)`.
- **Why API resources instead of `response()->json($model->toArray())`?** Resources provide structure consistency, conditional attribute inclusion, and relationship loading control. Raw `toArray()` output varies between endpoints.
- **Why 200 for update instead of 204?** Returning the updated resource confirms the changes and provides fresh data to the client without a follow-up GET request.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Semantic status codes improve API clarity | Inconsistent status codes confuse clients | Standardize with a team response guide |
| API resources ensure consistent JSON structure | Additional file per resource + collection | Acceptable for the structural consistency gained |
| Response macros reduce duplication | Macros can hide response construction details | Document macros in the API style guide |

---

## Performance Considerations

- API resource serialization has overhead proportional to the number of loaded relationships. Use `PhotoResource::collection()` with preloaded relationships to avoid N+1.
- `response()->noContent()` is the fastest response (no body serialization).
- Response macros add negligible overhead (one extra method call).
- JSON encoding time is proportional to payload size. Paginate collections; use `json_encode` options like `JSON_THROW_ON_ERROR` for debugging.

---

## Production Considerations

- Always return the created resource in store responses (201) so clients have the resource ID.
- Always return the updated resource in update responses (200) to confirm the changes.
- Never return `200 OK` with an error body; use the appropriate 4xx status code.
- Use `response()->noContent()` consistently for delete (204) so API clients can listen for the status code.
- Standardize response structure with a custom response trait or macro across all API controllers.
- Log response structure changes in a changelog to notify API consumers.

---

## Common Mistakes

- **Returning 200 with null body for DELETE**: `return response()->json(null)` instead of `response()->noContent()`.
  - *Why it happens:* Habitual use of `json()` for all responses.
  - *Why it's harmful:* API clients expect 204 for deletion; 200 with null body is ambiguous.
  - *Better approach:* Use `response()->noContent()` — 204, no body.

- **Forgetting `->response()->setStatusCode(201)` on store**: Returning `new PhotoResource($photo)` which defaults to 200.
  - *Why it happens:* The resource's default status code is 200.
  - *Why it's harmful:* API clients cannot distinguish "created" from "fetched."
  - *Better approach:* Always chain `->response()->setStatusCode(201)` for store responses.

- **Returning the model directly instead of an API resource**: `return $photo` instead of `return new PhotoResource($photo)`.
  - *Why it happens:* Direct model serialization works for simple cases.
  - *Why it's harmful:* Inconsistent JSON structure; exposed attributes may include sensitive fields.
  - *Better approach:* Always wrap models in API resources for consistent output.

---

## Failure Modes

- **PHP JSON encoding failure on resource serialization**: A resource contains binary data or circular references. *Detection:* 500 error instead of expected JSON response. *Mitigation:* Test resource serialization with factory-generated models; use `JSON_THROW_ON_ERROR` in development.

- **Incorrect status code masking errors**: A 200 response with an error body. *Detection:* API client reports success but receives an error message. *Mitigation:* Use appropriate 4xx/5xx codes; validate status codes in integration tests.

- **Response header mismatch**: Setting `Content-Type: application/json` but returning HTML (e.g., debugbar output). *Detection:* Client fails to parse response. *Mitigation:* Ensure `Accept: application/json` handling is consistent; disable debugbar for API requests.

---

## Ecosystem Usage

- **Laravel API Resources (Built-in)**: The official Eloquent API resource package provides `JsonResource` and `ResourceCollection` base classes.
- **Spatie Fractal**: A popular alternative response layer for Laravel APIs, providing transformers and includes.
- **Laravel Orion**: A package that auto-generates API resource responses for standard CRUD operations with consistent status codes.

---

## Related Knowledge Units

### Prerequisites
- API Resource Controllers
- Eloquent API Resources

### Related Topics
- Controller Action Delegation
- Controller Form Request Integration

### Advanced Follow-up Topics
- Controller Testing Strategies
- API Versioning

---

## Research Notes

### Source Analysis
- `Illuminate\Http\Response` — base HTTP response class
- `Illuminate\Http\JsonResponse` — JSON-specific response
- `Illuminate\Http\Resources\Json\JsonResource` — API resource base
- `Illuminate\Routing\ResponseFactory` — response factory with macros

### Key Insight
The status code is the primary communication channel; the body is secondary. A 201 communicates "created" even before the client reads the JSON. Choose status codes deliberately.

### Version-Specific Notes
- Eloquent API resources introduced in Laravel 5.5.
- `response()->noContent()` added in Laravel 5.6.
- `response()->accepted()` (202) added in Laravel 8.x.
- `JsonResource::collection()` vs `ResourceCollection` — both work; `collection()` is more concise.
