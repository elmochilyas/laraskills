# DTO Integration: toDto() Method

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** dto, todto, testing, production, version-bridging, mapper

## Executive Summary
Phase 3 covers testing `toDto()` mappers, version-bridging strategies, integration with action classes, production monitoring of conversion failures, and patterns for complex mapping scenarios including nested DTOs and conditional mapping.

## Core Concepts

### Mapper as a Version Boundary
A standalone `toDto()` mapper acts as a version adapter — translating API v2 request data into the same DTO structure as API v1, decoupling request version from internal domain model.

### Conversion Failure as Contract Violation
If `toDto()` fails (TypeError, missing key), it indicates a contract mismatch between validation rules and DTO structure. This should be caught in development/testing, not handled gracefully in production.

## Internal Mechanics

### Version-Bridging Mapper
```php
class PostRequestToDtoMapperV2ToV1
{
    public function map(StorePostV2Request $request): PostData // V1 DTO
    {
        $validated = $request->validated();

        return new PostData(
            title: $validated['title'],
            body: $validated['content'], // V2 renamed 'content' to 'body'
            authorId: $request->user()->id,
            status: PostStatus::from($validated['visibility']), // V2 renamed
        );
    }
}
```

### Composite Mapper for Nested DTOs
```php
class OrderRequestToDtoMapper
{
    public function __construct(
        private readonly CustomerRequestToDtoMapper $customerMapper,
        private readonly LineItemRequestToDtoMapper $lineItemMapper,
    ) {}

    public function map(StoreOrderRequest $request): OrderData
    {
        return new OrderData(
            customer: $this->customerMapper->map($request),
            items: array_map(
                fn (array $itemData, int $index) =>
                    $this->lineItemMapper->map($request, $index),
                $request->validated('items'),
                array_keys($request->validated('items')),
            ),
            paymentMethod: $request->validated('payment_method'),
            totalCents: $request->validated('total_cents'),
        );
    }
}
```

## Patterns

### Testing Standalone toDto() Mapper
```php
public function test_mapper_converts_request_to_dto(): void
{
    $request = new StorePostRequest([], [
        'title' => 'Test Post',
        'body' => 'Test body',
        'status' => 'published',
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->setContainer(app());
    $request->setUserResolver(fn () => User::factory()->make(['id' => 1]));

    $mapper = new PostRequestToDtoMapper();
    $dto = $mapper->map($request);

    $this->assertInstanceOf(PostData::class, $dto);
    $this->assertEquals('Test Post', $dto->title);
    $this->assertEquals('Test body', $dto->body);
    $this->assertEquals(PostStatus::Published, $dto->status);
    $this->assertEquals(1, $dto->authorId);
}

public function test_mapper_with_optional_fields(): void
{
    $request = new UpdatePostRequest([], [
        'title' => 'Updated Title',
        // body not provided
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->setContainer(app());
    $request->setUserResolver(fn () => User::factory()->make(['id' => 1]));

    $post = Post::factory()->make([
        'title' => 'Old Title',
        'body' => 'Old Body',
        'status' => 'draft',
    ]);

    $mapper = new PostRequestToDtoMapper();
    $dto = $mapper->fromUpdateRequest($request, $post);

    $this->assertEquals('Updated Title', $dto->title);
    $this->assertEquals('Old Body', $dto->body); // Preserved from model
}

public function test_mapper_preserves_extra_data(): void
{
    $request = new StorePostRequest([], [
        'title' => 'Test',
        'body' => 'Body',
        'status' => 'draft',
        'metadata' => ['key' => 'value'], // Extra field not in DTO
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->setContainer(app());
    $request->setUserResolver(fn () => User::factory()->make(['id' => 1]));

    $mapper = new PostRequestToDtoMapper();
    $dto = $mapper->map($request);

    // Extra data should be handled (either ignored or mapped)
    $this->assertInstanceOf(PostData::class, $dto);
}

public function test_version_bridge_mapper(): void
{
    $v2Request = new StorePostV2Request([], [
        'title' => 'Test',
        'content' => 'V2 content field',
        'visibility' => 'public',
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $v2Request->setContainer(app());
    $v2Request->setUserResolver(fn () => User::factory()->make(['id' => 1]));

    $mapper = new PostRequestToDtoMapperV2ToV1();
    $dto = $mapper->map($v2Request);

    // V2 'content' → V1 'body', V2 'visibility' → V1 'status'
    $this->assertEquals('V2 content field', $dto->body);
    $this->assertEquals(PostStatus::Published, $dto->status);
}
```

