# After Validation Hooks

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** hooks, after-validation, testing, production, normalization, dto

## Executive Summary
Phase 3 covers testing post-validation hooks, transactional safety with hooks, DTO population in `passedValidation()`, production monitoring for hook failures, and patterns for chaining multiple hooks without side effect leakage.

## Core Concepts

### Hook Purity Principle
Post-validation hooks should be **idempotent** and **side-effect-free** where possible. They mutate the request data, not external state. Any external side effect (DB write, event dispatch, API call) must be carefully justified and documented.

### Hook as DTO Preparation Layer
The primary architectural role of `passedValidation()` is to transform validated request data into the exact shape required by a DTO constructor. This keeps the DTO clean and the controller free of data-mapping logic.

## Internal Mechanics

### Hook Chain Execution
```php
protected function passedValidation(): void
{
    $this->merge(['uuid' => (string) Str::uuid()]);
    $this->merge(['amount_cents' => bcmul($this->input('amount'), '100')]);
    $this->merge(['user_id' => $this->user()->id]);
    $this->merge(['timestamp' => now()->toIso8601String()]);
}
```

Multiple merges are fine — they accumulate into a single `validated()` result.

### after() with Conditional Skip on Failure
```php
protected function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        if ($validator->errors()->isNotEmpty()) {
            return; // Skip if validation already failed
        }

        // Business rule: max 2 active subscriptions
        $count = Subscription::where('user_id', $this->user()->id)
            ->where('status', 'active')
            ->count();

        if ($count >= 2) {
            $validator->errors()->add('subscription', 'Maximum 2 active subscriptions allowed.');
        }
    });
}
```

## Patterns

### Testing passedValidation() Behavior
```php
public function test_passed_validation_injects_uuid(): void
{
    $request = new StorePostRequest([], [
        'title' => 'Test Title',
        'body' => 'Test Body',
    ], [], [], [], [
        'HTTP_ACCEPT' => 'application/json',
    ]);

    $request->setContainer(app());
    $request->setUserResolver(fn () => User::factory()->make(['id' => 1]));

    $validator = Validator::make(
        $request->validationData(),
        $request->rules(),
    );

    if ($validator->passes()) {
        $request->passedValidation();
    }

    $validated = $request->validated();
    $this->assertArrayHasKey('uuid', $validated);
    $this->assertTrue(Str::isUuid($validated['uuid']));
}

public function test_after_hook_rejects_high_risk(): void
{
    $request = new StoreOrderRequest([], [
        'email' => 'suspicious@example.com',
        'amount' => 5000,
    ]);

    $validator = Validator::make(
        $request->validationData(),
        $request->rules(),
    );

    $request->withValidator($validator);

    $this->assertTrue($validator->fails());
    $this->assertArrayHasKey('email', $validator->errors()->messages());
}

public function test_passed_validation_does_not_mutate_existing_data(): void
{
    $request = new StorePostRequest([], [
        'title' => 'My Title',
        'body' => 'My Body',
    ], [], [], [], [
        'HTTP_ACCEPT' => 'application/json',
    ]);

    $request->setContainer(app());
    $request->passedValidation();

    $validated = $request->validated();
    $this->assertEquals('My Title', $validated['title']);
    $this->assertEquals('My Body', $validated['body']);
    $this->assertArrayHasKey('uuid', $validated); // Added by hook
}
```

### DTO Population in passedValidation()
```php
protected function passedValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->input('title')),
        'author_id' => $this->user()->id,
        'published_at' => $this->input('status') === 'published' ? now() : null,
    ]);
}

public function toDto(): PostData
{
    return PostData::from($this->validated());
}
```

