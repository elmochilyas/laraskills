# Global Load Balancing — Rules

## R1: Always Start with Single Region + CloudFront — Never Multi-Region by Default

**Category**: Architecture Default

**Rule**: ALWAYS start with a single-region architecture behind CloudFront. NEVER deploy multi-region load balancing (Route53 latency routing, multiple regional stacks) before confirming the need.

**Reason**: CloudFront with a single-region origin covers 80%+ of global latency requirements. Edge caching delivers <30ms response time for cacheable content regardless of user location. Multi-region load balancing requires full infrastructure stacks in each region (ALB, ECS/EC2, RDS readers, Redis) — 2-5x infrastructure cost. Only add multi-region routing when CloudFront cache hit rates are <50% for dynamic content and sub-50ms response is required for non-cacheable requests.

**Bad Example**: A Laravel app with 20K MAU deploys to us-east-1, eu-west-1, and ap-southeast-1 with Route53 latency routing. Monthly infrastructure cost: $6,800. Analysis shows CloudFront would serve 90% of requests from edge with 20ms latency. Single-region + CloudFront cost: $3,300/month.

**Good Example**: The same app deploys to us-east-1 with CloudFront. Edge response: 15ms (cache hits), 80ms (origin fetch). After 12 months of growth (200K MAU), they add eu-west-1 with read replicas for dynamic request latency. Multi-region added only when data justifies it.

**Exceptions**: If your application is 100% real-time dynamic (WebSockets, streaming, real-time collaboration), CloudFront caching provides minimal benefit. Use Global Accelerator for TCP optimization or deploy multi-region from the start.

**Consequences Of Violation**: 2-5x infrastructure cost before proving the need. Multi-region complexity deployed when CloudFront alone is sufficient. Wasted engineering time on cross-region data sync, failover procedures, and multi-region monitoring.

---

## R2: Always Use Route53 Latency Routing for Multi-Region — Never Geolocation for Performance

**Category**: Routing Policy Selection

**Rule**: ALWAYS use Route53 latency-based routing for performance optimization across regions. AVOID geolocation routing for performance — reserve it for compliance (content restriction, data residency).

**Reason**: Latency-based routing automatically directs each user to the region with the lowest observed latency. As internet routing changes, latency-based routing adapts. Geolocation routing directs users based on their geographic location — not actual network performance. A user in Paris may get better performance from us-east-1 than eu-west-1 if their ISP has a direct fiber link; geolocation would incorrectly route them to eu-west-1. Latency-based costs $0.50/M queries (vs $0.70/M for geolocation) and provides better performance.

**Bad Example**: A global app uses geolocation routing: EU users → eu-west-1, US users → us-east-1, Asia users → ap-southeast-1. A user in Egypt is geolocated to eu-west-1 (180ms latency) when us-east-1 would serve them at 120ms. The user gets 50% worse performance because of the geolocation rule.

**Good Example**: The same app uses latency-based routing. The Egyptian user is routed to us-east-1 (120ms) — the lowest-latency region for their ISP. EU users who should go to eu-west-1 do so because latency is lowest. All users get optimal performance automatically.

**Exceptions**: Use geolocation routing when: (1) compliance requires EU user data to stay in EU regions (GDPR), (2) you serve different content per geography, (3) you need to block traffic from specific countries. Always pair geolocation with latency as a tiebreaker.

**Consequences Of Violation**: Users served from suboptimal regions due to static geographic mapping. Performance 30-50% worse than latency-based routing. Compliance concerns (geolocation used for performance instead of latency routing).

---

## R3: Always Use Health Checks on All Regional Endpoints — Never Route to Unhealthy Regions

**Category**: Reliability

**Rule**: ALWAYS configure Route53 health checks on every regional endpoint used in routing policies. NEVER rely on application-level health monitoring alone for DNS routing decisions.

**Reason**: Without health checks, Route53 continues routing traffic to a region experiencing an outage. Users receive errors while the secondary region sits idle. A Route53 health check ($0.50/month per check) monitors the ALB endpoint every 30 seconds. After 3 consecutive failures, Route53 automatically marks the endpoint unhealthy and stops routing traffic to it. Total detection time: ~90 seconds. Cost: $0.50/month per region — negligible for the reliability improvement.

**Bad Example**: A team configures latency-based routing to us-east-1 and eu-west-1 without health checks. us-east-1 has a region-level issue. Route53 continues routing 60% of traffic to us-east-1 (lowest latency for US users). Users in the US get errors for 30 minutes until the team manually fails over.

**Good Example**: Health checks monitor both regional ALBs. When us-east-1 health check fails (3 consecutive failures in 90 seconds), Route53 marks it unhealthy. All traffic routes to eu-west-1. Existing connections drain gracefully. failover in <2 minutes.

**Exceptions**: For single-region deployments (no multi-region), health checks on the ALB provide monitoring value but aren't needed for routing. For simple routing policies (single endpoint), health checks are optional but recommended.

**Consequences Of Violation**: Users receive errors during regional outages. DR infrastructure sits unused while primary region is down. Failover takes 10-30 minutes (manual DNS change + propagation) instead of 2 minutes.

---

