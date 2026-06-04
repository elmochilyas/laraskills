# Region Data Affinity — Rules

## R1: Deploy Application and Database in the Same AZ

**Category**: AZ Affinity

**Rule**: ALWAYS deploy application servers (EC2/Fargate) in the same Availability Zone as the primary database and cache (RDS/Aurora/ElastiCache). NEVER let ASG default behavior (spreading across AZs) place web servers in a different AZ than the database.

**Reason**: Cross-AZ data transfer costs $0.01/GB each direction. An app with 100 req/s and 10 database queries per request generates 1000 cross-AZ calls/s. At 5KB average response = ~430GB/month cross-AZ traffic = ~$8.60/month. Over a year: $103. Plus cache calls (Redis, Elasticache) at the same rate. Latency penalty: 1-5ms per query. Placing servers in the same AZ eliminates both cost and latency with no architecture change.

**Bad Example**: An Auto Scaling group launches instances across 3 AZs. RDS primary is in us-east-1a. 33% of traffic is same-AZ (free), 67% is cross-AZ ($0.02/GB round-trip). Monthly cross-AZ data transfer: 300GB x $0.02 = $6/month. Plus 200GB from cache calls = $4/month. Total: $10/month. Simple fix saves $120/year with zero effort.

**Good Example**: All web servers launch in us-east-1a (same AZ as RDS primary). ASG configured with single-AZ (or AZ rebalancing disabled). All database and cache traffic is same-AZ. Cost: $0. Latency: <1ms.

**Exceptions**: For production HA, maintain multi-AZ for failover capability. In this case, accept the cross-AZ cost or use Route53 latency routing to direct primary traffic to the same AZ as the primary database.

**Consequences Of Violation**: Paying $50-300+/year in unnecessary cross-AZ data transfer. Adding 1-5ms latency to every database and cache query — compounding across chained operations.

---

## R2: Use VPC Endpoints Instead of NAT Gateway for AWS Service Access

**Category**: Connectivity

**Rule**: ALWAYS use VPC Gateway Endpoints (free) for S3/DynamoDB and VPC Interface Endpoints for other AWS services (SQS, SNS, ECR, CloudWatch). NEVER route AWS service traffic through NAT Gateway.

**Reason**: NAT Gateway charges $0.045/hour ($32/month) + $0.045/GB for data processing. VPC Gateway Endpoints for S3/DynamoDB are completely free (no hourly, no per-GB). VPC Interface Endpoints cost ~$7/month per service but eliminate NAT processing fees. For an app using S3 (200GB/month), SQS (50GB/month), and ECR (100GB/month), NAT processing would cost $15.75/month + $32/month hourly = $47.75/month. VPC endpoints: $7 (SQS) + $7 (ECR) + $0 (S3 Gateway) = $14/month.

**Bad Example**: A private subnet Laravel app routes all outbound traffic through NAT Gateway — S3 uploads, SQS messages, ECR pulls, CloudWatch logs. Total monthly NAT data processing: 400GB x $0.045 = $18/month. NAT hourly: $32/month. Total: $50/month. All traffic goes to AWS services that have free or low-cost VPC endpoint alternatives.

**Good Example**: S3 Gateway Endpoint (free), SQS Interface Endpoint ($7/month), ECR Interface Endpoint ($7/month), CloudWatch Interface Endpoint ($7/month). NAT Gateway eliminated (no internet-bound traffic). Total: $21/month. Savings: $29/month ($348/year).

**Exceptions**: For internet-bound traffic (third-party API calls, external webhooks), NAT Gateway is still needed. The VPC endpoints cover AWS service traffic only.

**Consequences Of Violation**: Paying $0.045/GB for data that could be transferred for free or $7/month flat. Annual waste of $300-1,200+ for AWS-heavy application traffic.

---

## R3: Place Cache and Database in Same AZ as Web Servers

**Category**: Service Collocation

**Rule**: ALWAYS deploy Redis ElastiCache and RDS in the same Availability Zone as the web tier. NEVER create infrastructure where the web tier, cache, and database span multiple AZs for non-HA reasons.

**Reason**: Each cache call (1-5 per request) and database query (1-10 per request) that crosses AZ boundaries pays $0.01/GB each way. For a 500 req/s application with 3 cache hits + 5 DB queries per request = 4000 cross-AZ calls/s. At 2KB average = ~691GB/month = ~$13.82/month just in cross-AZ round-trips. Collocating in a single AZ eliminates this entirely. The latency improvement (1-5ms saved per query) also reduces page load times.

