# Decision Trees: Service Layer Testing Strategies

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service layer testing strategies
- **Knowledge Unit ID:** SLP-17
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Mock boundaries vs mock everything | Testing | Test design |
| 2 | Test outcomes vs test call sequences | Testing | Assertion strategy |
| 3 | Unit test vs integration test vs feature test | Testing | Test type selection |

---

## Decision 1: Mock boundaries vs mock everything

### Context
Over-mocking is a common testing anti-pattern — every dependency including value objects and simple data classes is mocked. This creates brittle tests that break on refactoring and don't verify real behavior. Mock only external boundaries: repositories, mailers, API clients, event dispatchers. Keep value objects, DTOs, and models as real objects.

### Decision Tree

```
Is the dependency an external boundary (repository, mailer, API, event)?
├── YES → Mock it
│   `$repository = $this->createMock(UserRepository::class);`
│   Configure expectations for methods the service calls
└── NO (dependency is a value object, DTO, or model)
    → Use real object
    Is the dependency expensive to construct (large dataset, external config)?
    ├── YES → Consider a test double (stub, not mock)
    └── NO → Real object is better
        `$data = new RegisterUserData('John', 'john@example.com');`
```

### Rationale
Mocking value objects and DTOs adds test complexity without benefit. Real value objects test serialization, validation, and type logic alongside the service. Mocking boundaries isolates the service logic while keeping data objects real. Each unnecessary mock increases test maintenance and reduces confidence — a test with 6 mocks will break on minor refactoring.

### Recommended Default
Mock external boundaries only; use real objects for value types

### Risks
- Over-mocking: brittle tests break on implementation changes
- Under-mocking: tests hit real external services (slow, unreliable)
- Mock/reality mismatch: mock returns values the real implementation never would

### Related Rules
- Mock The Boundaries, Not The Internals (SLP-17/05-rules.md)
- Avoid Over-Mocking (SLP-17/05-rules.md)
- Use In-Memory Implementations For Contract Tests (SLP-17/05-rules.md)

### Related Skills
- Test Service Layer Components Effectively (SLP-17/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Run Architecture Tests (AEG-01/06-skills.md)

---

## Decision 2: Test outcomes vs test call sequences

### Context
A common testing mistake is asserting that specific methods were called in a specific order on mocks. This couples tests to implementation details. When the implementation is refactored (method order changes, methods are merged or split), the tests break even though behavior is unchanged. Test outcomes and side effects instead.

### Decision Tree

```
Are your mock assertions checking method call order or call count?
├── YES → You're testing implementation details
│   Can the assertion be replaced with an outcome check?
│   ├── YES → Replace with outcome assertion
│   │   `$this->assertSame('completed', $result->status);`
│   └── NO (side effect with no observable return)
│       → Use `willReturnCallback` to capture side effects
│       Then assert on the captured effect, not the call sequence
└── NO (assertions are on return values and state)
    → Testing outcomes — correct approach
    Do you verify the service produced the right result?
    ├── YES → Good — tests won't break on refactoring
    └── NO → Add assertions on the final state/return value
```

### Rationale
Testing outcomes (return values, observable state changes) decouples tests from implementation. A service that calls `repo.save()` then `mailer.send()` could be refactored to call `mailer.send()` then `repo.save()` — behavior is unchanged, but call-sequence tests break. Outcome-based tests continue to pass. Use `willReturnCallback` to capture side effects for verification without asserting call order.

### Recommended Default
Assert on outcomes (return values, state); avoid asserting mock call sequences

### Risks
- Brittle tests from call-sequence assertions: every refactor breaks tests
- False confidence: tests pass but method call arguments are wrong
- Missed side effects: not verifying that events were dispatched correctly

### Related Rules
- Test Outcomes, Not Call Sequences (SLP-17/05-rules.md)
- Mock The Boundaries, Not The Internals (SLP-17/05-rules.md)
- Prioritize Unit Tests For Coverage, Feature Tests For Critical Paths (SLP-17/05-rules.md)

### Related Skills
- Test Service Layer Components Effectively (SLP-17/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Write Modular Monolith Tests (MMD-16/06-skills.md)

---

## Decision 3: Unit test vs integration test vs feature test

### Context
The service layer can be tested at three levels: unit tests (mocked deps, fast), integration tests (real database, slower), and feature tests (full HTTP stack, slowest). Each has a distinct purpose. The test pyramid should have many fast unit tests, fewer integration tests for repository/query correctness, and few feature tests for critical business journeys.

### Decision Tree

```
What aspect of the service are you testing?
├── Orchestration logic (does the service call the right deps with right data?)
│   → Unit test with mocked boundaries (milliseconds)
│   This should be the majority of your test suite
├── Query correctness (does the WHERE clause return the right data?)
│   → Integration test with real database (hundreds of ms)
│   Test each repository/query method against RefreshDatabase
└── Full business journey (does the end-to-end flow work?)
    → Feature test with full stack (multiple seconds)
    Reserve for critical paths: checkout, registration, payment
    Is this path critical enough to justify the speed cost?
    ├── YES → Write feature test
    └── NO → Cover with unit + integration tests instead
```

### Rationale
Unit tests with mocked boundaries are fast (milliseconds) and focused — they test the orchestration logic that is the service's responsibility. Integration tests against a real database verify that query methods return correct results (mocked repositories can silently return wrong data). Feature tests cover the full stack but are slow — reserve them for critical business journeys. The 80/20 rule applies: 80% unit, 15% integration, 5% feature.

### Recommended Default
Unit test with mocked boundaries as the primary service layer test

### Risks
- Too many feature tests: slow suite discourages running tests
- No integration tests for repos: mocked repos pass while real DB queries fail
- Unit tests with real DB: slow and unnecessarily coupled to database

### Related Rules
- Prioritize Unit Tests For Coverage, Feature Tests For Critical Paths (SLP-17/05-rules.md)
- Add Integration Tests For Repositories (SLP-17/05-rules.md)
- Test Outcomes, Not Call Sequences (SLP-17/05-rules.md)

### Related Skills
- Test Service Layer Components Effectively (SLP-17/06-skills.md)
- Run Architecture Tests (AEG-01/06-skills.md)
- Write Modular Monolith Tests (MMD-16/06-skills.md)
