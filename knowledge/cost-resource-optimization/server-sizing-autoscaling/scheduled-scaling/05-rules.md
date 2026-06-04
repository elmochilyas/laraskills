# Scheduled Scaling — Rules

## R1: Scale Down Non-Production Environments on Weekends and Off-Hours

**Category**: Environment Cost

**Rule**: ALWAYS configure scheduled scaling to reduce non-production environments (staging, dev, QA) to minimum capacity during off-hours and weekends. NEVER run non-production environments at full capacity 24/7.

**Reason**: Non-production environments consume 30-50% of total infrastructure bill but serve zero real user traffic during off-hours. Scheduled scaling reduces this cost by 50-70% with no functional impact — developers have full capacity during work hours, and the environment scales down automatically when not needed. This is the single highest-ROI cost optimization.

**Bad Example**: A staging environment with 4 x m7g.large instances ($500/month) runs 24/7/365. No one accesses it after 8 PM or on weekends. Annual waste: ~$3,000. This cost is simply accepted as "what staging costs."

**Good Example**: Staging schedule: 6 AM scale-up to 4 instances, 8 PM scale-down to 1 instance (t4g.nano for emergency access). Weekends: always 1 instance. Monthly cost: ~$180/month. Savings: $320/month ($3,840/year). Same development productivity during work hours.

**Exceptions**: Keep 1 tiny instance running for emergency SSH access (hotfixes, incident response). Ensure CI/CD pipelines can trigger scale-up if needed for out-of-hours deployments.

**Consequences Of Violation**: Paying 2-3x more for non-production environments than necessary. Annual waste of $3,000-12,000 for mid-scale deployments — money that could fund production capacity or additional developer tools.

---

## R2: Schedule Scale-Up 15 Minutes Before Need

**Category**: Timing

**Rule**: ALWAYS schedule scale-up actions 15 minutes before the time capacity is actually needed. NEVER schedule the scale-up at the same time as the traffic increase.

**Reason**: EC2 instances take 1-5 minutes to launch. Laravel takes 30-120 seconds to boot and warm up. ALB health checks take 2-3 intervals (10-30 seconds) before routing traffic. Total: 3-8 minutes from launch to serving traffic. Scaling at 9 AM means capacity is not ready until 9:05 AM at the earliest — users who start working at 9 AM experience errors or slowness for the first 5 minutes.

**Bad Example**: A business-hours Laravel app schedules scale-up at 9:00 AM. Employees start working at 9:00 AM. Instances launch at 9:01, Laravel boots by 9:02, health checks complete by 9:03. The first 3 minutes of work (9:00-9:03) see slow responses or errors. 50 employees × 3 minutes = 150 person-minutes of lost productivity per day.

**Good Example**: Scale-up scheduled at 8:45 AM. Instances launch at 8:46, boot Laravel by 8:47, pass health checks by 8:48. By 8:50 AM, all instances are ready and serving traffic. When employees start at 9:00 AM, capacity is fully warmed up. Zero productivity loss.

**Exceptions**: For Fargate containers with <30 second boot times, reduce the buffer to 5-10 minutes. For Laravel Octane (faster boot), 10 minutes may suffice.

**Consequences Of Violation**: Users experience slow performance or errors during the first minutes of their workday. The scheduled scaling delivers capacity later than needed, negating its purpose.

---

## R3: Never Scale to Zero in Production (Keep Minimum Capacity)

**Category**: Availability

**Rule**: ALWAYS configure production scheduled scaling to maintain a minimum non-zero capacity (at least 2 instances for HA). NEVER set the minimum to 0 for production during any schedule window.

**Reason**: Scaling to 0 in production means the application is completely unavailable during that window. If a critical incident occurs (security breach, partner issue, customer escalation), the application cannot be accessed until instances launch and warm up (5+ minutes). Every minute of downtime during incident response is amplified. A single t4g.nano instance costs <$15/month for 24/7 availability — a negligible cost for emergency access.

