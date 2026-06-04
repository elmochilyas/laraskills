# Anti-Patterns — Action / Service Unit Testing

## Anti-Pattern 1: God Services with 8+ Dependencies

**Category**: Architecture

**Description**: Creating service classes with 8+ constructor dependencies that orchestrate every operation, making them difficult to test and maintain.

**Warning Signs**:
- Service constructor has 8+ parameters
- A single test requires setting up 6+ mocks before testing one method
- The service handles persistence, events, notifications, logging, and caching

**Why It's Harmful**: Services with excessive dependencies violate the Single Responsibility Principle. Setting up mocks for each test becomes a burden — developers skip edge cases because they require too many mock setups. The service becomes a "god class" that knows about everything.

**Real-World Consequence**: A `PostService` has 10 constructor dependencies. Each test requires 10 mock setups. Developers write only 2 tests (happy path and one error). The remaining methods have zero coverage. A refactoring breaks an edge case in production.

**Preferred Alternative**: Split god services into focused action classes (one action per operation). Keep constructor dependencies to 3-5 max.

**Refactoring Strategy**:
1. Identify groups of related methods in the god service
2. Extract each group into a dedicated action class (e.g., `CreatePostAction`, `PublishPostAction`)
3. Move shared dependencies into a base class or inject selectively

**Detection Checklist**:
- [ ] No service has more than 5 constructor dependencies
- [ ] Each action/service has a single responsibility
- [ ] Tests require no more than 3 mock setups per test

**Related Rules**: Mock Repository Boundaries, Not Domain Logic
**Related Skills**: Test Actions And Services Unit

---

## Anti-Pattern 2: Happy-Path-Only Testing

**Category**: Testing completeness

**Description**: Testing only the successful return path of an action/service, ignoring exception scenarios, edge cases, and conditional branches.

**Warning Signs**:
- Each action has only one test — the happy path
- No test verifies behavior when a repository throws an exception
- Conditional branches (if/else, switch) are not individually tested
- Error-handling code (catch blocks) has no test coverage

**Why It's Harmful**: An action with three conditional branches has four possible paths. Testing only one means 75% of paths are untested. The unhandled exception path, the edge case branch, and the default fallback are all invisible to the test suite.

**Real-World Consequence**: A `PublishPostAction` has four conditional paths based on post status, user role, and moderation flag. Only the "draft → published by admin" path is tested. The "moderation required" path has a bug that causes a 500 error in production. The bug is caught only when a moderator tries to publish.

**Preferred Alternative**: For each action/service, enumerate all return paths and write a test per path. Include success, each exception type, each conditional branch, and edge cases.

**Refactoring Strategy**:
1. Read the action's source code and enumerate all conditional branches
2. Write a test for each branch (happy + each alternative)
3. For each dependency method call that can fail, add a test where that dependency throws

**Detection Checklist**:
- [ ] Each conditional branch has a dedicated test
- [ ] Each exception path is tested
- [ ] Edge cases (null inputs, empty collections, boundary values) are covered

**Related Rules**: Test All Return Paths
**Related Skills**: Test Actions And Services Unit

---

## Anti-Pattern 3: No Side-Effect Assertions

**Category**: Testing completeness

**Description**: Testing only the return value of an action/service without verifying that events, jobs, notifications, or mail were dispatched correctly.

**Warning Signs**:
- Tests assert `$result->id === 1` but never call `Event::assertDispatched()`
- Actions that trigger emails have no `Mail::fake()` assertions
- Queued jobs are never verified with `Bus::assertDispatched()`

**Why It's Harmful**: The observable outcome of many actions is not the return value but the side effects they trigger. A `CreatePostAction` that returns the correct DTO but never dispatches `PostCreated` means email notifications, audit logs, and webhooks are all silently missing.

**Real-World Consequence**: A `CreatePostAction` returns the correct post DTO. Tests pass. In production, the "post created" email is never sent because the developer forgot to add `PostCreated::dispatch()`. The event assertion was missing from the test, so the missing dispatch went undetected.

