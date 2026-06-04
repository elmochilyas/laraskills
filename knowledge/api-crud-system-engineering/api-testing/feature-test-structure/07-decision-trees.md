# Decision Trees — Feature Test Structure

## Tree 1: Test Organization Strategy

**Decision Context**: How to organize feature test files — one class per controller, per endpoint, or per feature grouping.

**Decision Criteria**:
- API surface size (number of endpoints)
- Team size and parallel development
- Test execution time per class
- CI pipeline structure

**Decision Tree**:
```
Does the controller have more than 5 endpoints (index, show, store, update, destroy + custom)?
├── YES → Split into multiple test classes by responsibility (e.g., PostsReadTest, PostsWriteTest)
└── NO → Single test class per controller with PestPHP describe() blocks per endpoint
    ├── Does this controller serve multiple consumer types (admin, public)?
    │   ├── YES → Split test class by consumer type (PostsAdminTest, PostsPublicTest)
    │   └── NO → Single class with clear method naming per endpoint
```

**Rationale**: One class per controller is the standard. Split when the class exceeds ~200 lines or has multiple consumer types, as this keeps tests focused and CI diff detection clear.

**Recommended Default**: One feature test class per controller with `describe()` blocks per endpoint.

**Risks**: Too many classes create navigation overhead; too few cause slow single-file execution.

---

## Tree 2: Database Reset Strategy

**Decision Context**: Choosing the database reset approach — RefreshDatabase trait, DatabaseTransactions, or manual cleanup.

**Decision Criteria**:
- Database driver (SQLite in-memory vs MySQL/PostgreSQL)
- Test count and suite runtime
- Parallel test execution setup

**Decision Tree**:
```
Are you running tests with SQLite in-memory?
├── YES → Use RefreshDatabase — fast schema migration per class
└── NO → Are you running tests in parallel (php artisan test --parallel)?
    ├── YES → Use RefreshDatabase per class with database creation per process
    └── NO → Is test suite runtime a concern?
        ├── YES → Use DatabaseTransactions (faster rollback per test)
        └── NO → Use RefreshDatabase per class (safe default)
```

**Rationale**: RefreshDatabase is the safest and most compatible. DatabaseTransactions is faster but may hide bugs where database state leaks between tests.

**Recommended Default**: `RefreshDatabase` per test class.

**Risks**: RefreshDatabase is slower per test than transactions but more reliable.

---

## Tree 3: AAA Layout Enforcement

**Decision Context**: Enforcing AAA (Arrange-Act-Assert) separation within test methods — strict blank-line separation vs loose grouping.

**Decision Criteria**:
- Team experience level
- Test readability requirements
- Coding standard enforcement tools

**Decision Tree**:
```
Is the team larger than 3 developers?
├── YES → Enforce strict AAA with blank-line separation; enforce via architecture tests or CI linting
└── NO → Use PestPHP higher-order expectations or loose AAA; readability less critical for small teams
    ├── Are you using PestPHP?
    │   ├── YES → Use beforeEach for arrange; let() for shared state; test body = act + assert only
    │   └── NO → Use strict AAA with comments (# Arrange, # Act, # Assert) for clarity
```

**Rationale**: Strict AAA makes tests self-documenting and easier to debug (clear where setup ends and assertion begins).

**Recommended Default**: Strict AAA with blank-line separation between sections.

**Risks**: Over-enforcement can lead to dogmatic refactoring without practical benefit for simple tests.
