# Route 53 Routing Costs — Rules

## R1: Choose Routing Policy by Functional Need — Never by DNS Query Cost

**Category**: Policy Selection

**Rule**: ALWAYS choose the Route53 routing policy that best meets your functional requirements (latency, compliance, failover, traffic distribution). NEVER select a routing policy based on DNS query cost differences.

**Reason**: Route53 DNS costs are negligible compared to data transfer and compute costs. The difference between simple routing ($0.40/M queries) and geolocation routing ($0.70/M queries) at 10M queries/month is $3/month. At 100M queries/month: $30/month. The performance and reliability benefits of the correct routing policy (latency-based routing improving conversion by 7% per 100ms, failover routing preventing downtime) far outweigh the $3-30/month query cost difference.

**Bad Example**: A team chooses basic routing ($0.40/M) over latency-based ($0.50/M) for a global app "to save money." Users in Asia get 250ms latency (routed to us-east-1). At 500K monthly visits, the 200ms extra latency costs 14% conversion (7% per 100ms) — $70,000/month in lost revenue. DNS savings: $5/month (at 5M queries).

**Good Example**: The same team uses latency-based routing ($0.50/M). Users routed to nearest region (us-east-1, eu-west-1, ap-southeast-1). Latency: 20-50ms. Conversion optimal. DNS cost: $2.50/month extra. Investment: $2.50/month. ROI from conversion: $70,000/month.

**Exceptions**: For single-region deployments with no multi-region routing needs, use simple routing ($0.40/M) — no benefit from more expensive policies. For apps with <100K queries/month, the cost difference is <$0.01/month — functionally zero.

**Consequences Of Violation**: Suboptimal user experience from incorrect routing policy. Lost revenue from poor performance. Failover failures from missing health checks. All to save $1-5/month on DNS.

---

## R2: Always Use Alias Records for AWS Resources — Never Pay for CNAME or A Records

**Category**: Record Type Optimization

**Rule**: ALWAYS use Route53 alias records when pointing to AWS resources (CloudFront, ELB, S3, API Gateway). NEVER use standard CNAME or A records for AWS endpoints.

**Reason**: Alias records are free — there is no per-query charge for alias record resolutions. Standard A and CNAME records cost $0.40/M queries. For a CloudFront distribution receiving 10M DNS queries/month: alias = $0; standard A record = $4/month. At 1B queries/month: alias = $0; standard = $400/month. Alias records also support root domain (zone apex) mapping — CNAME does not (requires A record alias or Route53 specific handling).

**Bad Example**: A Route53 record points to a CloudFront distribution using a CNAME. 20M queries/month: $8/month in DNS query costs. The CNAME can't be used for the root domain (example.com) — requires a separate A record alias.

**Good Example**: Same CloudFront distribution uses an alias record (A record alias to CloudFront). 20M queries/month: $0. The alias works for both root domain (example.com) and subdomains (www.example.com). Savings: $8/month.

**Exceptions**: Non-AWS endpoints (on-premises servers, external CDNs, third-party services) cannot use alias records — use standard records for these. Alias records are only for AWS resources: CloudFront, ELB, S3 website buckets, API Gateway, Elastic Beanstalk, and other Route53 records.

**Consequences Of Violation**: Paying $4-400/month for DNS queries that should be free. Inability to use root domain (example.com) without workarounds. $48-4,800/year in unnecessary DNS costs.

---

## R3: Health Check the ALB, Not Individual Instances — Never Proliferate Health Checks

**Category**: Health Check Strategy

**Rule**: ALWAYS configure Route53 health checks on the load balancer (ALB/ELB) endpoint — not on individual backend instances. NEVER create per-instance health checks.

**Reason**: Each Route53 health check costs $0.50/month. An ALB health check covers all instances behind the load balancer. For an ASG with 20 instances: 1 ALB health check = $0.50/month vs 20 instance health checks = $10/month. The ALB already performs instance health checks internally — Route53 checking the ALB adds the same failure detection capability at 1/20th the cost.

**Bad Example**: A team creates individual Route53 health checks for each of 50 EC2 instances behind an ALB. 50 health checks × $0.50 = $25/month. When instances scale up or down (ASG), health checks must be added/removed manually or via scripting.

**Good Example**: A single Route53 health check targets the ALB DNS name. $0.50/month. Instance health is managed by ALB target group health checks (included in ALB pricing). When ASG scales, no Route53 health check changes needed. Savings: $24.50/month.

**Exceptions**: If you need region-level health checking (multi-region failover), health check the ALB endpoint per region — still one per region, not per instance. If you need to route traffic away from specific instances (not behind ALB, e.g., direct EC2 endpoints), per-instance health checks are necessary but rare.

**Consequences Of Violation**: $0.50/instance/month for health checks that duplicate ALB functionality. $100-500/month waste for large fleets. Operational overhead of managing health checks when ASG scales.

---

## R4: Use 60-Second TTL for Production — Never Default to 300-Second Without Consideration

**Category**: TTL Configuration

**Rule**: ALWAYS use 60-second TTL for production DNS records that require failover capability. NEVER assume 300-second TTL is "safe" without considering failover speed requirements.

