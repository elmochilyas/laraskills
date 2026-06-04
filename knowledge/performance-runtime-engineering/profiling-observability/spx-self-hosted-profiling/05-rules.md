## Always set spx.http_key to a strong random value — never leave it unconfigured
---
Category: Security
---
Configure `spx.http_key` with a cryptographically random string in every environment — without it, anyone who knows the SPX URL can trigger profiling on any request.
---
Reason: Without an HTTP key, adding `?SPX_PROFILE=1` to any URL triggers profiling. An attacker can use this to degrade server performance on every request (SPX adds 50-200ms profiling overhead) and extract internal application information (function names, file paths, memory usage patterns) by profiling authentication, payment, or admin endpoints. The HTTP key must be strong enough to resist brute force and guessing attacks.
---
Bad Example:
```ini
; No HTTP key — anyone can trigger profiling
spx.http_enabled=1
; spx.http_key not set
```

Good Example:
```ini
; Strong random HTTP key
spx.http_key=aB3dE7fG9kL2mN4pQ6rS8tU0vW1xY3z
```
---
Exceptions: Development environments on localhost with no network access may use weaker keys for convenience.
---
Consequences Of Violation: Attackers trigger profiling on every request, degrading performance and extracting application internals through profile data.

## Restrict SPX web UI to localhost — never expose it to the internet
---
Category: Security
```
Configure the web server to block external access to the SPX endpoint — allow access only from 127.0.0.1 or internal monitoring IPs.
---
Reason: The SPX web UI displays detailed profiling data including full function names, file paths, call stacks, and memory usage. This information reveals application architecture, business logic paths, and potential attack surfaces. Exposing it to the internet allows attackers to map the application's internal structure without triggering any application-level authentication or authorization.
---
Bad Example:
```nginx
# SPX accessible from anywhere — security risk
# No access restriction on /SPX
```

Good Example:
```nginx
# SPX restricted to localhost
location /SPX {
    allow 127.0.0.1;
    deny all;
}
```
---
Exceptions: Internal monitoring tools on separate hosts may require network access to SPX, restricted to specific IP ranges with firewall rules.
---
Consequences Of Violation: Application internals exposed to the internet, attackers map business logic paths, increased attack surface from function name and file path disclosure.

## Disable SPX in production by default — enable only during targeted investigation windows
---
Category: Configuration
---
Set `spx.http_enabled=0` in production configuration and only enable it during active debugging sessions — never leave SPX enabled in production indefinitely.
---
Reason: SPX has zero overhead when not profiling, but HTTP-enabled configuration means any request with the SPX key triggers profiling. Accidental profiling (from a developer testing locally with the production key, or a load balancer health check including the parameter) adds 50-200ms to that request. Over weeks, these accidental profiles accumulate disk usage and occasionally impact production traffic. Disabling by default eliminates this risk while preserving on-demand capability.
---
Bad Example:
```ini
; SPX always enabled in production — accidental profiling risk
spx.http_enabled=1
```

Good Example:
```ini
; SPX disabled by default — enable only during investigation
spx.http_enabled=0
; During investigation: temporarily set to 1, then revert
```
---
Exceptions: Air-gapped production environments with no monitoring tools may need SPX available for occasional debugging.
---
Consequences Of Violation: Accidental profiling degrades production request latency, accumulated profile files consume disk space, security exposure from HTTP-enabled profiling.

## Manage SPX profile data retention — clean up old profiles regularly
---
Category: Maintainability
```
Configure a cron job or cleanup script to delete SPX profile files older than 30 days from `spx.data_dir` — never let profiles accumulate indefinitely.
---
Reason: Each SPX profile is 10-50KB. At 50 profiles per day, that's 0.5-2.5MB/day or 15-75MB/month. Without cleanup, this grows unbounded and fills the disk. Profiling during an incident can generate hundreds of profiles in hours, accelerating disk consumption. A 30-day retention provides a reasonable window for post-incident analysis while preventing indefinite accumulation.
---
Bad Example:
```bash
# No cleanup — profiles accumulate until disk is full
# 500 profiles at 50KB each = 25MB — harmless but growing
# 5000 profiles = 250MB — still manageable
# 50000 profiles after 3 years = 2.5GB — disk pressure
```

Good Example:
```bash
# Weekly cleanup of profiles older than 30 days
find /tmp/spx -type f -mtime +30 -delete
```
---
Exceptions: Air-gapped environments where profiles must be preserved indefinitely may archive them to external storage with a cleanup policy.
---
Consequences Of Violation: Disk filled with accumulated profile data, profiling fails to write new profiles, application errors from disk-full conditions.

## Never commit the SPX HTTP key to version control
---
Category: Security
---
Store `spx.http_key` in environment variables or secrets manager — never hardcode it in php.ini files committed to version control.
---
Reason: The SPX HTTP key provides access to profile all application requests. If committed to version control, it's visible to everyone with repository access, CI system logs, and deployment artifacts. Even after rotation, the key remains in Git history permanently. Environment variables keep the key out of the codebase while allowing per-environment configuration and easy rotation.
---
Bad Example:
```ini
# Key in php.ini — committed to version control
spx.http_key=hardcoded-key  # Visible in Git forever
```

Good Example:
```bash
# Key in environment variable
export SPX_HTTP_KEY=random-secure-key
```
```ini
; php.ini references environment variable
spx.http_key=${SPX_HTTP_KEY}
```
---
Exceptions: Local development environments where php.ini is excluded from Git may hardcode a development-only key for convenience.
---
Consequences Of Violation: Profiling key exposed in version control, unauthorized profiling access, potential performance degradation and information disclosure from key misuse.