### Hook Transactionality Guard
```php
protected function passedValidation(): void
{
    DB::beginTransaction();
    try {
        $this->merge(['order_reference' => OrderReference::generate()]);
        $this->merge(['total_cents' => $this->calculateTotal()]);
        DB::commit();
    } catch (\Throwable $e) {
        DB::rollBack();
        Log::error('Failed to prepare order data', [
            'error' => $e->getMessage(),
            'data' => $this->validated(),
        ]);
        throw $e;
    }
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Pass-through validated() after hooks | Controller receives enriched data, not raw input |
| after() for external checks | Centralized, runs once; not per-field like rules |
| Idempotent hooks | Safe to call multiple times; no side-effect doubling |
| DTO population in hook | Controller receives ready-to-use DTO |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Merge in passedValidation() | Enriched data, no controller work | Hidden transformation; debugger must check request |
| after() for business rules | Clean rules() method | Logic split between rules() and after() |
| Transactional hooks | Atomic data preparation | Heavier; may conflict with controller transaction |

## Performance Considerations
- `passedValidation()` should avoid I/O — it blocks the response.
- `after()` callbacks with external API calls add latency — cache results or defer.
- Hook code runs on every validated request — ensure O(1) or O(n) with small n.
- Avoid collection operations on large datasets in hooks.

## Production Considerations
- Wrap hook bodies in try/catch with logging — hook exceptions cause 500 errors.
- Monitor hook execution time with custom metrics.
- Use `passedValidation()` for deterministic transformations only.
- Document each `merge()` operation in a comment explaining why it belongs in the hook.

## Common Mistakes
- Performing I/O in `passedValidation()` — belongs in service layer.
- Mutating data that `rules()` depends on — `prepareForValidation()` is the pre-validation hook.
- Using `after()` for data transformation — use `passedValidation()` instead.
- Relying on `after()` running only on success — it runs even on failure; check errors.
- Forgetting to call `passedValidation()` in unit tests — leads to missing data in assertions.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Hook throws exception | 500 error on valid input | Wrap in try/catch; log and rethrow with context |
| Hook modifies validated key | Surprising validated() result | Only merge new keys; document changes |
| after() API call fails | Validation always fails | Circuit breaker; cache result for short period |
| Non-idempotent hook | Duplicate side effects | Never write to DB in hooks; use idempotent operations |

## Ecosystem Usage

### Spatie Laravel Data After Method
```php
class PostData extends Data
{
    public function __construct(
        public string $title,
        public string $slug,
        public string $body,
        public int $author_id,
    ) {}

    public static function fromRequest(StorePostRequest $request): self
    {
        return new self(
            title: $request->input('title'),
            slug: Str::slug($request->input('title')),
            body: $request->input('body'),
            author_id: $request->user()->id,
        );
    }
}
```

### Laravel Action with After Hook
```php
class StorePostAction
{
    public function __construct(
        private readonly StorePostRequest $request,
    ) {}

    public function execute(): Post
    {
        // Hooks already ran; data is ready
        return Post::create($this->request->validated());
    }
}
```

## Related Knowledge Units

### Prerequisites
- **after-validation-hooks** — Phase 2 hook mechanics.
- **input-preparation** — pre-validation hooks paired with post-validation.

### Related Topics
- **dto-integration-payload-method** — hook data flowing to DTO payload().
- **dto-integration-todto-method** — toDto() called after hooks complete.

### Advanced Follow-up Topics
- **form-request-testing** — testing hooks in isolation.
- **manual-validator-creation** — after hooks in manual validation.

## Research Notes

### Source Analysis
In `ValidatesWhenResolvedTrait`, `validateResolved()` checks `$this->validator->passes()` — if true, calls `passedValidation()`. The validator's `passes()` method runs `after()` callbacks as part of the validation cycle. If any `after()` callback adds errors, `passes()` returns false, and `passedValidation()` is never called.

### Key Insight
Post-validation hooks complete the **validation → transformation → consumption** pipeline within the request object itself. This keeps the controller focused on orchestration and the service layer focused on business logic, with the request handling both "is this valid?" and "now make it ready."

### Version-Specific Notes
- Laravel 10: `passedValidation()` is called unconditionally after validation passes.
- Laravel 11: No API changes; behavior stable.
- PHP 8.3: `json_validate()` available for hook-level JSON sanity checks.
