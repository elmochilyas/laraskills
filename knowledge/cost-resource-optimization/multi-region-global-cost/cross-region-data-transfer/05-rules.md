# Cross-Region Data Transfer — Rules

## R1: Always Use CloudFront Before Multi-Region — Never Route Cross-Region Traffic Directly

**Category**: Global Architecture

**Rule**: ALWAYS deploy CloudFront as the primary global entry point before routing any cross-region traffic. NEVER serve global users directly from a multi-region origin without CloudFront in front.

**Reason**: CloudFront caches content at 400+ edge locations. Cache hit rates of 80-95% mean only 5-20% of requests reach the origin region. CloudFront-to-origin data transfer is free for AWS origins, eliminating 80-95% of cross-region data transfer costs. Direct multi-region traffic (without CloudFront) means every request crosses a region boundary, paying $0.02-0.09/GB for all traffic.

**Bad Example**: A Laravel app deploys primary in us-east-1 and serves EU users directly to us-east-1. Each request: 100ms latency + $0.02/GB egress from us-east-1. 10TB/month egress: $200. EU users get 150ms latency.

**Good Example**: CloudFront in front of us-east-1 origin. Cache hit rate: 90%. Origin traffic: 1TB/month. CloudFront egress: $0.085/GB × 10TB = $85. EU users get 20ms latency from edge. Savings: $115/month + better performance.

**Exceptions**: If 100% of traffic is dynamic, personalized, or real-time (cacheable for 0% of requests), CloudFront only adds DNS overhead. In this case, use CloudFront with low TTL (0 seconds) for DDoS protection OR use Global Accelerator for TCP optimization.

**Consequences Of Violation**: Paying full cross-region data transfer rates ($0.02-0.09/GB) for traffic that could be served from edge caches at $0.085/GB. 5-10x higher data transfer costs than necessary.

---

## R2: Always Compress Data Before Cross-Region Transfer — Never Send Uncompressed

**Category**: Transfer Optimization

**Rule**: ALWAYS enable Gzip or Brotli compression on all cross-region data transfers. NEVER send uncompressed text data (JSON, XML, logs) across region boundaries.

**Reason**: Gzip reduces text-based data volume by 60-90%. At $0.02/GB cross-region transfer, compression reduces effective cost to $0.002-0.008/GB. Compression CPU overhead is negligible (<1ms per request on modern instances) compared to the network cost savings. For database replication, compressed WAL or binlog transfer can reduce replication traffic by 50-70%.

**Bad Example**: A Laravel app replicates 500GB/month of uncompressed JSON logs cross-region for central log aggregation. Transfer cost: 500GB × $0.02 = $10/month. With Gzip (70% compression), the same data is 150GB. Transfer cost: $3/month.

**Good Example**: All cross-region S3 CRR rules have compression enabled. Database replication uses native compression. API responses between regional deployments use Content-Encoding: gzip. Estimated savings: 60-70% on cross-region transfer costs.

**Exceptions**: Binary data that is already compressed (images, video, archives) should not be re-compressed — it wastes CPU and may increase size. Media files should use format-specific optimization (WebP for images, H.265 for video) at the source.

**Consequences Of Violation**: Paying 3-5x more for cross-region data transfer than necessary. A 500GB/month uncompressed transfer at $10/month becomes $30-50/month at scale. For petabyte-scale transfers, the waste reaches thousands per month.

---

## R3: Use Selective Replication — Never Replicate Everything to All Regions

**Category**: Data Strategy

**Rule**: ALWAYS replicate only business-critical data across regions. AVOID replicating entire databases or all S3 buckets to every region.

**Reason**: Cross-region data transfer costs scale linearly with data volume. Most applications have data that is region-specific (session data, localized content) and doesn't need global replication. Selective replication (specific tables, specific S3 prefixes, specific DynamoDB tables) reduces cross-region transfer by 70-90%. S3 CRR allows prefix-level filtering; Aurora Global Database replicates at the database level (all or nothing).

**Bad Example**: S3 CRR configured to replicate all buckets from us-east-1 to eu-west-1. 1TB/month replicated — $20/month. Analysis shows 85% of that data (user uploads, regional assets) is only accessed from us-east-1 and never from EU.

**Good Example**: S3 CRR rules configured with prefix filters: only replicate the "global-assets/" and "shared-config/" prefixes. 150GB/month replicated — $3/month. User uploads stay in source region; API reads them cross-region only when requested (rare). Savings: $17/month (85% reduction).

**Exceptions**: Aurora Global Database does not support selective table replication — it replicates the entire database. If selective replication is required, use application-level sync or DMS for specific tables. For compliance (GDPR), you may need to replicate all data to specific regions.

**Consequences Of Violation**: Paying 10x the necessary data transfer costs. Replicating petabytes of regional data (user uploads, local logs, temp files) that will never be read in the destination region. Storage costs also double/triple for replicated data.

---

