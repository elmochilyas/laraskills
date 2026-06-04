# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: Test Doubles & Mocks
 KU Code: ku-04-test-doubles-mocks
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Test doubles are stand-in objects that replace real dependencies during testing. The taxonomy — dummies, stubs, spies, mocks, and fakes — defines the purpose and behavior of each double type. Using the correct double type prevents brittle tests, over-specification, and false confidence. Laravel's built-in fakes (Http, Mail, Queue) are preferred over mocks for most scenarios. Understanding the taxonomy is foundational to writing tests that are both reliable and maintainable.

# Core Concepts
- **Dummy**: An object passed but never used. Fills parameter lists. Example: `new NullLogger()` passed to a constructor.
- **Stub**: Provides canned answers to calls. Used for query/read methods. Example: `$repository->find(1)` returns a predefined model.
- **Spy**: Records which methods were called and with what arguments. Verification happens after the fact.
- **Mock**: Pre-programmed with expectations about which methods will be called, with what arguments, how many times. Expect-then-verify.
- **Fake**: A working implementation that simplifies real behavior. Example: Laravel's `Http::fake()` returns responses without network calls.
- **Laravel's hierarchy**: Fakes > Spies > Mocks > Stubs > Dummies. Prefer fakes (most realistic), then spies (least brittle verification), then mocks (explicit but brittle).

# When To Use
- **Fakes**: When testing code that interacts with Laravel services (HTTP, Mail, Queue, Notification, Storage, Bus, Event). These are preferred.
- **Mocks**: When verifying orchestration logic — that a specific method was called with specific arguments exactly N times.
- **Spies**: When you need to verify interactions after the fact but don't need pre-configured expectations.
- **Stubs**: When only the return value matters and interaction pattern is irrelevant.
- **Dummies**: When a constructor parameter is required but the test doesn't use the injected object.

# When NOT To Use
- **Mocking value objects**: Value objects are simple data containers. Always use real instances.
- **Mocking Eloquent models**: Eloquent models are tightly coupled to the database. Use factory-created records in feature tests instead.
- **Mocking the class under test**: Partial mocks of the class under test indicate a design problem.
- **Over-mocking**: When mock setup lines exceed test assertion lines, you're probably over-mocking.
- **Mocks for everything**: If every test file has extensive mock setup, consider refactoring to use fakes or real implementations.

# Best Practices (WHY)
- **Prefer fakes over mocks**: Reason: Laravel's `Http::fake()`, `Mail::fake()`, `Queue::fake()` provide realistic in-memory implementations. They're less brittle than mocks and require less setup code.
- **Stub queries, mock commands**: Reason: query methods (get, find, all) should be stubbed (return value matters). Command methods (send, dispatch, notify) can be mocked (call pattern matters).
- **Prefer state verification over interaction verification**: Reason: `assertEquals(4, $calculator->add(2, 2))` is more stable than verifying `add()` was called with specific arguments. State tests don't break on refactoring.
- **Don't mock what you don't own**: Reason: third-party SDK interfaces may change without notice. Mock your own interfaces that wrap third-party code, not the SDK classes directly.
- **Use spies for post-hoc verification**: Reason: spies don't interrupt the test on unexpected calls. `$spy->shouldHaveReceived('send')->once()` is less brittle than `$mock->expects($this->once())->method('send')`.
- **Set expectations on interface contracts, not implementations**: Reason: mocking a concrete class creates coupling to that class. Mock the interface to test the contract.
- **Keep mock setups visible in test methods**: Reason: shared mock setup in `setUp()` hides important test configuration. Readers must scan multiple methods to understand the test.

# Architecture Guidelines
- **Dependency injection**: Design classes to receive dependencies via constructor injection. Testable code has explicit dependencies.
- **Interface boundaries**: Define interfaces for external services. Mock/implement the interface, not the concrete class.
- **Laravel fakes hierarchy**: `Http::fake()` > `Queue::fake()` > `Mail::fake()` > `Notification::fake()` > `Storage::fake()` > `Event::fake()` > `Bus::fake()`.
- **Mockery vs PHPUnit**: Use PHPUnit's `$this->createMock()` for simple stubs. Use Mockery's `mock()`, `spy()`, `partialMock()` for advanced expectations.
- **Container binding**: `$this->instance(Contract::class, $mock)` binds mocks into the service container for feature tests.
- **Partial mocks caution**: `$this->partialMock(Service::class)` creates a mock where unmocked methods call the real implementation. Use sparingly.

# Performance
- **Fake overhead**: <0.1ms per operation. Laravel fakes are lightweight in-memory implementations.
- **Mock generation**: PHPUnit uses reflection to create proxy classes. First call per class ~5ms, subsequent calls cached.
- **Mockery vs PHPUnit**: Mockery mocks are slightly faster but difference is negligible for suites <10,000 mocks.
- **Memory**: Each mock stores method configuration and invocation history. 1,000 mocks ~10MB.

