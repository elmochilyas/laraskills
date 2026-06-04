# Reserved Instances — Rules

## R1: Purchase RIs for Baseline Capacity Only — Not Peak or Variable

**Category**: Coverage Scope

**Rule**: ALWAYS purchase Reserved Instances to cover the minimum always-on instance count (baseline). NEVER purchase RIs for peak, burst, or auto-scaled capacity.

**Reason**: An RI discount applies only to running instances that match the RI attributes. If you purchase more RIs than your minimum running count, the excess goes unused and you pay the full RI hourly rate for zero benefit. Baseline capacity (e.g., the 3 instances running at 3 AM) is always consumed, guaranteeing 100% RI utilization. Peak capacity (e.g., 10 instances at 2 PM) should use Spot or On-Demand, which are cheaper than unused RI hours.

**Bad Example**: A team with 3 baseline instances and auto scaling to 10 peak instances purchases 10 RIs. During off-peak hours, only 3 of 10 RIs match running instances. The remaining 7 RIs are wasted — but still billed at RI effective rate. Monthly waste: 7 x $0.028/hour x 12 hours off-peak x 30 days = $70.56/month.

**Good Example**: The team purchases 3 RIs (matching baseline). Peak instances use Spot (70% discount). Off-peak, all 3 RIs match running instances — 100% utilization. Monthly cost: 3 RI instances + 0-7 Spot instances = minimized total cost.

**Exceptions**: If your workload runs at 100% capacity 24/7 with no variation (e.g., batch processing running around the clock), you can purchase RIs for the full fleet.

**Consequences Of Violation**: Paying for unused RI capacity every hour. The effective savings drops below On-Demand as utilization falls. Over-purchasing is the #1 cause of RI waste.

---

## R2: Always Purchase RDS RIs Separately — EC2 RIs Don't Cover Databases

**Category**: Service Coverage

**Rule**: ALWAYS purchase RDS Reserved Instances for production RDS/Aurora instances in addition to EC2 RIs. NEVER assume EC2 RIs cover RDS.

**Reason**: AWS treats EC2 and RDS as separate services with independent pricing and commitment instruments. RDS RIs are purchased separately from EC2 RIs and apply only to RDS instances. Production databases run 24/7 and are typically the most expensive always-on resource — missing RDS RIs means paying full On-Demand for the highest-value commitment target.

**Bad Example**: A team purchases EC2 RIs covering all web server instances but forgets RDS RIs. The production db.r6g.xlarge Aurora instance runs 24/7 at $0.50/hour On-Demand. Over 3 years, they pay $13,140 for the database with zero discount.

**Good Example**: The team purchases 1 RDS RI for the production db.r6g.xlarge (3-year All Upfront, ~60% off). Effective rate: $0.20/hour vs $0.50/hour On-Demand. Over 3 years, they save $7,884 on database costs alone.

**Exceptions**: Dev/staging databases that run <8 hours/day may not justify RDS RIs — use On-Demand or scheduled shutdown instead. Aurora Serverless v2 uses ACU pricing — evaluate if RDS RI applies (check service-specific terms).

**Consequences Of Violation**: Production database — the most expensive always-on resource — runs at full On-Demand rate. RI program's highest-impact target is missed. $5,000-15,000+ in avoidable spend over 3 years.

---

## R3: Use All Upfront 3-Year for Stable Production Workloads

**Category**: Term and Payment

**Rule**: ALWAYS use All Upfront 3-year Standard RIs for stable production workloads expected to run for 3+ years. AVOID 1-year or Partial Upfront for workloads that are demonstrably stable.

**Reason**: All Upfront 3-year provides the maximum discount (72% vs On-Demand) and requires no monthly payments. For production databases, cache clusters, and baseline web servers that have been running unchanged for 12+ months, the risk of architecture change within 3 years is low. Choosing a shorter term or less upfront payment leaves 20-30% savings on the table — on a $10,000/year baseline, that's $2,000-3,000/year foregone.

**Bad Example**: A production database running on db.r6g.xlarge for 2 years unchanged. The team purchases 1-year Partial Upfront RIs each year for 3 years. Savings: ~30% annually vs On-Demand. Total discount over 3 years: $5,400 (30% of $18,000 On-Demand).

**Good Example**: The same database — the team purchases a 3-year All Upfront RI. Savings: ~60%. Total discount over 3 years: $10,800. Additional savings: $5,400 (extra 30%).

**Exceptions**: Use 1-year or Convertible RIs if architecture changes are planned (e.g., migrating to Graviton, changing instance families, moving to serverless). Use Partial or No Upfront if cash flow constraints prevent All Upfront.

**Consequences Of Violation**: Leaving 20-30% additional savings on the table for stable workloads. On a $100,000/year stable baseline, that's $20,000-30,000/year in foregone savings.

---

## R4: Monitor RI Utilization Monthly — Target >95%

**Category**: Utilization Tracking

**Rule**: ALWAYS monitor RI utilization in AWS Cost Explorer monthly. Set a target of >95% utilization. Investigate and remediate when utilization drops below 90%.

**Reason**: RI utilization measures the percentage of purchased RI hours that match running instances. Utilization below 100% means some purchased RIs are unused — you pay for discount you don't receive. Early detection allows remediation: modify RIs (Convertible RIs can be exchanged), sell unused RIs on the RI Marketplace, or adjust the instance fleet to match committed RI attributes.

**Bad Example**: A team purchases 5 RIs for m5.large. After a rightsizing initiative, they only run 4 m5.large. Utilization drops to 80%. They don't notice for 6 months. Waste: 1 unused RI x $0.055/hour x 4,380 hours = $241/year.

**Good Example**: Monthly monitoring shows utilization at 92%. The team immediately sells 1 RI on the RI Marketplace (recoups ~70% of remaining value) and changes the remaining 4 m5.large to Convertible RIs for future flexibility. Waste minimized.

**Exceptions**: During active blue/green deployments where both old and new instances run simultaneously, utilization may temporarily exceed 100% — this is fine and corrects after deployment completes.

**Consequences Of Violation**: Unused RIs accumulate waste silently. A single unused RI costs $100-500/year. Across a fleet, unmonitored utilization can waste thousands of dollars before detection.

---

## R5: Combine RIs with Spot for Layered Cost Strategy

**Category**: Cost Stacking

**Rule**: ALWAYS use Reserved Instances for baseline (always-on) capacity and Spot instances for elastic (scaling) capacity. AVOID using On-Demand for either layer.

**Reason**: RIs cover the known baseline at up to 72% discount. Spot covers variable capacity at up to 90% discount. Combined, they achieve the lowest possible blended compute cost. Using On-Demand for scaling capacity means paying 3-10x more than necessary for burst traffic.

**Bad Example**: A team buys RIs for 3 baseline instances. Traffic scales to 8 instances during peak — the 5 additional instances all run On-Demand. Peak cost: $24/day in On-Demand charges (5 x $0.10/hour x 8 hours x $0.60/instance).

**Good Example**: The team buys RIs for 3 baseline instances. Auto scaling launches Spot instances for the 5 additional during peak. Spot cost: $3/day (5 x $0.03/hour x 8 hours x $0.18/instance). Spot savings: $21/day. For 200 peak days/year: $4,200 saved.

**Exceptions**: Workloads that cannot tolerate Spot interruptions (stateful services, synchronous user-facing writes) may use On-Demand for scaling. In these cases, evaluate if additional RIs or a Compute SP would be more cost-effective.

**Consequences Of Violation**: Paying On-Demand rates for all variable capacity. Doubling the total compute bill compared to Spot-based scaling.
