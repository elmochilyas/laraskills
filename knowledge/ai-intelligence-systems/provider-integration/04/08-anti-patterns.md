# ECC Anti-Patterns — Error Handling & Retry Strategies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | LLM Provider Abstraction & Integration |
| **Knowledge Unit** | Error Handling & Retry Strategies |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Immediate Retry — No Backoff Between Retries
2. Infinite Retry — No Maximum Retry Count
3. One-Size-Fits-All Retry Policy
4. Retrying Non-Retryable Errors
5. No Circuit Breaker — Retrying Against Overloaded Provider

---

## Repository-Wide Anti-Patterns

- Silent Failure — returning generic error without logging provider-specific details
- Retry Spiral — multiple services retrying simultaneously without jitter

---

## Anti-Pattern 1: Immediate Retry — No Backoff Between Retries

### Category
Reliability

### Description
Retrying immediately (or with a fixed short delay) after a rate limit or server error — the provider hasn't recovered in milliseconds.

### Why It Happens
Developers implement a simple retry loop without understanding the need for backoff.

### Warning Signs
- `sleep(1)` between retries regardless of attempt
- Rate limit errors still occur on retry 2 and 3
- Provider receives burst of requests from retries

### Why It Is Harmful
Without exponential backoff, retries arrive during the provider's rate limit window or while the server is still overloaded. Each retry consumes API quota and adds latency without increasing success probability. The thundering herd effect amplifies the provider's load, potentially triggering broader rate limiting or downtime.

### Preferred Alternative
Use exponential backoff with jitter. Base delay doubles each attempt (1s, 2s, 4s). Add ±10% jitter to spread retries.

### Detection Checklist
- [ ] Fixed retry delay regardless of attempt count
- [ ] Rate limit error on every retry
- [ ] No jitter between retries

### Related Rules
Use Exponential Backoff with Jitter (05-rules.md)

---

## Anti-Pattern 2: Infinite Retry — No Maximum Retry Count

### Category
Reliability

### Description
Retry loop without a maximum attempt limit — consumers hang forever during sustained provider outages.

### Preferred Alternative
Set a max retry count (3–5). Exhaust all retries, then fall back or fail.

### Detection Checklist
- [ ] Retry loop without max attempt check
- [ ] Long-running requests during outages
- [ ] No feedback to user

---

## Anti-Pattern 3: One-Size-Fits-All Retry Policy

### Category
Performance

### Description
The same retry configuration (max attempts, backoff base, circuit breaker thresholds) for all providers.

### Preferred Alternative
Configure retry policies per provider based on their documented rate limit windows and error patterns.

### Detection Checklist
- [ ] Shared retry config for all providers
- [ ] Provider-specific rate limits ignored
- [ ] Suboptimal retry behavior per provider

---

## Anti-Pattern 4: Retrying Non-Retryable Errors

### Category
Reliability

### Description
Retrying authentication errors (401), invalid request errors (400), or content policy violations — will always fail.

### Preferred Alternative
Classify errors as retryable (429, 5xx, timeouts) or non-retryable (4xx except 429). Fail immediately on non-retryable.

### Detection Checklist
- [ ] 401 errors retried
- [ ] Content policy violations retried
- [ ] Invalid request retried
- [ ] Wasted tokens on retries

---

## Anti-Pattern 5: No Circuit Breaker

### Category
Reliability

### Description
Continuing to retry against an overloaded or failing provider without a circuit breaker — makes the problem worse.

### Preferred Alternative
Implement circuit breaker: after N consecutive failures, stop requests for a cooldown period. Use half-open state for recovery.

### Detection Checklist
- [ ] No circuit breaker implementation
- [ ] Retries continue during sustained outage
- [ ] Provider load amplified by retries
