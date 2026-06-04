# ECC Anti-Patterns — API7 AI Gateway

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | API7 AI Gateway |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Rate Limiting at Gateway Level
2. No API Key Rotation Through Gateway
3. Gateway Without Request/Response Logging
4. No Caching at Gateway for Repeated Queries
5. Gateway Without Provider Failover

---

## Repository-Wide Anti-Patterns

- Gateway bypassed for internal service-to-service calls
- Gateway version not tracked for compatibility

---

## Anti-Pattern 1: No Rate Limiting at Gateway

### Category
Security

### Description
Gateway configured without rate limits — burst traffic reaches provider, triggering account-level rate limits.

### Preferred Alternative
Configure per-route, per-key rate limits at gateway level. Return 429 before reaching provider.

### Detection Checklist
- [ ] No gateway rate limits
- [ ] Provider rate limits triggered by bursts
- [ ] Rate limits only at application level

---

## Anti-Pattern 2: No Provider Failover at Gateway

### Category
Reliability

### Description
Gateway forwards to single provider with no failover — provider outage = no AI features.

### Preferred Alternative
Configure provider failover at gateway. Gateway retries alternative provider on failure.

### Detection Checklist
- [ ] Single provider at gateway
- [ ] No gateway-level failover
- [ ] Provider outage affects all users
