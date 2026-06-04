# ECC Anti-Patterns — Provider Failover & Circuit Breaker

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | LLM Provider Abstraction & Integration |
| **Knowledge Unit** | Provider Failover & Circuit Breaker |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Failover Without Circuit Breaker — Blind Retries to All Providers
2. All Providers in Same Circuit Breaker Group
3. Hardcoded Provider Order Without Dynamic Health Assessment
4. No Fallback Model — Same Model Name Fails on All Providers
5. Stateful Circuit Breaker Without Shared Backing Store

---

## Repository-Wide Anti-Patterns

- No failover testing — failover path never exercised until production outage
- Silent fallback — user not informed that a backup provider served the request

---

## Anti-Pattern 1: Failover Without Circuit Breaker — Blind Retries to All Providers

### Category
Reliability

### Description
Retrying the same request against every configured provider in sequence without checking provider health — wastes time and tokens on unhealthy providers.

### Why It Happens
Developers implement failover as a simple ordered list without integrating circuit breaker state.

### Warning Signs
- Sequential provider retries without health checks
- Every failover attempt tries a degraded provider
- Timeouts add up across all providers

### Why It Is Harmful
Without a circuit breaker, every request during a provider outage tries the failing provider first, waits for a timeout (often 30-60s), then moves to the next provider. If all providers are healthy except one, every request still pays the timeout cost for the unhealthy one. This turns a single-provider outage into system-wide slowdown.

### Preferred Alternative
Integrate circuit breaker with failover. Check circuit breaker state before attempting a provider. Skip providers in open circuit state.

### Detection Checklist
- [ ] No circuit breaker in failover loop
- [ ] Timeout cost paid for every unhealthy provider
- [ ] Provider outage causes system-wide slowdown

### Related Rules
Use Circuit Breaker with Failover (05-rules.md)

---

## Anti-Pattern 2: All Providers in Same Circuit Breaker Group

### Category
Architecture

### Description
Single circuit breaker for all providers — a failure on provider A opens the circuit for providers B and C.

### Preferred Alternative
One circuit breaker instance per provider. Shared state should track each provider independently.

### Detection Checklist
- [ ] Single breaker for all providers
- [ ] Provider A failure blocks provider B
- [ ] False negatives on healthy providers

---

## Anti-Pattern 3: Hardcoded Provider Order Without Dynamic Health Assessment

### Category
Reliability

### Description
Provider failover order is hardcoded (e.g., OpenAI -> Anthropic -> Ollama) regardless of current health.

### Preferred Alternative
Use dynamic ordering based on circuit breaker state, latency, and availability.

### Detection Checklist
- [ ] Static provider order in code
- [ ] No health-based reordering
- [ ] Degraded provider attempted first

---

## Anti-Pattern 4: No Fallback Model — Same Model Name Fails on All Providers

### Category
Reliability

### Description
Failover tries the same model name on each provider — if the model is deprecated or doesn't exist on the fallback, failover never succeeds.

### Preferred Alternative
Configure per-provider model mappings. Fallback provider uses a compatible alternative model.

### Detection Checklist
- [ ] Same model name on all providers
- [ ] Model doesn't exist on fallback provider
- [ ] Failover never succeeds

---

## Anti-Pattern 5: Stateful Circuit Breaker Without Shared Backing Store

### Category
Reliability

### Description
Circuit breaker state stored in-memory per process — under Octane or multiple workers, each process has independent breaker state.

### Preferred Alternative
Use a shared store (Redis, database) for distributed circuit breaker state.

### Detection Checklist
- [ ] In-memory circuit breaker under Octane
- [ ] Multiple workers with independent breaker states
- [ ] Each worker retries the same downed provider