# Security
- **Fake isolation**: Laravel fakes are scoped per-test. `Http::fake()` in one test doesn't affect others.
- **Mock verification**: Mocks verify exact call patterns. Ensure expectations don't leak security-relevant call information.
- **Container binding**: Mocks bound to the container replace real services. Ensure they implement the correct interface.
- **Partial mock unexpected behavior**: Unmocked methods on partial mocks call real implementations, which may have side effects.

# Common Mistakes

**Mistake: Mocking value objects**
- Description: `$this->createMock(Email::class)` instead of `new Email('test@example.com')`
- Cause: "All dependencies must be mocked"
- Consequence: Mock adds zero value; real instance is simpler and more reliable
- Better: Always use real value object instances. They're simple data containers.

**Mistake: Using mocks for everything**
- Description: Mocking every dependency in every test
- Cause: "Mock all dependencies for true isolation"
- Consequence: Tests become brittle; refactoring breaks many tests; high maintenance cost
- Better: Use fakes for framework boundaries, real instances for value objects, mocks only for orchestration verification.

**Mistake: Partial mocks of the class under test**
- Description: `$this->partialMock(Service::class)->shouldReceive('privateMethod')`
- Cause: "Testing a specific method in isolation"
- Consequence: You're testing implementation details; the mock defeats the purpose of the test
- Better: Extract the mocked method into a separate collaborator if it needs overriding.

**Mistake: Mocking Eloquent models**
- Description: `$this->createMock(User::class)` and setting expectations on `save()`
- Cause: "Isolating the test from the database"
- Consequence: Eloquent models are tightly coupled to the database; mocks behave differently than real models
- Better: Use factory-created records in feature tests for model-dependent logic.

# Anti-Patterns
- **Mockery overuse**: Using `Mockery::mock()` when `$this->createStub()` would suffice. Adds unnecessary dependencies.
- **Shared mock setup in setUp()**: Mocks configured in `setUp()` are invisible to test readers. Configure in test methods when possible.
- **Over-specification**: `$mock->expects($this->once())` when `$this->atLeast(1)` is appropriate. Brittle tests from exact count expectations.
- **No mock cleanup**: Mocks registered in the container persist across tests. Clean up in `tearDown()`.
- **Testing implementation through mocks**: Verifying that method A called method B on a mock, when method B is an implementation detail.

# Examples

**Laravel fakes (preferred)**
```php
test('order confirmation sends email', function () {
    Mail::fake();
    Queue::fake();

    $this->post('/orders', ['product' => 'SKU-001']);

    Mail::assertSent(OrderConfirmation::class);
    Queue::assertPushed(ProcessOrder::class);
});
```

**Stub for query method**
```php
test('user service returns user from repository', function () {
    $repository = $this->createStub(UserRepository::class);
    $user = new User(['id' => 1, 'name' => 'Test']);
    $repository->method('find')->with(1)->willReturn($user);

    $service = new UserService($repository);
    $result = $service->getUser(1);

    expect($result)->toBe($user);
});
```

**Mock for command method**
```php
test('register user dispatches welcome notification', function () {
    $notifier = $this->createMock(NotificationService::class);
    $notifier->expects($this->once())
        ->method('sendWelcome')
        ->with($this->isInstanceOf(User::class));

    $action = new RegisterUserAction($notifier);
    $action->execute(['name' => 'Test', 'email' => 'test@example.com']);
});
```

**Spy for post-hoc verification**
```php
test('logger records order confirmation', function () {
    $logger = Mockery::spy(Logger::class);
    $service = new OrderService($logger);

    $service->confirmOrder(1);

    $logger->shouldHaveReceived('info')
        ->once()
        ->with(Mockery::on(fn ($msg) => str_contains($msg, 'confirmed')));
});
```

# Related Topics
- Laravel fakes (Http, Mail, Queue, Notification, Storage, Event, Bus)
- Mockery integration
- HTTP Client faking
- Unit testing patterns
- Service container binding testing

# AI Agent Notes
- When generating tests, prefer Laravel fakes over Mockery mocks. Use `Http::fake()`, `Mail::fake()`, `Queue::fake()` by default.
- Use `$this->createStub()` for dependencies where only the return value matters.
- Use `$this->createMock()` with `expects()` only when call count and arguments are critical.
- Never mock value objects, Eloquent models, or the class under test.
- Generate spies (`Mockery::spy()`) for post-hoc verification when pre-configured expectations are not suitable.
- Keep mock setup visible in the test method, not hidden in `setUp()`.

# Verification
- [ ] Fakes are preferred over mocks (Http::fake(), Mail::fake(), Queue::fake())
- [ ] Value objects are always real instances, never mocks
- [ ] Eloquent models are never mocked; feature tests use factory-created records
- [ ] Partial mocks of the class under test are not used
- [ ] Stubs are used for query/read methods; mocks for command/write methods
- [ ] Mock expectations are visible in test methods, not hidden in setUp()
- [ ] "Don't mock what you don't own" principle is followed
- [ ] Mocks in the container are cleaned up after each test
