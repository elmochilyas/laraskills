# Skill: Install and Configure Blackfire with Triggered Profiling and CI Assertions

## Purpose
Install the Blackfire probe and agent across PHP-FPM and CLI environments, configure triggered profiling with `X-Blackfire-Profile` headers, enforce performance budgets using Blackfire assertions in CI pipelines, and implement canary profiling patterns at the load balancer level — achieving 0% profiling overhead on non-profiled production traffic while catching regressions in CI.

## When To Use
- Production profiling with low overhead (triggered mode)
- CI/CD performance regression detection with automated assertions
- On-demand profiling of specific slow requests via HTTP header
- Canary profiling (0.1% of traffic) for continuous production visibility
- Before/after optimization validation with comparison views

## When NOT To Use
- Budget-constrained teams (Blackfire is paid subscription with free tier limitations)
- Air-gapped environments without Blackfire Enterprise
- Teams needing continuous always-on profiling (use Tideways for that)
- Environments where the probe cannot be installed (use eBPF instead)

## Prerequisites
- Blackfire subscription (client ID and client token)
- Root/sudo access on target servers for probe installation
- PHP-FPM or CLI environment

## Inputs
- Blackfire Client ID and Client Token
- Target endpoints for profiling
- Performance budget thresholds (wall_time, io_time, cpu_time)

## Workflow

### 1. Install Blackfire Probe and Agent
- Install the PHP extension: `apt install blackfire-php` or `pecl install blackfire`
- Install the agent: `apt install blackfire-agent` or Docker image `blackfire/agent`
- Verify probe: `php -m | grep blackfire`
- Verify agent: `systemctl status blackfire-agent`
- Restart PHP-FPM after probe installation

### 2. Configure Triggered Profiling
- Never enable always-on profiling in production
- Send `X-Blackfire-Profile: true` HTTP header to profile a specific request
- Profile only targeted endpoints — zero overhead for non-profiled traffic
- Verify: `curl -H "X-Blackfire-Profile: true" http://app/slow-endpoint` generates a visible profile

### 3. Implement Canary Profiling
- Inject `X-Blackfire-Profile: true` on 0.1% of production traffic at load balancer
- Use Lua/nginx random sampling or load balancer header injection
- Fleet-wide overhead: ~0.002-0.005% — negligible
- Provides continuous production profiling baseline

### 4. Add CI Assertions
- Use `blackfire run --assert="main.wall_time < 200ms"` in CI pipeline
- Assert on wall_time, io_time, cpu_time for critical commands/endpoints
- Pipeline exits with non-zero code on assertion failure
- Start with 2-3 critical assertions; relax thresholds as needed
- Valid for CLI commands (artisan commands, test suites)

### 5. Compare Before/After Profiles
- Profile before making changes to establish baseline
- Use Blackfire dashboard comparison view
- Verify optimization impact with same profiler mode
- Share comparison links in PR comments for team visibility

## Validation Checklist
- [ ] Probe installed and verified (`php -m | grep blackfire`)
- [ ] Agent running (`systemctl status blackfire-agent`)
- [ ] Triggered profiling working — profile generated via HTTP header
- [ ] CI assertions configured for critical endpoints/commands
- [ ] CI pipeline fails when performance budget is exceeded
- [ ] Canary profiling configured at load balancer (optional)
- [ ] Credentials stored in environment variables, not version control

## Related Rules
- Triggered profiling, never always-on (`05-rules.md:1`)
- Verify probe AND agent (`05-rules.md:24`)
- CI assertions for performance budgets (`05-rules.md:50`)
- Canary profiling at 0.1% (`05-rules.md:75`)
- Credentials in environment variables (`05-rules.md:107`)

## Related Skills
- Tideways Setup — Continuous Monitoring
- SPX Self-Hosted Profiling
- eBPF PHP Profiling
- Production Guardrails and Profiling Cost
- CI Integration and Baseline Comparison

## Success Criteria
- Blackfire probe and agent installed on all target environments
- Triggered profiling works — zero overhead on non-profiled requests
- CI pipeline enforces performance budgets with automated assertions
- Canary profiling provides continuous production baseline (optional)
- Before/after comparison validates optimization impact
- Credentials stored securely in environment variables
