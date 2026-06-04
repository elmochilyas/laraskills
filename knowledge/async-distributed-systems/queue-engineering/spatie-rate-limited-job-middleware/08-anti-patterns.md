# Anti-Patterns — Spatie `laravel-rate-limited-job-middleware` Package

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Job Middleware |
| Knowledge Unit | Spatie `laravel-rate-limited-job-middleware` Package |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Untested `when()` Callback Bypass
2. Dual Rate Limiter Interference
3. Stale Package After Laravel Upgrade
4. Extra Dependency When Built-In Suffices

---

## 1. Untested `when()` Callback Bypass

### Category
Reliability

### Description
Using Spatie's `when()` callback for conditional rate limiting without unit testing it, allowing a bug in the condition to silently bypass rate limiting for all job instances.

### Why It Happens
The `when()` callback is a simple closure that returns true or false. The developer writes it inline in the `middleware()` method, assumes it works, and doesn't unit test it. If the condition always returns `false` (due to a bug, null reference, or type mismatch), rate limiting is silently disabled — no error, no warning, no log.

### Warning Signs
- `when()` callback not unit tested
- Rate limiting expected but never triggers in production
- Jobs execute unrestricted against throttled APIs
- Third-party API rate limit violations occur

### Why Harmful
The developer writes `->when(fn($job) => $job->user->isFree())` to rate-limit only free-tier users. But `$job->user` is null in some paths, causing a null pointer exception that's silently caught, or `isFree()` returns `false` for all users due to a refactoring bug. The `when()` callback always returns `false`, and rate limiting is completely disabled. All users bypass rate limiting. A single user floods the API and gets the API key banned.

### Consequences
- Rate limiting silently disabled by buggy condition
- Third-party API flooded despite rate limiting intent
- API key banned from provider
- Bug invisible until downstream impact

### Alternative
Always unit test the `when()` callback to verify it returns the correct boolean for each condition.

### Refactoring Strategy
1. Extract the `when()` callback to a testable method or class
2. Write unit tests: free user → true, premium user → false, null user → false
3. Test edge cases: null properties, unexpected types
4. Add integration test verifying middleware applies conditionally

### Detection Checklist
- [ ] `when()` callback unit tested
- [ ] Tests cover all branches of the condition
- [ ] Edge cases tested (null, unexpected types)
- [ ] Rate limiting confirmed active for intended instances

### Related Rules
test-when-callback

### Related Skills
Apply Conditional Rate Limiting with Spatie Middleware

### Related Decision Trees
Built-in RateLimited vs Spatie RateLimitedMiddleware

---

## 2. Dual Rate Limiter Interference

### Category
Reliability

### Description
Applying both Spatie's rate limiter and Laravel's built-in `RateLimited` middleware on the same job, creating two independent counters for the same underlying API limit with unpredictable combined behavior.

### Why It Happens
The developer adds Spatie's middleware for conditional rate limiting on top of an existing Laravel `RateLimited` without realizing they operate independently. Both middleware reference the same API limit but maintain separate counters. The job can be released by either limiter at different times, creating unpredictable throttling behavior.

### Warning Signs
- Both `Spatie\RateLimitedMiddleware\RateLimited` and `Illuminate\Queue\Middleware\RateLimited` in same job
- Two separate rate limit counters for the same API
- Unpredictable throttling — sometimes strict, sometimes permissive
- Jobs released by one limiter but not the other

### Why Harmful
Laravel's limiter releases the job when the cache counter hits 60/minute. Spatie's limiter releases the job when its separate cache counter hits 60/minute. A job that was released by Laravel's limiter at 60 hits is accepted by Spatie's limiter at 55 hits. After the Laravel window resets, the job executes. But Spatie's counter is still at 55. The job may execute while Spatie thinks it's rate-limited, or may be blocked by Spatie while Laravel thinks it's available. The combined behavior is undefined.

### Consequences
- Two independent counters for the same limit
- Unpredictable combined rate limiting behavior
- Jobs blocked when they should be allowed
- Jobs allowed when they should be blocked

### Alternative
Choose one rate limiter implementation per job. Use Spatie for conditional limiting, Laravel's built-in for simple limiting.

### Refactoring Strategy
1. Audit all jobs for dual rate limiter usage
2. Choose one implementation based on requirements
3. Remove the other rate limiter from the `middleware()` array
4. For conditional limiting: keep Spatie
5. For simple uniform limiting: keep Laravel's built-in

### Detection Checklist
- [ ] Only one rate limiter implementation per job
- [ ] No dual Laravel+Spatie rate limiter usage
- [ ] Single counter per API limit
- [ ] Predictable, documented rate limiting behavior

