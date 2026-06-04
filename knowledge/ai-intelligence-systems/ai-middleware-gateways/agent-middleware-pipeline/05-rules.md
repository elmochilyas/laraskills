---
id: KU-025 (AI Middleware)
title: "Agent Middleware Pipeline - Rules"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Agent Middleware Pipeline

### R1: Always run injection detection middleware before PII redaction middleware
- **Category:** Security
- **Rule:** Order the middleware pipeline so that injection detection executes before PII redaction; never reverse this order.
- **Reason:** PII redaction replaces sensitive values with placeholder tokens. If injection detection runs after redaction, the placeholder tokens may mask or bypass injection pattern matching (e.g., `[REDACTED]` hiding `ignore previous instructions`).
- **Bad Example:** Middleware array showing `[PiiRedact::class, InjectionScan::class]` — PII is redacted before injection patterns are checked.
- **Good Example:** `[InjectionScan::class, PiiRedact::class]` — injection patterns are detected in the original text, then PII is redacted.
- **Exceptions:** When both middleware are independent and neither modifies the content the other checks.
- **Consequences of Violation:** Injection payloads hidden inside PII pass through to the LLM, increasing the risk of successful prompt injection attacks.

### R2: Use per-agent middleware configuration, never a global-only pipeline
- **Category:** Architecture
- **Rule:** Configure middleware at the agent level via the `middleware()` method on each Agent class; use global registration only for truly universal middleware (logging, basic auth).
- **Reason:** Different agents need different security postures. A customer-support agent requires PII redaction, but a code-generation agent does not. Global-only configuration forces all agents into the same security profile.
- **Bad Example:** Registering all middleware globally in `AiServiceProvider::registerMiddleware()` so every agent runs the full pipeline regardless of need.
- **Good Example:** CustomerSupportAgent returns `[InjectionScan::class, PiiRedact::class]` while CodeGenAgent returns only `[InjectionScan::class]`.
- **Exceptions:** Authentication and base rate-limiting middleware that must apply uniformly.
- **Consequences of Violation:** Unnecessary latency on agents that don't need certain middleware; missing middleware on agents that do need specific protections.

### R3: Never allow post-receive middleware to run without pre-send counterpart for reversible transforms
- **Category:** Reliability
- **Rule:** When implementing a post-receive transform (e.g., PII de-redaction), ensure the corresponding pre-send transform (PII redaction) is configured in the same agent pipeline.
- **Reason:** Running de-redaction without redaction causes errors (missing tokens) or data leaks (real PII injected into responses that should have been redacted from the input).
- **Bad Example:** An agent with PII de-redaction in the post-receive middleware but no PII redaction in pre-send — the response has real PII that shouldn't have been sent.
- **Good Example:** A `PiiRedactMiddleware` that implements both `handle()` (redact pre-send) and `then()` (de-redact post-receive) as a paired middleware.
- **Exceptions:** Async or queued middleware where pre-send and post-receive are in different processes but still paired.
- **Consequences of Violation:** Data leakage in responses, broken token replacement that degrades UX, or runtime exceptions from missing placeholder values.

### R4: Implement short-circuit capability in pre-send middleware to reject requests before they reach the LLM
- **Category:** Cost Management
- **Rule:** Design pre-send middleware classes to return a synthetic `AgentResponse` (short-circuit) rather than calling `$next($prompt)` when a policy violation is detected.
- **Reason:** Allowing an injection or policy-violating request to reach the LLM wastes token cost and generates an unsafe response. Short-circuiting saves both money and security risk.
- **Bad Example:** An injection detection middleware that only logs the violation but still calls `$next($prompt)`, allowing the malicious prompt to reach the LLM.
- **Good Example:** When `InjectionScan::class` detects a high-confidence attack, it returns a `new AgentResponse(text: 'I cannot process this request')` without calling `$next()`.
- **Exceptions:** Soft-violation middleware that flags but does not block requests for review.
- **Consequences of Violation:** Payment for LLM tokens that process malicious prompts; potential harmful responses generated from injection attacks.