**Bad Example**: A production B2B Laravel app scales to 0 instances on weekends (no B2B usage). Saturday night: a security vulnerability is discovered. The team needs to deploy a hotfix but cannot — the production environment has 0 instances. They wait 10 minutes for instances to launch and boot before they can deploy. Attack window: 10 minutes + deployment time.

**Good Example**: Production minimum = 2 instances (t4g.micro for off-hours, $15/month). Same security vulnerability discovered: instances are already running. Team deploys the hotfix within 5 minutes. Attack window: 5 minutes. The $15/month cost is negligible compared to the security risk.

**Exceptions**: For non-production environments (staging, dev), scaling to 0 is acceptable with the understanding that emergency access requires a manual scale-up first. Document this lead time.

**Consequences Of Violation**: Application unavailable for critical incident response. Every minute of delay amplifies security vulnerabilities, revenue loss, or customer impact.

---

## R4: Use Cron Expressions for Weekdays-Only Scaling

**Category**: Schedule Precision

**Rule**: ALWAYS use cron expressions for scheduled scaling to precisely define weekdays-only or business-hours-only schedules. NEVER use simple rate-based schedules that don't account for weekday/weekend differences.

**Reason**: Rate-based schedules (e.g., every 12 hours) apply uniformly across all days — they scale up on weekends and holidays when no one works. Cron expressions allow precise patterns: scale-up on Monday-Friday only, skip holidays, and handle different schedules for different days. This precision maximizes cost savings by matching capacity to actual usage.

**Bad Example**: A team uses a rate-based schedule "scale up at 8 AM, scale down at 8 PM" without day-of-week filtering. The schedule fires at 8 AM on Saturday, scaling up the staging environment. No one works on Saturday. 10 instances run idle until 8 PM. Waste: 12 instance-hours every weekend.

**Good Example**: Terraform `aws_autoscaling_schedule` with recurrence: `"0 13 * * 1-5"` for scale-up (weekdays at 1 PM UTC = 8 AM ET) and `"0 1 * * 1-5"` for scale-down (weekdays at 1 AM UTC = 8 PM ET). Weekends: no schedule actions — environment stays at minimum capacity. Zero weekend waste.

**Exceptions**: For apps with weekend traffic (consumer-facing apps, e-commerce), use day-specific schedules. For 24/7 production workloads, use predictive scaling instead of scheduled scaling.

**Consequences Of Violation**: Schedules fire on weekends and holidays when environments are not needed. Capacity runs idle, wasting 30-60% of potential savings from scheduled scaling.

---

## R5: Test Schedule Changes in Non-Production First

**Category**: Change Management

**Rule**: ALWAYS test new scheduled scaling actions in a non-production environment before applying to production. Apply schedule changes gradually. NEVER modify production schedules without validation.

**Reason**: A misconfigured schedule can scale down production during business hours, causing a site outage. Unlike code changes (which have CI/CD pipelines and staging tests), schedule changes are often made ad-hoc via the console. Testing in staging first validates: (a) the timezone conversion is correct, (b) the cron expression fires at the right time, (c) the capacity values are appropriate, and (d) the schedule interacts correctly with existing dynamic scaling policies.

**Bad Example**: A team modifies the production scale-down schedule from 10 PM to 6 PM (employees now leave at 5 PM, no need for capacity at 6 PM). Timezone mistake: they enter "0 18 * * 1-5" but the schedule interprets 18 UTC = 2 PM ET. Production scales down at 2 PM. Traffic is still heavy. Outage: 2 hours. The team discovers the mistake at 4 PM after customer complaints.

**Good Example**: The team tests the schedule change in staging first. They set the staging schedule to scale-down at 18 UTC and observe: 18 UTC = 2 PM their time. They realize the timezone conversion is wrong. They correct to "0 22 * * 1-5" (10 PM UTC = 6 PM ET). They test in staging: works correctly. They apply to production with the corrected timezone. No outage.

**Exceptions**: For urgent schedule changes (fixing an active misconfiguration), test in production with a "1 instance" safety minimum and monitor the first cycle closely.

**Consequences Of Violation**: A single timezone or cron expression mistake can scale down production during peak hours, causing a site outage. Recovery requires manual scale-up (if someone notices) or waiting for the next scale-up schedule.
