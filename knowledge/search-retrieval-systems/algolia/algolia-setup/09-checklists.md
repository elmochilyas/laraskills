# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 04-algolia
**Knowledge Unit:** Algolia Setup
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Algolia Setup implementation follows 04-algolia patterns
- [ ] All edge cases handled for Algolia Setup
- [ ] Full test coverage for Algolia Setup
- [ ] Security review completed for Algolia Setup
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Algolia Setup

---

# Architecture Checklist

- [ ] One Algolia application per Laravel environment (dev/staging/prod)
- [ ] Use Search-Only API Key in frontend, Admin API Key server-side only
- [ ] Configure index settings in scout.php, not Algolia dashboard (for version control)
- [ ] Use within() method to search specific indexes
- [ ] Replicas for different sort orders within same data
- [ ] Evaluate: Algolia vs Alternative Search Engines
- [ ] Evaluate: Algolia Configuration and Setup Strategy
- [ ] Evaluate: Scout Driver Integration with Algolia

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Algolia Setup following 04-algolia patterns
- [ ] Configure all required settings for Algolia Setup
- [ ] Register route/middleware/service for Algolia Setup
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Sub-50ms P99 latency at any scale on Algolia's network
- [ ] Global CDN with edge caching for commonly searched queries
- [ ] Automatic index replication across data centers
- [ ] Pricing scales with usage — high-volume faces significant costs
- [ ] Async indexing means documents are searchable within ~1 second

---

# Security Checklist

- [ ] **Never expose Admin API Key** in frontend code
- [ ] Use Search-Only API Key for browser/mobile requests
- [ ] Algolia encrypts data at rest (AES-256) and in transit (TLS)
- [ ] API keys can be restricted to specific indexes and operations
- [ ] Enable IP restriction for Admin API Key in production

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Algolia account created and API keys configured
- [ ] Scout driver connected with correct credentials
- [ ] Can import documents and see them in Algolia dashboard
- [ ] Instant search works with typo tolerance
- [ ] Analytics tracking set up with SCOUT_IDENTIFY
- [ ] Budget alerts configured in Algolia dashboard
- [ ] Write feature tests for happy path of Algolia Setup
- [ ] Write feature tests for validation failure of Algolia Setup
- [ ] Write feature tests for authentication failure of Algolia Setup
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Rule Name

### Decisions
- Algolia vs Alternative Search Engines
- Algolia Configuration and Setup Strategy
- Scout Driver Integration with Algolia

## Related Knowledge
- K019 (Algolia index settings)
- K020 (Algolia analytics)
- K021 (Algolia geo-search)
- K022 (Algolia A/B testing)



