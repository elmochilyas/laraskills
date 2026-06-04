# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** service-class-pattern
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] DTOs used for response mapping
- [ ] Errors handled within service boundary
- [ ] HTTP client injected via constructor
- [ ] Define Interface Per Service
- [ ] Handle Errors Within the Service Boundary
- [ ] Inject Http Client Via Constructor
- [ ] One Service Class Per External System
- [ ] Return DTOs, Never Raw Response Objects
- [ ] Each API operation has typed method with typed DTO
- [ ] Errors handled within service (not in controller)
- [ ] Logging added for all API calls
- [ ] Add logging for all API calls at the service layer
- [ ] Create service class per external service: `app/Services/StripeService.php`
- [ ] Define typed methods for each API operation: `createPayment(PaymentData $dto)`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add logging for all API calls at the service layer
- [ ] Create service class per external service: `app/Services/StripeService.php`
- [ ] Define typed methods for each API operation: `createPayment(PaymentData $dto)`
- [ ] Handle errors and exceptions within the service
- [ ] Inject HttpClient in constructor for testability
- [ ] Register service in container for dependency injection
- [ ] Return typed DTOs instead of raw arrays
- [ ] Write unit tests with mocked HTTP client
- [ ] Define Interface Per Service
- [ ] Handle Errors Within the Service Boundary
- [ ] Inject Http Client Via Constructor
- [ ] One Service Class Per External System

---

# Performance Checklist

- [ ] DTO mapping adds ~0.05-0.1ms per response
- [ ] No additional overhead beyond underlying HTTP client
- [ ] Service instantiation overhead is negligible (~0.01ms)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Catching all exceptions with generic `catch (\Throwable $e)`
- [ ] Mixing business logic with API communication in service class
- [ ] Not defining interfaces (tight coupling, hard to mock)
- [ ] Returning Eloquent models from API service classes
- [ ] Service classes with implicit dependencies on global state
- [ ] Handle Errors Within the Service Boundary
- [ ] Return DTOs, Never Raw Response Objects

---

# Testing Checklist

- [ ] DTOs used for response mapping
- [ ] Each API operation has typed method with typed DTO
- [ ] Errors handled within service (not in controller)
- [ ] Errors handled within service boundary
- [ ] HTTP client injected via constructor
- [ ] Interface defined for each service class
- [ ] Logging added for all API calls
- [ ] No Eloquent models returned from service methods
- [ ] Service class created per external service
- [ ] Service injected, not instantiated directly

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Mixing Business Logic with API Communication in Service Class]
- [ ] [Returning Raw Response Objects Instead of Typed DTOs]
- [ ] [No Interface â€” Tight Coupling to Implementation]
- [ ] [Instantiating HTTP Client Inside Service Instead of Constructor Injection]
- [ ] [God Service Class â€” Multiple Providers in One Class]

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


