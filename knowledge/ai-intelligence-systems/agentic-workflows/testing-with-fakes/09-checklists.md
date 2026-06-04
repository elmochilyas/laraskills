# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** testing-with-fakes
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Assertion validation
- [ ] Contract testing
- [ ] Database factory for AI
- [ ] Error scenario testing
- [ ] Fixture-based testing
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Always Call Ai::fake() Before Agent Tests
- [ ] Provide Sufficient Fixtures for Multi-Turn Agents
- [ ] Test Error Scenarios with Fixtures
- [ ] Verify Prompts with Assertions
- [ ] `Ai::fake()` called in every test that invokes AI
- [ ] `preventStrayPrompts()` active (ideally in base TestCase)
- [ ] Error scenarios tested with error fixtures
- [ ] All AI feature tests run deterministically without network calls
- [ ] CI pipeline runs without API keys
- [ ] Error handling paths tested with appropriate error fixtures

---

# Architecture Checklist

- [ ] Built
- [ ] Full provider fake vs. partial mock â†’ Full fake replaces entire AI stack. Reason: Prevents any real API calls, guarantees determinism, works across all providers
- [ ] Sequential fixture queue vs. prompt
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Assertion validation
- [ ] Contract testing
- [ ] Database factory for AI
- [ ] Error scenario testing
- [ ] Fixture-based testing
- [ ] Http::fake() for AI
- [ ] Mocking by contract
- [ ] Sequential responses
- [ ] Always Call Ai::fake() Before Agent Tests
- [ ] Provide Sufficient Fixtures for Multi-Turn Agents
- [ ] Test Error Scenarios with Fixtures
- [ ] Verify Prompts with Assertions

---

# Performance Checklist

- [ ] Fake responses are instant â€” no network latency
- [ ] No rate limits, no cost, no flakiness from network failures
- [ ] Test suite with AI fakes is as fast as any regular PHPUnit test
- [ ] Fake responses are instant â€” no network latency

---

# Security Checklist

- [ ] Add `preventStrayPrompts()` to your `TestCase::setUp()` globally
- [ ] Always call `Ai::fake()` in test setup or `preventStrayPrompts()` to prevent accidental real API calls
- [ ] Register response fixtures at the start of each test method
- [ ] Test error handling by providing fixture responses that throw exceptions
- [ ] Use `Ai::assertPromptSent()` to verify prompt construction logic
- [ ] Avoid committing API keys to CI â€” fakes eliminate need for provider credentials in CI
- [ ] No rate limits, no cost, no flakiness from network failures

---

# Reliability Checklist

- [ ] Asserting prompt content too strictly â€” minor instruction changes break tests
- [ ] Forgetting to call `Ai::fake()` â€” test makes real API calls, accruing costs and failures
- [ ] Insufficient fixtures for multi-turn agents â€” running out of fixtures triggers `preventStrayPrompts` failure
- [ ] Not testing error scenarios â€” only testing "happy path" leaves error handling untested
- [ ] Using real provider in CI by mistake â€” `preventStrayPrompts()` catches this in local tests but CI without fakes will call APIs
- [ ] Always Call Ai::fake() Before Agent Tests
- [ ] Test Error Scenarios with Fixtures

---

# Testing Checklist

- [ ] `Ai::fake()` called in every test that invokes AI
- [ ] `preventStrayPrompts()` active (ideally in base TestCase)
- [ ] All AI feature tests run deterministically without network calls
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] CI pipeline runs without API keys
- [ ] Core concepts are understood and applied correctly.
- [ ] Error handling paths tested with appropriate error fixtures
- [ ] Error scenarios tested with error fixtures
- [ ] Fixture count matches expected AI call count

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Real API Calls in Tests â€” No Ai::fake()]
- [ ] [No preventStrayPrompts() â€” Accidental Real Calls]
- [ ] [Testing Only Happy Path â€” No Error Response Tests]
- [ ] [Mocking HTTP Instead of Using Ai::fake()]
- [ ] [Not Testing Tool Execution Independently]
- [ ] Fixture exhaustion
- [ ] Order sensitivity
- [ ] Real API leak
- [ ] Response mismatch

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


