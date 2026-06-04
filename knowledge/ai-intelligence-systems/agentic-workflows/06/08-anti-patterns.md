# ECC Anti-Patterns — Agent Error Recovery

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Agent Error Recovery |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Try/Catch Around Agent Execution — Unhandled ProviderException
2. Retrying All Errors Including Non-Retryable
3. No Fallback Provider When Primary Fails
4. Tool Exception Kills Entire Agent — No Graceful Degradation
5. No Logging on Agent Failure — Hard to Debug

---

## Repository-Wide Anti-Patterns

- Generic error messages returned to user — no actionable info
- Circuit breaker not integrated with agent error recovery

---

## Anti-Pattern 1: No Try/Catch Around Agent Execution

### Category
Reliability

### Description
Agent calls wrapped in no error handling — `ProviderException` propagates as 500 error to user.

### Preferred Alternative
Wrap agent execution in try/catch. Handle `ProviderException` subtypes appropriately (retry, fallback, fail).

### Detection Checklist
- [ ] No try/catch around agent call
- [ ] Provider exception as 500 error
- [ ] User sees raw error message

---

## Anti-Pattern 2: Retrying All Errors

### Category
Reliability

### Description
Same retry logic for rate limits (429) and auth errors (401) — wasting tokens on non-retryable.

### Preferred Alternative
Classify errors. Retry rate limits and 5xx. Fail immediately on 4xx (except 429).

### Detection Checklist
- [ ] Auth errors retried
- [ ] Content policy violations retried
- [ ] Non-retryable errors wasting retries
