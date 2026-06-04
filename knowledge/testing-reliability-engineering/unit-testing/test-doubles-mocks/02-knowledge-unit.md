# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: Test Doubles & Mocks
KU Code: ku-04-test-doubles-mocks
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
Test doubles are stand-in objects that replace real dependencies during testing. The taxonomy — dummies, stubs, spies, mocks, and fakes — defines the purpose and behavior of each double type. Using the correct double type prevents brittle tests, over-specification, and false confidence. Laravel's built-in fakes are preferred over mocks for most scenarios.

# Core Concepts
- **Dummy**: An object passed but never used. Fills parameter lists.
- **Stub**: Provides canned answers to calls. Used for query/read methods.
- **Spy**: Records which methods were called and with what arguments. Verification happens after the fact.
- **Mock**: Pre-programmed with expectations about which methods will be called, with what arguments, how many times.
- **Fake**: A working implementation that simplifies real behavior. Example: Laravel's `Http::fake()`.
- **Laravel's hierarchy**: Fakes > Spies > Mocks > Stubs > Dummies. Prefer fakes (most realistic), then spies (least brittle), then mocks (explicit but brittle).

# Mental Models
- **Double type selection by need**: Choose the simplest double that satisfies your test need. Dummy if unused, Stub if only return value matters, Spy for post-hoc check, Mock for exact expectations, Fake for realistic behavior.
- **Fakes as simplified reality**: Fakes are real implementations with simplified behavior. They're more realistic than mocks and less brittle.
- **Stub queries, mock commands**: Query methods (get, find) should be stubbed. Command methods (send, dispatch) can be mocked.

# Internal Mechanics
- PHPUnit's `createMock()` uses reflection to create a proxy class. The proxy delegates to generated methods based on `expects()` and `method()` configuration.
- `createStub()` is a variant of `createMock()` with default behavior of returning `null` for unstubbed methods.
- Mockery's `mock()` creates a similar proxy but with additional features like partial mocking, spies, and configuration shortcuts.
- Laravel fakes (e.g., `HttpFake`) are hand-written classes that implement the real interface with simplified in-memory behavior.
- Container-bound mocks are resolved by the service container when the bound interface/class is requested.

# Patterns
- **Laravel fake pattern**: `Mail::fake()`, `Queue::fake()`, `Storage::fake()` for built-in Laravel services.
- **Stub query, mock command pattern**: Use stubs for return values, mocks for call verification.
- **Spy for post-hoc verification pattern**: Use spies when you want to verify interactions without pre-configuring expectations.
- **Interface mock pattern**: Mock interfaces, not concrete classes. Couples to contracts, not implementations.

# Architectural Decisions
- **Decision: Laravel fakes over Mockery by default**: Fakes provide more realistic behavior and are less brittle. Mockery only for advanced scenarios.
- **Decision: PHPUnit stubs over mocks**: Prefer `createStub()` for dependencies where only return value matters. Reduces test brittleness.
- **Decision: Interface mocking**: Mock the interface contract, not the implementation. Allows implementation changes without test changes.

# Tradeoffs
- **Fakes vs mocks**: Fakes are more realistic but require a real implementation. Mocks are auto-generated but fragile.
- **Spy vs mock**: Spies verify after the fact (less brittle). Mocks verify during execution (more strict).
- **Exact expectations vs atLeast**: Exact call count (`$this->once()`) is more strict but breaks on legitimate refactoring. `$this->atLeast(1)` is more tolerant.

# Performance Considerations
- Fake overhead: <0.1ms per operation. Laravel fakes are lightweight in-memory implementations.
- Mock generation: PHPUnit uses reflection to create proxy classes. First call per class ~5ms, subsequent calls cached.
- Mockery vs PHPUnit: Mockery mocks are slightly faster but difference is negligible for suites <10,000 mocks.
- Memory: Each mock stores method configuration and invocation history. 1,000 mocks ~10MB.

# Production Considerations
- Fake isolation: Laravel fakes are scoped per-test. `Http::fake()` in one test doesn't affect others.
- Mock verification: Mocks verify exact call patterns. Ensure expectations don't leak security-relevant information.
- Container binding: Mocks bound to the container replace real services. Ensure they implement the correct interface.
- Partial mock unexpected behavior: Unmocked methods on partial mocks call real implementations, which may have side effects.

# Common Mistakes
- **Mocking value objects**: Always use real value object instances. They're simple data containers.
- **Using mocks for everything**: Mocking every dependency creates brittle tests. Use fakes for framework boundaries.
- **Partial mocks of the class under test**: Testing implementation details. Extract the mocked method into a separate collaborator.
- **Mocking Eloquent models**: Eloquent models are tightly coupled to the database. Use factory-created records in feature tests.

# Failure Modes
- Over-specification: `$mock->expects($this->once())` when `$this->atLeast(1)` is appropriate. Brittle tests from exact count expectations.
- No mock cleanup: Mocks registered in the container persist across tests. Clean up in `tearDown()`.
- Unmatched expectations: A `shouldReceive()` that is never called causes a test failure at end of test.
- Partial mock real calls: Unmocked methods on partial mocks call real implementations with potentially dangerous side effects.

# Ecosystem Usage
- Laravel provides first-party fakes for Http, Mail, Queue, Notification, Storage, Event, Bus, and Cache.
- PHPUnit includes built-in `createMock()`, `createStub()`, `createPartialMock()`, and `createConfiguredStub()`.
- Mockery is the most popular third-party mocking library for PHP with additional features like spies and partial mocks.
- Community convention: Use PHPUnit mocks for simple stubs, Mockery for advanced features, Laravel fakes for framework services.

# Related Knowledge Units
- Laravel fakes (Http, Mail, Queue, Notification, Storage, Event, Bus)
- Mockery integration
- HTTP Client faking
- Unit testing patterns
- Service container binding testing

# Research Notes
- The test double terminology was formalized by Gerard Meszaros in xUnit Test Patterns (2007).
- PHPUnit's mock API has evolved significantly. `createStub()` was added in PHPUnit 10 as a more intent-revealing alternative.
- Mockery's popularity has declined as PHPUnit's built-in mocking has improved and Laravel's fakes have become more comprehensive.
- The preference for fakes over mocks represents a broader industry trend toward realistic test doubles.
