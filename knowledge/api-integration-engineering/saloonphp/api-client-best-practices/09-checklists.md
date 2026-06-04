# Metadata

**Domain:** api-integration-engineering
**Subdomain:** saloonphp
**Knowledge Unit:** api-client-best-practices
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] All methods return typed DTOs or collections, not raw Response
- [ ] Configuration is externalized to `config/services/` files
- [ ] HTTP errors map to domain-specific exceptions
- [ ] Externalize Configuration from Service Classes
- [ ] Inject Http Facade Via Constructor
- [ ] Map HTTP Errors to Domain Exceptions
- [ ] Never Call APIs Directly in Controllers
- [ ] Return Typed DTOs, Not Raw Responses
- [ ] Connector defaults configured (timeout, retry, auth)
- [ ] Global middleware for cross-cutting concerns
- [ ] One Connector per external service
- [ ] Configure default Connector: timeout, retry, headers, base URL
- [ ] Create one Connector per external service (SRP)
- [ ] Create one Request class per endpoint, typed with Response DTO

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure default Connector: timeout, retry, headers, base URL
- [ ] Create one Connector per external service (SRP)
- [ ] Create one Request class per endpoint, typed with Response DTO
- [ ] Handle API errors in Connector-level middleware
- [ ] Register Connectors in service container for DI
- [ ] Use `MockClient` for deterministic testing
- [ ] Use global middleware for logging, auth, error handling
- [ ] Use plugins (`HasPlugins`) for caching, rate limiting, auth
- [ ] Externalize Configuration from Service Classes
- [ ] Inject Http Facade Via Constructor
- [ ] Map HTTP Errors to Domain Exceptions
- [ ] Never Call APIs Directly in Controllers

---

# Performance Checklist

- [ ] Authentication token caching eliminates repeated auth requests
- [ ] Constructor injection overhead is sub-millisecond and one-time
- [ ] DTO construction is negligible overhead compared to HTTP call latency
- [ ] Response caching at service layer (via `Cache::remember()`) reduces API calls for GET endpoints
- [ ] Service resolution cached after first instantiation via Laravel container

---

# Security Checklist

- [ ] Implement input validation before passing user data to external APIs
- [ ] Never log raw request/response bodies that may contain credentials
- [ ] OAuth2 tokens should be cached securely (encrypted if stored in database)
- [ ] Redact sensitive data (tokens, PII) in all service logging
- [ ] Store API keys and secrets in environment variables, not in service classes or config files committed to version control

---

# Reliability Checklist

- [ ] Map HTTP Errors to Domain Exceptions
- [ ] Never Call APIs Directly in Controllers

---

# Testing Checklist

- [ ] All methods return typed DTOs or collections, not raw Response
- [ ] Configuration is externalized to `config/services/` files
- [ ] Connector defaults configured (timeout, retry, auth)
- [ ] Global middleware for cross-cutting concerns
- [ ] HTTP errors map to domain-specific exceptions
- [ ] Logging captures duration and status without sensitive data
- [ ] One Connector per external service
- [ ] One Request per endpoint with typed response
- [ ] Plugins used where beneficial
- [ ] Service class uses constructor injection for all dependencies

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Controller God Class â€” API Calls in Controllers]
- [ ] [Leaky Abstraction â€” Returning Raw HTTP Responses]
- [ ] [Singleton Abuse with Stateful Services]
- [ ] [Over-Engineering Simple Integrations]
- [ ] [No Exception Mapping â€” Guzzle Exceptions Leaking Everywhere]
- [ ] Controller God Class
- [ ] Leaky Abstraction
- [ ] Over-engineering
- [ ] Singleton Abuse

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


