# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Signed Routes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Always Use Temporary Signed Routes for Time-Sensitive Actions
- [ ] Verify: Validate Parameters in the Route Handler
- [ ] Verify: Use Dedicated Routes for Signed Actions
- [ ] Route has `signed` middleware applied
- [ ] Temporary signed routes used for user-facing links (not permanent)
- [ ] Parameters use opaque identifiers (model IDs, UUIDs), not sensitive data
- [ ] Route handler validates resource existence after signature validation
- [ ] Signed routes are separate from authenticated routes
- [ ] One-time actions track consumption server-side
- [ ] Invalid/expired signatures return 403
- [ ] Performance: Signature generation and validation use HMAC-SHA256 via PHP's `hash_hmac()` f...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Signed Route Definition
- [ ] Architecture guideline: Route::get('/verify-email/{id}/{hash}', [VerificationController::class, 'verify'])
- [ ] Architecture guideline: ->name('verification.verify')
- [ ] Architecture guideline: ->middleware('signed');
- [ ] Architecture guideline: ### URL Generation
- [ ] Architecture guideline: use Illuminate\Support\Facades\URL;
- [ ] Architecture guideline: // Permanent (valid indefinitely)
- [ ] Architecture guideline: URL::signedRoute('verification.verify', ['id' => $user->id, 'hash' => sha1($user->email)]);
- [ ] Architecture guideline: // Temporary (valid 24 hours)
- [ ] Architecture guideline: URL::temporarySignedRoute('verification.verify', now()->addHours(24), ['id' => $user->id]);
- [ ] Decision: Temporary Signed Routes vs Permanent Signed Routes - ensure correct choice is made
- [ ] Decision: Signed Routes vs Authentication for Action Verification - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Always Use Temporary Signed Routes for Time-Sensitive Actions
- [ ] Best practice: Validate Parameters in the Route Handler
- [ ] Best practice: Use Dedicated Routes for Signed Actions
- [ ] Skill applied: Generate and Validate Signed Routes for Unauthenticated Access
- [ ] Skill applied: Implement One-Time Temporary Signed URLs with Consumption Tracking

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Signature generation and validation use HMAC-SHA256 via PHP's `hash_hmac()` function. Both operations are O(1) and ad...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### APP_KEY Protection
- [ ] Signed route security depends entirely on the secrecy of `APP_KEY`. If the key is compromised, anyone can generate va...
- [ ] ### Signature Exposure
- [ ] The signature is part of the URL query string. URLs containing signatures may be logged by web servers, proxies, or a...
- [ ] ### Replay Attacks
- [ ] Permanent signed URLs can be used repeatedly. For one-time actions (email verification, password reset), mark the res...
- [ ] ### URL Tampering

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] Route has `signed` middleware applied
- [ ] Temporary signed routes used for user-facing links (not permanent)
- [ ] Parameters use opaque identifiers (model IDs, UUIDs), not sensitive data
- [ ] Route handler validates resource existence after signature validation
- [ ] Signed routes are separate from authenticated routes
- [ ] One-time actions track consumption server-side
- [ ] Invalid/expired signatures return 403

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Skills (from 06)
- Generate and Validate Signed Routes for Unauthenticated Access
- Implement One-Time Temporary Signed URLs with Consumption Tracking
### Decision Trees (from 07)
- Temporary Signed Routes vs Permanent Signed Routes
- Signed Routes vs Authentication for Action Verification
- Dedicated Signed Routes vs Shared Signed+Authenticated Routes
- Server-Side Consumption Tracking vs Expiration-Only Protection
### Related Rules (from 06 skills)
- Use Temporary Signed Routes for User-Facing Links
- Define Separate Routes for Signed Actions
- Enforce Server-Side Consumption Tracking for One-Time URLs
- Validate Parameters After Signature Validation
- Never Expose Sensitive Data in Signed URL Parameters
### Related Skills (from 06 skills)
- Implement One-Time Temporary Signed URLs with Consumption Tracking
- Name Routes and Generate URLs from Named Routes
- Define Application Routes

