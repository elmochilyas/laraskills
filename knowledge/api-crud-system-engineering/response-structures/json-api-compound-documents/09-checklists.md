# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Json Api Compound Documents
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Json Api Compound Documents implementation follows response-structures patterns
- [ ] All edge cases handled for Json Api Compound Documents
- [ ] Full test coverage for Json Api Compound Documents
- [ ] Security review completed for Json Api Compound Documents
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Json Api Compound Documents
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Include parsing belongs in the controller or a dedicated service â€” it maps to eager loading.
- [ ] The resource serialization layer handles deduplication and structure â€” it does NOT trigger queries.
- [ ] Default includes (always included) increase baseline response size â€” consider if they're truly always needed.
- [ ] For HasMany relationships with large collections, limit included records or paginate them separately.
- [ ] Compound documents with sparse fieldsets: apply `fields[type]` to included resources too.
- [ ] Evaluate: Include Allowlist and Depth Control
- [ ] Evaluate: Eager Loading and Serialization Responsibility
- [ ] Evaluate: Deduplication Strategy

---

# Implementation Checklist

- [ ] Include values are whitelisted â€” no raw relation names from user input
- [ ] Eager loading happens before pagination â€” no N+1
- [ ] `whenLoaded()` is used in the resource to conditionally include relations
- [ ] Include depth is limited (max 2 levels)
- [ ] Invalid include values return 400 error
- [ ] Included resources use their own API Resource class
- [ ] Response includes both `data` and `included` when includes are requested
- [ ] Default response (no include parameter) has no `included` key
- [ ] Multiple includes are comma-separated or array-format
- [ ] Implement Json Api Compound Documents following response-structures patterns
- [ ] Configure all required settings for Json Api Compound Documents
- [ ] Register route/middleware/service for Json Api Compound Documents
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Serialization cost multiplies with inclusion count â€” 10 articles each including 20 comments = 200 included resources.
- [ ] Each included relationship adds a JOIN or separate query â€” deep inclusion chains multiply query count.
- [ ] Compound documents can be 10-100x larger than primary-only responses â€” set size thresholds.
- [ ] Memory usage grows with the `type:id` deduplication set â€” significant for large compound documents.

---

# Security Checklist

- [ ] Include allowlist prevents clients from requesting arbitrary relationship chains that may expose sensitive data.
- [ ] Authorization checks on included resources must match the authenticated user's permissions.
- [ ] Deep inclusion can be used for denial-of-service â€” enforce depth and count limits.
- [ ] Cached compound documents may serve stale included data â€” consider cache invalidation strategies.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Include allowlist is enforced â€” invalid includes return 400 or are silently ignored.
- [ ] Depth limit enforced â€” includes exceeding max depth are rejected.
- [ ] No duplicate resources appear in `included` â€” deduplication works.
- [ ] Every resource in `included` has a corresponding `data` entry in a relationship object.
- [ ] Responses without includes return the primary resource without the `included` key.
- [ ] Write feature tests for happy path of Json Api Compound Documents
- [ ] Write feature tests for validation failure of Json Api Compound Documents
- [ ] Write feature tests for authentication failure of Json Api Compound Documents
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

- [ ] Avoid: Over-fetching Included Resources
- [ ] Avoid: Under-including Required Resources
- [ ] Avoid: Missing Resource Linkage
- [ ] Avoid: Circular Includes
- [ ] Avoid: No Include Depth Limit

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
- Rule 1: Always Enforce an Include Allowlist
- Rule 2: Limit Include Depth to at Most Three Levels
- Rule 3: Always Deduplicate Included Resources by `type:id`
- Rule 4: Always Include `data` (Resource Linkage) in Relationship Objects
- Rule 5: Map Includes to Eager Loads in Controllers Only
- Rule 6: Validate Includes Before Processing the Query
- Rule 7: Authorize Included Resources Independently

### Decisions
- Include Allowlist and Depth Control
- Eager Loading and Serialization Responsibility
- Deduplication Strategy

### Anti-Patterns
- Over-fetching Included Resources
- Under-including Required Resources
- Missing Resource Linkage
- Circular Includes
- No Include Depth Limit

## Related Knowledge
- Prerequisites
- Related
- Advanced



