# DTO Integration: payload() Method

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** dto, payload, testing, production, typescript, openapi

## Executive Summary
Phase 3 covers testing `payload()` methods, integration with Spatie Laravel Data `DataRequest`, OpenAPI schema generation from DTOs, production validation of DTO construction, and patterns for evolving `payload()` across API versions.

## Core Concepts

### payload() as the API Contract Fulfillment
The `payload()` method is where the API contract (defined by validation rules) meets the domain contract (defined by DTO properties). Any mismatch between `validated()` keys and DTO constructor parameters is a contract violation caught at runtime.

### DTO Validation in payload()
DTOs themselves may have validation (Spatie `Data` rules). The `payload()` method is the natural place to validate the DTO after construction:
```php
public function payload(): PostData
{
    $dto = PostData::from($this->validated());
    $dto->validate(); // Throws if DTO validation fails
    return $dto;
}
```

## Internal Mechanics

### payload() with DTO Validation Pipeline
```php
public function payload(): PostData
{
    $dto = PostData::from($this->validated());

    // Run DTO-level validation (Spatie)
    $result = $dto->validate();
    if ($result->fails()) {
        throw new ValidationException(
            Validator::make([], []), // Dummy validator
            response()->json([
                'errors' => $result->errors(),
            ], 422),
        );
    }

    return $dto;
}
```

### payload() with Conditional DTO Selection
```php
public function payload(): OrderData|PersonalOrderData|BusinessOrderData
{
    $validated = $this->validated();

    return match ($validated['type']) {
        'personal' => PersonalOrderData::from($validated),
        'business' => BusinessOrderData::from($validated),
        default => OrderData::from($validated),
    };
}
```

## Patterns

### Testing payload() in Isolation
```php
public function test_payload_returns_correct_dto(): void
{
    $request = new StorePostRequest([], [
        'title' => 'Test Post',
        'body' => 'Test body content',
        'status' => 'draft',
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->setContainer(app());
    $request->setUserResolver(fn () => User::factory()->make(['id' => 1]));

    $validator = Validator::make(
        $request->validationData(),
        $request->rules(),
    );

    if ($validator->passes()) {
        $request->passedValidation(); // Ensure hooks run
    }

    $dto = $request->payload();

    $this->assertInstanceOf(PostData::class, $dto);
    $this->assertEquals('Test Post', $dto->title);
    $this->assertEquals('Test body content', $dto->body);
    $this->assertEquals('draft', $dto->status->value);
}

public function test_payload_includes_author_id(): void
{
    $user = User::factory()->create();

    $request = new StorePostRequest([], [
        'title' => 'Test Post',
        'body' => 'Content',
        'status' => 'draft',
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->setContainer(app());
    $request->setUserResolver(fn () => $user);

    $dto = $request->payload();

    $this->assertEquals($user->id, $dto->authorId);
}

public function test_payload_throws_when_validated_data_missing(): void
{
    $this->expectException(\TypeError::class);

    $request = new StorePostRequest([], [
        'title' => 'Test', // Missing body field
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->setContainer(app());
    $request->payload(); // Should fail because required field missing
}

public function test_payload_with_nested_dto(): void
{
    $request = new StoreOrderRequest([], [
        'customer' => ['name' => 'John', 'email' => 'john@example.com'],
        'items' => [
            ['sku' => 'SKU-001', 'quantity' => 2],
        ],
        'payment' => ['method' => 'credit_card', 'amount' => 100],
    ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

    $request->setContainer(app());
    $request->setUserResolver(fn () => User::factory()->make(['id' => 1]));

    $dto = $request->payload();

    $this->assertInstanceOf(OrderData::class, $dto);
    $this->assertInstanceOf(CustomerData::class, $dto->customer);
    $this->assertContainsOnlyInstancesOf(LineItemData::class, $dto->items);
    $this->assertInstanceOf(PaymentData::class, $dto->payment);
}
```

### Contract Test: validated() keys match DTO properties
```php
public function test_payload_keys_match_dto_properties(): void
{
    $dtoClass = PostData::class;
    $dtoProperties = array_keys(get_class_vars($dtoClass));

    $request = new StorePostRequest();
    $validatedKeys = array_keys($request->rules());

    // DTO properties should be a subset of validated keys
    foreach ($dtoProperties as $property) {
        $this->assertContains(
            $property,
            $validatedKeys,
            "DTO property {$property} has no corresponding validation rule."
        );
    }
}
```

