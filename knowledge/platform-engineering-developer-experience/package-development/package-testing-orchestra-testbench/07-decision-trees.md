# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Package Testing with Orchestra Testbench
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Testbench integration vs unit-only tests? | Provider registration, routing, DB | Both unit and Testbench integration tests |
| 2 | SQLite-only vs multi-database testing? | Production parity, CI speed | SQLite for speed + MySQL for production parity |

---

# Architecture-Level Decision Trees

---

## Decision 1: Testbench Integration vs Unit-Only Tests?

---

## Decision Context

Package tests can use Testbench (boots a full Laravel app) or plain PHPUnit/Pest for isolated logic. The choice affects test confidence and suite speed.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the test verify isolated business logic with no Laravel dependencies?
↓
YES → **Use plain PHPUnit/Pest** — fast, no Testbench overhead needed
NO → ↓
Does the test depend on service provider registration, routing, config merging, or migrations?
↓
NO → Consider if Testbench is needed; may be unit-testable
YES → **Use Testbench** — boots real Laravel app for integration testing
Regardless:
- Every package needs at least one Testbench boot test that verifies provider registration
- Keep test classes focused (5-15 methods) to amortize ~100-200ms boot cost
- Unit tests for isolated logic alongside Testbench integration tests

---

## Rationale

Testbench catches provider-level issues that unit tests miss (missing bindings, config merge order, route registration). However, using Testbench for every test unnecessarily slows the suite. A mix of fast unit tests and targeted integration tests is optimal.

---

## Recommended Default

**Default:** Unit tests for isolated logic + Testbench for provider/routing/migration tests
**Reason:** Balances test confidence (integration) with suite speed (unit)

---

## Risks Of Wrong Choice

- **Testbench for everything:** Slow test suite; 100+ tests each booting Laravel takes minutes
- **No Testbench at all:** Provider registration bugs, missing routes, config merge issues go undetected

---

## Related Rules

- TEMPLATE-RULE-009: Test all templates in CI

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: SQLite-Only vs Multi-Database Testing?

---

## Decision Context

Testbench defaults to SQLite in-memory for speed. Production may use MySQL or PostgreSQL. The choice affects CI speed vs production parity.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Does the package use MySQL/PostgreSQL-specific features (JSON, WHERE IN ordering, full-text search, GIS)?
↓
NO → **SQLite `:memory:` is sufficient** for CI; document MySQL compatibility
YES → ↓
Run SQLite tests for speed AND add MySQL/PostgreSQL CI jobs for dialect-specific testing
Additional considerations:
- SQLite `:memory:` is ~10x faster than MySQL in CI
- Multi-database testing adds 2-4 CI jobs per PHP/Laravel version combination
- Test with both SQLite (fast feedback) and MySQL (production parity)
- Document which database features are package-specific

---

## Rationale

SQLite in-memory provides fast CI feedback for most tests. MySQL-specific features warrant additional CI jobs. The fast feedback from SQLite supports rapid development while MySQL jobs catch production-only issues before release.

---

## Recommended Default

**Default:** SQLite `:memory:` as primary test database; add MySQL for dialect-specific features
**Reason:** Speed of SQLite for daily development; MySQL parity for production confidence

---

## Risks Of Wrong Choice

- **SQLite-only with MySQL features:** Tests pass but production breaks from SQL dialect differences
- **MySQL-only:** Slow CI feedback loop; discourages frequent testing

---

## Related Rules

- TEMPLATE-RULE-016: Template rendering under 2 seconds
- TEMPLATE-RULE-017: Optimize dependency installation

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

