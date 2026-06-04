# Decision Trees — Unit Testing Patterns

## Decision Tree 1: Unit Test vs Feature Test

```
What type of test should I write?
│
├── Does the code contain business logic (calculations, conditionals, algorithms)?
│   └── YES → UNIT TEST (20% of suite)
│       ├── Use `#[UnitTest]` attribute or extend `PHPUnit\Framework\TestCase`
│       ├── Test: calculators, policies, services, actions, value objects
│       ├── Speed: <1ms per test
│       └── Mock external dependencies at interface boundaries
│
├── Does the code interact with database, HTTP, or views?
│   └── YES → FEATURE TEST (70% of suite)
│       ├── Use Laravel's `Tests\TestCase`
│       ├── Test: controllers, routes, middleware, database queries
│       ├── Speed: ~30-50ms per test
│       └── Use RefreshDatabase or DatabaseTransactions
│
└── Does it test browser behavior or user interaction?
    └── YES → E2E/BROWSER TEST (10% of suite)
        ├── Use Laravel Dusk or Pest Playwright
        ├── Test: full user flows, JavaScript, UI rendering
        └── Speed: 1-5s per test
```

## Decision Tree 2: AAA vs Given-When-Then Structure

```
How should the test be structured?
│
├── Is the test verifying a pure business logic function?
│   └── Use AAA (Arrange-Act-Assert)
│       ```php
│       // Arrange
│       $calculator = new TaxCalculator();
│       // Act
│       $result = $calculator->calculate(100, 0.08);
│       // Assert
│       expect($result->total)->toBe(108.00);
│       ```
│
├── Is the test describing a user story or behavioral scenario?
│   └── Use Given-When-Then
│       ```php
│       test('admin can approve pending orders')
│           ->given(fn() => ...)       // Given: admin user, pending order
│           ->when(fn() => ...)        // When: admin approves
│           ->then(fn() => ...);       // Then: order is approved
│       ```
│
└── Is it a simple one-assertion test?
    └── Use inline structure
        `test('adds two numbers', fn() => expect((new Calculator())->add(2, 2))->toBe(4));`
```

## Decision Tree 3: How Many Tests for a Business Logic Class

```
How many tests does this business logic class need?
│
├── Happy path (the primary use case)
│   └── 1 test — validates the main success scenario
│       Example: "calculates tax correctly for domestic orders"
│
├── Edge cases (boundary values, empty states, singular items)
│   └── N tests — one per edge case
│       Example: "handles zero amount", "handles maximum allowed value"
│
├── Error conditions (invalid inputs, missing data)
│   └── N tests — one per error scenario
│       Example: "throws on negative amount", "throws on null currency"
│
└── Conditional branches (each if/else, switch, match)
    └── 1 test per branch — target >90% line coverage
        Example: "applies international rate for non-domestic orders"
```
