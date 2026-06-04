# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Unit Testing
**Knowledge Unit:** Dependency Injection Testing (Null Driver Pattern)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Set null/log/sync drivers for all external services in `.env.testing`
- [ ] Apply rule: Override null drivers with fakes (not real drivers) when testing the service
- [ ] Apply rule: Use constructor injection instead of facades in application code
- [ ] Apply rule: Create a `TestingServiceProvider` for custom null driver bindings
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] All constructor dependencies are identified and provided
- [ ] Real implementations are preferred over mocks for fast, deterministic services
- [ ] Container bindings are properly set up before class instantiation
- [ ] Mock expectations verify interaction (arguments, call count)
- [ ] `Mockery::close()` is called in tearDown to verify mock expectations
- [ ] Avoid: Relying on null drivers for services under test
- [ ] Avoid: Null drivers hiding real integration problems
- [ ] Avoid: Missing null driver for a new service

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`.env.testing` defaults**: `MAIL_MAILER=log`, `QUEUE_CONNECTION=sync`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `BROADCAST_DRIVER=log`, `FILESYSTEM_DISK=local`.
- **Testing service provider**: Create `App\Providers\TestingServiceProvider` that binds null implementations. Register only when `APP_ENV=testing`.
- **Null driver interface**: Null drivers implement the same interface as real drivers. Application code cannot distinguish between null and real.
- **Third-party SDK nullification**: Bind null implementations for external SDKs. Set API keys to placeholder values in `.env.testing`.
- **Fail-closed default**: Testing environment defaults to "do nothing externally." Only enable real service interactions per-test.
- **Integration test separation**: Have a separate test suite that runs against real sandbox environments for critical services.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Set null/log/sync drivers for all external services in `.env.testing`
- [ ] Follow rule: Override null drivers with fakes (not real drivers) when testing the service
- [ ] Follow rule: Use constructor injection instead of facades in application code
- [ ] Follow rule: Create a `TestingServiceProvider` for custom null driver bindings
- [ ] Follow rule: Have a separate integration test suite for critical services
- [ ] - [ ] All constructor dependencies are identified and provided
- [ ] - [ ] Real implementations are preferred over mocks for fast, deterministic services
- [ ] - [ ] Container bindings are properly set up before class instantiation
- [ ] - [ ] Mock expectations verify interaction (arguments, call count)

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: The Null Driver pattern uses no-op implementations of external services (mail, q...
- [ ] Verify: Set null/log/sync drivers for all external services in `.env.testing`
- [ ] Verify: Override null drivers with fakes (not real drivers) when testing the service
- [ ] Verify: Use constructor injection instead of facades in application code
- [ ] Verify: Create a `TestingServiceProvider` for custom null driver bindings

# Testing Checklist
- [ ] All constructor dependencies are identified and provided
- [ ] Real implementations are preferred over mocks for fast, deterministic services
- [ ] Container bindings are properly set up before class instantiation
- [ ] Mock expectations verify interaction (arguments, call count)
- [ ] `Mockery::close()` is called in tearDown to verify mock expectations
- [ ] Tests pass when run in isolation and as part of the suite
- [ ] Avoid: Relying on null drivers for services under test
- [ ] Avoid: Null drivers hiding real integration problems
- [ ] Avoid: Missing null driver for a new service

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Set null/log/sync drivers for all external services in `.env.testing`
- [ ] Apply: Override null drivers with fakes (not real drivers) when testing the service
- [ ] Apply: Use constructor injection instead of facades in application code
- [ ] Apply: Create a `TestingServiceProvider` for custom null driver bindings

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Relying on null drivers for services under test
- [ ] Avoid mistake: Null drivers hiding real integration problems
- [ ] Avoid mistake: Missing null driver for a new service
- [ ] Avoid mistake: Relying on null drivers for services that need behavior verification

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
- Set null/log/sync drivers for all external services in `.env.testing`
- Override null drivers with fakes (not real drivers) when testing the service
- Use constructor injection instead of facades in application code
- Create a `TestingServiceProvider` for custom null driver bindings
- Have a separate integration test suite for critical services
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Classes with Dependency Injection


