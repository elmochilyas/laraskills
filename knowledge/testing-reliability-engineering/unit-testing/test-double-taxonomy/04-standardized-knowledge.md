# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Unit Testing |
| Knowledge Unit | Test Double Taxonomy |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | PHPUnit/Pest fundamentals, Dependency injection principles |
| Related KUs | Laravel fakes, Mockery integration, HTTP Client faking |
| Source | domain-analysis.md K045 |

# Overview

Test doubles are stand-in objects that replace real dependencies during testing. The taxonomy—dummies, stubs, spies, mocks, and fakes—defines the purpose and behavior of each double type. Using the correct double type prevents brittle tests, over-specification, and false confidence. Laravel's built-in fakes (Http, Mail, Queue, etc.) are preferred over mocks for most scenarios. Understanding the taxonomy is foundational to writing tests that are both reliable and maintainable.

# Core Concepts

- **Dummy**: An object passed but never used. Fills parameter lists. Example: `new NullLogger()` passed to a constructor requiring `LoggerInterface`.
- **Stub**: Provides canned answers to calls made during the test. Used for query/read methods. Example: `$repository->find(1)` returns a predefined model.
- **Spy**: Records which methods were called and with what arguments. Used for verification after the fact.
- **Mock**: Pre-programmed with expectations about which methods will be called, with what arguments, how many times. Uses verification before the fact.
- **Fake**: A working implementation that simplifies real behavior. Example: Laravel's `Http::fake()` returns responses without network calls.
- **Laravel's hierarchy**: Fakes > Spies > Mocks > Stubs > Dummies. Prefer fakes (most realistic), then spies (least brittle verification), then mocks.

# When To Use

- **Fakes**: For external service boundaries (HTTP, mail, queue, storage) where realistic behavior matters
- **Stubs**: For repository/data source methods where only the return value matters
- **Spies**: For post-hoc verification of interactions without pre-configured expectations
- **Mocks**: For complex orchestration logic where call count and arguments are critical
- **Dummies**: For filling constructor parameters that aren't used by the system under test

# When NOT To Use

- **Mocking value objects**: Always use real instances for simple data containers
- **Mocking everything**: Leads to brittle tests that break on implementation changes
- **Partial mocks of class under test**: Defeats the purpose of unit testing
- **Over-mocking at multiple layers**: Creates tests that verify mock setup, not actual behavior
- **Third-party SDK mocking**: Mock interfaces you control; use integration tests for third-party code

# Best Practices (WHY)

- **Prefer fakes over mocks**: Reason: fakes provide more realistic behavior with less brittle setup. Laravel provides built-in fakes for most services.
- **Stub queries, mock commands**: Reason: use stubs for methods that return data (queries), mocks/spies for methods that perform actions (commands).
- **Prefer state verification over interaction verification**: Reason: verify the system under test's output rather than verifying that specific methods were called.
- **Don't mock what you don't own**: Reason: third-party SDKs change independently. Use integration tests for third-party boundaries.
- **Keep mock setup minimal**: Reason: if a test has more mock setup lines than assertion lines, it may be over-mocked.

# Architecture Guidelines

- **Double selection hierarchy**: Fakes (most preferred) → Spies → Mocks → Stubs → Dummies (least preferred).
- **Container binding**: Use `$this->instance(Contract::class, $mock)` to bind mocks into the service container.
- **Fake maintenance**: When real service interfaces change, fakes must be updated. Treat fakes as production code.
- **Mock visibility**: Test doubles should be as visible in code review as production code. Over-mocking is a code smell.

# Performance Considerations

- **Fake overhead**: Laravel fakes are lightweight. `HttpFake` stores requests in memory. Negligible overhead (<0.1ms per operation).
- **Mock generation**: PHPUnit mock generation uses reflection. First call per class is slower (~5ms), subsequent calls are cached.
- **Mockery comparison**: Mockery mocks are slightly faster than PHPUnit's native mocks. Difference is negligible for suites <10,000 mocks.
- **Memory**: Each mock stores method configuration and invocation history. 1,000 mocks use ~10MB memory.

# Security Considerations

- **Fake data exposure**: Fakes may store sensitive data in memory. Clear fakes between tests.
- **Mock expectations**: Incorrect mock expectations may mask security vulnerabilities in authorization or validation logic.
- **Partial mock risks**: Unmocked methods on partial mocks call real implementations with potential side effects. Use with caution.

# Common Mistakes

**Mistake: Mocking value objects**
- Description: Creating mocks for simple data containers like `Email` or `Money`
- Cause: "Mock all dependencies" approach
- Consequence: Mocking adds zero value; real instances are simpler
- Better: Always use real value object instances.

**Mistake: Using mocks for everything**
- Description: Mocking all dependencies regardless of type
- Cause: "More control over the test"
- Consequence: Tests become brittle; refactoring breaks many tests
- Better: Use fakes for framework boundaries, real instances for value objects, mocks only for orchestration.

**Mistake: Partial mocks of the class under test**
- Description: Testing a class while mocking some of its own methods
- Cause: Isolating the class from its own logic
- Consequence: You're testing implementation details
- Better: Extract the mocked method into a separate collaborator if it needs overriding.

# Anti-Patterns

- **Expecting specific call counts unnecessarily**: `expects($this->once())` when `atLeast()` or `atMost()` would be more appropriate.
- **Mocking Eloquent models**: Use factory-created records in feature tests instead of mocking model instances.
- **Dummy objects with complex setup**: If a dummy needs complex setup, it's not a dummy—it's a real dependency.
- **Spying where a stub would suffice**: Using spies for query methods where only the return value matters.

# Examples

**Fake (preferred)**
```php
Http::fake(['api.example.com/*' => Http::response(['status' => 'ok'], 200)]);
$response = $this->get('/fetch-data');
Http::assertSent(function ($request) {
    return $request->url() === 'api.example.com/data';
});
```

**Stub**
```php
$repository = Mockery::mock(UserRepository::class);
$repository->shouldReceive('find')->with(1)->andReturn(new User(['id' => 1]));
```

**Spy**
```php
$mailer = Mockery::spy(Mailer::class);
$action->execute($data);
$mailer->shouldHaveReceived('send')->once()->with($data['email']);
```

**Mock**
```php
$mock = Mockery::mock(Mailer::class);
$mock->shouldReceive('send')->once()->with(Mockery::type(InvitationMail::class));
app()->instance(Mailer::class, $mock);
```

# Related Topics

- Laravel fakes (Http, Mail, Queue, Event, Storage, Bus, Notification)
- Mockery integration (mock, partialMock, spy)
- HTTP Client faking
- Mail/Notification testing with fakes
- Service container binding testing

# AI Agent Notes

- When generating test code, prefer Laravel's built-in fakes (Http::fake, Mail::fake, Queue::fake, etc.) over Mockery mocks.
- Use `Mockery::spy()` for post-hoc verification and `Mockery::mock()` for pre-configured expectations.
- Never generate mock expectations for value objects or Eloquent models.
- Container binding: use `$this->instance()` or `$this->swap()` in Laravel tests to replace services.
- For third-party SDKs without Laravel-native fakes, create custom fake implementations.

# Verification

- [ ] Fakes are preferred over mocks in test code
- [ ] Value objects use real instances, not mocks
- [ ] Eloquent models are never mocked
- [ ] Mock setup is minimal (mock lines < assertion lines)
- [ ] Stubs are used for query methods, mocks/spies for command methods
- [ ] Container binding uses `$this->instance()` or `$this->swap()`
- [ ] Fakes are cleared between tests
- [ ] Third-party SDK boundaries have custom fake implementations
