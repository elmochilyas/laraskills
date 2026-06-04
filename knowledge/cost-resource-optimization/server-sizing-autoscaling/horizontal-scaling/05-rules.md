# Horizontal Scaling — Rules

## R1: Design for Statelessness from Day 1

**Category**: Application Architecture

**Rule**: ALWAYS design Laravel applications for stateless operation: sessions in Redis, files in S3, cache in ElastiCache. NEVER rely on local instance storage for sessions, files, or cache.

**Reason**: Horizontal scaling requires any instance to handle any request — this is only possible when no state is stored locally. Storing sessions in files (`storage/framework/sessions`) means instance A's user gets errors if routed to instance B. Storing uploaded files locally means scaling in a server loses user uploads. Stateless design is the foundational requirement for horizontal scaling; without it, you cannot scale out at all.

**Bad Example**: A Laravel app stores sessions in the default file driver (`SESSION_DRIVER=file`) and uploads to `storage/app/public`. After adding a second server behind an ALB, users are randomly logged out (session on server A but request goes to server B) and uploaded files appear/disappear depending on which server handles the request.

**Good Example**: `SESSION_DRIVER=redis` (ElastiCache), `FILESYSTEM_DISK=s3` (user uploads), `CACHE_STORE=redis`. Any instance can serve any request. Adding the 3rd instance was a config change, not an architecture overhaul.

**Exceptions**: For single-server applications (<500 req/s, no HA requirement), local storage is acceptable — you don't need horizontal scaling yet. But planning for it from day 1 prevents a painful migration later.

**Consequences Of Violation**: Horizontal scaling is impossible. The application is stuck on a single server or requires a full architecture rewrite to scale beyond one instance. Scaling up (vertical) becomes the only option, with its cost and capacity limits.

---

## R2: Use Multiple Smaller Instances Instead of Few Large Ones

**Category**: Instance Granularity

**Rule**: ALWAYS prefer multiple smaller instances (e.g., 3 x t4g.medium) over fewer large ones (e.g., 1 x t4g.xlarge) for the same total capacity. AVOID using large instances for web tier scaling.

**Reason**: Three small instances cost approximately the same as one large but provide: (1) fault tolerance — survive 1 instance failure (66% capacity) vs 0% for a single large, (2) granular scaling — add/remove 33% capacity at a time vs 100%, (3) better Spot diversification — spread across instance types. The per-instance overhead (OS, monitoring agent) is marginally higher with more instances but the operational benefits far outweigh the <5% overhead difference.

**Bad Example**: A team runs 2 x m7g.xlarge instances ($260/month total). Traffic increases by 20%. They must add 1 more m7g.xlarge ($130/month) — a 50% capacity increase for 20% more traffic. They over-provision by 30%.

**Good Example**: The team runs 4 x m7g.large instances ($260/month total). Traffic increases by 20%. They add 1 more m7g.large ($65/month) — a 25% capacity increase. Closer to actual demand. Over-provisioning: 5%. When traffic drops, they can scale in one instance (25% reduction) vs 50% with the xlarge approach.

**Exceptions**: For stateful workloads (databases, cache nodes) where vertical scaling is the primary method, fewer large instances are appropriate. For stateless web/worker tiers, always prefer many small.

**Consequences Of Violation**: Coarse capacity increments force either over-provisioning (wasting cost) or under-provisioning (degrading performance). Single large instance = single point of failure.

---

## R3: Set Target Tracking on ALB RequestCountPerTarget

**Category**: Scaling Metric

**Rule**: ALWAYS configure target tracking scaling based on `ALBRequestCountPerTarget`. NEVER use CPU utilization as the primary scaling metric for web tier.

**Reason**: Request count per target directly measures user-facing load — it's the metric that matters. CPU utilization can spike from background processes (queue workers on web servers, cron jobs, cache warming) or stay low under high traffic if the app is I/O-bound. Scaling on CPU causes false positives (scale-out for background jobs) and false negatives (no scale-out for I/O-heavy traffic). Request count per target aligns scaling with actual user demand.

