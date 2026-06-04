# Region Selection — Rules

## R1: Default to us-east-1 for Cost Optimization — Never Choose a Region Without Cost Comparison

**Category**: Region Default

**Rule**: ALWAYS default to us-east-1 (North Virginia) for new AWS deployments unless user latency or compliance requires a different region. NEVER select a region without comparing EC2, RDS, and data transfer pricing across at least 3 candidate regions.

**Reason**: us-east-1 is 10-40% cheaper than other regions for identical services. A $5,000/month compute bill in us-east-1 is $5,500-7,000/month in other regions. Additionally, us-east-1 has widest service availability (Graviton, Aurora Serverless v2, new instance types launch here first). The cost difference across regions compounds with data transfer. A 15-minute cost comparison before choosing saves 10-40% on the entire infrastructure bill for the lifetime of the deployment.

**Bad Example**: A team chooses ap-southeast-1 (Singapore) because "it's close to Asia users." Monthly bill: $6,800. Same workload in us-east-1: $5,500. CloudFront serves Asia users with <30ms latency. Waste: $1,300/month ($15,600/year) with no user-perceptible benefit.

**Good Example**: The team compares us-east-1 ($5,500), eu-west-1 ($6,300), and ap-southeast-1 ($6,800). Most users are in US + EU. They choose us-east-1 ($5,500) with CloudFront. EU users get 25ms latency from edge. Annual savings vs ap-southeast-1: $15,600.

**Exceptions**: If your primary user base is in a region with high latency to us-east-1 (Asia: 150-250ms, Australia: 200ms, South America: 100-200ms) AND the application is latency-sensitive (conversion drops >7% per 100ms), choose the nearest major region. For compliance (GDPR, LGPD), you must choose the mandated region regardless of cost.

**Consequences Of Violation**: Paying 10-40% premium on all infrastructure costs unnecessarily. $5,000-25,000/year extra for a medium deployment. Limited service availability in non-primary regions (no Graviton, delayed feature launches).

---

## R2: Compare Service Availability Before Choosing — Never Assume Every Region Has All Services

**Category**: Service Verification

**Rule**: ALWAYS verify that all required AWS services are available in the target region before deploying. NEVER assume service parity across regions.

**Reason**: AWS launches new services and instance types in us-east-1 first, then gradually rolls out to other regions. Some services (Graviton instances, Aurora Serverless v2, Lambda Response Streaming, certain RDS engines) are not available in all regions. Choosing a region without checking leads to forced compromises: using older instance types (10-20% less cost-effective), missing key features, or having to re-architect.

**Bad Example**: A team chooses ap-southeast-1 for a Laravel app. They need Graviton instances (r7g) for 20% cost savings. Graviton is not available in ap-southeast-1. They're forced to use r6i (x86) — 20% more expensive. Monthly waste: $400/month ($4,800/year) from unavailable instance type.

**Good Example**: Before choosing a region, the team checks: (1) Graviton r7g instances available? (Yes for us-east-1, eu-west-1, No for ap-southeast-1, ap-south-1). (2) Aurora Serverless v2 available? (Yes for us-east-1, eu-west-1, No for ap-southeast-1). They choose us-east-1 with all required services. Alternative: choose a secondary read region that supports needed services.

**Exceptions**: If compliance mandates a specific region that lacks some services, either: (1) use alternative services (e.g., provisioned Aurora instead of Serverless v2), (2) use a nearby region that offers the services (e.g., eu-central-1 instead of eu-west-1), or (3) accept the older instance type and budget for the cost premium.

**Consequences Of Violation**: Forced to use less cost-effective instance types (10-20% premium). Missing key features (Aurora Serverless, Lambda streaming). Architecture compromises that reduce scalability or increase cost.

---

## R3: Use Single Region for <100K MAU — Never Deploy Multi-Region Prematurely

**Category**: Scale-Based Architecture

**Rule**: ALWAYS use a single region with CloudFront for applications with <100K monthly active users. NEVER deploy multi-region architecture unless user base justifies the cost and complexity.

**Reason**: Multi-region architecture adds 2-5x infrastructure cost (compute, database readers, cache per region), operational complexity (deployments per region, monitoring per region), and engineering overhead (data sync, failover procedures, cross-region testing). For <100K MAU, CloudFront + single-region origin provides <50ms latency globally at a fraction of the cost. Re-evaluate multi-region at 100K+ MAU when user latency data justifies the investment.

**Bad Example**: A Laravel SaaS with 15K MAU deploys to us-east-1 and eu-west-1. Monthly cost: $4,200. CloudFront analysis: 90% of requests served from edge at 20ms. Single-region + CloudFront cost: $2,100/month. Waste: $2,100/month for users who don't need multi-region latency.

**Good Example**: The same SaaS deploys to us-east-1 with CloudFront. Monthly cost: $2,100. Edge latency: 20ms (cache hits), 80ms (origin fetch). At 100K MAU, they add eu-west-1 with read replicas. Multi-region cost only when user base justifies it.

**Exceptions**: Multi-region with <100K MAU is justified if: (1) compliance requires data residency in specific regions (GDPR, LGPD), (2) the application requires <30ms dynamic response globally (real-time collaboration), (3) DR failover is a business requirement with <5 minute RTO.

**Consequences Of Violation**: 2-5x infrastructure cost for users who don't need multi-region latency. Engineering team spending 30% of time on multi-region complexity instead of product features. Burnout from cross-region incident response.

---

## R4: Avoid sa-east-1 (Sao Paulo) Unless Brazil-Specific — Never Default to It

