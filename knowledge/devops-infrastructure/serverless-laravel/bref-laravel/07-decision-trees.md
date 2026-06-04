# Decision Trees: Bref Laravel

## Serverless Adoption

**Traffic pattern:**
- Highly variable with long idle periods → Bref (zero cost when idle)
- Consistent traffic → Traditional server or Vapor
- Predictable peaks → Bref with provisioned concurrency

**AWS investment:**
- Already on AWS → Bref integrates naturally
- Multi-cloud → Consider platform-agnostic approach

## Cold Start Strategy

**Latency requirements:**
- < 200ms p95 → Provisioned concurrency required
- < 500ms p95 → Config cache + route cache may be sufficient
- < 1s p95 → Standard cold start acceptable
