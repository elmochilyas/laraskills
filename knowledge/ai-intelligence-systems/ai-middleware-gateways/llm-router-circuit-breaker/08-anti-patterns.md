# ECC Anti-Patterns — LLM Router & Circuit Breaker

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | LLM Router & Circuit Breaker |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Simple Round-Robin Routing Without Health Checks
2. Circuit Breaker Without Half-Open Recovery State
3. All Models in Same Circuit Breaker — One Failure Blocks All
4. No Affinity — Same Conversation Routed to Different Models
5. Router Without Latency-Based Steering

---

## Repository-Wide Anti-Patterns

- Routing decisions not logged — can't debug routing issues
- Router not tested with circuit breaker open state

---

## Anti-Pattern 1: Round-Robin Without Health Checks

### Category
Reliability

### Description
Routing alternates between providers regardless of health — requests sent to degraded providers.

### Preferred Alternative
Check circuit breaker state and health scores before routing. Skip unhealthy providers.

### Detection Checklist
- [ ] Round-robin regardless of health
- [ ] Degraded providers receive traffic
- [ ] No health-aware routing

---

## Anti-Pattern 2: Circuit Breaker Without Half-Open Recovery

### Category
Reliability

### Description
Circuit breaker stays open indefinitely — provider never gets a chance to recover.

### Preferred Alternative
Implement half-open state. Allow test requests after cooldown. Close circuit on success, stay open on failure.

### Detection Checklist
- [ ] No half-open state
- [ ] Provider never retested
- [ ] Manual intervention needed to recover
