# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** saloonphp-patterns
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Connector registered as singleton in container
- [ ] DTOs used for response mapping
- [ ] MockClient used in integration tests
- [ ] Always Use DTOs for Response Mapping
- [ ] One Connector Per External Service
- [ ] One Request Class Per Endpoint
- [ ] Use MockClient for Testing
- [ ] Use Pipelines for Cross-Cutting Concerns
- [ ] Connector defined per external API service
- [ ] Default config (headers, timeout, retry) on Connector
- [ ] Logging middleware configured
- [ ] Add global middleware for logging and error handling
- [ ] Configure default headers, timeout, and retry on Connector
- [ ] Create Connector class per external API (base URL, headers, config, auth)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add global middleware for logging and error handling
- [ ] Configure default headers, timeout, and retry on Connector
- [ ] Create Connector class per external API (base URL, headers, config, auth)
- [ ] Create Request classes per endpoint (method, path, query, body)
- [ ] Create Response DTO classes for typed response handling
- [ ] Use `HasRequest` trait for dependency injection
- [ ] Use Saloon plugins for caching, rate limiting, and auth
- [ ] Write tests using `MockClient` to simulate responses
- [ ] Always Use DTOs for Response Mapping
- [ ] One Connector Per External Service
- [ ] One Request Class Per Endpoint
- [ ] Use MockClient for Testing

---

# Performance Checklist

- [ ] DTO mapping adds ~0.1ms per response
- [ ] MockClient responses pre-computed in test setup
- [ ] Object overhead per request is negligible (~0.05ms)
- [ ] Pipeline middleware processing ~0.01ms per plug

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Not using DTOs, relying on raw arrays throughout codebase
- [ ] Over-abstracting endpoints that differ only in URL path
- [ ] Putting multiple endpoints in one Request class (violates SRP)
- [ ] Skipping MockClient in tests (testing against real API)
- [ ] Tight coupling between Connector and specific Request classes
- [ ] Always Use DTOs for Response Mapping

---

# Testing Checklist

- [ ] Connector defined per external API service
- [ ] Connector registered as singleton in container
- [ ] Default config (headers, timeout, retry) on Connector
- [ ] DTOs used for response mapping
- [ ] Logging middleware configured
- [ ] MockClient used in integration tests
- [ ] One Connector per external service
- [ ] One Request class per endpoint
- [ ] Pipeline configured for cross-cutting concerns
- [ ] Plugins used for cross-cutting concerns

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Multiple Endpoints in a Single Request Class (SRP Violation)]
- [ ] [No DTOs â€” Raw Array Responses Throughout Codebase]
- [ ] [Tight Coupling Between Connector and Specific Request Classes]
- [ ] [Skipping MockClient â€” Testing Against Real API]
- [ ] [No Pipeline Configuration â€” Duplicated Middleware Per Request]

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


