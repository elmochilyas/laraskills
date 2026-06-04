# Anti-Patterns — Layer Isolation in Tests

## Anti-Pattern 1: 100% Feature Tests, Zero Isolation

**Category**: Testing architecture

**Description**: Testing all business logic exclusively through HTTP feature tests, never writing isolated unit tests for services, form requests, or DTOs.

**Warning Signs**:
- Every test file boots the framework and makes HTTP requests
- No test uses `$this->mock()` or `$this->createMock()` for services
- DTOs are never tested directly — only through HTTP response assertions
- Simple business logic bugs require full HTTP round trips to reproduce

**Why It's Harmful**: Feature tests are 10-100x slower than isolated unit tests. Debugging a business logic bug through a feature test requires tracing through middleware, controllers, and the entire HTTP stack. Complex logic with many conditional paths becomes prohibitively expensive to cover thoroughly.

**Real-World Consequence**: A pricing calculation has 15 conditional paths. The team writes 15 feature tests, each taking 200ms. Total: 3 seconds for coverage that could be <100ms with isolated unit tests. CI runs take longer. Developers write fewer tests. Coverage drops.

**Preferred Alternative**: Follow the 70/30 split — 70% feature tests for full-stack coverage, 30% isolated unit tests for complex business logic.

**Refactoring Strategy**:
1. Identify business logic with the most conditional paths (pricing, eligibility, scoring)
2. Extract these into testable service classes if not already
3. Write isolated unit tests that mock boundaries and exercise all paths
4. Keep feature tests for happy path and integration verification

**Detection Checklist**:
- [ ] Business logic has isolated unit tests (not just feature tests)
- [ ] DTOs are tested with real instances and plain assertions
- [ ] Services with complex logic are tested with mocked boundaries
- [ ] Feature tests cover ~70% of the test suite, unit tests ~30%

**Related Rules**: Follow The 70/30 Split
**Related Skills**: Isolate Test Layers
**Related Decision Trees**: Tree 1 — Test Pyramid Allocation

---

## Anti-Pattern 2: Mocking Eloquent Models and Query Builder

**Category**: Testing correctness

**Description**: Creating mocks of Eloquent models, the Query Builder, or other Laravel internals in isolated tests.

**Warning Signs**:
- Tests use `$this->createMock(Post::class)` or `$this->mock(Builder::class)`
- Mock expectations set on `save()`, `where()`, `find()` methods of Eloquent instances
- Framework upgrade requires updating mock expectations

**Why It's Harmful**: Eloquent models and the Query Builder are framework internals that you don't own. Mocking them couples tests to Laravel's implementation details, which change between versions. The mock behavior may diverge from real Eloquent behavior, producing passing tests that fail in production.

**Real-World Consequence**: A Laravel upgrade changes `save()` behavior to return a different type. Mock expectations still pass because they check method calls, not return types. Tests pass, but production crashes with type errors.

**Preferred Alternative**: Use real database interactions (RefreshDatabase + factories) for Eloquent-dependent tests. Mock at the repository interface level instead of the model level.

**Refactoring Strategy**:
1. Replace `$this->createMock(Post::class)` with real `Post::factory()->create()`
2. If the class under test depends on a persistence interface, create a `PostRepositoryInterface` and mock that instead
3. Remove all `Builder`-level mock expectations

**Detection Checklist**:
- [ ] No Eloquent models are mocked
- [ ] No Query Builder instances are mocked
- [ ] Repository interfaces are mocked instead (if used)
- [ ] Framework internals are tested with real implementations

**Related Rules**: Avoid Over-Mocking, Mock Repository Boundaries, Not Internals
**Related Skills**: Isolate Test Layers
**Related Decision Trees**: Tree 2 — Mock Boundary Selection

---

## Anti-Pattern 3: Mocking DTOs

**Category**: Testing correctness

**Description**: Creating mocks of Data Transfer Objects instead of using real instances.

**Warning Signs**:
- `$this->createMock(PostDTO::class)` appears in test files
- DTO mocks have `willReturn` for `toArray()` or getter methods
- DTO constructor bugs go undetected because tests use mocks

