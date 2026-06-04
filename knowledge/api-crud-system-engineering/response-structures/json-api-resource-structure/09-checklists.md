# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Json Api Resource Structure
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Json Api Resource Structure implementation follows response-structures patterns
- [ ] All edge cases handled for Json Api Resource Structure
- [ ] Full test coverage for Json Api Resource Structure
- [ ] Security review completed for Json Api Resource Structure
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Json Api Resource Structure
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Decide full compliance vs pragmatic subset. Full compliance requires relationship objects for every relation â€” determine if this is justified.
- [ ] Type naming must be consistent across the entire API â€” changing a type name is breaking.
- [ ] ID strategy must produce unique strings â€” UUIDs are ideal for JSON:API since they're naturally strings.
- [ ] Pagination uses `links` objects (`first`, `last`, `prev`, `next`) with `meta` for pagination metadata.
- [ ] Include depth limit (typically 3 levels) to prevent runaway response sizes.
- [ ] Evaluate: Full Compliance vs Pragmatic Subset
- [ ] Evaluate: Attributes vs Relationships Separation
- [ ] Evaluate: Type Naming Convention

---

# Implementation Checklist

- [ ] Resource `type` set to plural kebab-case
- [ ] `id` formatted as string
- [ ] `attributes` key wraps all non-id fields
- [ ] `relationships` defined with `links`
- [ ] `links` section with self/related URLs
- [ ] Related resources in `included`, not nested
- [ ] `jsonapi` top-level key with version
- [ ] Pagination follows JSON:API spec
- [ ] Dedicated resource classes used
- [ ] Relationship integrity errors return 409
- [ ] Implement Json Api Resource Structure following response-structures patterns
- [ ] Configure all required settings for Json Api Resource Structure
- [ ] Register route/middleware/service for Json Api Resource Structure
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] JSON:API responses are 20-40% larger than envelope responses due to structural keys (`type`, `id`, `relationships`, `links`).
- [ ] Serializing relationship objects for every relation adds CPU time proportional to the number of relationships.
- [ ] Compound documents serialize each included resource through its own resource class â€” cost multiplies with inclusion depth.
- [ ] Client-side JSON:API normalization (Redux, Ember Data) is CPU-intensive but enables efficient local queries.

---

# Security Checklist

- [ ] `type` names should not leak internal model names â€” use domain types, not database table names.
- [ ] IDs as strings prevent ID type confusion but can still be enumerated if sequential.
- [ ] Relationship objects may reveal existence of related resources even when the client can't access them â€” ensure authorization checks are in place.
- [ ] Self links should use HTTPS URLs and be generated via `route()` helper, never hardcoded.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every resource object includes `type` and `id` with correct formatting.
- [ ] `id` values are strings, not integers.
- [ ] Attributes never contain relationship data.
- [ ] Relationship objects include `data` (resource linkage) wherever possible.
- [ ] JSON:API compliance test suite passes for all endpoints.
- [ ] Write feature tests for happy path of Json Api Resource Structure
- [ ] Write feature tests for validation failure of Json Api Resource Structure
- [ ] Write feature tests for authentication failure of Json Api Resource Structure
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

- [ ] Avoid: Missing Resource Identifier in Response
- [ ] Avoid: Inconsistent Resource Type Names
- [ ] Avoid: Attributes at Wrong Nesting Level
- [ ] Avoid: Missing Relationship Section
- [ ] Avoid: Non-standard Resource Object Shape

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
- Rule 1: Always Include `type` and `id` in Every Resource Object
- Rule 2: Always Cast `id` to String
- Rule 3: Separate Attributes from Relationships
- Rule 4: Use Pluralized Kebab-Case for Type Names
- Rule 5: Include Resource Linkage (`data` with `type:id`) in Every Relationship
- Rule 6: Never Include Pagination Metadata in `attributes`
- Rule 7: Use `route()` Helper for `self` Links, Never Hardcoded URLs

### Decisions
- Full Compliance vs Pragmatic Subset
- Attributes vs Relationships Separation
- Type Naming Convention

### Anti-Patterns
- Missing Resource Identifier in Response
- Inconsistent Resource Type Names
- Attributes at Wrong Nesting Level
- Missing Relationship Section
- Non-standard Resource Object Shape

## Related Knowledge
- Prerequisites
- Related
- Advanced



