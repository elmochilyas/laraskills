# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mocking & Fakes
**Knowledge Unit:** Mail/Notification Testing with Fakes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always call `Mail::fake()` or `Notification::fake()` before the action
- [ ] Apply rule: Assert content via subject and recipient, not exact HTML
- [ ] Apply rule: Test each notification channel separately
- [ ] Apply rule: Use `Mail::assertNothingSent()` for actions that should not send mail
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `Mail::fake()` or `Notification::fake()` called before action
- [ ] Correct recipients are verified in assertions
- [ ] Email content is verified (subject, body, links)
- [ ] Notification channels are verified
- [ ] Queue assertions use `assertQueued` instead of `assertSent` for queued mail
- [ ] Avoid: Mistake
- [ ] Avoid: Asserting mail without faking first
- [ ] Avoid: Testing queued mail with Mail fake only

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`Mail::fake()` vs `Notification::fake()`**: Use `Mail::fake()` for direct mailables. Use `Notification::fake()` for notifications (multi-channel).
- **Content assertions**: Assert subject and recipient. For body, use `$mail->render()` and assert key text. Avoid full rendered output assertions.
- **Queue faking with mail**: Use `Queue::fake()` when mailables are queued. Assert job dispatch.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always call `Mail::fake()` or `Notification::fake()` before the action
- [ ] Follow rule: Assert content via subject and recipient, not exact HTML
- [ ] Follow rule: Test each notification channel separately
- [ ] Follow rule: Use `Mail::assertNothingSent()` for actions that should not send mail
- [ ] Follow rule: For queued mailables, use both `Queue::fake()` and `Mail::fake()`
- [ ] - [ ] `Mail::fake()` or `Notification::fake()` called before action
- [ ] - [ ] Correct recipients are verified in assertions
- [ ] - [ ] Email content is verified (subject, body, links)
- [ ] - [ ] Notification channels are verified

# Performance Checklist
- Fake registration: <0.5ms.
- Sending via fake: <0.1ms per message (no real delivery).
- Content rendering via `$mail->render()`: 5-20ms. Use only when content assertions are needed.
- Notification fake: <0.3ms per dispatch.

# Security Checklist
- Test that sensitive data (passwords, tokens, PII) is not included in email bodies or headers.
- Test that notification preferences are respected (users who opted out don't receive notifications).
- Test that email verification/password reset tokens are correctly addressed to the right user.

# Reliability Checklist
- [ ] Ensure: Mail and notification testing verifies that the correct messages are sent to the...
- [ ] Verify: Always call `Mail::fake()` or `Notification::fake()` before the action
- [ ] Verify: Assert content via subject and recipient, not exact HTML
- [ ] Verify: Test each notification channel separately
- [ ] Verify: Use `Mail::assertNothingSent()` for actions that should not send mail

# Testing Checklist
- [ ] `Mail::fake()` or `Notification::fake()` called before action
- [ ] Correct recipients are verified in assertions
- [ ] Email content is verified (subject, body, links)
- [ ] Notification channels are verified
- [ ] Queue assertions use `assertQueued` instead of `assertSent` for queued mail
- [ ] Error scenarios assert nothing was sent
- [ ] Avoid: Mistake
- [ ] Avoid: Asserting mail without faking first
- [ ] Avoid: Testing queued mail with Mail fake only

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always call `Mail::fake()` or `Notification::fake()` before the action
- [ ] Apply: Assert content via subject and recipient, not exact HTML
- [ ] Apply: Test each notification channel separately
- [ ] Apply: Use `Mail::assertNothingSent()` for actions that should not send mail

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Asserting mail without faking first
- [ ] Avoid mistake: Testing queued mail with Mail fake only
- [ ] Avoid mistake: Asserting exact email body
- [ ] Avoid mistake: Only testing the mail channel

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
- Always call `Mail::fake()` or `Notification::fake()` before the action
- Assert content via subject and recipient, not exact HTML
- Test each notification channel separately
- Use `Mail::assertNothingSent()` for actions that should not send mail
- For queued mailables, use both `Queue::fake()` and `Mail::fake()`
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Mail and Notification Sending


