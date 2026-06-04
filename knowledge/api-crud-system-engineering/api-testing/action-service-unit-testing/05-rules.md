# Action / Service Unit Testing — Rules

## Mock Repository Boundaries, Not Domain Logic
---
## Category
Testing
---
## Rule
Mock repository or persistence interfaces, not the internal domain logic classes.
---
## Reason
Mocking the domain logic you intend to test creates circular tests that prove the mock works, not the code. Mock at the boundary (repository, external API client) and test the domain logic's orchestration with real instances.
---
## Bad Example
```php
// Mocking the domain logic itself — test proves nothing
$mock = $this->createMock(PostService::class);
$mock->expects($this->once())->method('calculateScore')->willReturn(100);
```
---
## Good Example
```php
// Mock at the boundary — test proves orchestration logic
$repo = $this->createMock(PostRepositoryInterface::class);
$repo->expects($this->once())->method('save')->willReturn($post);

$service = new PostService($repo);
$result = $service->create($dto);

expect($result->score)->toBeGreaterThan(0);
```
---
## Exceptions
When the class under test has no external boundaries (pure domain logic with no I/O), mock nothing — test with real instances.
---
## Consequences Of Violation
Circular tests passing regardless of implementation; broken business logic deployed because tests proved mocks, not code.
---

## Test All Return Paths
---
## Category
Testing
---
## Rule
Write a test for every possible return path: success, failure with exception, conditional branching, and edge cases.
---
## Reason
An action with three conditional branches has four possible paths (including the "nothing matches" default). Testing only the happy path means 75% of paths are untested. Each branch represents a distinct business outcome that must be verified independently.
---
## Bad Example
```php
it('creates a post', function () {
    $service = new PostService($repo);
    $result = $service->create($dto);
    expect($result->id)->toBe(1);
    // Does not test what happens when repo throws exception
});
```
---
## Good Example
```php
it('creates a post successfully', function () {
    $result = $service->create($dto);
    expect($result->id)->toBe(1);
});

it('throws when repository fails', function () {
    $repo->expects($this->once())->method('save')->willThrowException(new DatabaseException());
    $service = new PostService($repo);

    expect(fn() => $service->create($dto))->toThrow(CreationFailedException::class);
});

it('returns null when post not found', function () {
    $repo->expects($this->once())->method('findById')->with(999)->willReturn(null);
    $service = new PostService($repo);

    expect($service->findById(999))->toBeNull();
});
```
---
## Exceptions
When a method has a single deterministic return path with no branching, one test covers all paths.
---
## Consequences Of Violation
Unhandled exceptions in production; silent failures in alternative paths; business logic bugs triggered only under specific conditions.
---

## Test Event And Job Dispatch Via Fakes
---
## Category
Testing
---
## Rule
Use `Event::fake()`, `Bus::fake()`, `Notification::fake()`, and `Mail::fake()` to verify that side effects are dispatched with the correct payload.
---
## Reason
Actions and services orchestrate side effects — dispatching events, queuing jobs, sending notifications. These side effects are the observable outcome of the business logic. Testing them verifies the orchestration, not just the return value.
---
## Bad Example
```php
it('creates a post', function () {
    $result = $service->create($dto);
    expect($result->id)->toBe(1);
    // Does not verify that PostCreated event was dispatched
});
```
---
## Good Example
```php
it('dispatches PostCreated event after creation', function () {
    Event::fake();

    $service->create($dto);

    Event::assertDispatched(PostCreated::class, function ($event) use ($dto) {
        return $event->title === $dto->title;
    });
});
```
---
## Exceptions
When the action has no side effects (pure computation, no event/job dispatch), side effect assertions are not needed.
---
## Consequences Of Violation
Events not dispatched; jobs not queued; notifications not sent — business processes broken despite passing tests.
---

## Test Exception Scenarios
---
## Category
Testing
---
## Rule
Test that the service correctly handles exceptions from its dependencies (repository failure, external API timeout, validation errors).
---
## Reason
A service that crashes with an uncaught `PDOException` when the database is unavailable will return a 500 error in production. A well-tested service catches boundary exceptions and converts them to domain-appropriate exceptions, allowing the controller to return a meaningful error.
---
## Bad Example
```php
it('creates a post', function () {
    $service = new PostService($repo);
    $result = $service->create($dto);
    expect($result->id)->toBe(1);
    // No exception scenario tests
});
```
---
## Good Example
```php
it('converts database exception to domain exception', function () {
    $repo = $this->createMock(PostRepositoryInterface::class);
    $repo->expects($this->once())
        ->method('save')
        ->willThrowException(new \PDOException('Connection refused'));

    $service = new PostService($repo);

    expect(fn() => $service->create($dto))
        ->toThrow(PersistenceException::class);
});
```
---
## Exceptions
When the service has no external dependencies (pure logic), exception scenarios may not apply.
---
## Consequences Of Violation
Raw database or framework exceptions leak to the controller; 500 errors returned instead of meaningful 4xx responses; poor user experience.
---

## Use Data Providers For Rule Variants
---
## Category
Testing
---
## Rule
Use PestPHP datasets or PHPUnit `@dataProvider` to test multiple input combinations producing different business outcomes.
---
## Reason
Business rules with multiple input combinations (e.g., discount calculator with tier × amount × coupon) require combinatorial coverage. Data providers enumerate each combination explicitly, ensuring no edge case is missed.
---
## Bad Example
```php
it('calculates discount for VIP', function () {
    expect($service->calculateDiscount(100, 'vip'))->toBe(20.0);
});

it('calculates discount for regular', function () {
    expect($service->calculateDiscount(100, 'regular'))->toBe(5.0);
});
// N tests for N combinations — repetitive and easy to miss combinations
```
---
## Good Example
```php
$discountScenarios = [
    'VIP over 100'    => [200, 'vip',    40.0],
    'VIP under 100'   => [50,  'vip',    10.0],
    'regular over 100' => [200, 'regular', 10.0],
    'regular under 100' => [50,  'regular', 2.5],
];

it('calculates :label discount', function (float $amount, string $tier, float $expected) {
    expect($service->calculateDiscount($amount, $tier))->toBe($expected);
})->with($discountScenarios);
```
---
## Exceptions
When the method has a simple deterministic output (no branching), a single test suffices.
---
## Consequences Of Violation
Edge-case business rules untested; wrong discount applied to specific tiers or amounts; financial errors in production.
---

## Use Integration Tests For Database-Bound Services
---
## Category
Testing
---
## Rule
When a service uses Eloquent directly (no repository), use `RefreshDatabase` and write integration tests, not mock-based unit tests.
---
## Reason
Mocking `Model::query()` or `DB::table()` is fragile, couples to implementation details, and diverges from real behavior. If the service doesn't use repository interfaces, accept the database dependency and test with real database for reliable coverage.
---
## Bad Example
```php
// Mocking Eloquent — brittle and implementation-coupled
$queryMock = $this->createMock(Builder::class);
$queryMock->expects($this->once())->method('where')->with('status', 'published');
Model::shouldReceive('query')->andReturn($queryMock);
```
---
## Good Example
```php
uses(RefreshDatabase::class);

it('finds published posts', function () {
    Post::factory()->count(3)->published()->create();
    Post::factory()->count(2)->draft()->create();

    $service = new PostService();
    $result = $service->findPublished();

    expect($result)->toHaveCount(3);
});
```
---
## Exceptions
When the service uses repository interfaces but the repository is not yet implemented, mock the interface (as intended by the pattern).
---
## Consequences Of Violation
Brittle mock-based tests; false confidence — mocks diverge from real Eloquent behavior; framework upgrade breaks tests.
---
