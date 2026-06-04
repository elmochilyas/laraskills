# Data Transfer Costs — Rules

## R1: Always Deploy App and Database in the Same AZ — Never Pay Cross-AZ Transfer

**Category**: Deployment Topology

**Rule**: ALWAYS deploy application servers (EC2/Fargate) in the same Availability Zone as the primary database (RDS/Aurora). NEVER place app and database in different AZs unless required for high availability.

**Reason**: Cross-AZ data transfer costs $0.01/GB each way. For a Laravel app with 100 requests/second and 10 queries per request, that's 1,000 cross-AZ database calls per second. At ~2KB per query response, this generates 2MB/s cross-AZ traffic = ~$260/month in wasted data transfer. The same deployment in one AZ costs $0 for data transfer. Multi-AZ for high availability is justified, but the active app+DB should be co-located in the same AZ.

**Bad Example**: A Laravel app deploys 3 EC2 instances in us-east-1a and RDS in us-east-1b "for high availability." The database serves 500 queries/second across AZs. Monthly cross-AZ data transfer: $200/month. The app has no Multi-AZ failover configured — the cross-AZ deployment provides zero HA benefit.

**Good Example**: The team deploys EC2 instances and RDS in the same AZ (us-east-1a). Cross-AZ data transfer: $0. For high availability, they enable Multi-AZ on RDS (standby in us-east-1b, automatic failover) and deploy ASG with instances in two AZs — but the primary app+DB pair is always in the same AZ.

**Exceptions**: If you need Multi-AZ deployment for high availability AND the application is latency-sensitive, the active-standby cross-AZ cost is acceptable. Use cluster endpoint connections and minimize cross-AZ queries to reduce the impact.

**Consequences Of Violation**: $100-500/month in avoidable cross-AZ data transfer. Zero high availability benefit if the cross-AZ configuration doesn't include actual Multi-AZ failover.

---

## R2: Always Use VPC Endpoints Over NAT Gateway for AWS Services

**Category**: Network Egress Path

**Rule**: ALWAYS use VPC Gateway Endpoints (S3, DynamoDB) and VPC Interface Endpoints (SQS, SNS, Lambda, etc.) for AWS service access. NEVER route AWS service traffic through a NAT Gateway.

**Reason**: NAT Gateway charges $0.045/hour ($32.40/month) + $0.045/GB for data processing. VPC Gateway Endpoints are free (no hourly charge, no per-GB charge). VPC Interface Endpoints cost ~$7/month each (hourly charge) plus $0.01/GB for data processed — still cheaper than NAT Gateway for moderate traffic. For 500GB/month of SQS traffic: NAT Gateway = $22.50/month + hourly; VPC Interface Endpoint = $7/month flat.

**Bad Example**: A Laravel app uses a NAT Gateway for all outbound traffic — including SQS queue access, SNS notifications, and DynamoDB queries. Monthly NAT Gateway cost: $32.40 (hourly) + $22.50 (500GB data processing) = $54.90/month.

**Good Example**: S3 and DynamoDB use Gateway Endpoints (free). SQS, SNS, and Lambda use Interface Endpoints ($7/month each × 3 = $21/month). NAT Gateway is removed — only needed for internet access (if any). Savings: $33.90/month. At scale (multiples of this traffic), savings reach $500+/month.

**Exceptions**: NAT Gateway is still required for: (1) internet access from private subnets (e.g., package downloads, external API calls), (2) Elastic Beanstalk environments that don't support VPC endpoints natively, (3) IPv6-only subnets.

**Consequences Of Violation**: Paying $0.045/GB for data that could be free (S3/DynamoDB) or $0.01/GB (SQS/SNS). Monthly NAT Gateway bill 2-5x higher than necessary. Scaling up traffic means linearly scaling NAT Gateway costs.

---

## R3: Always Minimize Cross-Region Writes — Never Use Synchronous Calls

**Category**: Cross-Region Communication

**Rule**: ALWAYS use asynchronous, batched cross-region data replication. NEVER perform synchronous writes across region boundaries in the request path.

**Reason**: Synchronous cross-region writes add 50-200ms latency per call (round-trip). At $0.02-0.09/GB, each API call adds data transfer cost. For a Laravel app processing 100 cross-region writes/second, this means 100ms extra latency + ~$500/month in data transfer. Async replication batches writes, compresses data, and eliminates user-facing latency impact. Event-driven architectures (SQS, EventBridge, SNS) handle this naturally.

**Bad Example**: A Laravel app in eu-west-1 writes to a database in us-east-1 synchronously on every user registration. Each registration takes 120ms (20ms local + 100ms cross-region write). At 10 registrations/second: 900ms of cross-region write latency per request. Monthly transfer: ~$80/month.

**Good Example**: The app writes to a local database in eu-west-1 immediately (20ms). A background queue worker replicates the registration data to us-east-1 asynchronously (batched, compressed, 1-second delay). User sees 20ms response time. Cross-region transfer: batched writes reduce volume by 60% (batch overhead) = $32/month.

**Exceptions**: If your application requires strongly consistent cross-region reads (user registers in EU, immediately reads in US with same data), you need synchronous replication. In this case, use Aurora Global Database write forwarding (synchronous, database-managed) rather than application-level synchronous calls.

