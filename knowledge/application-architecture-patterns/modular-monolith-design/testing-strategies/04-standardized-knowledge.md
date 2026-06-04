# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Testing strategies for modular monolith
Knowledge Unit ID: MMD-16
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Testing a modular monolith requires testing within-module behavior (module is self-contained) and cross-module contracts (module boundaries work correctly). The testing pyramid shifts: unit tests for module-internal logic, contract tests for cross-module interfaces, integration tests for module boundaries, and end-to-end tests for critical user journeys. Modules reduce the need for end-to-end tests because cross-module boundaries are tested with contract tests, not full-stack tests.

---

# Core Concepts

- **Within-module tests**: Unit tests for internal services, actions, domain logic. Fast, don't cross module boundaries.
- **Contract tests**: Verify a module's contracts (service interfaces) work correctly. Provider implements, consumer creates test exercising the contract.
- **Integration tests at module boundaries**: Verify Module A correctly calls Module B's contract and handles responses. Test integration point without booting full application.
- **End-to-end tests**: Complete user flow across multiple modules. Slow — minimal, for critical paths only.

---

# When To Use

- Always in a modular monolith. The testing strategy is a core practice, not optional.

---

# When NOT To Use

- Full Laravel boot for every test defeats the purpose of module isolation testing.

---

# Best Practices

- **Unit test domain logic thoroughly.** WHY: Domain logic (entities, value objects, services) is the most valuable code to test. No Laravel boot needed — these are pure PHP tests.
- **Contract test every cross-module interface.** WHY: Every interface in Contracts/ should have a contract test in the providing module's suite. Catches boundary bugs faster and more reliably than E2E tests.
- **Use in-memory adapters for contract testing.** WHY: In-memory implementations of module dependencies avoid requiring real infrastructure (database, queue) for contract tests.
- **Limit E2E tests to only critical user journeys.** WHY: Most integration bugs are caught by contract tests. E2E tests are slow and flaky.
- **Run module tests in parallel CI jobs.** WHY: Each module's test suite is independent. Parallel CI reduces feedback time.

---

# Architecture Guidelines

- Module test seeding: each module has its own test factories and seeders.
- Cross-module test data created through contracts, not by inserting into another module's tables.
- Module-isolated unit tests are fastest, contract tests require partial Laravel boot (providers registered), E2E tests are slowest.

---

# Performance Considerations

- Module-isolated unit tests: fastest (pure PHP, no boot).
- Contract tests: partial Laravel boot (providers registered, but no HTTP/database).
- E2E tests: slowest. Minimize count.

---

# Security Considerations

- No specific security implications. Testing patterns are structural, not security-related.

---

# Common Mistakes

1. **Skipping contract tests:** Relying only on E2E tests to catch cross-module bugs. Cause: unawareness of contract testing pattern. Consequence: slow, flaky E2E tests used for what faster contract tests should cover.

2. **Testing internal implementation across modules:** Module A's test suite directly tests Module B's models. Cause: convenience. Consequence: couples test suites, makes extraction harder. Better: test through contracts.

3. **No in-memory adapters:** Every test requires full Laravel stack. Cause: modules don't have test doubles. Consequence: slow test suite. Better: provide in-memory adapters per contract.

---

# Anti-Patterns

- **Contract mismatch:** Module A tests against v1 of contract, Module B implements v2. CI must run all contract tests together.
- **Test suite too slow:** E2E tests for every cross-module flow. Solution is more contract tests, not optimizing E2E.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-05 Module autonomy | AEG-01 Architecture testing | MMD-11 Module extraction |
| MMD-06 Sync inter-module comm | SLP-17 Service layer testing | AEG-02 CI enforcement |

---

# AI Agent Notes

- Generate contract tests for every contract interface created.
- Generate in-memory adapters alongside contract implementations.
- Default to in-memory adapters for contract tests, not full Laravel boot.

---

# Verification

- [ ] Domain logic has pure unit tests (no Laravel boot)
- [ ] Every contract interface has a contract test
- [ ] In-memory adapters exist for contract tests
- [ ] Module test suites can run independently
- [ ] E2E tests are minimal (only critical paths)