**Preferred Alternative**: Use `Event::fake()`, `Bus::fake()`, `Notification::fake()`, `Mail::fake()` before the action and assert dispatch after.

**Refactoring Strategy**:
1. For each action, identify all side effects (events, jobs, mail, notifications)
2. Add `::fake()` before calling the action
3. Assert each side effect was dispatched with the correct payload

**Detection Checklist**:
- [ ] All dispatched events are asserted in tests
- [ ] All queued jobs are asserted in tests
- [ ] Sent mail and notifications are asserted in tests

**Related Rules**: Test Event And Job Dispatch Via Fakes
**Related Skills**: Test Actions And Services Unit
**Related Decision Trees**: Tree 2 — Event and Bus Assertion Strategy

---

## Anti-Pattern 4: Mocking Concrete Classes Without Interfaces

**Category**: Testing architecture

**Description**: Using `Mockery::mock(ConcreteRepository::class)` instead of mocking an interface like `PostRepositoryInterface`.

**Warning Signs**:
- Tests use `$this->mock(ConcreteRepository::class)` instead of `$this->createMock(RepositoryInterface::class)`
- No repository interfaces exist — tests mock Eloquent model classes directly
- Changing a repository method signature requires updating mock expectations in every test

**Why It's Harmful**: Mocking concrete classes couples tests to implementation details. If the concrete class changes its constructor, adds a new dependency, or renames a method, all mock expectations break. Mocking interfaces decouples tests from implementation and allows swapping implementations freely.

**Real-World Consequence**: A `PostRepository` constructor adds a `CacheService` parameter. Every test that mocks `PostRepository` must now update its mock setup to handle the new constructor parameter. Tests that mock `PostRepositoryInterface` are unaffected.

**Preferred Alternative**: Define repository interfaces and always mock at the interface level.

**Refactoring Strategy**:
1. Create interfaces for all repository classes
2. Update service constructors to type-hint the interface
3. Update tests to mock the interface: `createMock(PostRepositoryInterface::class)`

**Detection Checklist**:
- [ ] All repository classes have corresponding interfaces
- [ ] Services type-hint interfaces, not concrete classes
- [ ] Tests mock interfaces, not concrete classes

**Related Rules**: Mock Repository Boundaries, Not Domain Logic
**Related Skills**: Test Actions And Services Unit
**Related Decision Trees**: Tree 1 — Mock Boundary Strategy

---

## Anti-Pattern 5: Over-Mocking Value Objects

**Category**: Testing correctness

**Description**: Creating mocks for DTOs, collections, primitive values, or other value objects instead of using real instances.

**Warning Signs**:
- Tests use `$this->createMock(PostDTO::class)` instead of `new PostDTO(...)`
- Mocks are created for arrays, collections, or simple value objects
- Mock setup code is more verbose than the actual test logic

**Why It's Harmful**: Mocking value objects adds complexity without benefit. Real DTO instances are simpler to create and provide stronger type guarantees. Mocked DTOs can mask construction bugs (wrong parameters, missing required fields).

**Real-World Consequence**: A test mocks `PostDTO` with `->method('toArray')->willReturn(['title' => 'Test'])`. A refactoring adds a required `uuid` field to `PostDTO`. The mock-based test passes. The real service, which uses `new PostDTO(...)`, crashes with a missing parameter error.

**Preferred Alternative**: Always use real instances for value objects: `new PostDTO(title: 'Test', body: 'Content')`.

**Refactoring Strategy**:
1. Replace all `->createMock(SomeDTO::class)` with `new SomeDTO(...)` using valid constructor arguments
2. Replace mock arrays with real array literals
3. Replace mock collections with real `Collection::make([...])`

**Detection Checklist**:
- [ ] No DTOs or value objects are mocked
- [ ] Real instances are used for all data carriers
- [ ] Mock setup code is minimal (mocks only for I/O boundaries)

**Related Rules**: Mock Repository Boundaries, Not Domain Logic
**Related Skills**: Test Actions And Services Unit
