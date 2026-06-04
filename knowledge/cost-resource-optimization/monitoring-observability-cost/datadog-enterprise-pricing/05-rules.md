# Datadog Enterprise Pricing — Rules

## R1: Consolidate Containers onto Fewer Hosts to Minimize Per-Host Costs

**Category**: Host Optimization

**Rule**: ALWAYS consolidate containerized workloads (Fargate tasks, ECS containers) onto fewer EC2 hosts before deploying Datadog. NEVER run containers in a way that maximizes the number of billable hosts.

**Reason**: Datadog charges per host, not per vCPU or container. Each Fargate task or ECS container is counted as a separate "host" for billing purposes. 50 Fargate tasks running individually cost $900/month for infrastructure monitoring alone. Consolidating those 50 tasks onto 5 EC2 instances reduces the billable host count to 5 ($90/month) — a 90% reduction. This is the single largest cost lever for containerized environments.

**Bad Example**: A Laravel app runs 30 Fargate tasks (10 web, 10 worker, 10 cron) + 10 standalone ECS containers = 40 billable hosts. Datadog infrastructure monitoring: 40 x $18 = $720/month. APM on all: 40 x $31 = $1,240/month. Total before logs: $1,960/month.

**Good Example**: The team consolidates to 5 EC2 m7g.xlarge instances running all containers. Billable hosts: 5. Infrastructure: $90/month. APM: $155/month. Total before logs: $245/month. Savings: $1,715/month (87%). Same workloads, dramatically lower Datadog cost.

**Exceptions**: If high-availability requirements mandate spreading containers across many hosts, use the minimum number of hosts per AZ that meets the SLA. Consider alternative monitoring for container-heavy deployments.

**Consequences Of Violation**: Paying Datadog per-container pricing can make monitoring 5-10x more expensive than the compute it monitors. A $500/month Fargate bill may generate $2,000/month in Datadog charges.

---

## R2: Use Tag-Based Exclusion Filters Before Log Ingestion

**Category**: Log Volume Control

**Rule**: ALWAYS configure Datadog log exclusion filters based on tags (service, environment, status) to drop low-value logs before ingestion. NEVER ingest all logs from all services.

**Reason**: Datadog charges $0.10/GB for log ingestion. Non-production environments, health check endpoints, and DEBUG-level logs generate 60-80% of log volume but provide minimal debugging value. Tag-based exclusion filters drop these logs at the agent level before they reach Datadog's ingestion pipeline, reducing log costs proportionally without affecting production error visibility.

**Bad Example**: A team sends all logs from all environments (prod, staging, dev, CI) to Datadog. Monthly log volume: 200GB at $0.10/GB = $600/month. Staging and dev generate 120GB (60%) of this volume — these environments are rarely debugged via Datadog.

**Good Example**: Exclusion filter: Drop all logs from `env:staging`, `env:dev`, and `env:ci`. Drop all DEBUG logs. Drop health check endpoint logs from production. Monthly log volume: 50GB at $0.10/GB = $150/month. Production errors and warnings are still 100% captured. Savings: $450/month.

**Exceptions**: During active debugging of a staging issue, temporarily disable the staging exclusion filter. Re-enable after the investigation.

**Consequences Of Violation**: Paying $0.10/GB for logs that are never queried. A 200GB/month log bill could be 50GB/month with proper filtering. Annual waste: $5,000-20,000+.

---

## R3: Limit Custom Metrics to 100 Per Host — Never Exceed Default without Review

**Category**: Metric Governance

**Rule**: ALWAYS enforce a 100-custom-metric-per-host limit. NEVER exceed the included custom metric allocation without explicit review and approval.

**Reason**: Datadog includes 100 custom metrics per host in the base infrastructure price. Each additional custom metric costs $0.05/metric/month. High-cardinality or excessively granular instrumentation can create thousands of custom metrics, adding $500-5,000+/month to the bill. Most observability value comes from the first 20 metrics per service — beyond that, diminishing returns accelerate.