**Bad Example**: Web servers in us-east-1a, ElastiCache in us-east-1b, RDS in us-east-1c. Every request pays cross-AZ for both cache reads and database queries. Monthly cross-AZ cost: ~$20/month. Average query latency: 4ms (vs 1ms same-AZ).

**Good Example**: All web servers, ElastiCache, and RDS primary in us-east-1a. Multi-AZ standby RDS in us-east-1b (no traffic until failover). All production traffic is same-AZ. Cost: $0. Query latency: 0.5-1ms.

**Exceptions**: High-availability architectures must have cache replicas and database standby in different AZs. The key rule is: all primary (read/write) traffic stays in one AZ. Only cross-AZ traffic is for replication and failover.

**Consequences Of Violation**: Unnecessary cross-AZ data transfer costs for every request. Latency penalties compound across cache + database calls, degrading user experience. A "10ms" page load hits 50ms due to cascading cross-AZ latency.

---

## R4: Configure RDS Proxy in Same AZ as Application

**Category**: Proxy Placement

**Rule**: ALWAYS deploy RDS Proxy in the same Availability Zone as the application servers that connect through it. NEVER deploy RDS Proxy in a different AZ than the application.

**Reason**: RDS Proxy sits between the application and the database. If the proxy is in a different AZ than the application, you pay cross-AZ data transfer twice: application → proxy (cross-AZ) + proxy → database (potentially cross-AZ). If the proxy is in the same AZ as the application, the application → proxy traffic is same-AZ (free). The proxy → database traffic is based on the proxy's placement.

**Bad Example**: Application in us-east-1a, RDS Proxy in us-east-1b. Application connects to proxy cross-AZ ($0.01/GB). Proxy connects to database in us-east-1a (cross-AZ, $0.01/GB). Double cross-AZ charges: $0.02/GB round-trip through proxy. 500 req/s x 10KB = 5MB/s = ~$259/month in double cross-AZ charges.

**Good Example**: Application and RDS Proxy both in us-east-1a. Application → proxy: same-AZ (free). Proxy → database: same-AZ (free). Total cross-AZ cost: $0. Monthly savings: $259.

**Exceptions**: For multi-AZ deployments, each AZ should have its own RDS Proxy instance. Configure the application to connect to the proxy in its own AZ (via separate endpoint per AZ or Route53 latency routing).

**Consequences Of Violation**: Paying double cross-AZ charges for proxy-mediated database connections. The proxy, which was deployed to improve reliability, adds $100-300/month in unnecessary data transfer costs.

---

## R5: Monitor Cross-AZ/Region DataTransfer in Cost Explorer

**Category**: Cost Visibility

**Rule**: ALWAYS monitor `DataTransfer` cost categories in AWS Cost Explorer with a dedicated budget. Track cross-AZ and cross-region charges monthly. AVOID managing multi-AZ cost without per-AZ data transfer visibility.

**Reason**: Data transfer costs are the most overlooked expense in multi-AZ architectures. They do not appear in per-instance billing — they accumulate as `DataTransfer-Out-Bytes` and `DataTransfer-Regional-Bytes` across the entire AWS bill. Without dedicated cost allocation tagging and monitoring, cross-AZ costs hide in the infrastructure total. A monthly review of per-AZ data transfer identifies placement issues that cost $50-500/month.

**Bad Example**: A team receives a $10,000/month AWS bill. They break it down by service: EC2, RDS, ElastiCache, DataTransfer. DataTransfer is $800/month — largest single line item after EC2. They cannot explain which services or AZs drive this. They know they have a cross-AZ cost problem but cannot target the fix.

**Good Example**: The team uses Cost Categories and tags to track DataTransfer per AZ pair. Cost Explorer shows: us-east-1a → us-east-1b data transfer = 800GB/month ($16). us-east-1a → us-east-1c = 200GB/month ($4). Web servers in 1a, RDS in 1b. They move RDS to 1a. Next month: DataTransfer drops to $50/month. Savings: $750/month.

**Exceptions**: For single-AZ deployments, DataTransfer costs are minimal (<$20/month). Begin detailed monitoring when cross-AZ costs exceed $50/month.

**Consequences Of Violation**: Cross-AZ costs silently grow to $200-1,000+/month without attribution. The team knows "networking costs are high" but cannot fix the root cause without per-AZ visibility.
