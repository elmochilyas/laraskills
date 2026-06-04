# Skill: Orchestrate Zero-Downtime PHP Deployment with Load Balancer and OpCache Pre-Warming

## Purpose
Orchestrate zero-downtime PHP deployments combining load balancer drain (deregister, wait for in-flight requests), PHP-FPM graceful reload (SIGUSR2, zero dropped connections), OpCache pre-warming (hit all critical endpoints before re-enabling traffic), health checks verifying OpCache hit rate >95%, staggered warm-ups across the fleet (5-10s apart to prevent thundering herd), backward-compatible schema changes, and real-time monitoring during the deployment window — completing the full sequence in 30-120 seconds per server with zero user-facing impact.

## When To Use
- Production environments with multiple server instances behind a load balancer
- Services with strict uptime requirements (99.9%+)
- Automated CI/CD pipelines with staging/production deployments
- Any deployment where request dropping is unacceptable

## When NOT To Use
- Single-server deployments (no load balancer to orchestrate)
- Development/staging environments where brief downtime is acceptable
- Emergency patches requiring immediate fix

## Prerequisites
- Load balancer with connection draining support (AWS ALB, HAProxy, Nginx)
- Multiple PHP-FPM instances behind the load balancer
- Health check endpoint with OpCache hit rate reporting
- Automated deployment pipeline

## Inputs
- Server list with load balancer target group memberships
- Critical endpoint list for warm-up
- Health check endpoint URL
- Drain timeout (2x max request duration, typically 60-120s)

## Workflow

### 1. Drain from Load Balancer
- Signal load balancer to stop sending new connections to the instance
- Wait for all in-flight requests to complete (up to drain timeout)
- This is the FIRST step before any server modification
- Prevents 502 errors and connection resets for active users

### 2. Deploy Code
- Symlink swap: `ln -snf /app/releases/v2 /app/current`
- Never copy files in-place (prevents mixed-version file reads)
- Ensure release directory is fully populated before swap

### 3. Graceful PHP-FPM Reload
- `systemctl reload php8.x-fpm` or `kill -USR2 <master_pid>`
- Old workers drain current requests while new workers start
- Zero connections dropped — the listen socket remains open during reload

### 4. Warm OpCache
- Run comprehensive warm-up hitting all critical endpoints
- Each request populates OpCache for that endpoint's code path
- Without warm-up: first users experience 3-5s cold-start latency
- Verify OpCache hit rate >95% after warm-up

### 5. Health Check Passes
- Health endpoint returns 200 only when: PHP-FPM responding, OpCache hit rate >95%, DB responsive, listen queue = 0
- Load balancer keeps instance in draining until health check passes
- Never re-enable traffic without comprehensive health check

### 6. Rejoin Load Balancer
- Signal load balancer to resume sending traffic to the instance
- Move to the next server in the fleet and repeat
- At fleet level: one server drains while others serve traffic

### 7. Stagger Warm-Ups Across the Fleet
- Stagger warm-up start times by 5-10 seconds per instance
- Prevents thundering herd on databases and backend services
- All instances warm simultaneously = backend overload

### 8. Ensure Backward-Compatible Schema
- Schema changes must be additive (new columns, new tables)
- Deploy schema before code in separate pipeline stage
- Old workers must work with new schema during rolling deployments

### 9. Monitor During Deployment Window
- Track error rates, p95 latency, listen queue length
- Alert on deviation from baseline
- Trigger automated rollback on health check failure

## Validation Checklist
- [ ] Load balancer drain executed before any server modification
- [ ] Symlink swap used for atomic code deployment
- [ ] Graceful reload used (SIGUSR2, not SIGTERM)
- [ ] OpCache warmed before re-enabling traffic
- [ ] Health check verifies OpCache hit rate >95%
- [ ] Warm-ups staggered across fleet (5-10s apart)
- [ ] Schema changes backward-compatible and deployed before code
- [ ] Error rates and latency monitored during deployment
- [ ] Automated rollback configured on failure

## Related Rules
- Drain before touching PHP-FPM (`05-rules.md:5`)
- Warm OpCache before re-enabling traffic (`05-rules.md:33`)
- Health check with OpCache hit rate (`05-rules.md:71`)
- Stagger warm-ups (`05-rules.md:105`)
- Backward-compatible schema (`05-rules.md:143`)
- Monitor during deployment (`05-rules.md:171`)

## Related Skills
- PHP-FPM Graceful Reload Patterns
- OpCache Reset Strategies
- Blue-Green Deployment OpCache
- Containerized Deployment Cache Strategies

## Success Criteria
- Deployment completes with zero user-facing errors
- OpCache pre-warming prevents cold-start latency
- Health check verifies quality of service (OpCache hit rate >95%)
- Warm-ups staggered to prevent backend overload
- Schema changes backward-compatible for rolling deployment
- Error rates and latency monitored in real-time during deployment
- Automated rollback on health check failure