**Reason**: DNS TTL directly impacts failover speed: a 60-second TTL means DNS resolvers re-query within 60 seconds after the previous TTL expired, enabling failover in <2 minutes (60s TTL + 30s health check interval × 3 failures = 150s). A 300-second TTL means failover takes 5+ minutes. The cost difference: 60s TTL generates 5x more DNS queries than 300s TTL, but at $0.40/M queries, the difference on 10M queries/month is $0.80/month (60s adds ~$0.80 vs 300s). This $0.80/month cost is trivial compared to the revenue impact of 3 extra minutes of downtime.

**Bad Example**: Production DNS records use 300-second TTL "to reduce DNS costs." A primary region fails. Failover takes: 300s (TTL propagation) + 90s (health check failover) = 390 seconds (6.5 minutes). During this time, users get errors. Revenue impact: $50K+ for an e-commerce app during peak hours. DNS cost savings: $0.80/month vs 60s TTL.

**Good Example**: Production records use 60-second TTL. Primary region fails. Failover takes: 60s (TTL) + 90s (health check) = 150 seconds (2.5 minutes). 4 minutes faster than 300s TTL. DNS cost: $0.80/month more than 300s. ROI: $0.80/month for 4-minute faster failover.

**Exceptions**: Use 300+ second TTL for: (1) stable internal records (internal load balancers, database endpoints — no failover expected), (2) static endpoints that don't change (S3 website buckets), (3) non-critical records where 5-minute failover is acceptable. Use shorter TTL (5-30s) only if sub-minute failover is required.

**Consequences Of Violation**: 3-5 minute longer failover times due to DNS caching. $5K-500K+ in revenue lost during extended outage windows. All to save <$1/month on DNS queries.

---

## R5: Consolidate Hosted Zones — Never Pay for Unnecessary Zones

**Category**: Zone Management

**Rule**: ALWAYS consolidate DNS records into fewer hosted zones. AVOID creating separate hosted zones for each subdomain or service.

**Reason**: Each hosted zone costs $0.50/month. 10 zones = $5/month; 100 zones = $50/month. More importantly, managing DNS across many zones increases complexity: cross-zone record references require full DNS names, IAM permissions must be managed per zone, and auditing is more difficult. Consolidate related subdomains into the same zone: app.example.com, api.example.com, admin.example.com in one zone instead of separate zones for each.

**Bad Example**: A team creates separate hosted zones for: example.com, app.example.com, api.example.com, admin.example.com, cdn.example.com, and staging.example.com. 6 zones × $0.50 = $3/month. Each zone requires separate NS records, IAM policies, and monitoring. Adding a new subdomain requires creating a new zone, delegating NS, and updating records.

**Good Example**: A single hosted zone for example.com contains all records: app.example.com (A alias to ALB), api.example.com (A alias to ALB), admin.example.com (A alias to ALB), cdn.example.com (CNAME to CloudFront). 1 zone × $0.50 = $0.50/month. Adding a new service: just add a record. No IAM per-zone management needed.

**Exceptions**: Create separate hosted zones when: (1) different teams manage different subdomains (devops owns api.example.com, marketing owns www.example.com), (2) DNS records must be isolated for compliance (PCI-scoped subdomain), (3) you need different DNSSEC signing per subdomain.

**Consequences Of Violation**: $0.50/zone/month adding up for many zones ($30-600/year for typical over-splitting). Operational complexity from managing many zones. Increased risk of DNS misconfiguration from zone sprawl.

---

## R6: Never Use Traffic Flow for Simple Setups — $50/Month Is Rarely Justified

**Category**: Traffic Flow Usage

**Rule**: ALWAYS use basic routing policies (latency, failover, weighted) for multi-region routing. AVOID Route53 Traffic Flow ($50/month per policy) unless you have complex routing requirements that basic policies cannot satisfy.

**Reason**: Traffic Flow costs $50/month per policy and provides a visual editor for complex routing rules (multiple records with conditional logic, failover ordering). For 95% of multi-region setups, basic routing policies handle the need: latency-based routing + health checks for global performance, failover routing for active-passive DR, weighted routing for canary deployments. Traffic Flow only adds value when you need 5+ records with complex interdependencies — nearly nonexistent for typical Laravel applications.

**Bad Example**: A Laravel app with 2 regions (us-east-1 primary, eu-west-1 DR) uses Traffic Flow ($50/month) to configure failover routing. The same setup using basic failover routing: $0 (no Traffic Flow cost). The visual editor provides no benefit for a 2-record failover setup. Waste: $600/year.

**Good Example**: The same 2-region setup uses basic failover routing (free). Records: primary ALB (failover primary) + secondary ALB (failover secondary) + health check. Total Route53 cost: $0.50 (zone) + $0.50 (health check) = $1/month vs $50.50/month with Traffic Flow.

**Exceptions**: Use Traffic Flow when: (1) you have 5+ routing records with complex failover ordering (region A → B → C with different health check thresholds per region), (2) you need version-controlled routing policies with rollback capability, (3) non-technical stakeholders need to visualize routing topology.

**Consequences Of Violation**: Paying $600/year for a feature that provides no benefit for simple multi-region setups. More complex DNS configuration than necessary (Traffic Flow policies are harder to audit and debug than basic records).