**Bad Example**: A team instruments every Laravel event (50 events) as a separate custom metric with dimensions for each HTTP status code, endpoint, and user tier. Custom metrics: 50 events x 10 status codes x 20 endpoints = 10,000 custom metrics. Hosts: 10. Included: 1,000. Additional: 9,000 x $0.05 = $450/month extra.

**Good Example**: The team limits custom metrics to 100 per host (1,000 total included for 10 hosts). They instrument 20 high-value business metrics (orders, registrations, revenue) + 50 technical metrics (queue depth, cache hit rate, response time by endpoint group). Additional metrics: 0. Cost: $0 extra. The 10,000-metric approach provided no additional actionable insights.

**Exceptions**: Business-critical custom metrics (revenue monitoring, compliance metrics) may exceed 100/host with documented justification. Review quarterly.

**Consequences Of Violation**: Custom metric costs silently balloon the monthly bill. A "small" $5,000/month Datadog bill becomes $7,500+ from metric proliferation that provides no additional visibility.

---

## R4: Use Synthetics Sparingly — Only Critical User Journeys

**Category**: Test Optimization

**Rule**: ALWAYS limit synthetic browser/API tests to 10-20 critical user journeys. NEVER monitor every page or endpoint with synthetic tests.

**Reason**: Datadog synthetics cost $5/test/month per location. Testing 50 endpoints from 3 locations = $750/month. Most endpoints are internal APIs or rarely-changed pages that do not benefit from continuous synthetic monitoring. Focusing on critical user journeys (login, checkout, search) provides the same reliability signal at 10-20% of the cost.

**Bad Example**: A team creates synthetic tests for every API endpoint (50 endpoints), every web page (30 pages), and every background job (10 jobs) from 3 global locations. Monthly: (50+30+10) x 3 x $5 = $1,350/month. 80% of these tests never fail and provide zero signal.

**Good Example**: The team identifies 8 critical user journeys (login, product search, add to cart, checkout, payment, registration, forgot password, health check). Tests from 2 locations: 8 x 2 x $5 = $80/month. Coverage: the 8 journeys cover 95% of user-facing functionality.

**Exceptions**: After a production incident caused by a specific endpoint failure, add a synthetic test for that endpoint. Remove it after 30 days of stability.

**Consequences Of Violation**: Spending $750-1,500+/month on synthetic tests that rarely fail. The cost-to-signal ratio is terrible. A single failed critical journey is not found faster because 90% of tests cover non-critical paths.

---

## R5: Skip Datadog for Single-Cloud Laravel Teams — Use CloudWatch + Scout APM

**Category**: Tool Selection

**Rule**: NEVER use Datadog for single-cloud (AWS-only) Laravel deployments at mid-scale (<50 hosts). ALWAYS use CloudWatch (free infrastructure metrics) + Scout APM ($39-299/month flat).

**Reason**: Datadog's pricing model (per-host, per-GB, per-metric) makes it dramatically more expensive for small-to-mid scale deployments. A 50-host Laravel app on Datadog costs $2,750-6,500/month. CloudWatch + Scout APM covers the same observability needs for $400-800/month — 80-90% less. For single-cloud Laravel teams, the value from Datadog's rich integration ecosystem does not justify the cost premium.

**Bad Example**: A Laravel team with 30 EC2 instances, 10 RDS databases, and 50GB/month logs deploys Datadog. Monthly bill: 30 hosts x $18 (infra) + 30 x $31 (APM) + 50GB x $0.10/GB (logs) = $1,520/month + miscellaneous. Total: ~$1,800/month.

**Good Example**: The same team uses CloudWatch (free for EC2/RDS metrics) + Scout APM ($99/month unlimited plan). Log retention: 30 days at 50GB = $50/month. Total: ~$150/month. Same infrastructure visibility, same APM coverage, same debugging capability. Savings: $1,650/month.

**Exceptions**: Multi-cloud environments (AWS + GCP + Azure) need a unified observability platform — Datadog is appropriate here. Enterprise compliance requirements (FedRAMP, HIPAA) may mandate Datadog for certain workloads.

**Consequences Of Violation**: Paying 5-10x more for observability than necessary. The $1,500-5,000/month "monitoring tax" could fund additional infrastructure or development resources.
