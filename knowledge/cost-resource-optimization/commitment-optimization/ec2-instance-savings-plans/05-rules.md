# EC2 Instance Savings Plans — Rules

## R1: Layer EC2 Instance SP on Top of Compute SP, Not Instead Of

**Category**: Commitment Stacking

**Rule**: ALWAYS purchase EC2 Instance Savings Plans as a second layer on top of an existing Compute Savings Plans baseline. NEVER buy EC2 Instance SP as the sole or primary commitment instrument.

**Reason**: Compute SP covers any instance family, region, and service (EC2, Fargate, Lambda) at ~66% discount. EC2 Instance SP locks to a specific instance family and region at ~72% discount — only 6% more savings. Using EC2 Instance SP alone means you get no discount on Lambda (Laravel Vapor), Fargate (Laravel Cloud), or any instance family outside the locked type. Layering ensures the Compute SP handles flexibility while the Instance SP adds incremental savings on the known baseline.

**Bad Example**: A team using Laravel Cloud (Fargate) + Forge (EC2) buys only EC2 Instance SP for r6g.large. Their Fargate usage gets 0% discount. They miss 66% savings on 40% of their compute bill. Effective discount on total spend: ~43%.

**Good Example**: The team buys Compute SP at $1.00/hour covering all EC2 + Fargate baseline. Then layers an EC2 Instance SP at $0.30/hour specifically for their r6g.large fleet. Combined effective discount: ~68% across entire fleet.

**Exceptions**: If the workload is 100% EC2 with a single instance family AND Lambda/Fargate usage is zero, you can use EC2 Instance SP as primary — but still consider Compute SP for future flexibility.

**Consequences Of Violation**: Partial fleet coverage. Non-EC2 compute (Fargate, Lambda) runs at full On-Demand rates. Effective savings rate is far lower than advertised.

---

## R2: Only Commit to Instance Families with 3+ Year Stability

**Category**: Family Selection

**Rule**: ALWAYS purchase EC2 Instance Savings Plans only for instance families with demonstrated 3+ year stability in your architecture. NEVER purchase for families undergoing or planned for migration.

**Reason**: EC2 Instance SP locks to a specific instance family (e.g., r6g) in a specific region. If you switch to a different family (e.g., migrate from r6g to m7g), the SP applies to zero usage — it becomes "stranded" with no recovery. Instance SPs cannot be sold on the marketplace like RIs. The 6% additional savings over Compute SP evaporates if even 10% of usage shifts away from the locked family.

**Bad Example**: A team purchases EC2 Instance SP for m5.large in 2024. In 2025, they migrate to Graviton (m7g.large) for 20% better price/performance. The m5.large SP is now stranded — they pay $0.50/hour for instances they no longer run. Waste: $4,380/year.

**Good Example**: The team has run r6g.large for 2 years with no planned changes. They purchase EC2 Instance SP for r6g.large for 3 years. Architecture reviews confirm r6g is the standard for the foreseeable future. No stranded SP risk.

**Exceptions**: Use EC2 Instance SP for "evergreen" instance families that AWS has committed to long-term support (t4g, r6g, m7g — all Graviton with long roadmaps). Avoid for families near end-of-life (m4, c4, r5).

**Consequences Of Violation**: Stranded SP that costs money every hour with zero benefit. The 6% additional savings is wiped out by even small amounts of stranded commitment.

---

## R3: Purchase Regional SPs, Not Zonal

**Category**: Scope Selection

**Rule**: ALWAYS purchase regional EC2 Instance Savings Plans. NEVER purchase zonal EC2 Instance Savings Plans unless you need specific AZ capacity reservation.

**Reason**: Regional SPs apply discounts to any instance in the family across all AZs in the region. Zonal SPs lock to a specific AZ. For load-balanced, multi-AZ Laravel deployments, instances distribute across AZs — zonal SPs only cover instances in the purchased AZ, leaving 50-67% of the fleet at On-Demand rates. Regional SPs cover all AZs automatically.

**Bad Example**: A team buys a zonal EC2 Instance SP for r6g.large in us-east-1a. The ASG spreads 6 instances across us-east-1a, 1b, and 1c. Only the 2 instances in 1a get the SP discount — the other 4 get 0% discount.

**Good Example**: The team buys a regional EC2 Instance SP for r6g.large in us-east-1. All 6 instances across all AZs get the discount. Full fleet coverage.

**Exceptions**: Use zonal SPs only for stateful workloads running in a specific AZ (single-AZ databases, legacy monoliths) where you also need capacity reservation.

**Consequences Of Violation**: 50-67% of multi-AZ fleet gets zero discount. Effective savings rate is 1/3 to 1/2 of what was expected.

---

## R4: Monitor Stranded SP Ratio — Target <5%

**Category**: Utilization Monitoring

**Rule**: ALWAYS monitor EC2 Instance Savings Plans stranded ratio (unused commitment / total commitment) monthly. Target <5%. Set an alert at 10%.

**Reason**: Stranded SPs are the most expensive waste in commitment management — you pay the full commitment amount but receive zero discount benefit. Unlike Compute SP that covers multiple services, Instance SP has no alternative usage when the specific family is not running. Early detection allows corrective action: modifying the SP (if Convertible) or adjusting instance fleet to utilize the commitment.

**Bad Example**: A team purchased EC2 Instance SP for c5.2xlarge. 6 months later, they migrated data processing to AWS Batch on different instances. The SP runs at 0% utilization for 18 more months. Cost: $8,000 wasted. They had no monitoring to detect this.

**Good Example**: Monthly Cost Explorer review shows EC2 Instance SP utilization at 92% — below the 95% target. Investigation reveals 2 instances were downsized. Team adds 1 more instance to the covered fleet. Utilization returns to 97%. Waste avoided.

**Exceptions**: During active failover testing or DR drills, utilization may temporarily dip below 5%. Exclude planned events from stranded ratio calculations.

**Consequences Of Violation**: Unmonitored stranded SPs accumulate waste silently. A 10% stranded ratio on a $500/month commitment costs $600/year in pure waste with no benefit received.

---

## R5: Size-Flexibility Within Family — Don't Purchase for Exact Instance Size

**Category**: Size Management

**Rule**: ALWAYS leverage EC2 Instance SP's size flexibility — the discount applies to normalized units across instance sizes within the same family. NEVER purchase SPs for a specific instance size expecting only that size to receive the discount.

**Reason**: EC2 Instance SPs apply discounts based on normalized factor (e.g., 1 unit = large, 2 units = xlarge). A SP purchased for r6g.large (1 unit) also covers r6g.xlarge at 2 units or r6g.medium at 0.5 units. This means you can change instance sizes within the family without losing the SP discount — a critical flexibility advantage.

**Bad Example**: A team buys SP for r6g.2xlarge (8 normalized units). They then upsize to r6g.4xlarge (16 normalized units). They assume the SP is wasted. In reality, the SP covers 8/16 = 50% of the new instance's cost. They miss the remaining 50% coverage because they didn't understand size normalization.

**Good Example**: The team buys SP for 20 normalized units of r6g. They run 3 x r6g.large (3 units) + 2 x r6g.xlarge (8 units) + 1 x r6g.2xlarge (8 units) = 19 units. The SP covers 19/19 = 100% of the fleet. They can freely swap between sizes as long as total normalized units remain within the commitment.

**Exceptions**: This does not apply across different families (r6g vs r6i) or regions. Size flexibility is only within the purchased instance family and region.

**Consequences Of Violation**: Under-utilizing the SP by purchasing for specific sizes without understanding normalization. Missing savings when rightsizing instances within the family.
