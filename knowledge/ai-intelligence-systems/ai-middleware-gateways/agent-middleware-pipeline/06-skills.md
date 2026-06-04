# Skills

## Skill 1: Build an agent middleware pipeline for cross-cutting AI concerns

### Purpose
Create a composable middleware pipeline for Laravel AI SDK agents that intercepts and modifies prompts before sending to the LLM (pre-send) and responses after return (post-receive), enabling prompt injection detection, PII redaction, cost metering, and content moderation without polluting agent or tool logic.

### When To Use
- Use when you need cross-cutting concerns (injection detection, PII redaction, logging) across multiple agents
- Use when you want to add security or observability to AI requests without modifying agent classes
- Use when you need different middleware configurations per agent type
- Use when building a multi-agent system with shared requirements

### When NOT To Use
- Do NOT use for single-agent applications with no cross-cutting concerns
- Do NOT use when middleware order dependencies are not understood (injection detection must run before PII redaction)
- Do NOT use when you need request-level bypass of all middleware — use per-agent configuration instead

### Prerequisites
- Laravel AI SDK installed with `HasMiddleware` trait available
- Agent classes defined and using `HasMiddleware`
- Understanding of middleware ordering requirements (security first)
- At least one middleware implementation to test the pipeline

### Inputs
- Agent class using `HasMiddleware` trait
- Middleware classes implementing `AgentMiddleware` contract
- `AgentRequest` and `AgentResponse` objects

### Workflow
1. Identify cross-cutting concerns needed: injection detection, PII redaction, cost logging, content moderation
2. Create middleware classes using `php artisan make:agent-middleware` for each concern
3. Implement `AgentMiddleware` contract with pre-send and post-receive handlers
4. Configure middleware on each Agent class via `middleware()` method:
   ```php
   class CustomerSupportAgent extends Agent
   {
       protected function middleware(): array
       {
           return [
               InjectionScan::class,
               PiiRedact::class,
               CostLogger::class,
               ContentModeration::class,
           ];
       }
   }
   ```
5. Order middleware correctly: injection detection before PII redaction (security first)
6. Use `->withoutMiddleware()` only for specific emergency overrides or admin tools
7. Test each middleware individually and in combination with integration tests
8. Monitor middleware performance — each adds latency to the AI request

### Validation Checklist
- [ ] Middleware executes in the declared order
- [ ] Pre-send middleware modifies AgentRequest before provider dispatch
- [ ] Post-receive middleware processes AgentResponse before returning to caller
- [ ] Injection detection runs before PII redaction (critical security ordering)
- [ ] Per-agent middleware configuration works (different agents, different pipelines)
- [ ] `withoutMiddleware()` bypass works correctly for authorized overrides
- [ ] Middleware failures are handled gracefully (fail-open vs. fail-closed decision)
- [ ] Each middleware adds acceptable latency (<5ms)
- [ ] Agent-specific middleware doesn't affect other agents

### Common Failures
- **Wrong middleware order**: Injection detection after PII redaction — placeholders mask injection patterns
- **Global-only configuration**: All agents forced into same pipeline — different agents need different security postures
- **Unhandled middleware failure**: One middleware throws exception, entire request fails — implement graceful fallbacks
- **Middleware bypass misuse**: `withoutMiddleware()` used in production flows, not emergency overrides
- **State leakage**: Middleware shares mutable state across requests — ensure statelessness

### Decision Points
- **Fail-open vs. fail-closed**: If middleware fails, should the request proceed or be blocked? Fail-closed for security, fail-open for observability-only middleware
- **Middleware per-agent vs. global**: Use per-agent configuration for most middleware; global only for logging, basic auth
- **Synchronous vs. queued post-receive**: Heavy post-processing (logging, analytics) should be queued

### Performance Considerations
- Each pre-send middleware adds latency before the LLM call — minimize heavy processing (injection scanning should be fast)
- Post-receive middleware runs after the LLM response — slower operations here don't block the LLM call
- Consider queuing expensive post-receive operations (cost logging, analytics)
- Middleware that calls external APIs (PII detection service) should have timeouts and circuit breakers

### Security Considerations
- Security middleware (injection detection, content moderation) should be fail-closed — block on failure
- Observability middleware may log sensitive data — implement data masking
- Middleware bypass (`withoutMiddleware()`) should require elevated privileges
- Never put secrets or credentials in middleware configuration

### Related Rules
- R1: Always run injection detection middleware before PII redaction middleware
- R2: Use per-agent middleware configuration, never a global-only pipeline

### Related Skills
- Implement prompt injection defense with semantic firewalls
- Configure PII pseudonymization for AI prompts and responses
- Implement cost tracking with agent middleware
- Set up OpenTelemetry tracing for AI request lifecycle

### Success Criteria
- Middleware pipeline executes reliably for every AI request
- Security middleware (injection detection) runs before transformation middleware (PII redaction)
- Different agents have different middleware configurations as needed
- Each middleware adds predictable, acceptable latency
- Middleware failures are handled without crashing the application
- Emergency bypass (`withoutMiddleware()`) works correctly for authorized uses