## R4: Never Use Global Accelerator for Simple HTTP — CloudFront Is Cheaper and Better

**Category**: Service Selection

**Rule**: ALWAYS use CloudFront for HTTP/HTTPS global traffic acceleration. ONLY use Global Accelerator for non-HTTP protocols (TCP, UDP) or when static IP addresses are a hard requirement.

**Reason**: CloudFront provides CDN caching (reduces origin load), DDoS protection (AWS Shield Standard), Lambda@Edge, and custom SSL — all at $0.085/GB egress. Global Accelerator provides anycast IP routing with 2 static IPs — no caching, no CDN, no edge compute — at $0.025/hour ($18/month) + $0.005/GB processed. For the same HTTP workload, CloudFront is cheaper and provides more features.

**Bad Example**: A Laravel API uses Global Accelerator for "faster global access." Monthly cost: $18 (hourly) + $5/GB data processing + ALB egress costs. No caching — every request hits the origin. Total unexpected cost: $50-100/month more than CloudFront.

**Good Example**: The Laravel API uses CloudFront. Cacheable responses (API GETs, assets) served from edge at 10ms. Dynamic requests forwarded to ALB. Monthly cost: $0.085/GB × traffic volume. Same latency improvement as Global Accelerator for HTTP + caching benefit at lower cost.

**Exceptions**: Use Global Accelerator when: (1) you need static IP addresses for whitelisting (enterprise clients, bank integrations), (2) you're using non-HTTP protocols (gRPC, WebSocket, MQTT), (3) you need TCP optimization without HTTP caching (real-time data feeds that can't be cached).

**Consequences Of Violation**: Paying more for fewer features. Global Accelerator for HTTP adds $18/month + per-GB processing with no caching benefit — while CloudFront provides caching, edge compute, and similar latency at competitive pricing.

---

## R5: Use Appropriate DNS TTL — Never Use 1-Second TTL Everywhere

**Category**: DNS Configuration

**Rule**: ALWAYS use 60-second TTL for production failover configurations and 300-second TTL for stable endpoints. NEVER set 1-second TTL on all Route53 records "for fast failover."

**Reason**: TTL directly impacts DNS query volume and cost. A 1-second TTL means every DNS resolver re-queries Route53 for every record on every lookup for every client. At $0.40/M queries, this increases DNS costs by 300-500x vs 300-second TTL. A single server with 1-second TTL generates ~86,400 DNS queries/day ($0.035/day). With 10 servers: $0.35/day = $128/year. At 300-second TTL: ~$0.26/year. The failover speed difference (1s vs 60s) is irrelevant for 99% of applications.

**Bad Example**: All Route53 records have 1-second TTL "for maximum failover speed." 50 ELB-backed records. 20 servers making DNS queries constantly. Monthly Route53 cost: $45 (vs $0.50 with appropriate TTL). Failover still takes 30+ seconds (health check interval).

**Good Example**: Production records use 60-second TTL. Stable internal records use 300-second TTL. Development records use 600-second TTL. Monthly DNS cost: $0.50. Failover time: 60s (TTL) + 90s (health check detection) = 150 seconds — acceptable for 99% of apps.

**Exceptions**: Use 1-5 second TTL only if: (1) you need sub-10-second failover (real-time trading, emergency services), (2) you're running an active-active setup where quick traffic shifting is critical. In these cases, budget for the increased DNS cost ($50-200/month extra).

**Consequences Of Violation**: DNS costs 100-500x higher than necessary. Zero meaningful improvement in failover speed (health checks are the bottleneck, not DNS TTL). Wasting $500-2,000/year on unnecessarily short TTLs.

---

## R6: Use Weighted Routing for Canary Deployments — Never Cut Over All at Once

**Category**: Deployment Strategy

**Rule**: ALWAYS use Route53 weighted routing for gradual traffic migration between regions or deployments. NEVER switch 100% of traffic to a new region in a single DNS change.

**Reason**: Weighted routing allows incremental traffic shifting: 5%→10%→25%→50%→100% over hours or days. This enables monitoring of error rates, latency, and conversion before full cutover. A 100% switch risks exposing all users to issues simultaneously. Route53 weighted routing costs $0.40/M queries — negligible for the risk reduction.

**Bad Example**: A team migrates from us-east-1 to us-west-2 by updating the Route53 record overnight. At 2 AM, 100% of traffic goes to us-west-2. The new region's ALB is misconfigured — 50% of users get 502 errors. 30 minutes of downtime for 50% of users before rollback.

**Good Example**: The team configures weighted routing: 95% us-east-1, 5% us-west-2. After 24 hours of monitoring (no errors, latency 10ms better), they shift to 90/10, then 75/25, then 50/50, then 100/0 over 5 days. Issues are caught during 5% traffic — rollback is instant (reset weights).

**Exceptions**: For DR failover, use failover routing (not weighted) — the secondary region should receive 0% traffic during normal operation and 100% on failover. For blue/green deployments within the same region, use ALB target groups, not Route53 weighted routing.

**Consequences Of Violation**: Full traffic exposed to potential issues in a new region. Rollback requires manual DNS change + TTL propagation delay. Extended downtime during rollback. User-facing errors during misconfiguration.
