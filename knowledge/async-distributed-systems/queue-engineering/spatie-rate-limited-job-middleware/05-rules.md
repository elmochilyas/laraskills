# Rule Card: K053 — Spatie `laravel-rate-limited-job-middleware` Package

---

## Rule 1

**Rule Name:** test-when-callback

**Category:** Always

**Rule:** Always unit test the `when()` callback of Spatie's `RateLimited` middleware.

**Reason:** If the callback always returns `false`, rate limiting is silently disabled — no error is thrown.

**Bad Example:**
```php
RateLimited::allowed(10)
    ->everySeconds(60)
    ->when(fn($job) => $job->user->isFree()); // Untested — may always return false
```

**Good Example:**
```php
// Test
public function test_rate_limiting_applies_to_free_users(): void
{
    $freeUser = User::factory()->free()->make();
    $job = new ApiJob($freeUser);
    $this->assertTrue($job->middleware()[0]->when($job));
}
```

**Exceptions:** When the `when()` callback is a simple, trivially correct expression (e.g., `fn($j) => true`), testing may not be necessary.

**Consequences Of Violation:** The application silently bypasses rate limiting — a third-party API gets flooded without any alert, causing IP bans or rate limit violations at the provider level.

---

## Rule 2

**Rule Name:** dont-mix-spatie-and-builtin

**Category:** Never

**Rule:** Never use both Spatie and Laravel rate limiters on the same job.

**Reason:** They operate independently with separate counters — two independent rate limiters for the same underlying limit cause unpredictable behavior.

**Bad Example:**
```php
public function middleware(): array
{
    return [
        new RateLimited('api-requests'),          // Laravel built-in
        RateLimited::allowed(10)->everySeconds(60), // Spatie — separate counter
    ];
}
```

**Good Example:**
```php
public function middleware(): array
{
    return [
        RateLimited::allowed(10)->everySeconds(60), // Choose one implementation
    ];
}
```

**Exceptions:** When the two limiters cover different concerns (e.g., one for rate, one for cost), both may be appropriate — but ensure they use different keys.

**Consequences Of Violation:** The Spatie limiter releases the job, but the Laravel limiter immediately re-queues it — or vice versa. The effective rate limit is undefined and unpredictable.

---

## Rule 3

**Rule Name:** update-spatie-package-after-laravel-upgrade

**Category:** Always

**Rule:** Always update `spatie/laravel-rate-limited-job-middleware` after a Laravel version upgrade.

**Reason:** The package depends on internal `RateLimiter` APIs that may change between Laravel versions — untested compatibility causes runtime failures.

**Bad Example:**
```bash
composer update laravel/framework
# Didn't update spatie/laravel-rate-limited-job-middleware — uses old API
```

**Good Example:**
```bash
composer update laravel/framework spatie/laravel-rate-limited-job-middleware
# Both updated together — API compatibility maintained
```

**Exceptions:** When a specific version of the Spatie package is known to be compatible with the Laravel version, pinning both is acceptable.

**Consequences Of Violation:** Rate limiting silently stops working or throws exceptions after a Laravel upgrade — jobs flood the downstream API without protection until the issue is discovered.
