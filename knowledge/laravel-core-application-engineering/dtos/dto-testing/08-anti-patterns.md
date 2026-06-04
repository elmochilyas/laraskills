# ECC Anti-Patterns — DTO Testing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | DTO Testing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Implementation Spy (Testing Constructor Arguments, Not Behavior)
2. The Over-Tested Constructor (Separate Test for Every Property)
3. The Untested Factory (No Coverage for fromModel or fromRequest)
4. Testing PHP-Enforced Type Hints
5. Testing Through HTTP Integration Tests Instead of Pure Unit Tests

---

## Repository-Wide Anti-Patterns

- Mocking DTOs in Tests (Introduces Unnecessary Mocking)
- No Invalid-Input Rejection Tests for DTO Validation
- One Giant Test Method Covering All Factory Methods
- DTO Tests That Depend on Database or HTTP Context
- No Data Providers for Construction Variants

---

## Anti-Pattern 1: The Implementation Spy

### Category
Testing | Maintainability

### Description
Testing that a DTO's constructor was called with specific arguments, or testing how the DTO internally constructs itself, rather than verifying the observable contract.

### Why It Happens
Developers write tests that inspect the mechanism of construction rather than the result. They mock the DTO to verify `fromArray` calls the constructor with specific args.

### Warning Signs
- Test uses `expects()` or `shouldReceive()` on a DTO
- Test verifies that `fromArray` calls `__construct` with specific parameters
- Refactoring the factory method breaks the test even though the observable result is identical
- Test asserts on implementation details (private method calls, internal state)

### Preferred Alternative
Test the observable contract: construct with input → assert property values match. If `fromArray` produces the correct DTO, the implementation is irrelevant.

### Related Rules
- Rule: Test the DTO Contract, Not the Implementation

---

## Anti-Pattern 2: The Over-Tested Constructor

### Category
Testing | Maintainability

### Description
Writing separate test cases for every property of a simple DTO with no factory methods or transformation logic.

### Why It Happens
Developers follow a "one assertion per test" rule rigidly without considering that simple constructors are trivially correct.

### Warning Signs
- 10 separate test methods for a DTO with 3-5 properties and no behavior
- Tests assert `assertEquals('x', $dto->name)` for every property individually
- Test file is 3x longer than the DTO class itself
- Adding a property requires adding 1-3 new test methods

### Preferred Alternative
Use a single data provider covering all properties for simple DTOs. Reserve individual test methods for factory methods, output methods, and validation behavior.

### Related Rules
- Rule: Use Data Providers for Simple Constructor Tests

---

## Anti-Pattern 3: The Untested Factory

### Category
Testing | Reliability

### Description
A `fromModel` or `fromRequest` factory method that silently maps fields incorrectly with no test coverage.

### Why It Happens
Development velocity is prioritized over test coverage for factory methods. The factory seems "trivial" so tests are skipped.

### Warning Signs
- `fromModel()` exists but has no corresponding test
- A field rename in the model does not break any DTO test (because there is none)
- Downstream service tests fail because DTO fields are null or wrong, but the bug takes hours to trace to the factory
- Code review asks "where is this factory tested?"

### Preferred Alternative
Every factory method must have at least one test: construct with known input → assert all expected properties are correctly mapped.

### Related Rules
- Rule: Test Every Factory Method

---

## Anti-Pattern 4: Testing PHP-Enforced Type Hints

### Category
Testing

### Description
Writing `$this->assertIsString($dto->name)` when the DTO already declares `public string $name` — PHP enforces this at the engine level.

### Why It Happens
Developers write exhaustive assertions without considering that PHP's type system already guarantees the constraint.

### Warning Signs
- `assertIsString()`, `assertIsInt()`, `assertInstanceOf()` on properties with native PHP types
- Type assertions for properties declared with `public string`, `public int`, `public bool`
- Test fails by design — PHP would throw a `TypeError` before the assertion runs

### Preferred Alternative
Trust PHP's native type enforcement. Focus tests on value correctness, factory mapping, null handling, and transformation logic — not on PHP-enforced types.

### Related Rules
- Rule: Don't Test PHP-Enforced Types

---

## Anti-Pattern 5: Testing Through HTTP Integration Tests

### Category
Testing | Performance

### Description
Testing DTO construction and transformation through HTTP feature tests that boot the full framework instead of pure unit tests.

### Why It Happens
Developers test DTOs as part of controller feature tests, not realizing DTOs are pure objects that can be tested instantly without framework boot.

### Warning Signs
- DTO construction is only tested through HTTP requests in feature tests
- A DTO test boots the framework, creates a request, and extracts data from the response
- Tests take 100ms+ each instead of <1ms
- CI pipeline is slower because DTO tests depend on framework boot

### Preferred Alternative
Test DTOs as pure unit tests — construct with known input, assert properties and output. No framework booting, no mocking, no HTTP context needed.

### Related Rules
- Rule: Test DTOs as Pure Unit Tests
