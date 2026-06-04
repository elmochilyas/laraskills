# Skill: Design the Provider Abstraction Layer

## Purpose
Create an architectural layer that isolates application code from specific LLM provider APIs, enabling multi-provider support, failover, and future migrations without code changes.

## When To Use
- Multi-provider applications that need to switch providers without code changes
- Applications that want to avoid vendor lock-in with any single LLM provider
- Systems that use different providers for different tasks (chat, embedding, summarization)
- Production systems that need provider failover for reliability

## When NOT To Use
- Single-provider, single-model applications where switching is not anticipated
- Prototypes where adding abstraction overhead is premature
- Applications needing deep provider-specific features not representable in a common interface

## Prerequisites
- Understanding of provider API differences (OpenAI, Anthropic, Gemini, etc.)
- PHP 8.1+ with attributes support
- Service container for dependency injection

## Inputs
- Common provider operations (chat, embed, stream, tool calling)
- Provider-specific feature matrix
- Error handling requirements

## Workflow
1. Define a provider interface covering the 80% use case (chat, stream, embeddings, tools)
2. Add `supports(string $capability): bool` for feature detection
3. Use DTOs for request and response objects (not raw arrays or provider-native types)
4. Never leak provider-specific types to application code
5. Map provider errors to a common exception hierarchy
6. Implement decorators for cross-cutting concerns (retry, logging, caching, rate limiting)
7. Use lazy provider instantiation via factory pattern (don't load all providers at startup)
8. Implement feature detection via `supports()` and check before using capabilities
9. Keep the adapter layer focused on provider-specific logic; decorators handle cross-cutting

## Validation Checklist
- [ ] Provider interface covers common operations but is not bloated
- [ ] `supports()` method available for capability detection
- [ ] Request/response DTOs used at abstraction boundary (not arrays)
- [ ] No provider-specific types imported in application code
- [ ] Provider errors mapped to common exception hierarchy
- [ ] Cross-cutting concerns implemented as decorators, not inside adapters
- [ ] Provider instances created lazily (factory pattern)
- [ ] Feature detection checked before using capabilities

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Interface too large | Adding every capability | Design for 80% use case; extension mechanism for the rest |
| Provider lock-in | Leaking types to app code | Encapsulate all provider types in adapter layer |
| Untestable adapter | Global state for credentials | Pass credentials via constructor |
| Duplicated retry logic | Inside adapter | Extract to RetryDecorator |
| Slow startup | Eager provider loading | Use lazy instantiation (factory) |
| Runtime errors on unsupported feature | No capability check | Check `supports()` before using |

## Decision Points
- **Interface scope:** Minimal (chat/stream/embed) vs comprehensive (including vision, etc.)
- **DTO vs array:** DTOs for type safety vs arrays for flexibility
- **Extension mechanism:** Attributes vs nativeCall() vs provider-specific methods
- **Decorator composition:** Manual wiring vs service container tags vs AOP

## Performance/Security Considerations
- Use lazy provider instantiation — don't resolve all providers at startup
- Cache provider driver instances in the service container
- Implement retry, logging, and circuit breaker as composable decorators
- Never pass provider-native exception types to application code
- Feature detection should be O(1) (cached capability matrix, not API calls)

## Related Rules
- ku-01/05-rules.md (all rules)

## Related Skills
- Implement Provider Adapters
- Handle Provider-Specific Features
- Handle Provider Errors and Retry Strategies
- Configure Provider Timeouts and Retry Strategies

## Success Criteria
- Application code never imports provider-specific types
- Provider switching is a config change, not a code change
- All cross-cutting concerns are decorators wrapping the provider interface
- Provider instances are created lazily and cached
- Capability detection works via `supports()` before using features
