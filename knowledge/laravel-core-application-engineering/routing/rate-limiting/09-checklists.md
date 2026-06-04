# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Rate Limiting
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Define Named Limiters Over Inline Limits
- [ ] Verify: Segment by User and IP
- [ ] Verify: Use Multiple Limits for Different Endpoints
- [ ] Verify: Return Appropriate Rate Limit Headers
- [ ] Named limiter registered via `RateLimiter::for()` â€” not inline `throttle:60,1`
- [ ] Rate limit key segments by authentication status (`$job->user?->id ?: $job->ip`)
- [ ] Limiter registered in service provider `boot()` â€” not in route files
- [ ] Redis configured as cache driver for production
- [ ] 429 response includes standard rate limit headers
- [ ] Different limits defined for different endpoint categories
- [ ] Rate limiting is NOT duplicated in controller business logic
- [ ] Performance: Rate limiting uses cache (default: Redis) to store attempt counts. Each throt...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Named Limiter Definition
- [ ] Architecture guideline: // In AppServiceProvider::boot()
- [ ] Architecture guideline: RateLimiter::for('api', function (object $job) {
- [ ] Architecture guideline: return Limit::perMinute(100)->by($job->user?->id ?: $job->ip);
- [ ] Architecture guideline: ### Application on Routes
- [ ] Architecture guideline: Route::middleware('throttle:api')->group(function () {
- [ ] Architecture guideline: Route::apiResource('users', UserController::class);
- [ ] Architecture guideline: ### Inline Limiter
- [ ] Architecture guideline: Route::middleware('throttle:10,1')->post('/login', [AuthController::class, 'login']);
- [ ] Decision: Named Limiters vs Inline Limits - ensure correct choice is made
- [ ] Decision: Cache Store Choice for Rate Limiting - ensure correct choice is made
- [ ] Decision: Segmented Rate Limit Keys vs Single Key - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Define Named Limiters Over Inline Limits
- [ ] Best practice: Segment by User and IP
- [ ] Best practice: Use Multiple Limits for Different Endpoints
- [ ] Best practice: Return Appropriate Rate Limit Headers
- [ ] Skill applied: Implement Named Rate Limiters for API Routes
- [ ] Skill applied: Configure Segmented Rate Limiting by Authentication Status

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Rate limiting uses cache (default: Redis) to store attempt counts. Each throttled request performs at least one cache...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Cache Store Security
- [ ] Rate limiting state is stored in the cache. If the cache is shared across applications, rate limits may interact betw...
- [ ] ### Distributed Rate Limiting
- [ ] In multi-server deployments, ensure the cache driver supports atomic operations with proper concurrency handling. Red...
- [ ] ### Authenticated vs Guest Limits
- [ ] Authenticated requests should have higher limits than guest requests. Always segment the rate limit key by authentica...

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
- [ ] Named limiter registered via `RateLimiter::for()` â€” not inline `throttle:60,1`
- [ ] Rate limit key segments by authentication status (`$job->user?->id ?: $job->ip`)
- [ ] Limiter registered in service provider `boot()` â€” not in route files
- [ ] Redis configured as cache driver for production
- [ ] 429 response includes standard rate limit headers
- [ ] Different limits defined for different endpoint categories
- [ ] Rate limiting is NOT duplicated in controller business logic

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: File Cache Rate Limiting in Multi-Server Production -- apply preferred alternative
    - [ ] Cache driver is shared (Redis/Memcached) in multi-server environments
    - [ ] File cache is not used for production rate limiting
    - [ ] `X-RateLimit-Remaining` is consistent across requests to different servers
- [ ] Prevent: IP-Based Limiting for Authenticated Users -- apply preferred alternative
    - [ ] Authenticated requests are keyed by user ID
    - [ ] Unauthenticated requests are keyed by IP
    - [ ] No shared IP rate limiting for authenticated users
- [ ] Prevent: Rate Limiting in Business Logic Instead of Routing -- apply preferred alternative
    - [ ] No manual rate limiting logic in controllers or services
    - [ ] All rate limits use the `throttle` middleware
    - [ ] Custom 429 responses use `Limit::response()`
- [ ] Prevent: Extremely Low or High Limits Without Traffic Analysis -- apply preferred alternative
    - [ ] Rate limits are based on production traffic analysis, not guesses
    - [ ] P99 request frequency is known for each endpoint category
    - [ ] Limits are 2-3x P99 (room for normal peaks)
- [ ] Prevent: Not Separating Read and Write Rate Limits -- apply preferred alternative
    - [ ] Read and write operations have separate rate limits
    - [ ] Read bursts do not block write operations
    - [ ] Write limits are tighter than read limits

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
- Implement Named Rate Limiters for API Routes
- Configure Segmented Rate Limiting by Authentication Status
### Decision Trees (from 07)
- Named Limiters vs Inline Limits
- Cache Store Choice for Rate Limiting
- Segmented Rate Limit Keys vs Single Key
- Rate Limiting at Route Level vs Application Level
### Anti-Patterns (from 08)
- File Cache Rate Limiting in Multi-Server Production
- IP-Based Limiting for Authenticated Users
- Rate Limiting in Business Logic Instead of Routing
- Extremely Low or High Limits Without Traffic Analysis
- Not Separating Read and Write Rate Limits
### Related Rules (from 06 skills)
- Define Named Limiters Instead of Inline Limits
- Segment by Authentication Status
- Register Limiters Before Route Dispatch
- Use Redis for Production Rate Limiting
- Do Not Implement Rate Limiting in Business Logic
### Related Skills (from 06 skills)
- Configure Segmented Rate Limiting by Authentication Status
- Organize Routes with Route Groups
- Define Application Routes

