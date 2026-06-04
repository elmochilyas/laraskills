# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Unit Testing
**Knowledge Unit:** Null Driver Pattern
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Default null, override per-test with fakes
- [ ] Apply rule: Do not use null drivers for services under behavioral test
- [ ] Apply rule: Create custom null drivers for third-party SDKs without Laravel-native fakes
- [ ] Apply rule: Use `TestingServiceProvider` to bind all null implementations in one place
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Null driver implements every method of the target interface
- [ ] Return values are safe defaults (null, empty array, 0, false, `$this`)
- [ ] Methods with side effects (logging, caching, emailing) do nothing
- [ ] Null driver can be bound via container and resolved in tests
- [ ] Tests using the null driver pass without side effects
- [ ] Avoid: Relying on null drivers for services under test
- [ ] Avoid: Null drivers hiding real integration problems
- [ ] Avoid: Missing null driver for a new service

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Configuration defaults**: Set `MAIL_MAILER=log`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `BROADCAST_DRIVER=log` in `.env.testing`.
- **Third-party SDK nullification**: Set API keys to placeholder values in `.env.testing`. Application code should handle missing keys gracefully.
- **Null driver scope**: Nullify at the driver level, not the application level. Allows individual services to be turned back on with `->fake()`.
- **Fail-closed default**: The testing environment should default to "do nothing externally." Only enable real interactions per-test when explicitly testing that service.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Default null, override per-test with fakes
- [ ] Follow rule: Do not use null drivers for services under behavioral test
- [ ] Follow rule: Create custom null drivers for third-party SDKs without Laravel-native fakes
- [ ] Follow rule: Use `TestingServiceProvider` to bind all null implementations in one place
- [ ] Follow rule: Document known behavioral differences between null and real drivers
- [ ] - [ ] Null driver implements every method of the target interface
- [ ] - [ ] Return values are safe defaults (null, empty array, 0, false, `$this`)
- [ ] - [ ] Methods with side effects (logging, caching, emailing) do nothing
- [ ] - [ ] Null driver can be bound via container and resolved in tests

# Performance Checklist
- **Null driver speed**: Null operations are essentially free (<1Î¼s per operation). No I/O overhead.
- **Queue sync in tests**: `sync` driver executes jobs inline. For complex job chains, this adds test time. Use `Queue::fake()` when testing dispatching logic.
- **Cache null driver impact**: Code heavily relying on cache executes the full computation path. Tests may be slower without cached data.
- **Session array driver**: In-memory session is faster than database or Redis sessions. Good default for testing.

# Security Checklist
- **Silent failure risk**: Null drivers silently drop all operations. A bug where the application fails to send critical emails won't be caught.
- **Integration blind spots**: Layer integration test suites for critical services. Null drivers for non-critical paths.
- **Forgotten null configuration**: Adding a new service without configuring its null driver may cause real API calls in tests.

# Reliability Checklist
- [ ] Ensure: The Null Driver pattern uses no-op implementations of external services (mail, q...
- [ ] Verify: Default null, override per-test with fakes
- [ ] Verify: Do not use null drivers for services under behavioral test
- [ ] Verify: Create custom null drivers for third-party SDKs without Laravel-native fakes
- [ ] Verify: Use `TestingServiceProvider` to bind all null implementations in one place

# Testing Checklist
- [ ] Null driver implements every method of the target interface
- [ ] Return values are safe defaults (null, empty array, 0, false, `$this`)
- [ ] Methods with side effects (logging, caching, emailing) do nothing
- [ ] Null driver can be bound via container and resolved in tests
- [ ] Tests using the null driver pass without side effects
- [ ] Null driver is documented as a testing-only implementation
- [ ] Avoid: Relying on null drivers for services under test
- [ ] Avoid: Null drivers hiding real integration problems
- [ ] Avoid: Missing null driver for a new service

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Default null, override per-test with fakes
- [ ] Apply: Do not use null drivers for services under behavioral test
- [ ] Apply: Create custom null drivers for third-party SDKs without Laravel-native fakes
- [ ] Apply: Use `TestingServiceProvider` to bind all null implementations in one place

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Relying on null drivers for services under test
- [ ] Avoid mistake: Null drivers hiding real integration problems
- [ ] Avoid mistake: Missing null driver for a new service

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
- Default null, override per-test with fakes
- Do not use null drivers for services under behavioral test
- Create custom null drivers for third-party SDKs without Laravel-native fakes
- Use `TestingServiceProvider` to bind all null implementations in one place
- Document known behavioral differences between null and real drivers
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Implement the Null Driver Pattern for Testing


