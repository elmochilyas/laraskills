## Use triggered profiling via X-Blackfire-Profile header for production — never enable always-on profiling
---
Category: Monitoring
---
Profile production requests only when triggered by the `X-Blackfire-Profile: true` HTTP header — never configure Blackfire for continuous profiling in production.
---
Reason: Blackfire's sampling mode adds 2-5% overhead even when no profile is being captured. In always-on mode, every request pays this overhead. Triggered profiling adds zero overhead to non-profiled requests — the extension checks for the trigger header and only collects data when present. For a service handling 1000 RPS, always-on profiling wastes 20-50 RPS worth of CPU on profile data collection that nobody is using.
---
Bad Example:
```bash
# Always-on — 2-5% overhead on every request
```

Good Example:
```bash
# Triggered — zero overhead for non-profiled requests
curl -H "X-Blackfire-Profile: true" http://app/slow-endpoint
```
---
Exceptions: Staging or development environments where overhead is acceptable may use always-on profiling for continuous feedback.
---
Consequences Of Violation: 2-5% CPU overhead on all production requests for profiles that are rarely viewed.

## Verify both the Blackfire probe and agent are running before attempting to profile
---
Category: Configuration
```
Check that `php -m | grep blackfire` shows the probe loaded AND `systemctl status blackfire-agent` shows the agent running — one without the other produces no profiles.
---
Reason: The Blackfire probe collects profiling data, but the probe needs the agent to forward data to the Blackfire cloud. Without the agent, profiles are collected in memory and discarded when the request ends — no data ever reaches the dashboard. The probe loads without error even when the agent is missing, so the most common setup failure is silent — profiles appear to work but produce no results.
---
Bad Example:
```bash
# Only probe checked — agent may be missing
php -m | grep blackfire  # OK — but agent is not running
# Profiles collected but never sent — looks like a Blackfire cloud issue
```

Good Example:
```bash
# Both verified
php -m | grep blackfire && echo "Probe OK"
systemctl status blackfire-agent && echo "Agent OK"
```
---
Exceptions: Docker environments using the Blackfire Agent as a separate container require checking both containers, not a single systemctl command.
---
Consequences Of Violation: Profiles collected but never uploaded, wasted investigation time debugging "Blackfire isn't working" when the configuration is fine.

## Enforce performance budgets with Blackfire assertions in CI pipeline
---
Category: Testing
```
Add Blackfire assertions for wall_time, io_time, and cpu_time in the CI pipeline and fail the build when assertions fail — performance budgets must be enforced automatically.
---
Reason: Manual performance reviews are inconsistent and easily skipped under deadline pressure. Automated assertions in CI ensure every commit meets performance budgets before merging. A simple assertion like `--assert="main.wall_time < 200ms"` catches regressions that would otherwise reach production. The assertion check runs in seconds and provides immediate feedback to the developer.
---
Bad Example:
```bash
# Manual performance review — easily skipped
# Performance checked only during code review, budget not enforced
```

Good Example:
```bash
# Automated assertion — enforced every commit
blackfire run --assert="main.wall_time < 200ms" php artisan your:command
# Wall_time 250ms → assertion fails → build blocked
```
---
Exceptions: Rapid prototyping branches where performance budgets are intentionally relaxed may skip assertions.
---
Consequences Of Violation: Performance regressions reach production, team spends heroic effort debugging production slowdowns that could have been caught in CI.

## Use canary profiling — inject X-Blackfire-Profile on 0.1% of production traffic
---
Category: Monitoring
```
Configure the load balancer or reverse proxy to inject the `X-Blackfire-Profile: true` header on 0.1% of production traffic for continuous, low-overhead production profiling.
---
Reason: Triggered profiling is great for targeted investigations but provides no visibility into normal production traffic. Canary profiling (0.1% of requests) provides continuous profiling data with fleet-wide overhead of 0.002-0.005% — negligible. This enables always-on production visibility, baseline profiling, and detection of regressions before they cause user-facing issues.
---
Bad Example:
```bash
# No production visibility — only investigate known issues
# Miss regressions until users report them
```

Good Example:
```nginx
# Canary profiling — 0.1% of requests profiled
location / {
    if ($request_uri ~* "^/api") {
        access_by_lua_block {
            if math.random(1, 1000) == 1 then
                ngx.header["X-Blackfire-Profile"] = "true"
            end
        }
    }
}
```
---
Exceptions: Systems with extremely tight performance budgets may reserve profiling entirely for on-demand investigations.
---
Consequences Of Violation: No baseline production profiles, regression detection relies on user reports, inability to compare "before" and "after" profiles for deployed changes.

## Store Blackfire credentials in environment variables — never hardcode in version control
---
Category: Security
```
Set BLACKFIRE_CLIENT_ID and BLACKFIRE_CLIENT_TOKEN as environment variables in deployment environments — never commit credentials to version control or configuration files.
---
Reason: Blackfire credentials provide access to profile data, which contains application internals (function names, file paths, SQL queries). Hardcoded credentials in Git history are accessible to anyone with repository access, including former employees and compromised CI systems. Environment variables keep credentials out of the codebase while allowing per-environment configuration.
---
Bad Example:
```php
// Credentials hardcoded — exposed in Git
'client_id' => 'abc123-def456',  // In version control forever
```

Good Example:
```bash
# Environment variables — not in version control
export BLACKFIRE_CLIENT_ID=abc123-def456
export BLACKFIRE_CLIENT_TOKEN=ghj789-klm012
```
---
Exceptions: Local development environments where credentials are stored in `.env` files (excluded from Git via `.gitignore`) are acceptable.
---
Consequences Of Violation: Credential exposure in version control, unauthorized access to production profiling data, potential information disclosure.
