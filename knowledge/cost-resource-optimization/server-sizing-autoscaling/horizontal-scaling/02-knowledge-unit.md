# KU-01-HORIZONTAL-SCALING: Horizontal Scaling

## Metadata
- **ID**: KU-01-HORIZONTAL-SCALING
- **Subdomain**: Server Sizing & Autoscaling
- **Topic**: Horizontal Scaling
- **Source**: Server Sizing & Autoscaling, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Horizontal scaling adds more server instances to handle increased load, as opposed to vertical scaling (bigger instances). For Laravel applications, horizontal scaling is the preferred approach: it provides better fault tolerance (survive instance failure), granular cost control (add/remove instances in small increments), and supports Auto Scaling. The key cost tradeoff: many small instances vs. fewer large instances. Many small instances are generally more cost-effective for web workloads due to better resource utilization and Spot diversification.

## Core Concepts
- **Horizontal scaling**: Add/remove instances; typically through Auto Scaling Groups
- **Stateless design**: Required for horizontal scaling; no local state (sessions in Redis, files in S3)
- **ALB distribution**: Application Load Balancer distributes traffic across instances
- **Instance granularity**: Small increments (t4g.medium) vs large increments (t4g.xlarge)
- **Scaling granularity**: Smaller instances = more granular scaling (less over-provisioning waste)
- **Fault tolerance**: N+1 instances survive 1 instance failure; 1 large instance = single point of failure
- **Connection pooling**: Many instances = many connections; RDS Proxy needed

## Mental Models
- Default: horizontal over vertical for stateless web tier
- Default: smaller instances (> granularity, < fault tolerance unit)
- Stateless design required: Redis for sessions, S3 for files

## Internal Mechanics
- Small instances (t4g.medium): 2 vCPUs, 4GB RAM; handles ~500 req/s for typical Laravel
- Medium instances (m7g.large): 2 vCPUs, 8GB RAM; handles ~1000 req/s
- ALB distribution overhead: <1ms per request (negligible)
- Connection pool pressure: More instances = more connections; use RDS Proxy
- Cold start: New instances need 2-5 minutes to reach full performance
- Warm instances: Keep min=2 for immediate capacity

## Patterns
- Design for statelessness from day 1
- Use smaller instances for better granularity
- Set target tracking on ALB RequestCountPerTarget
- Enable connection draining on ALB
- Use lifecycle hooks for warm-up
- Prefer many small over few large
- Monitor scale-in termination policy

## Architectural Decisions
- ASG: min=2 (multi-AZ), max=20 (cost cap)
- Instance: m7g.large or t4g.medium (2 vCPUs)
- ALB: Cross-zone load balancing enabled
- Health check: HTTP 200 on /health endpoint
- Connection drain: 60 seconds
- Warm-up: 120 second lifecycle hook
- Cooldown: 180s scale-out, 300s scale-in
- Termination policy: NewestInstance

## Tradeoffs
**When To Use:**
- Horizontal scaling: Stateless Laravel apps (most production apps); preferred over vertical scaling
- Auto Scaling: Variable traffic; scale out/in based on load metrics
- Multi-AZ: Distribute instances across AZs for high availability
- Spot instances: Mix Spot + On-Demand in the same group
- Stateless web tier: Laravel + Redis sessions + S3 files = fully horizontally scalable
- Queue workers: Always horizontal (by definition; each worker is a process)

**When NOT To Use:**
- Stateful workloads: Apps with local session storage, local file storage, or in-memory caches that don't survive scale-in
- Very small scale: 1-2 instances; vertical scaling may be simpler and similarly cost-effective
- Database tier: Databases are harder to scale horizontally (read replicas help, writes are bottleneck)
- Non-stateless Laravel apps: Running without Redis/S3 for sessions/files; horizontal scaling would lose data
- Minimum capacity 1 ASG: If you only need 1 instance, scaling may not be necessary (use vertical first)

## Performance Considerations
- Small instances (t4g.medium): 2 vCPUs, 4GB RAM; handles ~500 req/s for typical Laravel
- Medium instances (m7g.large): 2 vCPUs, 8GB RAM; handles ~1000 req/s
- ALB distribution overhead: <1ms per request (negligible)
- Connection pool pressure: More instances = more connections; use RDS Proxy
- Cold start: New instances need 2-5 minutes to reach full performance
- Warm instances: Keep min=2 for immediate capacity

## Production Considerations
- Instances in private subnets only (no public IPs)
- Security groups per instance role (web, worker, database)
- ALB terminates TLS; instances use HTTP (internal)
- Instance metadata service v2 (IMDSv2) enforced
- Instance identity documents for IAM role verification

## Common Mistakes
- **Stateful application design**: Storing sessions/files on local disk; horizontal scaling loses data (Cause: traditional PHP approach; Consequence: scale-in terminates users' sessions; Better: Redis for sessions, S3 for files (stateless))
- **One large instance instead of multiple small**: Single m7g.2xlarge covering all capacity (Cause: simpler management; Consequence: no fault tolerance, coarse scaling, harder Spot diversification; Better: 2-3 smaller instances for same total capacity)
- **No connection draining**: Scale-in terminates active requests (Cause: not configuring ALB connection drain; Consequence: users get 502 errors during scale-in; Better: 60-second connection drain)
- **Identical instances across all ASGs**: Web, worker, and batch ASGs all use same instance type (Cause: simple configuration; Consequence: web needs balanced (m7g), workers need compute (c7g), cache needs memory (r7g); Better: right-size per workload)

## Failure Modes
- **Monolithic scaling**: Whole app on one instance with no horizontal scaling capability
- **Identical ASG min/max**: min=5, max=5 means no actual scaling; defeats purpose
- **No lifecycle hooks**: Instances serve traffic before PHP is ready; 50x errors during scale-out
- **No ALB health checks**: Unhealthy instances continue receiving traffic

## Ecosystem Usage
- **Autoscaling web tier**: min=2 t4g.medium, max=10; target tracking on RequestCountPerTarget (5000); cooldown 180/300
- **Small scale**: 2 x m7g.large behind ALB; no auto-scaling needed (constant load)
- **Large scale**: 10 x m7g.large baseline; auto-scales to 30 with Spot mix; RDS Proxy for connection pooling

## Related Knowledge Units
- Vertical Scaling (ku-02)
- Predictive Autoscaling (ku-03)
- VM Sizing
- Auto Scaling Policies

## Research Notes
Derived from Server Sizing & Autoscaling, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.