**Consequences Of Violation**: 50-200ms added latency on every user-facing request that requires a write. Poor user experience for global applications. Data transfer costs 2-3x higher than necessary.

---

## R4: Always Use CloudFront for Global Egress — Never Serve Directly from EC2/ALB

**Category**: Content Delivery

**Rule**: ALWAYS serve global users through CloudFront. NEVER expose EC2 or ALB endpoints directly to users outside the origin region.

**Reason**: CloudFront egress pricing ($0.085/GB) is comparable to or cheaper than EC2 egress ($0.05-0.09/GB) for most regions — and includes CDN benefits: edge caching (80-95% cache hit rate), DDoS protection (AWS Shield Standard), HTTP/2, custom SSL, and origin offload. For global user bases, CloudFront also eliminates cross-region data transfer: CloudFront-to-origin transfer is free for AWS origins.

**Bad Example**: A Laravel API serves global users directly from an ALB in us-east-1. 10TB/month egress: $0.09/GB × 10TB = $900/month. Users in Asia get 200ms latency. No caching, no DDoS protection, no edge compute (Lambda@Edge).

**Good Example**: CloudFront in front of the same ALB. 10TB/month: CloudFront egress $0.085/GB × 10TB = $850/month + free origin transfer. 90% cache hit rate means 9TB served from edge (10ms latency), 1TB from origin (still in us-east-1). Users in Asia get 20ms latency. Savings: $50/month + DDoS protection included.

**Exceptions**: If your application requires WebSocket connections (persistent, bidirectional), CloudFront doesn't support WebSocket behind the CDN — use Global Accelerator or ALB directly. If all users are in the same region as the origin, direct ALB access is simpler and avoids CloudFront DNS overhead.

**Consequences Of Violation**: Higher latency for global users (200ms vs 20ms). Paying full EC2 egress rates when CloudFront offers similar pricing with CDN benefits. No edge caching means every request hits the origin, increasing infrastructure load.

---

## R5: Monitor DataTransfer in Cost Explorer Monthly — Never Let It Surprise You

**Category**: Cost Monitoring

**Rule**: ALWAYS set a Cost Explorer budget for the DataTransfer service and review it monthly. NEVER go more than 30 days without reviewing data transfer costs.

**Reason**: Data transfer is often the fastest-growing and most overlooked cost in AWS. A misconfigured cross-region replication, a DDoS attack causing high egress, or an application bug causing excessive API calls can double data transfer costs within days. Monthly review catches these anomalies early. Set a Cost Anomaly Detection alert specifically for DataTransfer with a threshold of $100/month or 20% increase week-over-week.

**Bad Example**: A team's data transfer costs grow from $200/month to $800/month over 3 months. They don't notice because they review only compute and storage costs. Investigation reveals: a cross-region replication job was misconfigured to replicate 5TB/month instead of 500GB. Waste: $600/month × 3 months = $1,800.

**Good Example**: The team sets a Cost Explorer budget of $300/month for DataTransfer with an alert at 80% ($240). In month 3, they receive an alert: data transfer at $280. Investigation within 48 hours reveals the misconfigured replication job. Fix applied. Savings: $500/month going forward.

**Exceptions**: For teams spending <$50/month on data transfer, weekly monitoring is overkill. Set a monthly calendar reminder to review DataTransfer costs and check for anomalies — a 5-minute review is sufficient.

**Consequences Of Violation**: Unchecked data transfer costs can silently grow to dominate the infrastructure bill. Monthly bills 2-5x higher than expected. Difficulty identifying which service or configuration change caused the increase.

---

## R6: Keep Regional Data Local — Never Share Cache or Session Across Regions

**Category**: Architecture Design

**Rule**: ALWAYS deploy independent local caches (Redis, ElastiCache) and session storage per region. NEVER implement cross-region cache or session sharing.

**Reason**: Cross-region cache synchronization adds significant data transfer cost and latency. Every cache write requires a round-trip to the primary region. For a Laravel app with frequent cache updates (session state, rate limits, cache tags), this can generate terabytes of cross-region traffic. Multi-region Redis replication (Global Datastore) costs $0.15/GB for data transfer plus extra compute. Local caches have zero cross-region cost and sub-millisecond latency.

**Bad Example**: A multi-region Laravel app uses a single ElastiCache Redis cluster in us-east-1. EU users make API calls, which read/write cache in us-east-1 — 100ms latency per cache operation. Monthly cross-region transfer for cache sync: $150/month.

**Good Example**: Each region has an independent ElastiCache Redis cluster. EU region uses eu-west-1 Redis (<1ms latency). US region uses us-east-1 Redis. No cross-region cache traffic. Cost: $0 cross-region transfer. If a user's session needs to be available globally, use a database-backed session (DynamoDB) with cross-region replication (Global Tables).

**Exceptions**: If your application requires a globally distributed lock or rate limiter, use DynamoDB Global Tables or a purpose-built service — not cross-region cache sync. If you need cross-region cache invalidation, use SNS or EventBridge to send invalidation events (event-driven, not data-sync).

**Consequences Of Violation**: 100-200ms added latency per cache operation. Significant cross-region data transfer costs ($100-500/month). Cache sync complexity adds operational burden. Session sharing across regions complicates failover and regional isolation.
