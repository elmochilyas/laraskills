# Cross-AZ and NAT Gateway Cost — Rules

## R1: Collocate Application and Database in the Same AZ

**Category**: AZ Architecture

**Rule**: ALWAYS deploy application servers and the primary database in the same Availability Zone for cost optimization. NEVER run database queries across AZ boundaries unnecessarily.

**Reason**: Cross-AZ data transfer costs $0.01/GB each direction ($0.02/GB round-trip). A Laravel app with 100 req/s and 5 database queries per request generates 500 cross-AZ calls per second. At 1KB per query result, that's ~43GB/day = ~$0.86/day = ~$26/month just for database query traffic. Over a year: $312. For chatty applications (10 queries per request), the cost is double. Same-AZ traffic between EC2 and RDS is free.

**Bad Example**: A team deploys web servers in us-east-1a and RDS in us-east-1b (different AZs by chance — ASG spreads across AZs, RDS was created in a different AZ). Average query: 5KB response. 500 req/s x 5 queries = 2500 queries/s. Daily cross-AZ data: 2500 x 5KB x 86,400 = ~1.08TB. Monthly cross-AZ cost: ~$324.

**Good Example**: The team deploys web servers in the same AZ as the RDS primary (all in us-east-1a). All database traffic is same-AZ = $0. Cross-AZ cost: $0. Savings: $324/month.

**Exceptions**: Multi-AZ HA deployments must have the RDS standby in a different AZ — this is acceptable. The standby is idle (no traffic) until failover. The primary traffic still goes to the primary (same-AZ).

**Consequences Of Violation**: Paying $100-500+/month in cross-AZ data transfer that provides zero reliability benefit. The data never leaves the AZ — it goes from one server to another a few feet away.

---

## R2: Use VPC Gateway Endpoints for S3 and DynamoDB — Free

**Category**: VPC Endpoints

**Rule**: ALWAYS use VPC Gateway Endpoints (free) for S3 and DynamoDB access from private subnets. NEVER send S3 or DynamoDB traffic through NAT Gateway.

**Reason**: VPC Gateway Endpoints for S3 and DynamoDB have no hourly charge and no per-GB data processing fee. NAT Gateway charges $0.045/hour (~$32/month) plus $0.045/GB for data processing. For an app storing 500GB/month to S3, NAT processing costs $22.50/month. The Gateway Endpoint routes traffic through the AWS backbone (not internet), reducing both cost and latency.

**Bad Example**: An application uploads 200GB/month of user files to S3. The traffic routes through NAT Gateway: 200GB x $0.045/GB = $9/month in data processing + $0.045/hour NAT hourly = $32/month. Total: $41/month for S3 access.

**Good Example**: VPC Gateway Endpoint for S3. No hourly charge, no per-GB fee. S3 traffic routes through AWS backbone. Cost: $0. Savings: $41/month.

**Exceptions**: For cross-region S3 access, Gateway Endpoints only work within the same region. Use Interface Endpoints or Direct Connect for cross-region S3.

**Consequences Of Violation**: Paying $0.045/GB for data that could be transferred for free. For data-heavy applications (user uploads, file processing, backups), this adds $50-500+/month in unnecessary NAT Gateway charges.

---

## R3: Use VPC Interface Endpoints for AWS Services — Cheaper Than NAT at Scale

**Category**: Data Processing

**Rule**: ALWAYS use VPC Interface Endpoints for high-volume AWS service traffic (SQS, SNS, ECR, CloudWatch, STS) when monthly processing exceeds 155GB/month per service. NEVER route high-volume AWS traffic through NAT Gateway.

**Reason**: VPC Interface Endpoints cost ~$7/month per endpoint (hourly charge) but eliminate NAT Gateway data processing fees ($0.045/GB). The breakeven point is ~155GB/month per service. Above that, the Interface Endpoint is cheaper. For services like ECR (large container image pulls) or SQS (high-volume message processing), the savings are substantial.