### Related Rules
dont-mix-spatie-and-builtin

### Related Skills
Apply Conditional Rate Limiting with Spatie Middleware

### Related Decision Trees
Built-in RateLimited vs Spatie RateLimitedMiddleware

---

## 3. Stale Package After Laravel Upgrade

### Category
Maintainability

### Description
Upgrading Laravel without updating `spatie/laravel-rate-limited-job-middleware`, causing runtime failures from internal API incompatibility.

### Why It Happens
The package depends on internal `RateLimiter` facade APIs that may change between Laravel versions. A `composer update laravel/framework` upgrades Laravel but leaves the Spatie package at its old version. The Spatie package calls methods that no longer exist or have different signatures in the new Laravel version, causing errors.

### Warning Signs
- Laravel upgraded without Spatie package update
- Rate limiting errors after Laravel upgrade
- Jobs stop being rate-limited silently
- Error logs show method not found or signature mismatches

### Why Harmful
After a Laravel 10→11 upgrade, Spatie's package still references `RateLimiter::attempt()` with the old signature. The new Laravel version changes the method signature. Every job using Spatie's rate limiter throws a TypeError when the middleware runs. Jobs execute without rate limiting, flooding the downstream API. The error is caught and logged, but rate limiting is completely disabled until the package is updated.

### Consequences
- Rate limiting broken after Laravel upgrade
- Jobs execute unrestricted, potentially flooding APIs
- Errors may be caught and logged silently
- Package compatibility lag causes issues

### Alternative
Always update the Spatie package alongside the Laravel framework upgrade. Test rate limiting after upgrades.

### Refactoring Strategy
1. Before Laravel upgrade: check Spatie package compatibility
2. Update both together: `composer update laravel/framework spatie/laravel-rate-limited-job-middleware`
3. Pin compatible versions if necessary
4. Run rate limiting tests after upgrade
5. Monitor rate limiting metrics post-upgrade

### Detection Checklist
- [ ] Spatie package updated alongside Laravel upgrade
- [ ] Compatible versions verified
- [ ] Rate limiting tested after upgrade
- [ ] No rate limiting errors post-upgrade

### Related Rules
update-spatie-package-after-laravel-upgrade

### Related Skills
Apply Conditional Rate Limiting with Spatie Middleware

### Related Decision Trees
Built-in RateLimited vs Spatie RateLimitedMiddleware

---

## 4. Extra Dependency When Built-In Suffices

### Category
Maintainability

### Description
Installing and using Spatie's package for simple uniform rate limiting that Laravel's built-in `RateLimited` handles natively, adding an unnecessary external dependency.

### Why It Happens
The developer discovers Spatie's package first (through blog posts or Search), finds its syntax cleaner, and installs it without evaluating whether Laravel's built-in middleware suffices. A simple 60-requests-per-minute limit uses Spatie's syntax instead of Laravel's built-in, adding a dependency and update burden for no additional benefit.

### Warning Signs
- Spatie package used for simple uniform rate limiting
- No conditional logic, no attempt-based limiting needed
- Built-in `RateLimited` would handle the same scenario
- Dependency added without evaluating native alternatives

### Why Harmful
Every package dependency adds maintenance burden: updates, compatibility checks, security audits. For simple uniform rate limiting, Laravel's built-in `RateLimited` (available since Laravel 10) handles the same scenario with zero additional dependencies. The Spatie package adds a `composer.json` entry, update cycle, and compatibility risk for functionality that exists natively.

### Consequences
- Unnecessary external package dependency
- Additional maintenance burden for updates
- Compatibility risk during Laravel upgrades
- No benefit over built-in alternative

### Alternative
Use Laravel's built-in `RateLimited` middleware for simple uniform rate limiting. Use Spatie only when its additional features (conditional, attempt-based) are needed.

### Refactoring Strategy
1. Audit Spatie usage — identify jobs with simple uniform rate limiting
2. Replace `Spatie\RateLimitedMiddleware\RateLimited` with `Illuminate\Queue\Middleware\RateLimited`
3. Define named limiter in `AppServiceProvider::boot()` via `RateLimiter::for()`
4. Remove unused Spatie import
5. Remove package if no jobs require it

### Detection Checklist
- [ ] Spatie used only for features not in built-in
- [ ] Simple uniform limits use built-in middleware
- [ ] No unnecessary external dependencies
- [ ] Package removal evaluated

### Related Rules
dont-mix-spatie-and-builtin

### Related Skills
Apply Conditional Rate Limiting with Spatie Middleware, Add RateLimited Middleware to Jobs

### Related Decision Trees
Built-in RateLimited vs Spatie RateLimitedMiddleware
