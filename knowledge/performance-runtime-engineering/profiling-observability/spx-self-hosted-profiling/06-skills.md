# Skill: Install and Use SPX for Self-Hosted, On-Demand PHP Profiling

## Purpose
Install SPX (Simple Profiling eXtension) for self-hosted, request-scoped PHP profiling with zero external dependencies, configure with a strong HTTP key and restricted UI access, trigger on-demand profiles via URL parameter or HTTP header, interpret call trees and flame graphs in the built-in web UI, and manage data retention to prevent disk accumulation — providing free, air-gapped profiling for private environments.

## When To Use
- Air-gapped or private networks where cloud profilers are blocked
- Development and staging environments for quick ad-hoc profiling
- Teams needing a free, open-source profiling solution
- Debugging specific slow requests without continuous monitoring
- Environments requiring on-premises tooling for data sovereignty

## When NOT To Use
- Continuous production profiling (use Tideways or Blackfire)
- Persistent APM metrics and dashboards (SPX is on-demand)
- CLI-only environments without web UI access (use Xdebug)

## Prerequisites
- Root/sudo access on target server
- PHP with PECL support
- Web browser access for SPX UI (restricted to localhost)

## Inputs
- Target endpoint URL for profiling
- SPX HTTP key (cryptographically random string)
- Web server configuration for UI access restriction

## Workflow

### 1. Install SPX Extension
- Install: `pecl install spx`
- Add `extension=spx.so` to php.ini
- Configure: `spx.http_enabled=1`, `spx.http_key=<strong-key>`, `spx.data_dir=/tmp/spx`
- Verify: `php -m | grep spx`
- Restart PHP-FPM

### 2. Secure SPX Configuration
- Always set `spx.http_key` with a cryptographically random string
- Restrict SPX web UI to localhost via web server rules (Nginx `allow 127.0.0.1; deny all;`)
- Disable in production by default (`spx.http_enabled=0`)
- Never commit HTTP key to version control — use environment variables
- Set `spx.data_dir` permissions to 0700

### 3. Trigger On-Demand Profiling
- Via URL: `?SPX_KEY=secret&SPX_PROFILE=1`
- Via HTTP header: `X-SPX-Profile: 1`
- Profile is captured for that single request only — no continuous overhead
- Zero overhead on non-profiled requests

### 4. Interpret SPX Web UI Data
- Navigate to `http://app/SPX?SPX_KEY=secret`
- Call tree: functions sorted by inclusive/exclusive time — follow hot path
- Flame graph: wide frames indicate time sinks
- Flat profile: sorted by self time for direct optimization targets
- Memory timeline: memory allocation over the request duration

### 5. Manage Data Retention
- Each profile is ~10-50KB as flat file
- Set up cron job to delete profiles older than 30 days
- Monitor disk usage in `spx.data_dir`
- During active debugging: profiles accumulate faster — clean up after session

## Validation Checklist
- [ ] SPX extension installed (`php -m | grep spx`)
- [ ] HTTP key configured with strong random value
- [ ] Web UI restricted to localhost (firewall rule)
- [ ] SPX disabled in production (`spx.http_enabled=0`)
- [ ] Profile data directory with restricted permissions (0700)
- [ ] Data retention configured (cron cleanup)
- [ ] Triggered profiling works — profile generated and viewable in UI
- [ ] No SPX keys committed to version control

## Related Rules
- Always set `spx.http_key` (`05-rules.md:1`)
- Restrict SPX UI to localhost (`05-rules.md:26`)
- Disable in production by default (`05-rules.md:53`)
- Manage data retention (`05-rules.md:78`)
- Never commit HTTP key (`05-rules.md:104`)

## Related Skills
- Tideways Setup — Continuous Monitoring
- Blackfire Installation and Triggered Profiling
- Xdebug Profiling Setup and Analysis
- Flame Graph Generation and Interpretation

## Success Criteria
- SPX installed and secured with strong HTTP key
- UI restricted to localhost only
- On-demand profiling works with zero overhead on non-profiled requests
- Profiles interpreted via call tree, flame graph, and flat profile
- Data retention policy prevents disk accumulation
