# Knowledge Unit: Agent Middleware Pipeline

## Metadata

- **ID:** KU-025 (AI Middleware)
- **Subdomain:** AI Middleware & Gateway Architecture
- **Slug:** agent-middleware-pipeline
- **Version:** 1.0.0
- **Maturity:** Stable (Laravel AI SDK v0.4.2+)
- **Status:** Published

## Executive Summary

The agent middleware pipeline intercepts and modifies prompts before they reach the LLM (pre-send) and responses after they return (post-receive). It enables cross-cutting concerns like prompt injection detection, PII redaction, logging, cost metering, and content moderation without polluting agent or tool logic.

## Core Concepts

- **`HasMiddleware` trait**: Laravel AI SDK trait applied to Agent classes to enable middleware stack
- **Pre-send middleware**: Intercepts the `AgentRequest` before it is dispatched to the provider — used for prompt augmentation, injection scanning, input validation
- **Post-receive middleware**: Intercepts the `AgentResponse` after provider returns — used for output validation, PII reinsertion, logging, cost recording
- **`make:agent-middleware`**: Artisan generator that scaffolds a middleware class implementing `AgentMiddleware` contract
- **Pipeline order**: Middleware executes in declared order; order matters for injection defense (scan before PII redaction)
- **Middleware bypass**: Agents can bypass middleware via `->withoutMiddleware()` for specific calls (emergency overrides, admin tools)

## Mental Models

- **HTTP Middleware for AI**: Exactly like Laravel HTTP middleware — request passes through a stack before reaching the controller (LLM), response passes back through on return. Each layer inspects, transforms, or rejects.
- **Security Checkpoint**: Think of airport security — pre-send is the pre-board screening (ID check, bag scan), post-receive is customs on arrival. Different checks happen at each stage.
- **Assembly Line**: Pre-send middleware stamps, validates, and packages the prompt; the LLM is the machine; post-receive middleware inspects and sorts the output.

## Internal Mechanics

The Laravel AI SDK's middleware trait uses a pipeline pattern. When `$agent->call('prompt')` is invoked:

1. The `AgentRequest` object is built from the prompt, system instructions, tool definitions, and conversation history
2. Pre-send middleware stack is invoked via `array_reduce`, each middleware calling `$next($request)` or returning a modified `AgentRequest`
3. Any middleware can short-circuit by returning a synthetic response, preventing the actual LLM call
4. The LLM is called with the (possibly modified) request
5. Post-receive middleware stack processes the `AgentResponse`
6. Middleware can throw exceptions (block content), modify responses, or append metadata

```php
class InjectionDetectionMiddleware implements AgentMiddleware
{
    public function handle(AgentRequest $request, Closure $next): mixed
    {
        if (InjectionPatterns::matches($request->content)) {
            throw new BlockedContentException('Prompt injection pattern detected');
        }

        return $next($request);
    }

    public function receive(AgentResponse $response, Closure $next): mixed
    {
        // Post-receive: check response for injected instructions
        if ($response->containsSuspiciousContent()) {
            $response->flagForReview();
        }

        return $next($response);
    }
}
```

## Patterns

- **Registration via `middleware()` method**: Agents override `middleware()` to return an array of middleware class names
- **Conditional middleware**: Use agent constructor flags or runtime checks to conditionally register middleware
- **Global middleware**: Register middleware on all agents via `AiServiceProvider::registerMiddleware()` in the service provider
- **Middleware groups**: Define named groups (e.g., `'strict' => [InjectionScan::class, PiiRedact::class]`) for reusability
- **Async middleware**: For expensive operations (external API calls to moderation services), use queued middleware that marks content for async review

## Architectural Decisions

- **Decision**: Separate pre-send and post-receive hooks vs. single middleware method → Two-phase interface (`handle` and `receive`). Reason: Middleware often needs different logic for request vs. response; a single method forces type-checking and reduces clarity.
- **Decision**: Middleware stack on Agent only vs. global pipeline → Per-agent middleware with a global registration option. Reason: Different agents need different security postures; a customer-support agent needs PII redaction but a code-generation agent doesn't.
- **Decision**: Middleware can short-circuit (return synthetic response) vs. only transform → Allow short-circuit. Reason: Injection detection must block the request before it reaches the LLM, avoiding wasted tokens and security breaches.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Per-agent middleware | Fine-grained control per use case | More boilerplate for similar agents |
| Pre-send injection scanning | Blocks malicious prompts before LLM cost | Adds latency to every agent call |
| Middleware short-circuit | Saves tokens on blocked requests | Synthetic responses must be consistent with real ones |