**Why It's Harmful**: DTOs are pure data containers with no dependencies, no I/O, and no side effects. Mocking them adds complexity, masks construction bugs (wrong parameter types, missing required fields), and defeats the purpose of having typed data contracts. Direct instantiation is simpler and provides stronger guarantees.

**Real-World Consequence**: A DTO constructor adds a required `uuid` parameter. All service tests mock the DTO and never pass `uuid`. Tests pass. Production crashes because every service call creates a DTO without the required field.

**Preferred Alternative**: Always use real DTO instances in tests: `new PostDTO(title: 'Test', body: 'Content')`.

**Refactoring Strategy**:
1. Replace all `createMock(SomeDTO::class)` with `new SomeDTO(...)` using valid constructor arguments
2. Add tests that assert DTO construction fails with invalid arguments
3. Add tests that assert DTO `toArray()` returns expected keys

**Detection Checklist**:
- [ ] No DTOs are mocked in any test
- [ ] DTO tests use real instance construction and plain assertions
- [ ] DTO constructor validation is tested directly

**Related Rules**: DTOs Need Zero Mocking
**Related Skills**: Isolate Test Layers

---

## Anti-Pattern 4: Over-Mocking (Testing Implementation Details)

**Category**: Testing maintainability

**Description**: Asserting that specific internal methods were called on mocked dependencies, coupling tests to implementation details rather than behavior.

**Warning Signs**:
- Tests assert `$service->create()` called `$repository->save()` with specific arguments
- Refactoring method names or parameter order breaks tests even when behavior is unchanged
- Test names describe implementation steps ("calls save on repository") rather than business outcomes

**Why It's Harmful**: Implementation-detail tests break with every refactoring that doesn't change observable behavior. They create resistance to improvement — developers fear changing code because tests will fail even if the output is correct.

**Real-World Consequence**: A refactoring merges `repository->save()` and `repository->syncRelations()` into a single `repository->persist()`. All service tests fail because they expected `->save()`. The team spends 2 hours updating mock expectations for zero behavioral change.

**Preferred Alternative**: Test observable behavior — the returned value, the dispatched events, the database state. Mock boundaries to control inputs, not to verify internal call chains.

**Refactoring Strategy**:
1. Replace `shouldReceive('save')->once()` with Event/notification assertions or return-value assertions
2. Remove mock expectations that verify internal call order or specific parameter matching
3. If internal call verification is essential, document why and limit to critical infrastructure

**Detection Checklist**:
- [ ] Mock expectations verify outcomes, not method call sequences
- [ ] Event fakes are preferred over method-call assertions
- [ ] Refactoring internals doesn't break tests (behavior preserved)

**Related Rules**: Mock Repository Boundaries, Not Internals
**Related Skills**: Isolate Test Layers

---

## Anti-Pattern 5: 100% Isolation, Zero Integration Tests

**Category**: Testing completeness

**Description**: Writing only isolated unit tests with every dependency mocked, never verifying that the real implementation works together.

**Warning Signs**:
- All services are tested with mocked repositories
- No test creates real database records and queries them through the service layer
- No feature test exercises the full controller → service → repository chain with real dependencies

**Why It's Harmful**: Mocks can diverge from real behavior. A repository interface may define `save()` returning `Post`, but the real implementation may return `null` under certain conditions. Mock-based tests pass, but production breaks. Without integration tests, these mismatches go undetected.

**Real-World Consequence**: A repository's `find()` method throws an exception when the record is soft-deleted. The mock always returns a valid object. All service tests pass. Production crashes on every soft-deleted record access.

**Preferred Alternative**: Maintain a balance — isolated unit tests for fast logic verification + feature/integration tests that verify real implementations work together correctly.

**Refactoring Strategy**:
1. Identify the critical integration points: service + repository, controller + service
2. Add feature tests for the main happy paths that use real implementations
3. Add integration tests for error paths that are mocked in unit tests

**Detection Checklist**:
- [ ] Critical user flows have feature tests with real implementations
- [ ] Error paths tested in both isolation (unit) and integration (feature)
- [ ] Mocked boundaries have at least one integration test verifying real behavior

**Related Rules**: Follow The 70/30 Split
**Related Skills**: Isolate Test Layers
**Related Decision Trees**: Tree 1 — Test Pyramid Allocation
