# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: Test Double Taxonomy
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Test doubles are stand-in objects that replace real dependencies during testing. The taxonomy—dummies, stubs, spies, mocks, and fakes—defines the purpose and behavior of each double type. Using the correct double type prevents brittle tests, over-specification, and false confidence. Laravel's built-in fakes (Http, Mail, Queue, etc.) are preferred over mocks for most scenarios. Understanding the taxonomy is foundational to writing tests that are both reliable and maintainable.

# Core Concepts
- **Dummy**: An object passed but never used. Fills parameter lists. Example: `new NullLogger()` passed to a constructor that requires `LoggerInterface`.
- **Stub**: Provides canned answers to calls made during the test. Used for query/read methods. Example: `$repository->find(1)` returns a predefined model.
- **Spy**: Records which methods were called and with what arguments. Used for verification after the fact.
- **Mock**: Pre-programmed with expectations about which methods will be called, with what arguments, how many times. Uses verification before the fact (expect-then-verify).
- **Fake**: A working implementation that simplifies real behavior. Example: Laravel's `Http::fake()` returns responses without network calls.
- **Laravel's hierarchy**: Fakes > Spies > Mocks > Stubs > Dummies. Prefer fakes (most realistic), then spies (least brittle verification), then mocks (explicit but brittle).

# Mental Models
- **Queries vs Commands**: Stubs replace query methods (get data, return value). Mocks/spies replace command methods (perform action, return void). Separating these determines double type.
- **State verification vs Interaction verification**: State verifies the system under test's output. Interaction verifies that specific methods were called on the double. State is preferred.
- **Fakes as lightweight implementations**: A fake is a real class that does something simpler. Laravel's `FakeHttpClient` stores requests and returns predefined responses without network I/O.
- **Brittleness spectrum**: Fakes < Spies < Mocks (least to most brittle). Fakes are more tolerant of implementation changes; mocks break when call patterns change.

# Internal Mechanics
- **Mock (PHPUnit/Mockery)**: Creates a proxy class via `PHPUnit\Framework\MockObject\Generator`. The proxy intercepts method calls, checks expectations, and returns configured values.
- **Mock expectations**: `$mock->expects($this->once())->method('send')->with($email)`. If `send()` is called 0 or 2+ times, the test fails.
- **Spy vs Mock in Mockery**: `Mockery::spy()` returns a `Spy` instance. Calls are not pre-configured. After the act phase, call `$spy->shouldHaveReceived('send')->with($email)`.
- **Laravel fakes**: Each fake is a dedicated class implementing the same interface as the real service. `HttpFake` implements `Client` interface and returns responses from a queue without HTTP calls.
- **Partial mocks**: `$this->partialMock(Service::class)` creates a mock where unmocked methods delegate to the real implementation. Used for overriding specific methods.
- **Container binding**: `$this->instance(Contract::class, $mock)` binds the mock into the service container. Subsequent resolutions return the mock.

# Patterns
- **Pattern: Prefer fakes over mocks**
  - Purpose: Use Laravel's built-in fake implementations instead of mocking
  - Benefits: More realistic behavior, less brittle, less setup code
  - Tradeoffs: Fakes may not exist for all interfaces; custom fakes must be written
  - Implementation: `Http::fake()` instead of mocking `Client`; `Queue::fake()` instead of mocking `Dispatcher`

- **Pattern: Stub queries, mock commands**
  - Purpose: Use stubs for methods that return data, mocks for methods that perform actions
  - Benefits: Appropriate verification level for each interaction type
  - Tradeoffs: Some methods blur the line (e.g., a cache get that also logs)
  - Implementation: `$repoStub->method('find')->willReturn($user)` vs `$mailerMock->expects()->send($user)`

- **Pattern: Spy for post-hoc verification**
  - Purpose: Verify interactions after the test action, not before
  - Benefits: Tests are less brittle; the "act" phase is not interrupted by expectation failures
  - Tradeoffs: Spies cannot provide return values for method calls
  - Implementation: `Mail::fake()` then `Mail::assertSent(InvitationMail::class)` after `$action->execute()`