## Performance Considerations

- Each middleware adds latency — injection detection via regex is ~1ms, but PII redaction using a local model can be 10-50ms
- Middleware order matters: put fast-fail middleware (injection pattern scan) before expensive middleware (PII pseudonymization)
- Post-receive middleware runs after the LLM has already consumed tokens — middleware that rejects responses wastes the entire generation cost
- Global middleware on every agent call multiplies latency across all AI interactions in the application

## Production Considerations

- Log middleware execution duration — unexpectedly slow middleware degrades user experience
- Use middleware metrics: count blocked requests, track which middleware is triggered most frequently
- Implement middleware timeouts — a stuck middleware should not hang the entire agent call
- Test middleware in isolation with `AgentRequest` and `AgentResponse` factories
- Version middleware configurations — changes to middleware stack can break existing agent behaviors
- Consider middleware failover: if PII redaction service is down, fall through to a no-op rather than failing the agent call

## Common Mistakes

- Placing PII redaction before injection detection — redacted content may hide injection patterns (e.g., `[REDACTED]` bypasses keyword filters)
- Writing stateful middleware that leaks data between requests — middleware instances may be reused; reset state in `handle()`
- Forgetting post-receive PII reinsertion — redacted PII is lost from the response, breaking functionality that needs the original data
- Over-using middleware for business logic — middleware is for cross-cutting concerns; move domain-specific logic to tools
- Not testing middleware independently — middleware bugs break all agent calls silently

## Failure Modes

- **Injection detector false positive**: Legitimate user prompt gets blocked — implement classification confidence thresholds and admin override endpoints
- **PII redactor crashes**: `PiiPseudonymizer` throws exception mid-redaction — wrap in try/catch that falls through to pass-through mode
- **Middleware order misconfiguration**: PII redaction runs before injection scan, allowing redacted PII tokens to bypass pattern detection — enforce groups with validated ordering
- **Synthetic response inconsistency**: Short-circuited middleware returns a response that agent consumers don't expect — standardize synthetic response format
- **Middleware timeout**: External API-based moderation service hangs — wrap external calls with HTTP timeout lower than the agent timeout

## Ecosystem Usage

- **Laravel AI SDK `HasMiddleware` trait**: Core middleware pipeline, `make:agent-middleware` generator
- **`fr3on/laravel-guardrail`**: Pre-built security middleware for prompt injection defense, PII redaction, output validation
- **`MrPunyapal/laravel-ai-aegis`**: Security middleware package with 30+ injection patterns, configurable actions (block, flag, log)
- **`subhashladumor1/laravel-ai-guard`**: Middleware for budget enforcement, cost tracking, and content scanning
- **`mubseoul/laravel-llm-observability`**: Observability middleware for token tracking, latency measurement, and audit logging

## Related Knowledge Units

- KU-002: LiteLLM Proxy (external gateway middleware)
- KU-026: Prompt Injection Defense (pre-send injection patterns)
- KU-027: PII Pseudonymization (PII redaction patterns)
- KU-029: Tool Argument Validation (middleware for tool args)
- KU-001: Laravel AI SDK Architecture (agent foundation)

## Research Notes

- Source: Laravel AI SDK documentation — https://laravel.com/docs/13.x/ai-sdk#agent-middleware
- Source: fr3on/laravel-guardrail GitHub (v1.x, stable)
- Source: MrPunyapal/laravel-ai-aegis GitHub (v2.x, stable)
- The SDK's middleware architecture is inspired by Laravel HTTP middleware but adapted for bidirectional (request/response) interception
- The middleware pipeline is resolver-based — middleware classes are resolved from the container, enabling DI of services like `AegisScanner` or `PiiRedactor`
- Future direction: middleware groups, middleware priority sorting, async middleware for expensive operations
