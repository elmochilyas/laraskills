# ECC Anti-Patterns — LiteLLM Proxy

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | LiteLLM Proxy |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Deploying Without LiteLLM Proxy — Direct Provider Calls
2. No Model-Specific Rate Limiting at Proxy
3. Proxy Without Cost Tracking — Can't Attribute Spend
4. No Provider Failover Configured in Proxy
5. Proxy Not Monitored for Latency and Errors

---

## Repository-Wide Anti-Patterns

- LiteLLM proxy deployed without authentication
- Proxy version not kept up-to-date with provider API changes

---

## Anti-Pattern 1: No LiteLLM Proxy

### Category
Architecture

### Description
Application calls providers directly instead of routing through LiteLLM — loses unified cost tracking, rate limiting, and failover.

### Preferred Alternative
Route all provider calls through LiteLLM proxy. Configure provider models, keys, and rate limits centrally.

### Detection Checklist
- [ ] Direct provider calls
- [ ] No LiteLLM proxy
- [ ] No centralized cost tracking

---

## Anti-Pattern 2: No Model-Specific Rate Limits

### Category
Reliability

### Description
Same rate limit for all models — expensive models overwhelmed by cheap model traffic.

### Preferred Alternative
Configure per-model rate limits in LiteLLM. Limit expensive model RPM separately.

### Detection Checklist
- [ ] Global rate limits
- [ ] Per-model limits not configured
- [ ] Expensive models overused
