# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Unit Testing
**Knowledge Unit:** Class & Method Testing (DTO Factories)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use the `with()` pattern to preserve DTO immutability
- [ ] Apply rule: Favor builder pattern for DTOs with >5 properties
- [ ] Apply rule: Align factory defaults with DTO constructor validation
- [ ] Apply rule: Use deterministic defaults, not random data
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Class is instantiated with all constructor dependencies
- [ ] Mocks are used only for slow or unreliable dependencies
- [ ] Method is invoked with explicit, deterministic arguments
- [ ] Return value or side effect is asserted
- [ ] Happy path and at least one error/edge case are tested
- [ ] Avoid: Using random data in DTO factories
- [ ] Avoid: Over-factoring simple DTOs
- [ ] Avoid: Mutating DTOs after creation

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Factory location**: `tests/DTOFactories/{Domain}/` following DTO namespace structure.
- **Factory naming**: `{DTO}Factory` (e.g., `UserDTOFactory`). Consistent with Eloquent factory conventions.
- **Method naming**: `with{Property}()` for individual property setters. `{preset}()` for named presets (e.g., `admin()`, `guest()`).
- **Return type**: Factory methods should return the DTO instance. `build(): UserDTO`.
- **Default values**: Sensible, valid defaults that satisfy DTO validation. Document default values in the factory class docblock.
- **Composition**: DTOs containing other DTOs should compose factories: `OrderDTOFactory::new()->withItems([LineItemFactory::new()->build()])`.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use the `with()` pattern to preserve DTO immutability
- [ ] Follow rule: Favor builder pattern for DTOs with >5 properties
- [ ] Follow rule: Align factory defaults with DTO constructor validation
- [ ] Follow rule: Use deterministic defaults, not random data
- [ ] Follow rule: Place factories in `tests/DTOFactories/` mirroring DTO namespace
- [ ] Follow rule: Name preset methods for common DTO variants
- [ ] - [ ] Class is instantiated with all constructor dependencies
- [ ] - [ ] Mocks are used only for slow or unreliable dependencies
- [ ] - [ ] Method is invoked with explicit, deterministic arguments
- [ ] - [ ] Return value or side effect is asserted

# Performance Checklist
- [ ] No performance concerns identified

# Security Checklist
- [ ] No security concerns identified

# Reliability Checklist
- [ ] Ensure: DTO test factories create Data Transfer Object instances with valid default valu...
- [ ] Verify: Use the `with()` pattern to preserve DTO immutability
- [ ] Verify: Favor builder pattern for DTOs with >5 properties
- [ ] Verify: Align factory defaults with DTO constructor validation
- [ ] Verify: Use deterministic defaults, not random data

# Testing Checklist
- [ ] Class is instantiated with all constructor dependencies
- [ ] Mocks are used only for slow or unreliable dependencies
- [ ] Method is invoked with explicit, deterministic arguments
- [ ] Return value or side effect is asserted
- [ ] Happy path and at least one error/edge case are tested
- [ ] Mock expectations verify correct interaction (call count, arguments)
- [ ] Avoid: Using random data in DTO factories
- [ ] Avoid: Over-factoring simple DTOs
- [ ] Avoid: Mutating DTOs after creation

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use the `with()` pattern to preserve DTO immutability
- [ ] Apply: Favor builder pattern for DTOs with >5 properties
- [ ] Apply: Align factory defaults with DTO constructor validation
- [ ] Apply: Use deterministic defaults, not random data

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Using random data in DTO factories
- [ ] Avoid mistake: Over-factoring simple DTOs
- [ ] Avoid mistake: Mutating DTOs after creation
- [ ] Avoid mistake: Factory defaults that don't match validation

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
- Use the `with()` pattern to preserve DTO immutability
- Favor builder pattern for DTOs with >5 properties
- Align factory defaults with DTO constructor validation
- Use deterministic defaults, not random data
- Place factories in `tests/DTOFactories/` mirroring DTO namespace
- Name preset methods for common DTO variants
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Class Methods in Isolation