# Architectural Decisions
- **When to use mocks**: For complex orchestration logic where call count and arguments are critical. Example: verifying exactly one email is sent per registration.
- **When to use fakes**: For external service boundaries (HTTP, mail, queue, storage). Fakes provide realistic behavior without mock setup.
- **When to use stubs**: For repository/data source methods where only the return value matters. Example: stubbing `UserRepository::find()` to return a user.
- **When to use dummies**: For filling constructor parameters that the system under test doesn't use. Example: passing `NullLogger` when testing a service that logs conditionally.
- **When to use real implementations**: For value objects, collections, and stateless utilities. Real instances are more reliable and require no setup.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fakes are realistic and simple | Must write/maintain fake implementations | Fakes become part of the codebase |
| Mocks provide precise verification | Tests break on implementation refactors | Over-mocking leads to high maintenance cost |
| Spies are less brittle than mocks | Cannot provide return values | Use mocks for stubbing, spies for verification |
| Stubs are simple and focused | Cannot verify interaction patterns | Supplement with spies when interaction matters |
| Real implementations are most reliable | May have side effects (I/O, state) | Only use for stateless, side-effect-free classes |

# Performance Considerations
- **Fake overhead**: Laravel fakes are lightweight. `HttpFake` stores requests in memory. Negligible overhead (<0.1ms per fake operation).
- **Mock generation**: PHPUnit mock generation uses reflection to create proxy classes. First call per class is slower (~5ms), subsequent calls are cached.
- **Mockery comparison**: Mockery mocks are slightly faster than PHPUnit's native mocks due to optimized proxy generation. Difference is negligible for test suites <10,000 mocks.
- **Memory**: Each mock stores method configuration and invocation history. 1,000 mocks use ~10MB memory. Manageable but not free.

# Production Considerations
- **Code review**: Test doubles should be as visible as production code in code review. Over-mocking is a code smell that indicates tight coupling.
- **Fake maintenance**: When real service interfaces change, fakes must be updated. Treat fakes as production code with the same maintenance standards.
- **Mock overuse detection**: If a test file has more mock setup lines than test assertion lines, it may be over-mocked. Refactor to use fakes or real implementations.

# Common Mistakes
- **Mistake: Mocking value objects**
  - Why: Value objects are simple data containers
  - Why harmful: Mocking adds zero value; real instances are simpler
  - Better: Always use real value object instances

- **Mistake: Using mocks for everything**
  - Why: "Mock all dependencies" approach
  - Why harmful: Tests become brittle; refactoring breaks many tests
  - Better: Use fakes for framework boundaries, real instances for value objects, mocks only for orchestration verification

- **Mistake: Partial mocks of the class under test**
  - Why: Testing a class while mocking some of its own methods
  - Why harmful: You're testing implementation details; the mock defeats the purpose
  - Better: Extract the mocked method into a separate collaborator if it needs overriding

# Failure Modes
- **Mock expectation mismatch**: `expects($this->once())` but method called 0 or 2 times. Tests fail with unclear message. Use `Mockery::shouldReceive()->atMost()` for flexible matching.
- **Fake implementation drift**: A fake is updated to match an interface but behaves inconsistently with real implementation. Keep fakes simple and audited.
- **Stale dummy objects**: Dummies with required constructor parameters that change. Constructors with many dependencies are a design smell.
- **Partial mock unexpected behavior**: Unmocked methods on partial mocks call the real implementation, which may have side effects. Use with caution.

# Ecosystem Usage
- **Laravel core**: Laravel's internal tests use a mix of fakes (Http, Cache, Event) and mocks (for services like Mailer, Queue).
- **Pest**: Pest doesn't change the double taxonomy. Standard PHPUnit and Mockery doubles work identically.
- **Mockery**: The defacto mocking framework in the Laravel ecosystem. Provides `mock()`, `partialMock()`, `spy()` helpers via Laravel's base TestCase.
- **PHPUnit**: Native mocking via `$this->createMock()`, `$this->getMockBuilder()`. Sufficient for most cases; Mockery adds syntactic sugar.

# Related Knowledge Units
- **Prerequisites**: PHPUnit/Pest fundamentals, Dependency injection principles
- **Related Topics**: Laravel fakes, Mockery integration, HTTP Client faking, Mail/Notification fakes
- **Advanced Follow-up**: Partial mock strategies, Custom fake development, Service container binding testing

# Research Notes
- The Laravel ecosystem strongly favors fakes over mocks (Research Finding 4 from domain analysis)
- "Don't mock what you don't own" is consistently cited—mock interfaces you control, not third-party SDKs
- Mocking Eloquent models is an anti-pattern; use factory-created records in feature tests instead