**Bad Example**: Target tracking on CPU utilization at 60%. A Laravel app's CPU stays at 30% under load because the app is I/O-bound (waiting on database queries). Traffic increases 3x but CPU doesn't cross 60%. No scale-out occurs. Users experience 5-second page loads from database queueing. The ASG never reacts.

**Good Example**: Target tracking on ALBRequestCountPerTarget at 5000 requests/min. Traffic increases 3x, request count per target rises from 2000 to 6000. ASG scales out immediately. Capacity matches demand. Users see consistent sub-500ms response times.

**Exceptions**: For compute-bound internal services (video encoding, image processing) where request count does not correlate with load, use CPU-based scaling. For web-facing Laravel apps, always use request count.

**Consequences Of Violation**: Scaling behavior does not match real user demand. Under high traffic, the ASG may not scale out because CPU is low (app is I/O-bound) or may scale out unnecessarily because CPU is high (background job).

---

## R4: Enable Connection Draining on ALB (60 Seconds)

**Category**: Graceful Scale-In

**Rule**: ALWAYS configure ALB connection draining (deregistration delay) to at least 60 seconds. NEVER terminate instances with in-flight requests.

**Reason**: When an instance is terminated during scale-in, active requests are dropped — users see 502 errors, lose form submissions, or experience failed API calls. Connection draining tells the ALB to stop sending new requests to the terminating instance while allowing existing requests to complete (up to the drain timeout). A 60-second drain handles most request completion times (Laravel APIs typically respond in 100-500ms).

**Bad Example**: Connection draining = 0 seconds (disabled). ASG scales in from 6 to 4 instances. Two instances are terminated immediately. Each has 5 active requests. 10 users see 502 errors. 2 users lose form submissions they were completing.

**Good Example**: Connection draining = 60 seconds. ASG scales in from 6 to 4 instances. ALB marks 2 instances as "draining" — no new requests are sent. Existing requests complete within 500ms. After 60 seconds (or when all requests complete), instances are terminated. Zero user-facing errors.

**Exceptions**: For WebSocket connections (Laravel Reverb) or long-polling, increase connection draining to 300+ seconds. For very short-lived requests (<100ms), 30 seconds may be sufficient.

**Consequences Of Violation**: Users experience errors during scale-in events. The cost savings from scaling in (fewer instances) are offset by the cost of user frustration and support tickets.

---

## R5: Use Lifecycle Hooks for Instance Warm-Up

**Category**: Graceful Scale-Out

**Rule**: ALWAYS configure Auto Scaling lifecycle hooks to delay instance registration until warm-up completes (120-300 seconds). NEVER let instances serve traffic before they are ready.

**Reason**: A new EC2 instance must boot the OS, start PHP-FPM/Octane, warm OpCache, pre-load config, and pass health checks before it can serve traffic. Without lifecycle hooks, the instance registers with the ALB immediately — traffic arrives before the application is ready, causing 502 errors. Lifecycle hooks pause the instance at "Pending:Wait" until warm-up completes, then signal `complete-lifecycle-action`.

**Bad Example**: A Laravel Octane app scales out during a traffic spike. New instances launch and register with the ALB within 60 seconds, but Octane takes 90 seconds to fully warm up. For 30 seconds, new instances receive traffic but return errors. 300 requests fail during the gap.

**Good Example**: Lifecycle hook pauses new instances at Pending:Wait for 120 seconds. During this time: OS boots (30s), Octane starts (15s), cache warms (30s), health check passes (5s). After 80 seconds, the instance signals completion and registers with ALB. Zero errors during scale-out. Traffic is routed to fully-ready instances.

**Exceptions**: For Fargate containers with <30 second boot times, reduce lifecycle hook to 30-60 seconds. For apps with small cache sets (<100MB), reduce to 60-90 seconds.

**Consequences Of Violation**: New instances serve traffic before they are ready, causing error spikes during scale-out events — the exact times when error-free operation is most critical.