**Bad Example**: An ECS-based Laravel app pulls 500GB/month of container images from ECR through NAT Gateway. NAT processing: 500GB x $0.045/GB = $22.50/month + $32/month NAT hourly = $54.50/month. Plus slower downloads due to internet routing.

**Good Example**: VPC Interface Endpoint for ECR: $7/month flat. ECR traffic routes through AWS backbone (faster downloads, no internet). NAT processing eliminated. Total: $7/month. Savings: $47.50/month.

**Exceptions**: For low-volume services (<50GB/month per service), NAT Gateway may be cheaper than multiple Interface Endpoints ($7 each). Evaluate based on per-service volume.

**Consequences Of Violation**: Paying $0.045/GB for data that could be transferred for $7/month flat. For organizations using multiple AWS services at scale, NAT Gateway processing costs add $200-1,000+/month unnecessarily.

---

## R4: Minimize Cross-AZ Traffic — Place Frequently Communicating Services in Same AZ

**Category**: Service Placement

**Rule**: ALWAYS place services that communicate frequently (web → cache, web → queue, worker → database) in the same Availability Zone. NEVER distribute related services across AZs for non-availability reasons.

**Reason**: Every GB that crosses AZ boundaries costs $0.01 each way ($0.02 round-trip). For a microservice architecture where service A calls service B 10 times per request, and each call transfers 10KB of data, the monthly cross-AZ cost for 100 req/s is: 100 x 10 x 10KB x 86,400 x 30 = 2.59TB/month = $51.80/month. This is pure waste — there is no reliability benefit because the services co-location does not affect fault tolerance.

**Bad Example**: Web service in AZ-a, Redis cache in AZ-b, database in AZ-c. Each request: web reads cache (cross-AZ), web queries database (cross-AZ). Monthly cross-AZ data: 800GB at $0.02/GB = $16/month. Latency: +2-3ms per query.

**Good Example**: All services in AZ-a: web, Redis, RDS. Zero cross-AZ traffic cost. Latency: <1ms between services. If AZ-a goes down, service goes down (acceptable — multi-AZ adds significant cost for services that run in a single region).

**Exceptions**: For production HA, deploy a second copy of each service in AZ-b with Route53 failover. The primary traffic remains same-AZ; failover traffic briefly crosses AZ during the switch.

**Consequences Of Violation**: Unnecessary $50-300/month in cross-AZ data transfer costs. Service latency increases by 1-5ms due to AZ distance, compounding across chained service calls.

---

## R5: Monitor NAT Gateway BytesProcessed with Budget Alarm

**Category**: Cost Visibility

**Rule**: ALWAYS monitor NAT Gateway `BytesProcessed` metric with a CloudWatch alarm set to a cost-based threshold. NEVER manage NAT Gateway cost without active monitoring.

**Reason**: NAT Gateway data processing costs are variable and can spike unexpectedly. A misconfigured application (e.g., logging to CloudWatch through NAT instead of VPC Endpoint) or a deployment script that downloads large files can increase NAT processing 10x overnight. Without monitoring, the first indication is the monthly bill. A budget alarm catches the anomaly within hours.

**Bad Example**: A team's NAT Gateway processes 200GB/month normally. A CI/CD pipeline misconfiguration causes all deployment artifacts to be downloaded through NAT instead of directly from S3. NAT processing spikes to 1.5TB/month. Additional cost: 1,300GB x $0.045 = $58.50. The team discovers this 3 weeks later on the AWS invoice.

**Good Example**: CloudWatch alarm on NAT Gateway `BytesProcessed` with threshold set at $50/month equivalent (calculated from BytesProcessed rate). The alarm fires within 1 day of the CI/CD misconfiguration. The team investigates, finds the issue, and fixes it within 2 hours. Additional cost: $3.00.

**Exceptions**: For very small deployments with <50GB/month NAT traffic, the cost risk is low — set a simple price-based alarm at $50/month.

**Consequences Of Violation**: Unexpected NAT Gateway charges accumulate for days or weeks before discovery. A single misconfiguration can add $100-500+ to the monthly bill in data processing fees.