### TypeScript Type Generation from payload() DTO
```php
// Artisan command to generate TypeScript types
class GenerateTypesFromPayload extends Command
{
    public function handle(): int
    {
        $requests = [
            StorePostRequest::class => PostData::class,
            UpdatePostRequest::class => PostData::class,
            StoreOrderRequest::class => OrderData::class,
        ];

        $types = '';
        foreach ($requests as $requestClass => $dtoClass) {
            $reflection = new ReflectionClass($dtoClass);
            $properties = $reflection->getProperties(ReflectionProperty::IS_PUBLIC);
            $types .= "// {$requestClass}\n";
            $types .= "interface {$reflection->getShortName()} {\n";
            foreach ($properties as $prop) {
                $phpType = $prop->getType();
                $tsType = $this->phpTypeToTypeScript((string) $phpType);
                $types .= "  {$prop->getName()}: {$tsType};\n";
            }
            $types .= "}\n\n";
        }

        File::put(resource_path('ts/api-types.ts'), $types);
        $this->info('TypeScript types generated.');

        return self::SUCCESS;
    }
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| payload() with strict types | Compile-time safety; IDE autocompletion |
| DTO validation in payload() | Catches DTO-level errors at request boundary |
| Contract tests for payload() | Ensures validation ↔ DTO alignment |
| TypeScript type generation | Maintains API contract parity across stack |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| payload() contract test | Prevents silent schema drift | Requires maintenance as DTO evolves |
| DTO validation in payload() | Catches business logic validation in DTO | Two validation layers may confuse |
| TypeScript generation | Client-side type safety | Requires CI step to regenerate |
| Polymorphic payload() | Handles multiple DTO types cleanly | Union return type is complex |

## Performance Considerations
- `payload()` should avoid I/O — DTO creation is in-memory only.
- Spatie's `from()` uses reflection per call — consider caching class metadata.
- Contract tests run in CI, not in production — zero runtime impact.
- TypeScript generation is a build-time step — no runtime cost.

## Production Considerations
- Log payload() construction failures with the validated data snapshot.
- Use `@return` type declaration for IDE support in all payload() methods.
- Version DTOs alongside FormRequests in `Api\V1` namespace.
- Never catch `TypeError` from payload() — let it surface as a 500 indicating a contract bug.

## Common Mistakes
- Not testing the failure case — what happens when validated() has missing keys.
- Over-complicating payload() with business logic — it should only map data.
- Forgetting to call `passedValidation() / prepareForValidation()` when testing payload().
- Returning array from payload() instead of DTO — defeats the purpose.
- Using payload() in middleware — validation has not run yet.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| DTO property renamed but validated() key not updated | TypeError in payload() | Contract test catches mismatch |
| payload() called before validation | validated() returns empty array | Controller ensures FormRequest type-hint |
| Nested DTO from() fails | TypeError with nested data | Unit test nested payload() paths |
| payload() throws after validation passed | 500 instead of 422 | Ensure DTO construction cannot fail after validation |

## Ecosystem Usage

### Spatie Laravel Data DataRequest (Auto-payload)
```php
class StorePostRequest extends \Spatie\LaravelData\DataRequest
{
    protected string $dataClass = PostData::class;
    // No payload() method needed — DataRequest auto-generates it
    // Returns PostData directly from validated data
}

// In controller:
public function store(StorePostRequest $request): PostResource
{
    $post = Post::create($request->payload()); // Auto-generated
    return PostResource::make($post);
}
```

### Spatie Laravel Data WithPayload Interface
```php
// The DataRequest base class uses WithPayload interface
// which auto-generates payload() based on $dataClass property
interface WithPayload
{
    public function payload(): Data;
}
```

### TypeScript Type Sync in CI
```yaml
# .github/workflows/types-sync.yml
name: Sync API Types
on:
  pull_request:
    paths:
      - 'app/Data/**'
      - 'app/Http/Requests/**'
jobs:
  generate-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: php artisan types:generate
      - run: git diff --exit-code resources/ts/api-types.ts
```

## Related Knowledge Units

### Prerequisites
- **dto-integration-payload-method** — Phase 2 payload() mechanics.
- **data-transfer-object-design** — DTO design fundamentals.

### Related Topics
- **dto-integration-todto-method** — alternative pattern for DTO conversion.
- **after-validation-hooks** — hooks that prepare data before payload().

### Advanced Follow-up Topics
- **spatie-laravel-data-integration** — deep Spatie Data + payload integration.
- **dto-construction-patterns** — construction strategies used in payload().

## Research Notes

### Source Analysis
The `payload()` pattern is not in Laravel core. It emerged from the Spatie Laravel Data ecosystem via the `DataRequest` class. The pattern's power comes from its placement — between validated data and domain consumption — making it the single point of transformation in the request pipeline.

### Key Insight
`payload()` is the **bridge between validation and domain**. By housing DTO construction in the request, you eliminate the need for controller-level data mapping and ensure that every consumer of request data receives it in a consistent, typed format. This is the natural conclusion of the "thin controller" principle applied to data transformation.

### Version-Specific Notes
- Spatie Laravel Data 3.x: `DataRequest` auto-generates `payload()` method.
- Spatie Laravel Data 4.x: Improved `from()` performance with cached reflection.
- Laravel 10: `validated()` with key parameter enables partial DTO construction.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization