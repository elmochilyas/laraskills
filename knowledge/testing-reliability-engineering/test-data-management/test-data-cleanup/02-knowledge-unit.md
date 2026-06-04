# Metadata
- **Domain:** Testing & Reliability Engineering
- **Subdomain:** Test Data Management
- **Knowledge Unit:** Test Data Cleanup (Minimal Data Principle)
- **KU Code:** ku-03-test-data-cleanup
- **Last Updated:** 2026-06-02

---

# Executive Summary
The minimal data principle dictates that tests create only the minimum data required to verify the specific behavior under test — typically 1-3 records. This principle is foundational to fast, maintainable Laravel test suites. Unnecessary data creation multiplies CI time, obscures test intent, and increases maintenance burden. Industry practice (2026) recommends explicit attribution over Faker-generated defaults, focused record counts (not production-like volumes), and monitoring total records created per suite.

---

# Core Concepts
- **Minimum viable data:** The smallest dataset that exercises the target behavior. 1 record for existence, 2-3 for scoping/authorization.
- **1-3 record guideline:** Most database tests need 1-3 records. Pagination tests need `per_page + 1`. Sorting needs diverse values.
- **Explicit attributes over defaults:** Use `User::factory()->create(['role' => 'admin'])` rather than relying on default factory definitions.
- **Data sufficiency vs excess:** Sufficient data triggers the behavior. Excess data slows tests, increases maintenance, obscures intent.
- **Test-specific data vs realistic data:** `User::factory()->create(['name' => 'Test'])` is sufficient. Faker data adds noise with no coverage benefit.

---

# Mental Models
- **Data as evidence, not decoration:** Test data exists only to make the assertion pass or fail. Every extra record beyond what's needed is distraction.
- **Pareto for data creation:** 20% of tests create 80% of test data. Profile to find the data-heavy tests and optimize them.
- **Realism fallacy:** Realistic-looking test data doesn't catch more bugs. Behavioral variety (edge cases, boundary conditions) catches bugs. Aesthetic realism is waste.

---

# Internal Mechanics
- **Per-record cost:** 1-5ms for simple model creation, 5-20ms for models with relationships. 50 records = 50-250ms per test.
- **Transaction rollback cost:** Proportional to modified data size. 3 records vs 50 = ~10× faster rollback for 3.
- **Faker overhead:** ~0.01ms per Faker call. 50 calls per model × 50 models = 25ms in Faker generation alone.
- **Connection pool pressure:** More data per test = longer transaction duration = more contention across parallel workers.

---

# Patterns
- **Single-record existence pattern:** `User::factory()->create(['email' => 'test@example.com'])` — explicit, minimal, deterministic.
- **Two-record authorization pattern:** One owned record + one unowned record. Tests boundary with minimum data.
- **Pagination minimum pattern:** `create(perPage + 1)` records. Exactly enough to test page 2 existence.
- **Explicit attribute pattern:** Factory overrides for all assertion-relevant fields. Faker defaults for irrelevant fields.

---

# Architectural Decisions
| Decision | Rationale |
|----------|-----------|
| 1-3 records as default | Covers most test scenarios; minimizes CI time |
| Explicit values in assertions | Prevents Faker-generated flaky failures |
| `per_page + 1` for pagination | Exactly enough data to verify second page exists |
| Data budget monitoring | Trend-aware teams catch CI time creep early |

---

# Tradeoffs
| Tradeoff | Pros | Cons |
|----------|------|------|
| Minimal data (1-3 records) | Fast, focused, maintainable | May miss edge cases from larger datasets |
| Explicit attribute values | Deterministic, readable | More verbose than relying on factory defaults |
| Data budget enforcement | Prevents CI time creep | Requires team discipline and tooling |

---

# Performance Considerations
- **1-3 records per test:** ~3-15ms. **50 records:** ~50-250ms. Minimal data is 10-50x faster.
- **Transaction rollback:** Proportional to modified rows. Fewer rows = faster teardown.
- **Parallel contention:** Less data per test = shorter transaction duration = less connection pool contention.
- **Faker generation:** Significant cumulative cost across thousands of tests. Use explicit values.

---

# Production Considerations
- **CI time budget:** A test suite that creates 50 records per test × 1000 tests creates 50,000 unnecessary rows per run.
- **Data budget alert:** Set CI alert when total record creation exceeds a threshold. Track in weekly team metrics.
- **Code review data check:** Review test PRs for unnecessary factory calls or copy-pasted data setup.

---

# Common Mistakes
- **Creating production-like datasets:** Using Faker for realistic names, emails, addresses in every test. 90% of it is irrelevant to the assertion.
- **Using Faker in assertions:** `assertDatabaseHas('users', ['email' => $user->email])` — Faker email may contain special characters causing false failures.
- **Unused data from copy-paste:** Migrating data setup from one test to another without removing what's not needed.
- **Confusing realistic with correct:** Spending time making test data look real instead of focusing on behavioral edge cases.

---

# Failure Modes
- **Over-minimalization:** Creating so little data that behavior isn't properly exercised (e.g., 1 record for a sort test when 2 are needed).
- **Hidden data dependencies:** A test creates 1 record but an `afterCreating` callback silently creates 10 more. Profile reveals unexpected data volume.
- **Data budget alert fatigue:** Setting thresholds too low generates noise and trains teams to ignore alerts.

---

# Ecosystem Usage
- **Laravel community consensus:** "1-3 records per test" is standard advice in all major Laravel testing guides.
- **Benjamin Crozat (2026):** "The minimal data principle is the single biggest test performance optimization you can make."
- **greeden (2026):** "Explicit attributes > Faker defaults. Always. Faker in assertions is a test smell."

---

# Related Knowledge Units
- ku-01-test-data-factories (Factory states and sequences — create minimal focused data)
- ku-02-test-data-seeding (Declarative methods — should follow minimal data principle)
- ku-05-test-data-lifecycle (RefreshDatabase cleanup)
- ku-06-test-suite-profiling (Profile data-heavy tests)

---

# Research Notes
- Benjamin Crozat (2026): "Never create more than 10 records in a single test without a comment explaining why."
- Laravel docs (2026): Factory make() vs create() — use make() when persistence isn't needed; it eliminates DB write entirely.
- Community surveys (2025-2026): Test data volume is the #1 predictor of slow Laravel test suites.
