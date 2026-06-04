# ECC Anti-Patterns — Multi-Provider Text Generation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | LLM Provider Abstraction & Integration |
| **Knowledge Unit** | Multi-Provider Text Generation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Hardcoded Provider Selection Without Fallback
2. Ignoring Provider-Specific Rate Limits Per Model
3. Same Retry Policy Across All Providers
4. Not Accounting for Provider Response Format Differences
5. Routing All Traffic to One Provider Without Health Checks

---

## Repository-Wide Anti-Patterns

- Silent provider failures — provider fails without alerting
- No provider failover orchestration at the application layer

---

## Anti-Pattern 1: Hardcoded Provider Selection Without Fallback

### Category
Reliability

### Description
Application hardcodes a single provider with no fallback — any provider outage breaks all AI features.

### Why It Happens
Development starts with one provider (usually OpenAI) and fallback is deprioritized.

### Warning Signs
- Single `.env` provider configuration
- No try/catch around provider calls
- No fallback provider configured

### Why It Is Harmful
When the sole provider experiences an outage, rate-limiting, or API change, every AI feature in the application becomes unavailable. Users see errors or blank responses. Recovery requires a code deployment or configuration change. Multi-provider setups provide resilience by failing over to a backup provider automatically.

### Preferred Alternative
Configure at least two providers. Implement fallback logic: try primary provider, catch errors, try secondary provider.

### Detection Checklist
- [ ] Single provider configured
- [ ] No fallback logic
- [ ] Provider outage = full AI feature outage

### Related Rules
Configure at Least Two Providers for Production (05-rules.md)

---

## Anti-Pattern 2: Ignoring Provider-Specific Rate Limits Per Model

### Category
Performance

### Description
Same rate limit configuration applied to all models, ignoring that different models (GPT-4 vs GPT-3.5) have different rate limit tiers.

### Preferred Alternative
Track rate limits per provider per model. Adjust retry timing based on model-specific limits.

### Detection Checklist
- [ ] Same RPM/TPM for all models
- [ ] Rate limit errors more frequent on cheaper models
- [ ] No model-aware rate limiting

---

## Anti-Pattern 3: Same Retry Policy Across All Providers

### Category
Reliability

### Description
Identical backoff, max attempts, and circuit breaker settings for all providers.

### Preferred Alternative
Configure retry policies per provider based on their documented behavior.

### Detection Checklist
- [ ] Single RetryPolicy instance for all providers
- [ ] Provider-specific retry differences ignored

---

## Anti-Pattern 4: Not Accounting for Provider Response Format Differences

### Category
Reliability

### Description
Application code assumes all providers return identical response structures — crashes on provider switch.

### Preferred Alternative
Use the standardized `ChatResponse` DTO. Do not access provider-specific response fields.

### Detection Checklist
- [ ] Provider-specific field access in application
- [ ] Provider switch causes response parsing errors

---

## Anti-Pattern 5: Routing All Traffic to One Provider Without Health Checks

### Category
Reliability

### Description
All requests go to the primary provider until total failure, rather than distributing based on provider health.

### Preferred Alternative
Implement health-check-based routing. Periodically verify provider availability and adjust traffic distribution.

### Detection Checklist
- [ ] No provider health checks
- [ ] All traffic to single provider until outage
- [ ] No partial failover (all-or-nothing)
