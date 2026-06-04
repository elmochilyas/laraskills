# Skill: Manage and Prevent Octane State Leaks Through Auditing and Monitoring

## Purpose
Prevent cross-request data contamination in Octane workers by systematically eliminating static property misuse, enforcing correct singleton/scoped binding patterns, implementing ordered-request leak testing, and establishing per-worker RSS monitoring with alert thresholds.

## When To Use
- During Octane migration (static property audit phase)
- When debugging suspected state leaks (User A sees User B's data)
- When adding new code to an Octane-deployed application
- When setting up monitoring for an Octane production deployment
- When third-party package updates may introduce incompatible patterns

## When NOT To Use
- For PHP-FPM applications (static properties reset per request — not a concern)
- For applications with zero static properties and all services correctly scoped
- As a one-time activity — state leaks can be introduced by any code change

## Prerequisites
- Laravel application running under Octane (or being prepared for Octane)
- Access to application source code, all service providers, and vendor packages
- Output of `grep -rn "static \" app/ --include="*.php"` across the codebase
- List of all container bindings (singleton, scoped, instance) from all providers
- RSS monitoring infrastructure (or ability to set it up)
- Staging environment for ordered-request leak testing

## Inputs
- Static property audit results (all usages of `static` keyword in app and vendor code)
- Service provider binding list (singleton vs scoped classifications)
- Current `config/octane.php` configuration
- Worker RSS history (if already deployed) or baseline measurements
- Third-party package list with versions

## Workflow

### 1. Run Comprehensive Static Property Audit
- Search app code: `grep -rn "static \" app/ --include="*.php"` and `grep -rn "static \$" app/ --include="*.php"`
- Search vendor code: `grep -rn "public static \" vendor/ --include="*.php"` — focus on mutable properties (arrays, objects), not constants
- For each static property found, classify:
  - Request-scoped mutable (data leaks): MUST be eliminated
  - Read-only configuration (safe): document as intentionally shared
  - Private implementation cache (safe if cleared per-request): verify reset exists
- Create a tracking issue for each request-scoped static property: file, class, property name, replacement plan

### 2. Eliminate Request-Scoped Static Properties
- Replace `public static $currentUser` with instance property on a `scoped()`-bound service
- Replace `public static $queryLog = []` with Laravel query logging or `scoped()` service
- Replace `self::$cache[$key] = $value` with request-scoped cache or container binding
- For each fix, verify the service is bound with `$this->app->scoped()` (not `singleton()`)
- Run `grep -rn "singleton(" app/Providers/ --include="*.php"` — verify all request-scoped services use `scoped()` instead

### 3. Audit and Fix Container Bindings
- List every `$this->app->singleton()` call across all providers
- For each singleton, determine if it holds request-scoped state:
  - Auth, session, request, user-dependent services → must be `scoped()`
  - Logger, config, cache client, HTTP client (stateless) → can remain `singleton()`
  - Database connection → typically `singleton()` with per-request transaction reset
- Replace misclassified singletons with `$this->app->scoped()`
- For stateful singletons that cannot be scoped (library requirements), implement `resetState()` called by Octane's request lifecycle hook

### 4. Implement Ordered-Request Leak Testing
- Create a test script that sends requests as alternating users:
  ```bash
  curl --user user-a:pass http://app/profile  # Expect User A data
  curl --user user-b:pass http://app/profile  # Expect User B data
  curl --user user-a:pass http://app/profile  # Expect User A data — NOT User B's
  ```
- Automate in CI: run ordered-request tests on every deploy candidate
- For API endpoints, test with different identifiers in query parameters
- Log test results with request IDs to trace which worker handled each request
- If any contamination detected, isolate which binding or static property causes the leak

### 5. Set Up Octane State Leak Detection in Development
- Enable `php artisan octane:watch` during development for runtime leak detection
- Run a focused testing session: all application endpoints exercised under Octane
- Review `octane:watch` output for static property modification warnings
- Add Octane-compatibility PHPStan rules to catch static property misuse at analysis time
- Consider community tools like `stan-blade/laravel-octane-analyzer`

### 6. Monitor Per-Worker RSS Growth
- Configure per-worker RSS tracking (via `/proc/self/status` or Octane health endpoint)
- Establish baseline: measure RSS after idle (worker started, no requests) and after 100 requests
- Set up alert: if RSS grows >10% over any 4-hour window, trigger investigation
- Set up critical alert: if RSS exceeds 80% of max_worker_memory or starts growing >20% per hour
- Trend RSS over days: gradual upward trend indicates accumulating state leak

### 7. Establish CI Gate for Static Properties
- Add CI step to grep for static properties in app code and fail if unapproved
- Maintain an allowlist of intentionally shared static properties (read-only config, immutable singletons)
- Run `php artisan octane:test` in CI on every commit
- Gate deployment on passing Octane compatibility checks

### 8. Create State Leak Incident Response Runbook
- Document symptoms: User A sees User B's data, RSS growing faster than baseline, `octane:test` failures
- Document investigation steps: ordered-request test to confirm, isolate affected endpoint, grep static properties in recent code changes
- Document mitigation steps: reduce max_requests temporarily (300), rollback recent code changes, or switch to FPM
- Document fix steps: identify and eliminate the static property or misclassified binding

## Validation Checklist
- [ ] Static property audit completed across app and vendor code
- [ ] All request-scoped static properties eliminated or wrapped with per-request reset
- [ ] All request-scoped container bindings use `scoped()` (not `singleton()`)
- [ ] Ordered-request test (A, B, A) passes with zero data contamination
- [ ] `php artisan octane:watch` detects zero leaks during development testing
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] Per-worker RSS monitoring configured with 10% growth alert
- [ ] CI gate for static properties implemented
- [ ] State leak incident response runbook documented
- [ ] All team members trained on Octane state management patterns

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Intermittent data leak | User A occasionally sees User B's data | Third-party package with mutable static cache | Audit vendor packages, find alternative or wrap with scoped binding |
| Gradual RSS growth | Worker memory increases 5% per hour | Accumulating data in static array or collection | Add logging to track which static property grows, eliminate it |
| Ordered test fails only sometimes | Contamination appears only under concurrent load | Race condition in static property access | Increase concurrent test concurrency, fix synchronization |
| `octane:watch` silent but leak exists | No warnings but data still leaks | Leak via singleton binding (not static) | Audit all singleton bindings for request-scoped data |
| New code introduces leak | Leak appeared after deployment | Developer unaware of Octane patterns | Add CI gate, train team on Octane-safe patterns |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Eliminate static vs wrap with reset | Eliminate when possible; wrap with reset only when the service comes from a third-party package that cannot be refactored |
| scoped() vs singleton() + resetState() | Prefer scoped() — it's automatic and less error-prone. Use singleton + resetState() only for services that MUST be singleton for performance |
| Alert threshold | 10% per hour growth as warning; 20% per hour as critical. Lower thresholds for services with strict SLAs |
| CI fail on any static vs allowlist | Fail on any static in app code with explicit allowlist for read-only config. Fail on any static in vendor code that isn't on approved list |

