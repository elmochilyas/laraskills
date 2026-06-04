# Rules: Plan-Aware Throttling

## Define Rate Limits in a Config File, Not Hardcoded
---
## Category
Architecture
---
## Rule
Define plan-based rate limits in a config file (e.g., `config/plans.php`). Never hardcode limits in controllers or middleware.
---
## Reason
Hardcoded limits require code changes to adjust pricing plans. A config file separates limits from logic, allowing plan adjustments without deployment. It also provides a single source of truth for documentation and billing.
---
## Bad Example
```php
// Hardcoded limit in controller
if ($user->plan === 'free' && $usage > 100) { abort(429); }
```
---
## Good Example
```php
// config/plans.php
return [
    'free' => ['requests_per_minute' => 10, 'requests_per_day' => 100],
    'pro' => ['requests_per_minute' => 60, 'requests_per_day' => 1000],
    'enterprise' => ['requests_per_minute' => 300, 'requests_per_day' => 10000],
];
```
```php
$limits = config("plans.{$user->plan}");
if ($usage > $limits['requests_per_minute']) { abort(429); }
```
---
## Exceptions
No common exceptions — config-driven limits are always preferred.
---
## Consequences Of Violation
Deployments required for plan changes, inconsistent limit enforcement.
---

## Apply the Strictest Limit When No Plan Is Assigned
---
## Category
Security
---
## Rule
Default to the lowest (strictest) rate limit tier when a user has no plan assignment. Never default to unlimited.
---
## Reason
A user without a plan assignment (e.g., new signup before plan selection, or deleted plan) should not get unlimited API access. Defaulting to the strictest limit ensures they are always constrained and prevents accidental free access to higher tiers.
---
## Bad Example
```php
$limits = config("plans.{$user->plan}"); // null if no plan — throws error or returns null
```
---
## Good Example
```php
$plan = $user->plan ?? 'free'; // Default to free (strictest)
$limits = config("plans.{$plan}");
```
---
## Exceptions
No common exceptions — unassigned users must have a default limit.
---
## Consequences Of Violation
Unlimited API access for unassigned users.
---

## Cache Plan Limits to Avoid Repeated Config Reads
---
## Category
Performance
---
## Rule
Cache resolved plan limits for the user's session (or a short TTL). Avoid reading config and calculating limits on every request.
---
## Reason
Plan limit resolution may involve database lookups (current plan, current usage). Caching reduces repeated queries for the same user within the TTL window. This is especially important for rate-limit-checking middleware that runs on every API request.
---
## Bad Example
```php
// Config read on every request
$limits = config("plans.{$user->plan}");
```
---
## Good Example
```php
$limits = cache()->remember("plan_limits:{$user->id}", 300, function () use ($user) {
    return config("plans.{$user->plan ?? 'free'}");
});
```
---
## Exceptions
No common exceptions — caching plan limits is a simple performance improvement.
---
## Consequences Of Violation
Unnecessary config reads and potential DB queries on every request.
---

## Pro-Rate Remaining Requests When Upgrading During the Cycle
---
## Category
Architecture
---
## Rule
When a user upgrades their plan mid-cycle, increase their remaining limit proportionally. Do not reset usage to zero.
---
## Reason
Resetting usage to zero on upgrade allows the user to consume the full new plan's limit on top of what they already used on the lower plan. Pro-rating ensures fair resource allocation based on the portion of the cycle remaining.
---
## Bad Example
```php
// Reset usage on upgrade — user gets full new limit + already used old limit
$usage->reset();
```
---
## Good Example
```php
// Pro-rate remaining limit
$oldLimit = config("plans.{$oldPlan}.requests_per_day");
$newLimit = config("plans.{$newPlan}.requests_per_day");
$remaining = $oldLimit - $usage->current;
$prorated = ($remaining / $oldLimit) * $newLimit;
$usage->remaining = $prorated;
```
---
## Exceptions
No common exceptions — pro-rating is the fair approach.
---
## Consequences Of Violation
Users can exceed the new plan's limit in the same cycle.
---

## Return Plan Quota Headers in API Responses
---
## Category
Architecture
---
## Rule
Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers that reflect the user's plan tier limits.
---
## Reason
API consumers need visibility into their plan's limits to avoid hitting the ceiling unexpectedly. Standard rate limit headers provide transparency and allow clients to implement proactive backoff. Plan-aware headers also show the value of upgrading.
---
## Bad Example
```php
// No usage headers returned — clients don't know their limits
```
---
## Good Example
```php
$response->header('X-RateLimit-Limit', $limits['requests_per_minute']);
$response->header('X-RateLimit-Remaining', max(0, $limits['requests_per_minute'] - $currentUsage));
$response->header('X-RateLimit-Reset', $resetTimestamp);
```
---
## Exceptions
No common exceptions — rate limit headers improve client experience.
---
## Consequences Of Violation
Clients cannot plan around rate limits, unexpected 429 errors.
---

## Notify Users When Approaching Plan Limits
---
## Category
Architecture
---
## Rule
Trigger a notification (email, in-app) when a user reaches 80% and 100% of their plan's rate limit. Offer upgrade links in the notification.
---
## Reason
Users who hit their rate limit unknowingly receive 429 errors and may think the application is broken. Proactive notifications inform them of their usage level and provide a clear upgrade path, improving user experience and conversion.
---
## Bad Example
```php
// User hits limit and gets 429 — no prior warning
```
---
## Good Example
```php
if ($usagePercentage >= 0.8 && !cache("limit_warning:{$user->id}")) {
    $user->notify(new ApproachingLimitNotification($usagePercentage));
    cache(["limit_warning:{$user->id}" => true], 86400); // Once per day
}
```
---
## Exceptions
No common exceptions — proactive notifications improve user experience.
---
## Consequences Of Violation
User frustration, unexpected 429 errors without context.
