## Follow the structured migration order: static properties → providers → singletons → testing → canary deploy
---
Category: Maintainability
---
Execute Octane migration in the specified sequence: 1) Audit and fix all request-scoped static properties, 2) Audit service providers for Octane compatibility, 3) Convert singleton bindings to scoped where needed, 4) Run concurrent request tests, 5) Deploy to a canary subset before full rollout.
---
Reason: Each migration step depends on the previous one. Static properties are the most common and dangerous source of leaks — fixing them first eliminates the highest-risk category. Provider audit catches boot-time side effects. Singleton conversion prevents data leakage through shared service instances. Testing verifies each step before proceeding. Skipping the order means finding and fixing leaks in production rather than in staging.
---
Bad Example:
```bash
# Big-bang migration — all changes simultaneously
# When a leak appears, cannot identify which change caused it
```

Good Example:
```bash
# Step 1: grep -r "static \$" app/ — fix all request-scoped statics
# Step 2: grep boot() in Providers — verify idempotent side effects
# Step 3: Review singleton bindings → scoped where needed
# Step 4: ab -n 100 -c 10 with different users — verify no leaks
# Step 5: Deploy to 10% of servers for 24-hour observation
```
---
Exceptions: Greenfield applications with no FPM legacy can start with Octane from day one, skipping the migration steps.
---
Consequences Of Violation: Undetected state leaks cause data exposure between users, debugging is impossible because multiple changes overlap, production incidents from improperly ordered migration.

## Run concurrent request tests with different user parameters to detect state leaks
---
Category: Testing
---
Use Apache Benchmark (ab) or wrk to send concurrent requests with different user identifiers to the same endpoint, then verify each response contains only the correct user's data — never assume sequential testing reveals leaks.
---
Reason: Sequential requests (one at a time) don't reveal state leaks because the time gap between requests allows the worker to fully process and clean up. Under concurrent load, multiple requests interleave within the same worker, exposing static property contamination, shared singleton state, and incomplete sandbox resets. A simple test sending 100 concurrent requests as user A followed by 100 as user B reveals leaks that sequential testing completely misses.
---
Bad Example:
```bash
# Sequential testing — misses all state leaks
curl http://app/test?user=alice  # Returns alice's data — looks fine
curl http://app/test?user=bob    # Returns bob's data — looks fine
# Leak exists but goes undetected
```

Good Example:
```bash
# Concurrent testing — detects leaks
ab -n 100 -c 10 "http://app/test?user=alice"
# Verify all 100 responses contain only alice's data
ab -n 100 -c 10 "http://app/test?user=bob"
# Verify all 100 responses contain only bob's data
# If alice's data appears in bob's responses, state leak detected
```
---
Exceptions: Health check endpoints that return static data may not need concurrent leak testing.
---
Consequences Of Violation: Undetected cross-request data leakage in production, user A sees user B's data, potential privacy breach and data exposure incident.

## Audit all third-party packages for Octane compatibility before migration — not just application code
---
Category: Testing
---
Run the static property audit and compatibility checks on vendor packages in addition to application code — third-party packages are the most common source of Octane state leaks.
---
Reason: Application code is typically well-audited because it's under the team's control. Vendor packages, however, commonly use public static properties for caching ($queryLog, $results, $instances) that silently accumulate data across requests in Octane's persistent worker model. A single package with a static collection grows unboundedly, or worse, leaks one user's data to another. These leaks are invisible in FPM where processes die after each request.
---
Bad Example:
```bash
# Only auditing app/ — missing vendor leaks
grep -rn "static \$\|self::" app/ --include="*.php"  # Clean
# But vendor/package-x has public static $cache that grows across requests
```

Good Example:
```bash
# Auditing both app and vendor
grep -rn "public static \$\|protected static \$" vendor/ --include="*.php"
# Identify and wrap incompatible packages with scoped bindings
```
---
Exceptions: Applications using only well-known Octane-compatible packages (Laravel first-party packages) may focus the audit on app code.
---
Consequences Of Violation: Undetected data leakage from vendor packages, intermittent data exposure between users, extremely difficult debugging because the leak source is outside the application code.

## Deploy Octane to a canary subset of servers for 24 hours before full rollout
---
Category: Reliability
---
Roll out Octane to 10% of production servers first, compare error rates and performance metrics against the FPM baseline for 24 hours, then proceed to full rollout only if metrics are stable.
---
Reason: Staging environments cannot perfectly replicate production traffic patterns, data sizes, and concurrency levels. A canary deployment reveals environment-specific issues — database connection pool sizing, Redis connection limits, load balancer timeouts — that don't surface in staging. The 24-hour observation window catches memory leaks and performance regressions that only emerge under sustained production load.
---
Bad Example:
```bash
# Full rollout immediately — no canary
# Octane deployed to all 20 servers simultaneously
# All workers OOM after 6 hours from undetected memory leak
```

Good Example:
```bash
# Canary rollout
# Deploy Octane to 2 of 20 servers (10%)
# Monitor for 24 hours: error rate stable, RSS stable, no leaks
# Day 2: deploy to remaining 18 servers
```
---
Exceptions: Greenfield applications with no existing traffic can deploy Octane directly since there is no FPM baseline to compare against.
---
Consequences Of Violation: Full-production outage from issues that would have been caught in a canary, extended downtime during emergency rollback, loss of team confidence in Octane.
