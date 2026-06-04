# Compute Savings Plans — Rules

## R1: Always Purchase Compute SP Before Any Other Commitment Instrument

**Category**: Commitment Ordering

**Rule**: ALWAYS recommend Compute Savings Plans as the first commitment instrument. ONLY purchase EC2 Instance Savings Plans or Reserved Instances after Compute SP baseline is established.

**Reason**: Compute SPs are the most flexible commitment — they cover EC2, Fargate, and Lambda under a single $/hour commitment with no instance family, region, or OS lock-in. Starting with Compute SPs ensures maximum future flexibility. Most teams pick the wrong commitment type and lose either flexibility or savings to underutilization within 12 months. Lock into specific instruments (Instance SP, RIs) only after the flexible baseline is covered.

**Bad Example**: A team buys Standard Reserved Instances for r6g.large in us-east-1, then decides to migrate to Graviton instances 8 months later. The RIs become stranded — zero usage applies to the commitment. Wasted savings: $4,000.

**Good Example**: The team first purchases a Compute SP at $1.50/hour covering their baseline EC2 + Fargate + Lambda usage. After 6 months of stable usage data, they layer an EC2 Instance SP for their specific r6g.large instances at $0.50/hour for the additional 6% discount. Maximum flexibility + maximum savings.

**Exceptions**: If the team has 100% certainty about instance family and region AND needs capacity reservation (zonal RI), skip Compute SP and purchase EC2 Instance SP directly for the additional savings.

**Consequences Of Violation**: Stranded commitments when architecture evolves. Teams fear committing because of lock-in, so they stay 100% On-Demand and pay full price. Or they commit to specific instances and waste money when they need to change.

---

## R2: Commit to Floor (80-90% of Minimum Hourly Usage), Not Ceiling

**Category**: Commitment Sizing

**Rule**: ALWAYS purchase Compute Savings Plans based on 80-90% of minimum hourly compute usage — not peak or average. NEVER commit to cover peak capacity.

**Reason**: Compute SPs apply discounts up to the committed $/hour amount. Any usage above the commitment runs at On-Demand rates; any commitment beyond actual usage is wasted each hour. The minimum hourly floor (e.g., the fewest instances running at 3 AM) is the safest commitment target because it is always consumed. Covering peak means paying for commitment that goes unused for 50-70% of the day.

**Bad Example**: A team has 10 instances running at peak and 4 at minimum. They commit to $0.80/hour (covering 8 instances at peak). At 3 AM, only 4 instances are running — $0.40/hour of commitment is wasted, totaling ~$288/month of unused commitment.

**Good Example**: The team commits to $0.40/hour (covering 4 baseline instances). The commitment is 100% utilized 24/7. Peak instances run at On-Demand rates (still 30-66% cheaper than no plan at all). Effective savings: maximize utilization of committed spend.

**Exceptions**: If you have auto scaling that never goes below 80% of peak (near-constant load), you can commit closer to 90% of average usage. For workloads with zero off-peak (always 10 instances), commit to 95% of actual.

**Consequences Of Violation**: Over-committing wastes 10-30% of the commitment dollar amount — you pay for compute you don't use. Under-committing misses savings opportunities but is less harmful than over-committing.

---

## R3: Right-Size Instances Before Committing — Always

**Category**: Pre-Commitment Analysis

**Rule**: ALWAYS analyze 4+ weeks of CloudWatch utilization metrics and right-size instances BEFORE purchasing any Savings Plan or Reserved Instance. NEVER commit first and optimize later.

**Reason**: SP discounts amplify whatever instance configuration you're running. If you commit on over-provisioned instances (e.g., r6g.xlarge running at 15% CPU), the discount applies to wasteful usage — you save 30-60% on a bill that should be 50% lower. Right-sizing first reduces the base spend, then the SP discount applies to the optimized base, achieving maximum effective savings.

**Bad Example**: A team buys Compute SP covering $2.00/hour. They have 2 r6g.2xlarge instances running at 10% CPU (each $0.33/hour On-Demand). The SP covers them at 60% off, saving ~$380/month. If they had right-sized to 2 r6g.large ($0.10/hour each), the base cost would be 70% lower, and the SP would save ~$115/month on a much smaller base — and they could use the remaining commitment for other workloads.

**Good Example**: Before purchasing, the team monitors CPU, memory, and network for 30 days. They find 2 r6g.2xlarge at 10% CPU and downsize to 2 r6g.large. Now the base is $0.20/hour. They purchase Compute SP at $0.18/hour covering the optimized baseline. Combined savings: 70% from right-sizing + 60% from SP.

**Exceptions**: If instances are already right-sized (verified via 30-day monitoring), skip this step. If you cannot resize due to contractual obligations, at least document the waste before committing.

