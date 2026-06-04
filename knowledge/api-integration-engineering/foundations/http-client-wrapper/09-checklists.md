# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** http-client-wrapper
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Configuration externalized to config files
- [ ] Error responses map to typed domain exceptions
- [ ] Logging captures duration and status
- [ ] Centralize Configuration in Config Files
- [ ] Inject Http Facade Via Constructor
- [ ] Map HTTP Errors to Domain Exceptions
- [ ] Never Make API Calls Directly in Controllers
- [ ] Return Typed Data, Not Raw Response Objects
- [ ] Authentication handled centrally
- [ ] Client class has typed methods per API operation
- [ ] Errors transformed to typed exceptions
- [ ] Add logging for all requests and responses
- [ ] Centralize authentication (token management, API key headers)
- [ ] Define Client class per external service

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add logging for all requests and responses
- [ ] Centralize authentication (token management, API key headers)
- [ ] Define Client class per external service
- [ ] Implement consistent error handling and exception transformation
- [ ] Implement typed methods for each API operation
- [ ] Inject HTTP client (use Http facade or Guzzle)
- [ ] Return typed DTOs instead of raw arrays
- [ ] Write unit tests with mocked HTTP responses
- [ ] Centralize Configuration in Config Files
- [ ] Inject Http Facade Via Constructor
- [ ] Map HTTP Errors to Domain Exceptions
- [ ] Never Make API Calls Directly in Controllers

---

# Performance Checklist

- [ ] Auth token caching at wrapper level eliminates repeated auth requests
- [ ] Connection pooling via shared Guzzle client instance
- [ ] Wrapper adds negligible overhead (~0.1ms) vs HTTP call latency (50-5000ms)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Hardcoding URLs and credentials in the wrapper instead of config files
- [ ] Making API calls directly in controllers without a wrapper
- [ ] Returning raw Response objects instead of typed data
- [ ] Map HTTP Errors to Domain Exceptions
- [ ] Never Make API Calls Directly in Controllers

---

# Testing Checklist

- [ ] Authentication handled centrally
- [ ] Client class has typed methods per API operation
- [ ] Configuration externalized to config files
- [ ] Error responses map to typed domain exceptions
- [ ] Errors transformed to typed exceptions
- [ ] Logging added for request/response
- [ ] Logging captures duration and status
- [ ] Responses returned as typed DTOs
- [ ] Tests use `Http::fake()` without real HTTP calls
- [ ] Unit tests with mocked HTTP client

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Direct HTTP Calls in Controllers Without a Wrapper]
- [ ] [Returning Raw HTTP Response Objects Instead of Typed Data]
- [ ] [Hardcoded URLs and Credentials in Wrapper Classes]
- [ ] [Propagating Raw HTTP Exceptions to Callers]
- [ ] [Instantiating Http Facade Inside Methods (No Constructor Injection)]

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