## R4: Monitor Per-Region Transfer Costs — Never Ignore Region Pair Pricing Differences

**Category**: Cost Monitoring

**Rule**: ALWAYS monitor cross-region data transfer costs per region pair in AWS Cost Explorer. NEVER assume all region pairs have the same pricing.

**Reason**: Cross-region data transfer pricing varies 4-5x between region pairs: $0.01/GB between adjacent US regions vs $0.09/GB between US and South America. Choosing a DR region without checking transfer pricing can multiply transfer costs by 5x. Cost Explorer provides per-region-pair breakdown using the "Region" and "Source Region" filters.

**Bad Example**: A team chooses sa-east-1 (Sao Paulo) as DR region for geographic diversity from us-east-1. Data transfer: $0.09/GB × 500GB/month = $45/month. They could have chosen us-west-2 (Oregon) for similar geographic diversity at $0.02/GB × 500GB = $10/month. Waste: $35/month ($420/year).

**Good Example**: Before choosing DR region, the team compares transfer costs: (1) us-east-1 → us-west-2 = $0.02/GB, (2) us-east-1 → eu-west-1 = $0.02/GB, (3) us-east-1 → sa-east-1 = $0.09/GB. They choose eu-west-1 for DR, balancing geographic diversity ($0.02/GB), compliance (GDPR), and latency.

**Exceptions**: If compliance mandates a specific high-cost region (e.g., Brazil's LGPD requires sa-east-1), the premium is unavoidable. In this case, minimize transfer volume through compression and selective replication.

**Consequences Of Violation**: Unknowingly paying 4-5x for data transfer by choosing expensive region pairs. Monthly transfer costs 5x higher than necessary without realizing the pricing difference exists.

---

## R5: Aggregate Small Writes at Source — Never Transfer Inefficiently

**Category**: Write Pattern Optimization

**Rule**: ALWAYS batch small data writes into larger payloads before cross-region transfer. NEVER send individual small records across region boundaries.

**Reason**: Cross-region data transfer costs are based on data volume, not request count — but each small write incurs protocol overhead, TLS handshake overhead, and per-request processing. Batching 100 small records (1KB each) into one payload (100KB) reduces TCP overhead by 99% and can reduce transferred bytes by 30-50% (headers, framing). For database replication, transaction log grouping achieves similar savings.

**Bad Example**: A logging pipeline sends 1 million 500-byte log entries per hour cross-region, each as an individual HTTP POST. Data volume: 500MB/hour + TCP headers (66 bytes each = 66MB) = 566MB/hour. Monthly: 407GB = $8.14/month. CPU overhead: significant per-request processing.

**Good Example**: The logging pipeline batches 1,000 entries per request (500KB payloads). 1,000 requests/hour instead of 1M. Data volume: 500MB/hour + TCP headers (1,000 × 66 bytes = 66KB) = 500MB/hour. Monthly: 360GB = $7.20/month (12% savings). Plus: 99.9% reduction in HTTP request processing overhead.

**Exceptions**: Real-time data streams (alerts, metrics) that must be delivered within 1 second can't wait for batch accumulation. For these, use a streaming service (Kinesis, SQS) that handles batching internally.

**Consequences Of Violation**: 30-50% higher transfer costs from protocol overhead. Significant CPU waste on per-request processing. Rate limiting or throttling at scale due to excessive API requests.

---

## R6: Use AWS Backbone for Cross-Region — Never Route Over Public Internet

**Category**: Network Path Selection

**Rule**: ALWAYS use AWS services (Aurora Global Database, S3 CRR, DMS) for cross-region data transfer to keep traffic on the AWS backbone. NEVER route cross-region data over the public internet.

**Reason**: AWS backbone traffic is encrypted by default, stays within AWS controlled network, and has no additional per-GB charge for the backbone path (you still pay the cross-region data transfer rate). Public internet routing adds variable latency (50-200ms more), exposes data to ISP routing, and has no SLA. AWS services that use the backbone include Aurora Global Database replication, S3 CRR, DynamoDB Global Tables, and RDS cross-region replicas.

**Bad Example**: A Laravel app manually `curl`s data from us-east-1 EC2 to eu-west-1 EC2 over the public internet for cross-region sync. Latency: 150ms (vs 70ms on backbone). Data traverses public ISPs. No encryption guarantee without explicit TLS configuration.

**Good Example**: The app uses S3 CRR (backbone) for file replication and Aurora Global Database (storage-layer replication on backbone) for database sync. Both stay on AWS network, are encrypted by default, and have predictable latency of 70ms.

**Exceptions**: If no AWS managed service provides the required cross-region capability (e.g., custom application-level sync), use VPC peering or Transit Gateway with inter-region peering — both keep traffic on the AWS backbone without internet transit.

**Consequences Of Violation**: Variable latency and throughput due to internet routing. Security risk of data traversing public infrastructure. No SLA for data delivery timing. Potential compliance violations if data crosses geographic boundaries without controls.
