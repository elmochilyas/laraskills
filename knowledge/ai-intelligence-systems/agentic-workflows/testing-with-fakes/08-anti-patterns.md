# ECC Anti-Patterns — Testing with Fakes

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Testing with Fakes |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Real API Calls in Tests — No Ai::fake()
2. No preventStrayPrompts() — Accidental Real Calls
3. Testing Only Happy Path — No Error Response Tests
4. Mocking HTTP Instead of Using Ai::fake()
5. Not Testing Tool Execution Independently

---

## Repository-Wide Anti-Patterns

- Fakes not updated when provider response format changes
- Integration tests querying real providers in CI

---

## Anti-Pattern 1: Real API Calls in Tests

### Category
Testing

### Description
Unit/feature tests make real LLM API calls — slow, costly, flaky, network-dependent.

### Why It Happens
Developers don't set up `Ai::fake()` before test assertions.

### Warning Signs
- Tests take 5-30s each
- CI fails due to network issues
- Monthly API costs from test suite

### Why It Is Harmful
Real API calls make tests non-deterministic (LLM returns vary), slow (sequential 5s per test), and expensive (tokens burned per test run). Test suites with 100 tests can take 10+ minutes and cost hundreds of dollars per month. Flaky tests from network issues erode trust in the test suite.

### Preferred Alternative
Use `Ai::fake()` with predefined responses in every test. Use `preventStrayPrompts()` to catch accidental real calls.

### Detection Checklist
- [ ] No Ai::fake() in test
- [ ] Slow test execution
- [ ] API costs from test suite

### Related Rules
Use Ai::fake() in All Tests (05-rules.md)

---

## Anti-Pattern 2: No preventStrayPrompts()

### Category
Testing

### Description
Using `Ai::fake()` but not calling `preventStrayPrompts()` — unfaked prompts make real API calls silently.

### Preferred Alternative
Always call `Ai::preventStrayPrompts()` after `Ai::fake()` to throw on unexpected prompts.

### Detection Checklist
- [ ] preventStrayPrompts not called
- [ ] Unfaked prompts in tests
- [ ] Real API calls during test suite

---

## Anti-Pattern 3: Testing Only Happy Path

### Category
Testing

### Description
Only testing successful agent responses — no tests for provider errors, tool failures, or invalid output.

### Preferred Alternative
Test error scenarios using `Ai::fake()` with error responses. Test tool failure handling.

### Detection Checklist
- [ ] No error scenario tests
- [ ] Error handling untested
- [ ] Production failures from unhandled errors
