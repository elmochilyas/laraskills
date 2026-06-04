# DTO Integration: toDto() Method — Rules

## Choose payload() or toDto() — Never Both on the Same Endpoint
---
## Category
Code Organization | Maintainability
---
## Rule
Use either `payload()` (request-bound) or `toDto()` (standalone mapper) per endpoint — never define both for the same endpoint.
---
## Reason
Having two conversion paths for the same request creates ambiguity about which one is authoritative, leading to inconsistent DTO construction and maintenance confusion.
---
## Bad Example
```php
class StorePostRequest extends FormRequest
{
    public function payload(): PostData { ... }
}

class MapPostRequestToData
{
    public function __invoke(StorePostRequest $request): PostData { ... }
}
// Both exist — which one is used?
```
---
## Good Example
```php
// Choose request-bound payload() for simple mapping
class StorePostRequest extends FormRequest
{
    public function payload(): PostData { ... }
}
// OR standalone mapper for cross-version scenarios
class MapPostRequestToData
{
    public function __invoke(StorePostRequest $request): PostData { ... }
}
```
---
## Exceptions
No common exceptions — pick one pattern per endpoint and be consistent across the codebase.
---
## Consequences Of Violation
Confusion about authoritative DTO source; wasted maintenance on two parallel conversion paths; risk of the two paths diverging behavior.

---

## Use Standalone Mappers for Cross-Version Scenarios
---
## Category
Architecture | Scalability
---
## Rule
Use standalone invokable `toDto()` mappers when different API versions require different request-to-DTO mappings, enabling version bridging without changing request classes.
---
## Reason
Request classes are versioned by namespace (`V1\`, `V2\`). When V2 adds a field that V1 doesn't have, a standalone mapper can map V1 requests to the same DTO (or vice versa) without duplicating request classes.
---
## Bad Example
```php
// V1 and V2 both have StorePostRequest but duplicate almost all logic
// just to handle slightly different DTO mapping
```
---
## Good Example
```php
// V1 mapper bridges V1 request shape to V2 DTO
class V1PostRequestToV2Dto
{
    public function __invoke(V1\StorePostRequest $request): PostData { ... }
}
```
---
## Exceptions
When API versions share identical request shapes and DTOs — `payload()` on the request suffices.
---
## Consequences Of Violation
Duplicated request classes across versions; brittle mapping spread across multiple files; breaking changes ripple through all versions.

---

## Keep Mappers as Pure Transformations — No I/O or Side Effects
---
## Category
Reliability | Testing
---
## Rule
Keep `toDto()` mappers as pure data transformation functions — no database queries, API calls, job dispatches, or file writes.
---
## Reason
Mappers that perform I/O introduce latency, coupling, and side effects into what should be a predictable data conversion. Side effects in mappers execute even when the downstream action fails.
---
## Bad Example
```php
public function __invoke($request): PostData
{
    $category = Category::find($request->validated('category_id')); // I/O in mapper
    return new PostData(...);
}
```
---
## Good Example
```php
public function __invoke($request): PostData
{
    return new PostData(...$request->validated()); // Pure transformation
}
```
---
## Exceptions
Accessing the authenticated user (`$request->user()`) is in-memory and acceptable.
---
## Consequences Of Violation
Slow request processing; untestable without mocking DB/HTTP; side effects executing on validation failure; error handling complexity.

---

## Use Only Validated Data in toDto() Mappers
---
## Category
Security
---
## Rule
Pass only `$request->validated()` data to the mapper — never pass the raw request or use `$request->all()` or `$request->input()`.
---
## Reason
A standalone mapper receives the request after validation. Using raw input methods bypasses validation, allowing unvalidated data to enter the domain layer through the mapper.
---
## Bad Example
```php
public function __invoke($request): PostData
{
    return new PostData(
        title: $request->input('title'), // Bypasses validation
    );
}
```
---
## Good Example
```php
public function __invoke($request): PostData
{
    return new PostData(
        ...$request->validated(),
        authorId: $request->user()->id,
    );
}
```
---
## Exceptions
Server-generated fields (user ID, IP address) from authenticated context — these are not user input.
---
## Consequences Of Violation
Invalid data enters the domain; validation rules are bypassed; security vulnerabilities from unvalidated input reaching business logic.

---

## Register Invokable Mappers in the Container
---
## Category
Architecture | Maintainability
---
## Rule
Register invokable `toDto()` mapper classes in the service container so they can be injected automatically into controllers.
---
## Reason
Without container registration, controllers must instantiate mappers manually, creating tight coupling and making it harder to swap implementations or apply decorators.
---
## Bad Example
```php
public function store(Request $request): JsonResponse
{
    $mapper = new MapPostRequestToData(new SkuRepository()); // Manual instantiation
    $post = Post::create($mapper($request));
}
```
---
## Good Example
```php
// Registered in container — automatic resolution
public function store(StorePostRequest $request, MapPostRequestToData $mapper): JsonResponse
{
    $post = Post::create($mapper($request));
}
```
---
## Exceptions
Mappers with no dependencies can be instantiated inline without registration, but registering is still preferred for consistency.
---
## Consequences Of Violation
Tight coupling between controllers and mapper implementations; difficulty swapping mappers for testing or versioning; scattered instantiation logic.

---

## Name Mappers Descriptively — Avoid Collision with Eloquent
---
## Category
Maintainability
---
## Rule
Name standalone mapper classes descriptively (e.g., `MapPostRequestToData`, `PostRequestToDtoMapper`) and avoid `$model->toDto()` naming that collides with Eloquent accessor conventions.
---
## Reason
A method named `toDto()` on both a request and an Eloquent model creates ambiguity about the data source — developers cannot tell from the call site whether the data comes from HTTP input or the database.
---
## Bad Example
```php
class Post extends Model
{
    public function toDto(): PostData { ... } // toDto on model
}

class StorePostRequest extends FormRequest
{
    public function toDto(): PostData { ... } // toDto on request — same name, different context
}
```
---
## Good Example
```php
class MapPostRequestToData
{
    public function __invoke(StorePostRequest $request): PostData { ... }
}
```
---
## Exceptions
No common exceptions — keep mapper names distinct from model method names.
---
## Consequences Of Violation
Developer confusion about whether DTO data originates from request or database; accidental misuse of the wrong `toDto()` in controllers.
