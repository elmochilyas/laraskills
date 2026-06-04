# Horizontal Scaling

## Metadata
- **ID**: KU-01-HORIZONTAL-SCALING
- **Subdomain**: server-sizing-autoscaling
- **Domain**: cost-resource-optimization
- **Topic**: Horizontal Scaling
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Horizontal scaling adds more server instances to handle increased load, as opposed to vertical scaling (bigger instances). For Laravel applications, horizontal scaling is the preferred approach: it provides better fault tolerance (survive instance failure), granular cost control (add/remove instances in small increments), and supports Auto Scaling. The key cost tradeoff: many small instances vs. fewer large instances. Many small instances are generally more cost-effective for web workloads due to better resource utilization and Spot diversification.

## Core Concepts
- **Horizontal scaling**: Add/remove instances; typically through Auto Scaling Groups
- **Stateless design**: Required for horizontal scaling; no local state (sessions in Redis, files in S3)
- **ALB distribution**: Application Load Balancer distributes traffic across instances
- **Instance granularity**: Small increments (t4g.medium) vs large increments (t4g.xlarge)
- **Scaling granularity**: Smaller instances = more granular scaling (less over-provisioning waste)
- **Fault tolerance**: N+1 instances survive 1 instance failure; 1 large instance = single point of failure
- **Connection pooling**: Many instances = many connections; RDS Proxy needed

## When To Use
- Horizontal scaling: Stateless Laravel apps (most production apps); preferred over vertical scaling
- Auto Scaling: Variable traffic; scale out/in based on load metrics
- Multi-AZ: Distribute instances across AZs for high availability
- Spot instances: Mix Spot + On-Demand in the same group
- Stateless web tier: Laravel + Redis sessions + S3 files = fully horizontally scalable
- Queue workers: Always horizontal (by definition; each worker is a process)

## When NOT To Use
- Stateful workloads: Apps with local session storage, local file storage, or in-memory caches that don't survive scale-in
- Very small scale: 1-2 instances; vertical scaling may be simpler and similarly cost-effective
- Database tier: Databases are harder to scale horizontally (read replicas help, writes are bottleneck)
- Non-stateless Laravel apps: Running without Redis/S3 for sessions/files; horizontal scaling would lose data
- Minimum capacity 1 ASG: If you only need 1 instance, scaling may not be necessary (use vertical first)

## Best Practices
- **Design for statelessness from day 1**: Sessions in Redis, files in S3, cache in ElastiCache (WHY: horizontal scaling requires any instance to handle any request; local state prevents this; stateless design enables instant scaling, fault tolerance, and zero-downtime deploys)
- **Use smaller instances for better granularity**: 3 x t4g.medium ($60/month total) vs 1 x t4g.xlarge ($55/month) (WHY: 3 small instances cost approximately the same as 1 large, but provide: (a) fault tolerance (survive 1 instance failure), (b) granular scaling (add/remove 1/3rd capacity), (c) better Spot diversification)
- **Set target tracking on ALB RequestCountPerTarget**: Maintain 3000-5000 requests/minute per instance (WHY: request count is the most direct measure of load; CPU may spike from non-traffic work; request count aligns scaling with actual user demand)
- **Enable connection draining on ALB**: 30-120 second drain time (WHY: prevents dropping in-flight requests during scale-in; existing requests complete before instance is deregistered; users don't see 502 errors)
- **Use lifecycle hooks for warm-up**: Register instance only after warm-up completes (WHY: PHP-FPM/Octane boot takes 5-60 seconds; serving traffic before ready causes errors; lifecycle hook holds registration until health check passes)
- **Prefer many small over few large**: For the same total capacity, more smaller instances are usually better (WHY: better capacity granularity (add 20% at a time vs 50%), better fault tolerance (lose 1 of 5 vs 1 of 2), easier Spot diversification)
- **Monitor scale-in termination policy**: Use "Newest Instance" termination for ASG (WHY: newest instances have least accumulated cache/connections; terminating them has minimal impact vs terminating an instance with warm cache)

## Architecture Guidelines
- ASG: min=2 (multi-AZ), max=20 (cost cap)
- Instance: m7g.large or t4g.medium (2 vCPUs)
- ALB: Cross-zone load balancing enabled
- Health check: HTTP 200 on /health endpoint
- Connection drain: 60 seconds
- Warm-up: 120 second lifecycle hook
- Cooldown: 180s scale-out, 300s scale-in
- Termination policy: NewestInstance

## Performance Considerations
- Small instances (t4g.medium): 2 vCPUs, 4GB RAM; handles ~500 req/s for typical Laravel
- Medium instances (m7g.large): 2 vCPUs, 8GB RAM; handles ~1000 req/s
- ALB distribution overhead: <1ms per request (negligible)
- Connection pool pressure: More instances = more connections; use RDS Proxy
- Cold start: New instances need 2-5 minutes to reach full performance
- Warm instances: Keep min=2 for immediate capacity

## Security Considerations
- Instances in private subnets only (no public IPs)
- Security groups per instance role (web, worker, database)
- ALB terminates TLS; instances use HTTP (internal)
- Instance metadata service v2 (IMDSv2) enforced
- Instance identity documents for IAM role verification

## Common Mistakes
1. **Stateful application design**: Storing sessions/files on local disk; horizontal scaling loses data (Cause: traditional PHP approach; Consequence: scale-in terminates users' sessions; Better: Redis for sessions, S3 for files (stateless))
2. **One large instance instead of multiple small**: Single m7g.2xlarge covering all capacity (Cause: simpler management; Consequence: no fault tolerance, coarse scaling, harder Spot diversification; Better: 2-3 smaller instances for same total capacity)
3. **No connection draining**: Scale-in terminates active requests (Cause: not configuring ALB connection drain; Consequence: users get 502 errors during scale-in; Better: 60-second connection drain)
4. **Identical instances across all ASGs**: Web, worker, and batch ASGs all use same instance type (Cause: simple configuration; Consequence: web needs balanced (m7g), workers need compute (c7g), cache needs memory (r7g); Better: right-size per workload)

## Anti-Patterns
- **Monolithic scaling**: Whole app on one instance with no horizontal scaling capability
- **Identical ASG min/max**: min=5, max=5 means no actual scaling; defeats purpose
- **No lifecycle hooks**: Instances serve traffic before PHP is ready; 50x errors during scale-out
- **No ALB health checks**: Unhealthy instances continue receiving traffic

## Examples
- **Autoscaling web tier**: min=2 t4g.medium, max=10; target tracking on RequestCountPerTarget (5000); cooldown 180/300
- **Small scale**: 2 x m7g.large behind ALB; no auto-scaling needed (constant load)
- **Large scale**: 10 x m7g.large baseline; auto-scales to 30 with Spot mix; RDS Proxy for connection pooling

## Related Topics
- Vertical Scaling (ku-02)
- Predictive Autoscaling (ku-03)
- VM Sizing
- Auto Scaling Policies

## AI Agent Notes
- Default: horizontal over vertical for stateless web tier
- Default: smaller instances (> granularity, < fault tolerance unit)
- Stateless design required: Redis for sessions, S3 for files

## Verification
- [ ] Stateless application design (Redis sessions, S3 files)
- [ ] Auto Scaling Group configured (min >= 2 for multi-AZ)
- [ ] ALB with connection drain (60s)
- [ ] Lifecycle hooks for instance warm-up
- [ ] Smaller instances preferred over fewer large ones
- [ ] Target tracking on RequestCountPerTarget
- [ ] No stateful dependencies on local instance storage
