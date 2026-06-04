# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Error Code Namespace Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Error Code Namespace Design implementation follows error-handling-design patterns
- [ ] All edge cases handled for Error Code Namespace Design
- [ ] Full test coverage for Error Code Namespace Design
- [ ] Security review completed for Error Code Namespace Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Error Code Namespace Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Each Laravel module (`app/Domains/User/`, `app/Domains/Order/`) defines its own error codes within its namespace.
- [ ] A global `ErrorCodes` registry reads all domain error code classes and merges them.
- [ ] Namespace prefix is enforced by a PHPStan or CI rule: code must start with the domain name in uppercase.
- [ ] Dot-delimited codes (`USER.AUTH_INVALID_TOKEN`) stored as constants with the full path.
- [ ] Deprecated codes keep their namespace â€” moving a code to a new namespace breaks backward compatibility.

---

# Implementation Checklist

- [ ] Top-level domains defined and documented
- [ ] Subdomains or categories defined per domain
- [ ] Consistent code format across all domains
- [ ] Namespace reserved for future domains
- [ ] Namespace registry maintained
- [ ] No codes outside defined namespaces
- [ ] Implement Error Code Namespace Design following error-handling-design patterns
- [ ] Configure all required settings for Error Code Namespace Design
- [ ] Register route/middleware/service for Error Code Namespace Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] String length is bounded (â‰¤ 60 chars for any code).
- [ ] OPcache caches the registry file.
- [ ] No runtime namespace resolution â€” codes are literal string constants.
- [ ] Merging per-domain registries happens at boot time once.

---

# Security Checklist

- [ ] Namespace prefixes may reveal application domain structure â€” acceptable for most APIs.
- [ ] Never include sensitive information in the namespace path.
- [ ] Ensure namespaces do not expose internal tooling or infrastructure details.
- [ ] When exposed publicly, namespace structure is safe â€” it mirrors domain organization.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All error codes follow `DOMAIN.VERB_OBJECT` format
- [ ] Domain prefix is mandatory and validated by CI
- [ ] No code exceeds 2 namespace levels
- [ ] Each domain has its own error code registry file
- [ ] Global aggregator successfully merges all domain registries
- [ ] Format regex `^[A-Z]+\.[A-Z_]+$` passes for all codes
- [ ] No code namespace has been changed after initial release (only deprecated)
- [ ] Write feature tests for happy path of Error Code Namespace Design
- [ ] Write feature tests for validation failure of Error Code Namespace Design
- [ ] Write feature tests for authentication failure of Error Code Namespace Design
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

- [ ] Avoid: No Namespace at All
- [ ] Avoid: Dynamic Namespaces
- [ ] Avoid: Namespace by HTTP Method
- [ ] Avoid: Customer-Specific Namespaces
- [ ] Avoid: Version in Namespace

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
- Always Use Domain-Prefixed Namespace Format with Dot Delimiter
- Limit Namespace Depth to Exactly Two Levels
- Enforce Namespace Format with CI Regex Validation
- Never Change an Error Code's Namespace After Release
- Use Per-Domain Registry Files with a Global Aggregator
- Never Use Underscore as the Domain Separator
- Validate Namespace Prefix Matches the Domain Directory Name
- Never Include API Version in the Namespace
- Never Include HTTP Method or Transport Details in the Namespace

### Anti-Patterns
- No Namespace at All
- Dynamic Namespaces
- Namespace by HTTP Method
- Customer-Specific Namespaces
- Version in Namespace

## Related Knowledge
- Domain-Specific Error Codes (foundation for namespace design)
- Exception-to-Code Mapping (connects exceptions to namespaced codes)
- Laravel module/bounded context design (domain folder structure)
- Error Type Taxonomy (categories orthogonal to namespace)
- Domain-Driven Design folder conventions for APIs



