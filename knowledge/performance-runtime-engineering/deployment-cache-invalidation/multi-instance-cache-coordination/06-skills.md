# Skill: Coordinate OpCache Invalidation Across Multiple Instances with Staggered Warm-Up

## Purpose
Coordinate OpCache invalidation across horizontally scaled PHP-FPM fleet using cachetool with `--all` flag or per-host iteration, enable sticky sessions on the load balancer for rolling deployments, warm and health-check each instance independently (verifying OpCache hit rate >95%), stagger warm-ups by 5-10 seconds to prevent thundering herd on backends, and monitor per-instance hit rate post-deployment — ensuring every instance serves fresh code without fleet-wide CPU spikes.

## When To Use
- Multi-server PHP-FPM deployments behind a load balancer
- Autoscaling groups where instances are added/removed dynamically
- Rolling deployment strategies across a fleet
- Any horizontally scaled PHP application

## When NOT To Use
- Single-server deployments (no coordination needed)
- Blue-green deployments with atomic environment cutover
- Containerized deployments with pre-warmed file cache in image

## Prerequisites
- Load balancer with sticky session support
- cachetool installed on all instances
- Health check endpoint with OpCache status
- List of all instances in the fleet

## Inputs
- Instance hostnames or IPs
- OpCache hit rate threshold (>95%)
- Warm-up endpoint list
- Stagger interval (5-10s)

## Workflow

### 1. Configure Sticky Sessions on Load Balancer
- Enable `ip_hash` or cookie-based session affinity
- Ensures user requests consistently hit the same code version during rolling deployment
- Prevents inconsistent behavior from bouncing between old and new instances

### 2. Invalidate OpCache on Every Instance
- Use `cachetool opcache:reset --all` to target all configured hosts
- Or iterate per-host: `for host in web1 web2 web3; do cachetool opcache:reset --web --web-path=http://$host/opcache.php; done`
- Never invalidate only a subset of instances
- OpCache is per-machine — each instance must be invalidated independently

### 3. Stagger Invalidation and Warm-Up
- Never invalidate all instances simultaneously (fleet-wide CPU spike)
- Stagger by 5-10 seconds per instance
- Sequence: invalidate instance 1, warm, health check; then instance 2; then instance 3
- During rollout, 1/N instances are new while others serve traffic normally

### 4. Warm and Health-Check Each Instance Independently
- For each instance: run warm-up hitting all critical endpoints
- Verify OpCache hit rate >95% before declaring the instance ready
- Check health endpoint: PHP-FPM responding, DB connectivity, listen queue = 0
- Only after warm + health check passes, move to the next instance

### 5. Monitor Per-Instance OpCache Hit Rate
- Track hit rate as per-instance metric during and after deployment
- Low hit rate on a specific instance = warm-up failure or memory exhaustion
- Trigger targeted warm-up or alert if any instance drops below threshold
- Confirm all instances settle at >99% hit rate after deployment

### 6. Use SSH-Based cachetool When HTTP Endpoint is Restricted
- If OpCache reset web endpoint is not accessible (firewall), use SSH mode
- `cachetool opcache:reset --ssh --user=deploy --host=web1`
- Never expose the OpCache reset endpoint to the public internet

## Validation Checklist
- [ ] Sticky sessions enabled on load balancer
- [ ] All instances invalidated explicitly (no instance missed)
- [ ] Invalidation staggered by 5-10s per instance
- [ ] Each instance warmed and health-checked independently
- [ ] OpCache hit rate >95% confirmed per instance
- [ ] Per-instance hit rate monitored post-deployment
- [ ] SSH-based cachetool configured for restricted environments

## Related Rules
- Invalidate every instance explicitly (`05-rules.md:5`)
- Sticky sessions for rolling deployments (`05-rules.md:35`)
- Warm and check each instance independently (`05-rules.md:68`)
- Never invalidate all simultaneously (`05-rules.md:101`)
- SSH-based cachetool for restricted envs (`05-rules.md:130`)
- Monitor per-instance hit rate (`05-rules.md:156`)

## Related Skills
- CI/CD Cache Invalidation Steps
- Zero-Downtime Deployment OpCache
- Blue-Green Deployment OpCache
- OpCache Reset Strategies

## Success Criteria
- All instances invalidated and warmed with no stale-code serving
- Sticky sessions prevent mixed-version user experience
- Staggered warm-up avoids fleet-wide CPU spikes and thundering herd
- Per-instance monitoring detects warm-up failures immediately
- SSH-based invalidation available when HTTP endpoints are restricted
