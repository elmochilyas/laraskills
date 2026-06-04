# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Unit Testing
**Knowledge Unit:** DTO Test Factories
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use deterministic defaults, not random data, in DTO factories
- [ ] Apply rule: Use builder pattern for DTOs with >5 properties, function factory for simpler DTOs
- [ ] Apply rule: Align factory defaults with DTO validation constraints
- [ ] Apply rule: Use `with()` pattern to preserve DTO immutability
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Factory method returns the correct DTO type
- [ ] Overrides correctly merge with defaults
- [ ] Default values are deterministic and test-relevant
- [ ] Factory is organized in a domain-specific trait or class
- [ ] Return type is explicitly declared
- [ ] Avoid: Using random data in DTO factories
- [ ] Avoid: Over-factoring simple DTOs
- [ ] Avoid: Mutating DTOs after creation

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Factory location**: `tests/DTOFactories/` directory mirroring DTO namespace. `tests/DTOFactories/UserDTOFactory.php` for `app/DTOs/UserDTO.php`.
- **Function vs Builder**: Use simple function factories for <5 properties. Use builder pattern for >5 properties or complex inheritance.
- **Preset scenarios**: Define named presets (admin, guest, expired) as static factory methods for common DTO variants.
- **Nested DTO composition**: For DTOs containing other DTOs, compose factories. `OrderDTOFactory` calls `LineItemFactory` for nested items.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use deterministic defaults, not random data, in DTO factories
- [ ] Follow rule: Use builder pattern for DTOs with >5 properties, function factory for simpler DTOs
- [ ] Follow rule: Align factory defaults with DTO validation constraints
- [ ] Follow rule: Use `with()` pattern to preserve DTO immutability
- [ ] Follow rule: Place DTO factories in `tests/DTOFactories/` mirroring the DTO namespace
- [ ] Follow rule: Define named presets for common DTO configurations
- [ ] - [ ] Factory method returns the correct DTO type
- [ ] - [ ] Overrides correctly merge with defaults
- [ ] - [ ] Default values are deterministic and test-relevant
- [ ] - [ ] Factory is organized in a domain-specific trait or class

# Performance Checklist
- **Factory overhead**: DTO factory construction adds <10Î¼s per DTO. Thousands of DTOs per test still complete in <10ms.
- **Memory**: Each DTO factory instance stores default values and overrides. 100 factories in memory use <1MB.
- **Builder chain overhead**: Each `with*()` call creates a new factory instance (immutability). PHP's GC handles this efficiently.
- **Comparison to Eloquent factories**: DTO factories are 100-1000x faster than Eloquent factories (no database, no hydration, no events).

# Security Checklist
- **Sensitive data in factories**: DTO factories may contain default values that resemble real data. Avoid using real user data or secrets as defaults.
- **Factory exposure**: DTO factories are test code; they don't run in production. No production security concern.

# Reliability Checklist
- [ ] Ensure: DTO test factories create Data Transfer Object instances with valid default valu...
- [ ] Verify: Use deterministic defaults, not random data, in DTO factories
- [ ] Verify: Use builder pattern for DTOs with >5 properties, function factory for simpler DTOs
- [ ] Verify: Align factory defaults with DTO validation constraints
- [ ] Verify: Use `with()` pattern to preserve DTO immutability

# Testing Checklist
- [ ] Factory method returns the correct DTO type
- [ ] Overrides correctly merge with defaults
- [ ] Default values are deterministic and test-relevant
- [ ] Factory is organized in a domain-specific trait or class
- [ ] Return type is explicitly declared
- [ ] Complex variations have their own named methods
- [ ] Avoid: Using random data in DTO factories
- [ ] Avoid: Over-factoring simple DTOs
- [ ] Avoid: Mutating DTOs after creation

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use deterministic defaults, not random data, in DTO factories
- [ ] Apply: Use builder pattern for DTOs with >5 properties, function factory for simpler DTOs
- [ ] Apply: Align factory defaults with DTO validation constraints
- [ ] Apply: Use `with()` pattern to preserve DTO immutability

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Using random data in DTO factories
- [ ] Avoid mistake: Over-factoring simple DTOs
- [ ] Avoid mistake: Mutating DTOs after creation
- [ ] Avoid mistake: Factory defaults mismatched with validation

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
- Use deterministic defaults, not random data, in DTO factories
- Use builder pattern for DTOs with >5 properties, function factory for simpler DTOs
- Align factory defaults with DTO validation constraints
- Use `with()` pattern to preserve DTO immutability
- Place DTO factories in `tests/DTOFactories/` mirroring the DTO namespace
- Define named presets for common DTO configurations
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Create and Use DTO Test Factories