## Performance Considerations
- Each `scoped()` binding adds ~0.01ms per request resolution cost — negligible
- RSS monitoring overhead is minimal (reading `/proc/self/status` once per minute)
- Ordered-request tests add 1-2 seconds to CI pipeline — worth the safety
- Lowering max_requests as leak mitigation adds bootstrap overhead — fix the leak instead
- Eliminating static caches may increase database load slightly if the cache was reducing queries

## Security Considerations
- State leaks are security vulnerabilities: User A's data (orders, PII, auth tokens) visible to User B
- Singleton misuse with auth data causes privilege escalation — User B authenticated as User A
- Static caches may retain sensitive data (API keys, tokens, personal information) across requests
- Vendor package static leaks are especially dangerous because they're outside the team's direct control
- When rolling back from Octane to FPM due to a state leak, purge all worker connections to ensure clean state

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Run static property audit as a CI step before Octane deployment | `05-rules.md:1` | Steps 1, 7: audit and CI gate |
| Always use scoped() bindings for per-request services | `05-rules.md:26` | Step 3: binding audit |
| Test Octane with ordered requests to detect state leaks | `05-rules.md:52` | Step 4: ordered-request testing |
| Monitor per-worker RSS growth — alert on >10% per hour | `05-rules.md:78` | Step 6: RSS monitoring |

## Related Skills

| Skill | Relation |
|-------|----------|
| Audit and Adapt Application for Octane's Persistent Execution Model | This skill is the detailed implementation of state leak prevention within that migration |
| Optimize Service Providers for Octane Persistent Execution | Provider binding audit is shared work between both skills |
| Perform FPM-to-Octane Migration | State leak prevention is Phase 4 of the full migration |
| Install and Configure Octane for a Laravel Project | Prerequisite — Octane must be running for leak testing |
| Monitor and Debug Octane Workers | RSS monitoring in this skill feeds into broader worker monitoring |

## Success Criteria
- Zero cross-request state leaks detected in production or staging
- All request-scoped static properties eliminated from app code
- All request-scoped container bindings use `scoped()`
- Ordered-request test (A, B, A) passes consistently with zero contamination
- Per-worker RSS stable (<10% growth over 24 hours)
- `php artisan octane:test` and `php artisan octane:watch` produce zero warnings
- CI pipeline prevents introduction of new static property leaks
- Team can identify, investigate, and fix state leaks within 1 hour of detection