### Testing toDto() with Spatie Data
```php
public function test_spatie_data_from_request(): void
{
    $request = new StorePostRequest([], [
        'title' => 'Test',
        'body' => 'Body',
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->setContainer(app());
    $request->setUserResolver(fn () => User::factory()->make(['id' => 1]));

    $dto = PostData::from($request->validated());

    $this->assertInstanceOf(PostData::class, $dto);
    $this->assertEquals('Test', $dto->title);
}
```

### Action Class Integration
```php
class StorePostAction
{
    public function __construct(
        private readonly PostRepository $posts,
        private readonly PostRequestToDtoMapper $mapper,
    ) {}

    public function execute(StorePostRequest $request): Post
    {
        $dto = $this->mapper->map($request);
        return $this->posts->create($dto);
    }
}

// Controller:
public function store(StorePostRequest $request, StorePostAction $action): PostResource
{
    $post = $action->execute($request);
    return PostResource::make($post);
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Standalone mapper injectable into actions | Decouples DTO construction from HTTP layer |
| Version-bridge mapper | Allows DTO stability across API versions |
| Composite mapper for nested DTOs | Single responsibility per mapper level |
| Constructor injection in mappers | Service dependencies explicit and testable |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Standalone mapper | Testable, version-bridgeable, reusable | Extra class; learning curve for team |
| Request-bound toDto() | Simple, co-located | Cannot version independently |
| Composite mappers | Clean separation of concerns | Many mapper classes to maintain |
| Action-integrated mapper | Complete pipeline isolation | Action depends on both request and mapper |

## Performance Considerations
- Standalone mappers resolved per request — negligible.
- Composite mappers create multiple objects — fine for typical depth (2-3 levels).
- Version-bridge mappers add a conversion layer — one extra mapping step.
- Use readonly DTOs to avoid defensive copies in mappers.

## Production Considerations
- Register all mappers in the container for dependency injection.
- Log mapping performance metrics in slow endpoints.
- Test version-bridge mappers with both old and new request versions.
- Document field mapping in `@see` annotations on mapper methods.

## Common Mistakes
- Creating mappers that do I/O — mapping should be pure data transformation.
- Forgetting to pass user context to the mapper — mapper should receive all needed data.
- Mapper depending on request class — should depend on validated data, not request.
- Not testing edge cases (null, missing keys, extra fields).
- Over-engineering — simple request-bound `payload()` is often sufficient.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Mapper throws on valid request | 500 on valid data | Test all mapping paths |
| Version bridge misses field | Null in DTO for required field | Contract test between request and DTO |
| Mapper not registered | BindingResolutionException | Register in ServiceProvider |
| Circular mapper dependency | Maximum function nesting level | Never inject mappers into each other's constructors (only in method calls) |

## Ecosystem Usage

### Spatie Laravel Data Mapper Pattern
```php
// Spatie Data can act as its own mapper
class PostData extends Data
{
    public function __construct(
        public string $title,
        public string $body,
        public int $authorId,
    ) {}

    public static function fromStoreRequest(StorePostRequest $request): self
    {
        return new self(
            title: $request->validated('title'),
            body: $request->validated('body'),
            authorId: $request->user()->id,
        );
    }
}
```

### Laravel Auto-Mapper Packages
```php
// Auto-mapper (ricanbe/automapper) for convention-based mapping
$config = (new AutoMapper())->getConfiguration();
$config->createMapping(StorePostRequest::class, PostData::class);
$dto = $mapper->map($request, PostData::class);
```

## Related Knowledge Units

### Prerequisites
- **dto-integration-todto-method** — Phase 2 toDto() mechanics.
- **dto-integration-payload-method** — related payload() pattern.

### Related Topics
- **controller-dto-action-flow** — how toDto() integrates with action pattern.
- **dto-construction-patterns** — DTO construction strategies.

### Advanced Follow-up Topics
- **spatie-laravel-data-integration** — Spatie Data mapping features.
- **data-transfer-object-design** — DTO design that makes toDto() mapping natural.

## Research Notes

### Source Analysis
The `toDto()` pattern reverses the controller's traditional responsibility of extracting request data. By moving mapping to a dedicated class, the controller becomes a pure orchestrator: receive request, call mapper, pass DTO to action, return response.

### Key Insight
The `toDto()` mapper pattern decouples **three evolution axes**: (1) the request structure (API version), (2) the DTO structure (domain model), and (3) the mapping logic between them. This allows each to change independently — a critical property for long-lived APIs.

### Version-Specific Notes
- Laravel 10+: `validated()` can be called multiple times safely.
- PHP 8.2: First-class callable syntax enables clean mapper references.
- Spatie Data 3.x: `from()` supports array and object sources.
