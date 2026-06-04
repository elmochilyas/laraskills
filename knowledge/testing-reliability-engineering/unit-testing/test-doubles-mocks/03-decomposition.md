# Decomposition: Test Doubles & Mocks

## Topic Overview
Test doubles are stand-in objects that replace real dependencies during testing. The taxonomy of dummies, stubs, spies, mocks, and fakes defines the purpose and behavior of each double type.

## Decomposition Strategy
This knowledge unit breaks down into three areas: (1) the five test double types and when to use each, (2) Laravel's built-in fakes and their API, and (3) PHPUnit vs Mockery mocking approaches.

## Proposed Folder Structure
```
ku-04-test-doubles-mocks/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| Dummies | concept | Passed but never used. Fill parameter lists. |
| Stubs | concept | Provide canned answers to calls. |
| Spies | concept | Record calls for post-hoc verification. |
| Mocks | concept | Pre-programmed with call expectations. |
| Fakes | concept | Working implementations that simplify behavior. |
| Laravel fakes | practice | `Http::fake()`, `Mail::fake()`, `Queue::fake()`, etc. |
| PHPUnit mocks | practice | `createMock()`, `createStub()`, `expects()`, `method()` |
| Mockery | practice | `mock()`, `spy()`, `partialMock()` |
| Container binding | practice | `$this->instance()` and `$this->partialMock()` |

## Dependency Graph
```
Test Doubles & Mocks
├── Requires: Understanding of dependency injection
├── Related: Laravel fakes
├── Related: Mockery integration
├── Related: HTTP Client faking
├── Related: Unit testing patterns
└── Related: Service container binding testing
```

## Boundary Analysis
This KU covers the conceptual taxonomy of test doubles and the practical use of Laravel fakes, PHPUnit mocks, and Mockery. Specific details of each Laravel fake are covered in the Mocking & Fakes subdomain.

## Future Expansion Opportunities
- Custom fake implementation patterns
- Mocking anti-patterns catalog
- Test double taxonomy decision tree
- Comparative performance analysis of double types
