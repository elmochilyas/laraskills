# DTO Integration: toDto() Method

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** dto, todto, data-transfer-object, request-to-dto, laravel

## Executive Summary
Phase 2 covers the `toDto()` method pattern — a convention for converting validated request data into a DTO. Unlike `payload()`, `toDto()` is typically a standalone conversion method that can exist on the request or as a separate mapper. This phase covers implementation strategies, naming conventions, and placement decisions.

## Core Concepts

### toDto() as Explicit Conversion
The `toDto()` method explicitly converts the request's validated data into a domain DTO:
```php
// On the request itself
class StorePostRequest extends FormRequest
{
    public function toDto(): PostData
    {
        return new PostData(
            title: $this->validated('title'),
            body: $this->validated('body'),
        );
    }
}

// Or as a standalone mapper
class PostRequestToDtoMapper
{
    public function map(StorePostRequest $request): PostData
    {
        return PostData::from($request->validated());
    }
}
```

### payload() vs toDto()
| Aspect | payload() | toDto() |
|---|---|---|
| Location | On request | Request or separate mapper |
| Pattern origin | Spatie DataRequest convention | Service layer conversion pattern |
| Responsibility | Request knows its DTO | Conversion can be external |
| Testability | Test request + DTO together | Test mapper independently |
| Versioning | Coupled to request version | Mapper can bridge versions |

## Internal Mechanics

### Request-Bound toDto()
```php
class StorePostRequest extends FormRequest
{
    public function toDto(): PostData
    {
        return PostData::from([
            'title' => $this->validated('title'),
            'body' => $this->validated('body'),
            'author_id' => $this->user()->id,
            'slug' => Str::slug($this->validated('title')),
            'status' => PostStatus::tryFrom($this->validated('status')) ?? PostStatus::Draft,
        ]);
    }
}
```

### Standalone toDto() Mapper
```php
class PostRequestToDtoMapper
{
    public function __construct(
        private readonly SlugService $slugs,
    ) {}

    public function fromStoreRequest(StorePostRequest $request): PostData
    {
        return new PostData(
            title: $request->validated('title'),
            slug: $this->slugs->generate($request->validated('title')),
            body: $request->validated('body'),
            authorId: $request->user()->id,
            status: PostStatus::Draft,
        );
    }

    public function fromUpdateRequest(UpdatePostRequest $request, Post $post): PostData
    {
        return new PostData(
            title: $request->validated('title', $post->title),
            slug: $request->has('title')
                ? $this->slugs->generate($request->validated('title'))
                : $post->slug,
            body: $request->validated('body', $post->body),
            authorId: $post->author_id,
            status: PostStatus::tryFrom($request->validated('status', $post->status->value)) ?? $post->status,
        );
    }
}
```

## Patterns

### Invokable DTO Mapper
```php
class MapPostRequestToData
{
    public function __invoke(StorePostRequest $request): PostData
    {
        return PostData::from($request->validated());
    }
}

// Usage in controller:
public function store(StorePostRequest $request, MapPostRequestToData $mapper): PostResource
{
    $post = Post::create($mapper($request));
    return PostResource::make($post);
}
```

### Pipeline with toDto()
```php
class StorePostController extends Controller
{
    public function store(StorePostRequest $request): PostResource
    {
        $dto = $request->toDto();

        // Pipeline: request → DTO → action → response
        $post = $this->dispatchSync(new CreatePostAction($dto));

        return PostResource::make($post);
    }
}
```

### toDto() with Update Handling
```php
class UpdatePostRequest extends FormRequest
{
    public function toDto(Post $post): PostData
    {
        return new PostData(
            title: $this->validated('title', $post->title),
            body: $this->validated('body', $post->body),
            status: PostStatus::tryFrom($this->validated('status', $post->status->value)) ?? $post->status,
        );
    }
}

// Controller:
public function update(UpdatePostRequest $request, Post $post): PostResource
{
    $post = $this->posts->update($post, $request->toDto($post));
    return PostResource::make($post);
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| toDto() on request | Mapping lives with its validation rules | Standalone mapper — reusable across request types |
| Standalone mapper | DTO conversion can be versioned independently | Request-bound — version coupling |
| Invokable class | Single responsibility, testable, injectable | Static method — not mockable |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Request-bound toDto() | Simple, co-located with validation | Cannot reuse across request types |
| Standalone mapper | Reusable, testable, bridge versions | Extra class per DTO mapping |
| Invokable mapper | Clean pipeline syntax (callable) | Less discoverable than named method |

## Performance Considerations
- `toDto()` DTO construction is in-memory — negligible cost.
- Standalone mappers add one class per request-to-DTO mapping.
- Invokable mappers resolved via container per request — fine for typical use.

## Production Considerations
- Document whether `toDto()` includes author/audit fields or just validated data.
- Test `toDto()` with all valid input combinations.
- Use readonly DTOs to prevent mutation after `toDto()` returns.
- Version mappers when API version changes DTO structure.

## Common Mistakes
- Calling `toDto()` before validation — `validated()` returns empty or throws.
- Including unvalidated data in the DTO — defeats validation purpose.
- Using `toDto()` on the request but not passing authenticated user context.
- Making `toDto()` do I/O or API calls — should construct in-memory only.
- Naming collision — `toDto()` used elsewhere (Eloquent model conversion).

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| toDto() called without validation | Missing data or exception | Controller uses type-hinted request |
| DTO constructor requires extra fields | TypeError | Ensure validated() covers all DTO properties |
| Mapper not registered in container | BindingResolutionException | Register mapper in service provider |
| Version mismatch in mapper | Wrong DTO fields populated | Version mapper alongside API version |

## Ecosystem Usage

### Spatie Laravel Data Manual toDto()
```php
class StorePostRequest extends FormRequest
{
    public function toDto(): PostData
    {
        return PostData::from([
            ...$this->validated(),
            'author_id' => $this->user()->id,
        ]);
    }
}
```

### Laravel Auto-Mapper (ricanbe/automapper)
```php
class StorePostRequest extends FormRequest
{
    public function toDto(): PostData
    {
        return (new AutoMapper())->map($this->validated(), PostData::class);
    }
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — request that provides validated data.
- **data-transfer-object-design** — DTO fundamentals for toDto().

### Related Topics
- **dto-integration-payload-method** — alternative payload() pattern.
- **input-preparation** — preparing input before toDto().

### Advanced Follow-up Topics
- **dto-construction-patterns** — construction strategies for toDto().
- **controller-dto-action-flow** — how toDto() fits in the controller flow.

## Research Notes

### Source Analysis
The `toDto()` convention is not part of Laravel core. It's a community pattern that emerged from the need to formalize validated array → typed object conversion. Unlike `payload()`, which is request-bound, `toDto()` can be any callable, making it more flexible for complex mapping scenarios.

### Key Insight
Separating DTO conversion from the request class (standalone `toDto()` mapper) enables **version bridging** — an API v2 request can produce a v1 DTO or vice versa, without changing the request class. This decoupling is valuable when the API versioning strategy differs from the DTO versioning strategy.

### Version-Specific Notes
- Laravel 10: `validated()` accepts optional key parameter — enabling selective DTO construction.
- Laravel 11: No changes.
- PHP 8.2: Readonly classes make DTOs naturally immutable after toDto() construction.
