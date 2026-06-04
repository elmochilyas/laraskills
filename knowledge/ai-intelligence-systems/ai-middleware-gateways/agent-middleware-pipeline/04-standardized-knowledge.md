---
id: KU-025 (AI Middleware)
title: "Agent Middleware Pipeline"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/09-ai-middleware-gateways/agent-middleware-pipeline/04-standardized-knowledge.md"
---

# Agent Middleware Pipeline

## Overview

The agent middleware pipeline intercepts and modifies prompts before they reach the LLM (pre-send) and responses after they return (post-receive). It enables cross-cutting concerns like prompt injection detection, PII redaction, logging, cost metering, and content moderation without polluting agent or tool logic.

## Core Concepts

- **`HasMiddleware` trait**: Laravel AI SDK trait applied to Agent classes to enable middleware stack
- **Pre-send middleware**: Intercepts the `AgentRequest` before it is dispatched to the provider â€” used for prompt augmentation, injection scanning, input validation
- **Post-receive middleware**: Intercepts the `AgentResponse` after provider returns â€” used for output validation, PII reinsertion, logging, cost recording
- **`make:agent-middleware`**: Artisan generator that scaffolds a middleware class implementing `AgentMiddleware` contract
- **Pipeline order**: Middleware executes in declared order; order matters for injection defense (scan before PII redaction)
- **Middleware bypass**: Agents can bypass middleware via `->withoutMiddleware()` for specific calls (emergency overrides, admin tools)

## When To Use

- Production applications requiring Agent Middleware Pipeline functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Registration via `middleware()` method**: Agents override `middleware()` to return an array of middleware class names
- **Conditional middleware**: Use agent constructor flags or runtime checks to conditionally register middleware
- **Global middleware**: Register middleware on all agents via `AiServiceProvider::registerMiddleware()` in the service provider
- **Middleware groups**: Define named groups (e.g., `'strict' => [InjectionScan::class, PiiRedact::class]`) for reusability
- **Async middleware**: For expensive operations (external API calls to moderation services), use queued middleware that marks content for async review

- **HTTP Middleware for AI**: Exactly like Laravel HTTP middleware â€” request passes through a stack before reaching the controller (LLM), response passes back through on return. Each layer inspects, transforms, or rejects.
- **Security Checkpoint**: Think of airport security â€” pre-send is the pre-board screening (ID check, bag scan), post-receive is customs on arrival. Different checks happen at each stage.
- **Assembly Line**: Pre-send middleware stamps, validates, and packages the prompt; the LLM is the machine; post-receive middleware inspects and sorts the output.

## Architecture Guidelines

- **Decision**: Separate pre-send and post-receive hooks vs. single middleware method â†’ Two-phase interface (`handle` and `receive`). Reason: Middleware often needs different logic for request vs. response; a single method forces type-checking and reduces clarity.
- **Decision**: Middleware stack on Agent only vs. global pipeline â†’ Per-agent middleware with a global registration option. Reason: Different agents need different security postures; a customer-support agent needs PII redaction but a code-generation agent doesn't.
- **Decision**: Middleware can short-circuit (return synthetic response) vs. only transform â†’ Allow short-circuit. Reason: Injection detection must block the request before it reaches the LLM, avoiding wasted tokens and security breaches.

## Performance Considerations

- Each middleware adds latency â€” injection detection via regex is ~1ms, but PII redaction using a local model can be 10-50ms
- Middleware order matters: put fast-fail middleware (injection pattern scan) before expensive middleware (PII pseudonymization)
- Post-receive middleware runs after the LLM has already consumed tokens â€” middleware that rejects responses wastes the entire generation cost
- Global middleware on every agent call multiplies latency across all AI interactions in the application

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Per-agent middleware | Fine-grained control per use case | More boilerplate for similar agents |
| Pre-send injection scanning | Blocks malicious prompts before LLM cost | Adds latency to every agent call |
| Middleware short-circuit | Saves tokens on blocked requests | Synthetic responses must be consistent with real ones |

## Security Considerations

- Log middleware execution duration â€” unexpectedly slow middleware degrades user experience
- Use middleware metrics: count blocked requests, track which middleware is triggered most frequently
- Implement middleware timeouts â€” a stuck middleware should not hang the entire agent call
- Test middleware in isolation with `AgentRequest` and `AgentResponse` factories
- Version middleware configurations â€” changes to middleware stack can break existing agent behaviors
- Consider middleware failover: if PII redaction service is down, fall through to a no-op rather than failing the agent call

## Common Mistakes

- Placing PII redaction before injection detection â€” redacted content may hide injection patterns (e.g., `[REDACTED]` bypasses keyword filters)
- Writing stateful middleware that leaks data between requests â€” middleware instances may be reused; reset state in `handle()`
- Forgetting post-receive PII reinsertion â€” redacted PII is lost from the response, breaking functionality that needs the original data
- Over-using middleware for business logic â€” middleware is for cross-cutting concerns; move domain-specific logic to tools
- Not testing middleware independently â€” middleware bugs break all agent calls silently

## Anti-Patterns

- **Injection detector false positive**: Legitimate user prompt gets blocked â€” implement classification confidence thresholds and admin override endpoints
- **PII redactor crashes**: `PiiPseudonymizer` throws exception mid-redaction â€” wrap in try/catch that falls through to pass-through mode
- **Middleware order misconfiguration**: PII redaction runs before injection scan, allowing redacted PII tokens to bypass pattern detection â€” enforce groups with validated ordering
- **Synthetic response inconsistency**: Short-circuited middleware returns a response that agent consumers don't expect â€” standardize synthetic response format
- **Middleware timeout**: External API-based moderation service hangs â€” wrap external calls with HTTP timeout lower than the agent timeout

## Examples

The following ecosystem packages provide reference implementations:

- **Laravel AI SDK `HasMiddleware` trait**: Core middleware pipeline, `make:agent-middleware` generator
- **`fr3on/laravel-guardrail`**: Pre-built security middleware for prompt injection defense, PII redaction, output validation
- **`MrPunyapal/laravel-ai-aegis`**: Security middleware package with 30+ injection patterns, configurable actions (block, flag, log)
- **`subhashladumor1/laravel-ai-guard`**: Middleware for budget enforcement, cost tracking, and content scanning
- **`mubseoul/laravel-llm-observability`**: Observability middleware for token tracking, latency measurement, and audit logging

## Related Topics

- KU-002: LiteLLM Proxy (external gateway middleware)
- KU-026: Prompt Injection Defense (pre-send injection patterns)
- KU-027: PII Pseudonymization (PII redaction patterns)
- KU-029: Tool Argument Validation (middleware for tool args)
- KU-001: Laravel AI SDK Architecture (agent foundation)

## AI Agent Notes

- When asked about Agent Middleware Pipeline, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