**Category**: High-Cost Region Avoidance

**Rule**: ALWAYS avoid sa-east-1 (Sao Paulo) unless you have a Brazil-specific compliance or latency requirement. NEVER choose sa-east-1 for geographic diversity or "coverage of South America."

**Reason**: sa-east-1 is 30-50% more expensive than us-east-1 for EC2, RDS, and data transfer. A $5,000/month us-east-1 deployment costs $6,500-7,500/month in sa-east-1. For South American users, CloudFront from us-east-1 provides 50-100ms latency — acceptable for most applications. The 30-50% premium for sa-east-1 is rarely justified.

**Bad Example**: A US-based Laravel app with 2% of users in Brazil deploys to sa-east-1 "for South American users." Monthly bill: $7,200 (vs $5,000 us-east-1). The 2% of Brazilian users get 20ms latency instead of 80ms (no measurable conversion improvement). Waste: $2,200/month ($26,400/year).

**Good Example**: The app deploys to us-east-1 with CloudFront. Brazilian users get 60ms from CloudFront edge in Sao Paulo. Monthly bill: $5,000 + $100 CloudFront. Total: $5,100. Savings vs sa-east-1: $2,100/month.

**Exceptions**: Use sa-east-1 if: (1) Brazil's LGPD (Lei Geral de Proteção de Dados Pessoais) requires data to stay in Brazil, (2) your user base is >50% in Brazil and requires <20ms dynamic response latency, (3) you have a contractual obligation to host in Brazil.

**Consequences Of Violation**: Paying 30-50% premium on all infrastructure for the lifetime of the deployment. $2,000-10,000/month extra for a medium-to-large deployment. No business benefit (latency improvement is marginal for most use cases).

---

## R5: Choose Region Based on User Latency + Compliance + Cost — Never Any Single Factor Alone

**Category**: Decision Framework

**Rule**: ALWAYS evaluate region selection on three axes: user latency (conversion impact), compliance (regulatory requirements), and cost (infrastructure pricing). NEVER optimize for one factor in isolation.

**Reason**: Choosing purely by cost (us-east-1) may violate GDPR or cause 250ms latency for Asian users. Choosing purely by latency (region closest to users) may triple infrastructure cost. Choosing purely by compliance may lock you into a region with high prices and limited services. The correct region balances all three factors. For most applications: primary in us-east-1 (cost + wide service availability), CloudFront for latency, and add regional infrastructure only when compliance or latency demands it.

**Bad Example**: A team chooses eu-west-1 for "proximity to EU users" (latency optimization). Monthly cost: $6,300 (vs $5,500 us-east-1). 80% of users are in the US. US users get 80ms latency (vs 15ms from us-east-1). Compliance doesn't require EU hosting. All three factors are suboptimal: higher cost, worse latency for majority of users, unnecessary compliance restriction.

**Good Example**: The team evaluates: (1) User distribution: 60% US, 30% EU, 10% Asia. (2) Compliance: GDPR applies (EU user data must stay in EU). (3) Cost: us-east-1 is cheapest. Decision: Primary in us-east-1 (60% of users get 15ms, lowest cost). EU user data in eu-west-1 (GDPR compliance). CloudFront for global cache. Asia: CloudFront edge only (10% of users don't justify regional infra). This balances all three factors.

**Exceptions**: If compliance or latency is non-negotiable (GDPR mandates EU region, real-time app needs <20ms per region), the decision is forced — accept the cost as a business requirement.

**Consequences Of Violation**: Suboptimal performance for users (single-factor cost optimization ignoring latency). Suboptimal cost (single-factor latency optimization ignoring pricing). Compliance violations (single-factor cost optimization ignoring data residency).

---

## R6: Plan for Multi-Region from Start if Global — Never Retrofitted

**Category**: Architectural Planning

**Rule**: ALWAYS design event-driven, region-independent architecture from day one if you expect to go multi-region. NEVER attempt to retrofit a single-region monolith for multi-region operation.

**Reason**: Retrofitting multi-region requires: splitting a shared database into regional instances, converting synchronous calls to async events, rethinking session/cache strategy, adding cross-region replication, and rewriting deployment pipelines. This is 3-6 months of engineering work and carries significant risk of data loss or inconsistency during migration. Designing from the start with region-independent services (SQS for cross-region events, local caches, database-per-region write affinity, feature flags for regional routing) costs minimal upfront effort and enables multi-region in days, not months.

**Bad Example**: A Laravel SaaS with 500K MAU must add EU multi-region for GDPR compliance. The current app: shared RDS database in us-east-1, shared Redis cache, synchronous API calls between services, hardcoded database connections. Estimated retrofit timeline: 6 months. Risk: data loss during migration, extended downtime, 3-week EU-only freeze.

**Good Example**: From day one, the app uses: (1) per-region database connections configurable via env, (2) SQS for cross-region event sync, (3) local ElastiCache per region, (4) feature flags for routing. When EU multi-region is needed: (1) deploy EU infrastructure (2 days), (2) configure Route53 geo-routing (1 hour), (3) enable EU database write forwarding (1 day). Total: <1 week.

**Exceptions**: If you have <100K MAU and no multi-region plans within 2 years, a single-region monolith is fine. The engineering overhead of "designing for multi-region" (event-driven architecture, region-independent services) may not be justified until multi-region is on the roadmap.

**Consequences Of Violation**: 3-6 months of engineering time to retrofit multi-region. High risk of data inconsistency during migration. Extended downtime during cutover. Business opportunity cost (cannot enter new regions quickly to meet compliance or user demand).
