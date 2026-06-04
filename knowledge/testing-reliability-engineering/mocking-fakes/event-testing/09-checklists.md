# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mocking & Fakes
**Knowledge Unit:** Event Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always pair `Event::fake()` with `assertDispatched()` â€” never one without the other
- [ ] Apply rule: Test listener logic separately from event dispatch
- [ ] Apply rule: Verify event data in the `assertDispatched()` callback
- [ ] Apply rule: Use `assertListening()` to verify listener registration
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `Event::fake()` is called before the action
- [ ] Event dispatch is asserted with the correct class
- [ ] Event payload is verified with callback assertions
- [ ] Dispatch count is asserted when relevant
- [ ] Events that should not fire are verified with `assertNotDispatched`
- [ ] Avoid: Mistake
- [ ] Avoid: Faking events but not asserting dispatch
- [ ] Avoid: Testing listener logic through event dispatch

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Fake all vs selective**: Fake all for unit-level dispatch tests. Use `fakeExcept()` for integration tests needing some listener execution.
- **Queued listeners**: Use both `Event::fake()` and `Queue::fake()` to test both dispatch and queuing of `ShouldQueue` listeners.
- **Model events**: Test Eloquent model events (created, updated, deleted) separately from custom events.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always pair `Event::fake()` with `assertDispatched()` â€” never one without the other
- [ ] Follow rule: Test listener logic separately from event dispatch
- [ ] Follow rule: Verify event data in the `assertDispatched()` callback
- [ ] Follow rule: Use `assertListening()` to verify listener registration
- [ ] Follow rule: Use `Event::fakeExcept()` for integration tests that need some listeners to execute
- [ ] Follow rule: Use `Queue::fake()` in addition to `Event::fake()` for queued listeners
- [ ] - [ ] `Event::fake()` is called before the action
- [ ] - [ ] Event dispatch is asserted with the correct class
- [ ] - [ ] Event payload is verified with callback assertions
- [ ] - [ ] Dispatch count is asserted when relevant

# Performance Checklist
- Fake registration: <0.5ms.
- Event dispatch via fake: <0.01ms per event (no listener execution).
- Assertion execution: <0.1ms per assertion.
- `fakeFor` scope: Negligible overhead.

# Security Checklist
- Events carrying sensitive data (user PII, payment info) should be verified for correct data (not leaking extra data) in dispatch assertions.

# Reliability Checklist
- [ ] Ensure: Event testing verifies that events are dispatched with correct data and that lis...
- [ ] Verify: Always pair `Event::fake()` with `assertDispatched()` â€” never one without the other
- [ ] Verify: Test listener logic separately from event dispatch
- [ ] Verify: Verify event data in the `assertDispatched()` callback
- [ ] Verify: Use `assertListening()` to verify listener registration

# Testing Checklist
- [ ] `Event::fake()` is called before the action
- [ ] Event dispatch is asserted with the correct class
- [ ] Event payload is verified with callback assertions
- [ ] Dispatch count is asserted when relevant
- [ ] Events that should not fire are verified with `assertNotDispatched`
- [ ] Real listeners are not executing during the test
- [ ] Avoid: Mistake
- [ ] Avoid: Faking events but not asserting dispatch
- [ ] Avoid: Testing listener logic through event dispatch

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always pair `Event::fake()` with `assertDispatched()` â€” never one without the other
- [ ] Apply: Test listener logic separately from event dispatch
- [ ] Apply: Verify event data in the `assertDispatched()` callback
- [ ] Apply: Use `assertListening()` to verify listener registration

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Faking events but not asserting dispatch
- [ ] Avoid mistake: Testing listener logic through event dispatch
- [ ] Avoid mistake: Not testing queued listeners
- [ ] Avoid mistake: Not asserting event data

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Always pair `Event::fake()` with `assertDispatched()` â€” never one without the other
- Test listener logic separately from event dispatch
- Verify event data in the `assertDispatched()` callback
- Use `assertListening()` to verify listener registration
- Use `Event::fakeExcept()` for integration tests that need some listeners to execute
- Use `Queue::fake()` in addition to `Event::fake()` for queued listeners
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Events in Isolation


