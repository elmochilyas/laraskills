# Layer Isolation in Tests — Rules

## Mock Repository Boundaries, Not Internals
---
## Category
Testing
---
## Rule
Mock at the repository interface level, not at the Eloquent query or model level.
---
## Reason
Mocking `Post::query()` couples the test to Laravel's Eloquent internals. Changing the persistence strategy (e.g., from Eloquent to a third-party API) breaks all mock-based tests. Mocking `PostRepositoryInterface` decouples the test from persistence implementation.
---
## Bad Example
```php
// Mocking at the Eloquent level — tightly coupled to implementation
$postMock = $this->mock(Post::class);
$postMock->shouldReceive('save')->once();
```
---
## Good Example
```php
// Mocking at the repository interface — decoupled from persistence
$repoMock = $this->createMock(PostRepositoryInterface::class);
$repoMock->expects($this->once())->method('save')->willReturn($post);

$service = new PostService($repoMock);
```
---
## Exceptions
When the application does not use repository interfaces (thin controllers with direct Eloquent), mock at the service boundary or use integration tests.
---
## Consequences Of Violation
Tests break when persistence implementation changes; false confidence — passing tests mask mocking mismatches with real implementation.
---

## Use Bus And Event Fakes For Side Effects
---
## Category
Testing
---
## Rule
Use `Bus::fake()`, `Event::fake()`, `Notification::fake()`, and `Mail::fake()` to verify side effects without executing real jobs, events, or notifications.
---
## Reason
Real side effects (sending emails, dispatching jobs) slow tests, require external services, and introduce nondeterminism. Fakes capture dispatched events and allow assertions without execution.
---
## Bad Example
```php
// Real event dispatching — slow and may have side effects
it('dispatches event after creation', function () {
    $this->postJson('/api/posts', $data)->assertCreated();
    // Cannot assert event was dispatched — only side effect observable
});
```
---
## Good Example
```php
it('dispatches PostCreated event', function () {
    Event::fake();

    $this->postJson('/api/posts', $data)->assertCreated();

    Event::assertDispatched(PostCreated::class);
});
```
---
## Exceptions
When testing that side effects produce correct outcomes (e.g., email rendering), use real execution in dedicated integration tests.
---
## Consequences Of Violation
Slow test suite; external service dependencies in tests; flaky failures from network-dependent side effects.
---

## DTOs Need Zero Mocking
---
## Category
Performance
---
## Rule
Never mock DTOs — always use real instance creation and plain PHP assertions.
---
## Reason
DTOs are pure data containers with no dependencies, no I/O, and no side effects. Mocking a DTO adds complexity, masks construction bugs, and defeats the purpose of having a typed data contract. Direct instantiation is simpler and provides stronger guarantees.
---
## Bad Example
```php
// Mocking a DTO — unnecessary complexity
$dtoMock = $this->createMock(PostDTO::class);
$dtoMock->method('toArray')->willReturn(['title' => 'Test']);
```
---
## Good Example
```php
// Real DTO instance — straightforward and type-safe
$dto = new PostDTO(title: 'Test', body: 'Content');

expect($dto->title)->toBe('Test');
expect($dto->toArray())->toHaveKey('title');
```
---
## Exceptions
When the DTO constructor performs expensive or I/O-bound operations (rare — that would violate the DTO pattern), consider refactoring the DTO instead of mocking it.
---
## Consequences Of Violation
Brittle tests that pass despite broken DTO constructors; unnecessary mock setup burden; missed construction bugs.
---

## Follow The 70/30 Split
---
## Category
Architecture
---
## Rule
Target 70% feature-level integration tests and 30% isolated unit tests, adjusting based on business logic complexity.
---
## Reason
Laravel's feature tests (HTTP → controller → full stack) are the most valuable for API coverage — they validate the actual behavior consumers experience. Isolated unit tests add targeted coverage for complex business logic. The 70/30 split balances confidence with speed.
---
## Bad Example
```php
// 100% feature tests — no isolated unit tests for complex business rules
// Every test boots the kernel; business logic bugs found only through full HTTP round trips
```
---
## Good Example
```php
// Feature test (70%)
it('creates a post', fn () => $this->postJson('/api/posts', $data)->assertCreated());

// Isolated unit test (30%) for complex business logic
it('applies discount rules correctly', function () {
    $service = new PricingService();
    expect($service->calculateDiscount(100, 'vip'))->toBe(20.0);
});
```
---
## Exceptions
Prototypes and thin-CRUD APIs may lean 90% feature tests. Heavy domain-logic APIs may lean 50/50.
---
## Consequences Of Violation
Over-isolation: mock mismatches cause production failures despite passing tests. Over-integration: slow test suite discourages thorough coverage of complex logic.
---

## Avoid Over-Mocking
---
## Category
Maintainability
---
## Rule
Never mock what you don't own — avoid mocking Eloquent models, the Query Builder, third-party SDKs, or value objects.
---
## Reason
Mocking Eloquent or the Query Builder couples tests to Laravel's internals, which change between versions. Mocking third-party SDKs hides integration bugs. Use fakes (for owned boundaries) or integration tests (for third-party code).
---
## Bad Example
```php
// Mocking Eloquent internals — brittle and framework-coupled
$queryMock = $this->createMock(Builder::class);
$queryMock->expects($this->once())->method('where')->with('id', 1);
```
---
## Good Example
```php
// Integration test with real database — tests actual Eloquent behavior
it('finds post by id', function () {
    $post = Post::factory()->create();

    $found = Post::find($post->id);

    expect($found->id)->toBe($post->id);
});
```
---
## Exceptions
When providing a fake implementation for a third-party SDK (not a mock), use a dedicated Fake class that implements the SDK interface.
---
## Consequences Of Violation
Brittle tests that break on framework upgrades; false confidence — mock behavior diverges from real implementation; high maintenance cost.
---