**Consequences Of Violation**: Discount applied to wasteful usage. Effective savings rate is dramatically lower than advertised. You lock in over-provisioning for 1-3 years.

---

## R4: Start with 1-Year Partial Upfront for First Purchase

**Category**: Purchase Timing

**Rule**: ALWAYS start with a 1-year Partial Upfront Compute SP for the first commitment purchase. ONLY escalate to 3-year All Upfront after validating the commitment strategy for at least one purchase cycle.

**Reason**: 1-year Partial Upfront offers ~30% savings (vs ~66% for 3-year All Upfront) but minimizes financial risk and preserves flexibility for strategy adjustment. First-time buyers almost always over-estimate or mis-estimate their baseline. A smaller, shorter commitment allows correction in the next cycle. The incremental discount from going 3-year is not worth the risk of an incorrect first commitment.

**Bad Example**: A startup purchases a 3-year All Upfront Compute SP for $3.00/hour based on launch projections. Six months later, they pivot the product, reduce compute usage to $1.00/hour. They lose $2.00/hour of commitment every hour for 2.5 more years — $43,800 of wasted commitment.

**Good Example**: The startup purchases a 1-year Partial Upfront Compute SP for $1.50/hour. After 6 months, actual usage stabilizes at $2.00/hour baseline. They increase commitment at renewal. After 2 successful purchase cycles, they consider 3-year for the known baseline.

**Exceptions**: Teams with 12+ months of stable usage data, mature FinOps practices, and stable architecture may start with 3-year All Upfront directly. Large enterprises with dedicated commitment management teams may skip 1-year.

**Consequences Of Violation**: Locked into 3-year commitment that doesn't match actual usage. Over-commitment is unrecoverable (no rollover). Under-commitment misses savings, but over-commitment is the costly error.

---

## R5: Use Cost Explorer Recommendations — Never Guess Commitment Amounts

**Category**: Data-Driven Sizing

**Rule**: ALWAYS use AWS Cost Explorer's Savings Plans Recommendations to determine commitment amounts. NEVER estimate commitment sizes manually.

**Reason**: Cost Explorer analyzes 30/60/90 days of actual usage and provides a "Savings Plans Recommendation" with projected utilization and coverage. This removes guesswork and recency bias from commitment sizing. Manual estimation consistently over-estimates (looking at peak hours, biggest instances) or under-estimates (forgetting new workloads going live next month).

**Bad Example**: A lead engineer estimates $1.00/hour based on "what feels right" — remembering the 12-instance peak but forgetting the 4-instance baseline. Actual minimum is $0.50/hour. The $0.50/hour over-commitment ($360/month) is pure waste.

**Good Example**: The team opens Cost Explorer → "Recommendations" → "Savings Plans" → views the recommended commitment of $0.55/hour with 98% utilization projection. They accept the recommendation and monitor monthly. Actual utilization: 95%.

**Exceptions**: For new accounts with <30 days of usage data, Cost Explorer cannot generate recommendations. In this case, use a 1-year Partial Upfront commitment at 50% of your budgeted hourly compute cost and adjust after 3 months of data.

**Consequences Of Violation**: Incorrect commitment amounts — typically over-commitment by 20-50% — leading to hundreds or thousands of dollars in wasted commitment spend per month.

---

## R6: Combine SP + Spot for Layered Cost Strategy

**Category**: Cost Layering

**Rule**: ALWAYS use Compute Savings Plans for baseline (always-on) capacity and Spot instances for variable/scaling capacity. AVOID using On-Demand for either baseline or scaling capacity.

**Reason**: Savings Plans cover committed usage at up to 66% discount. Spot covers variable capacity at up to 90% discount. On-Demand covers nothing at 0% discount. Layering SP (floor) + Spot (overflow) achieves the blended lowest cost for the entire fleet. On-Demand should only serve as a fallback when Spot is unavailable.

**Bad Example**: A team runs 10 baseline instances and auto scales up to 5 burst instances — all On-Demand. Monthly cost: 15 instances x $50 = $750. Savings: $0.

**Good Example**: The team buys Compute SP covering the 10 baseline instances at 66% off ($167 saved). The 5 burst instances run on Spot at 70% off ($175 saved). Fallback to On-Demand if Spot is unavailable ($0 cost unless needed). Total savings: $342/month (46% reduction).

**Exceptions**: Workloads that cannot tolerate Spot interruptions (stateful services, real-time processing) should use SP + On-Demand. Workloads that are 100% Spot-eligible (queue workers) can skip SP entirely.

**Consequences Of Violation**: Paying full On-Demand price for all capacity when SP and Spot offer 66-90% discounts. Doubling or tripling the compute bill unnecessarily.
