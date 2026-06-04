---
## Rule Name
Use Aurora Serverless v2 for Variable Workloads Only

## Category
Architecture

## Rule
Choose Aurora Serverless v2 exclusively for workloads with variable or unpredictable traffic. For steady 24/7 workloads, use provisioned RDS with Reserved Instances.

## Reason
Serverless charges per ACU-hour with no commitment discount. At consistent load above 4 ACU, provisioned RDS with a 3-year RI is 60-70% cheaper. Serverless is a premium for elasticity.

## Bad Example
Running a steady 8 ACU Aurora Serverless v2 cluster 24/7 ($700/month). Same workload on RDS r7g.large with 3-year RI: ~$60/month. Serverless costs 11x more.

## Good Example
Using Aurora Serverless v2 for a SaaS app with variable traffic: 2 ACU baseline, scales to 16 ACU during marketing campaigns. Average cost: $150/month. Provisioned would cost $350/month for peak capacity.

## Exceptions
When the workload is truly unpredictable and the cost of over-provisioning provisioned RDS exceeds the serverless premium.

## Consequences Of Violation
Paying 2-11x more for database compute than necessary. Serverless on steady workloads is one of the most common and expensive database mistakes.

---
## Rule Name
Set Minimum ACU to Handle Baseline Traffic

## Category
Performance

## Rule
Configure the minimum ACU setting to handle the application's baseline query throughput. Never set min ACU to 0.5 for a production database with real traffic.

## Reason
Scaling from 0.5 ACU to 8 ACU on a traffic spike takes 1-5 seconds. During that time, queries queue up, causing latency spikes and potential timeouts.

## Bad Example
Setting min=0.5 for a production app. App normally handles 100 req/s. Traffic resumes after a low-traffic period, database is at 0.5 ACU. Takes 3 seconds to scale to 8 ACU. During those 3 seconds, 300 requests queue or timeout.

## Good Example
Setting min=4 ACU for an app with 100 req/s baseline. Database is ready at all times. Traffic spikes scale from 4 to 16 ACU smoothly without request queuing.

## Exceptions
Development or staging environments where temporary latency is acceptable.

## Consequences Of Violation
Request timeouts and errors during traffic ramp-ups. Users experience degraded performance during the scaling window.

---
## Rule Name
Always Use RDS Proxy With Aurora Serverless v2

## Category
Architecture

## Rule
Deploy RDS Proxy in front of every Aurora Serverless v2 cluster. Never connect application workers directly to a Serverless v2 endpoint.

## Reason
Aurora Serverless v2 changes the compute capacity (and thus connection capacity) as it scales. RDS Proxy manages connection scaling transparently, preventing connection drops during ACU changes.

## Bad Example
Direct connection to Aurora Serverless v2. During a scaling event (0.5 ACU -> 8 ACU), connections are reset. Application workers get "connection lost" errors.

## Good Example
RDS Proxy in front of Aurora Serverless v2. Proxy manages connections through scaling events. Application workers see stable connection endpoints.

## Exceptions
When the Serverless v2 cluster is exclusively used by a single long-running process (e.g., a migration runner).

## Consequences Of Violation
Unpredictable connection drops during scaling events cause application errors. Debugging these errors is difficult because they correlate with traffic patterns.

---
## Rule Name
Set Maximum ACU Cap for Budget Control

## Category
Cost Management

## Rule
Always set a maximum ACU cap on Aurora Serverless v2 clusters. Calculate the cap as the maximum monthly budget divided by ACU-hour cost.

## Reason
Without a cap, a traffic spike could scale ACU to the maximum (256 ACU), costing over $700/hour. A cap ensures predictable maximum spend.

## Bad Example
No max ACU set. A DDoS or marketing campaign drives traffic to 256 ACU. Database bill for that month: $50,000 unexpected charge.

## Good Example
Max ACU set to 16. Even under extreme traffic, the database cannot exceed 16 ACU per hour. Maximum hourly cost: ~$1.92. Monthly max: ~$1,400.

## Exceptions
When the application has a hard latency SLO that requires unlimited scaling, and the budget accommodates the risk.

## Consequences Of Violation
Unbounded database costs from traffic spikes. A single viral event could generate a database bill larger than all other infrastructure combined.

---
## Rule Name
Use Neon for Ephemeral Environments Only

## Category
Architecture

## Rule
Use Neon Serverless Postgres exclusively for development, staging, CI/CD, and preview environments. Do not use Neon for production databases larger than 50GB.

## Reason
Neon's pay-per-use model is ideal for ephemeral branches. However, its compute-storage separation adds latency at scale, and pricing favors small databases.

## Bad Example
Neon for a production app with 200GB of data. Query latency increases as data grows. Monthly cost: $500. Same workload on Aurora: $250.

## Good Example
Neon for development: 10 developers each with a branch. Compute auto-pauses after 5 minutes. Cost: $50/month total. Production stays on Aurora for predictable performance.

## Exceptions
New projects with <50GB data and unpredictable traffic where Neon's instant branching provides development velocity benefits.

## Consequences Of Violation
Higher costs and latency for production workloads as data grows. Neon's pricing and performance characteristics do not favor large production databases.

---
## Rule Name
Compare Serverless vs Provisioned Break-Even Before Choosing

## Category
Cost Management

## Rule
Before deploying any database, calculate the monthly cost of Aurora Serverless v2 at the expected average ACU usage vs provisioned RDS with a 1-year and 3-year Reserved Instance.

## Reason
The serverless vs provisioned decision is purely financial at steady load. Serverless at 4 ACU 24/7 costs ~$350/month. RDS r7g.large with 3-year RI: ~$60/month.

## Bad Example
Choosing Serverless v2 for a known, predictable workload without cost comparison. Wasting $290/month for 4 years = $13,920 total.

## Good Example
Running the break-even calculation before deployment:
- Serverless (4 ACU avg): $350/month
- RDS r7g.large 1yr RI: $90/month
- RDS r7g.large 3yr RI: $60/month
Choosing provisioned saves $290-350/month.

## Exceptions
When traffic is too unpredictable to estimate average ACU usage for the break-even calculation.

## Consequences Of Violation
Thousands of dollars in unnecessary database costs per year. The serverless premium adds up significantly over the application's lifetime.

---
## Rule Name
Monitor ACU Utilization Monthly

## Category
Cost Management

## Rule
Monitor `ServerlessDatabaseCapacity` in CloudWatch. Adjust min/max ACU settings monthly based on utilization patterns. Scale down if consistently at minimum.

## Reason
Consistently at max ACU indicates under-provisioning.
Consistently at min ACU indicates over-provisioning.
Monthly adjustment ensures the ACU range matches actual traffic.

## Bad Example
Configuring min=2, max=64 a year ago. App traffic has since decreased. Database runs at 2 ACU 90% of the time. Paying for ability to scale to 64 ACU that never happens.

## Good Example
Monthly review shows average = 3 ACU, peak = 8 ACU. Adjust min=2, max=12. Cap provides headroom without over-provisioning the scaling range.

## Exceptions
When the application has seasonal peaks that make monthly adjustments counterproductive (adjust seasonally instead).

## Consequences Of Violation
ACU range drifts out of alignment with actual traffic. Either paying for unused scaling capacity or risking under-provisioning during peaks.
