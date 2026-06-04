# Skill: Generate Text with Multiple AI Providers

## Purpose
Use the Laravel AI SDK's provider-agnostic `Ai::call()` and `Agent::prompt()` for stateless and stateful text generation, switching providers via configuration without code changes.

## When To Use
- Production applications requiring multi-provider text generation
- Teams building AI-powered features within Laravel applications
- Scenarios where provider-agnostic abstraction is valuable

## When NOT To Use
- Simple applications that can rely on direct provider calls without abstraction
- Prototypes or experiments where abstraction overhead isn't justified

## Prerequisites
- `laravel/ai` package installed and configured
- Provider API keys in environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.)
- Default provider configured in `config/ai.php`

## Inputs
- Messages array with user input
- Optional provider override and model override
- Provider configuration for timeouts and retries

## Workflow
1. Install `laravel/ai` via Composer
2. Configure providers in `config/ai.php` with env-driven API keys
3. Set `AI_PROVIDER` environment variable for default provider selection
4. Use `Ai::call(messages: [...])` for simple text generation
5. Use `#[Provider]` and `#[Model]` attributes on agent classes for scoped configuration
6. Configure per-provider timeouts and retries in config
7. Handle provider-specific exceptions with try-catch blocks
8. Cache provider driver instances via the service container
9. Use `Ai::fake()` in tests to prevent real API calls
10. Set up environment-specific models (cheap in dev, capable in prod)

## Validation Checklist
- [ ] `Ai::call()` used with env-driven provider selection (not hardcoded provider strings)
- [ ] Per-provider timeouts and retries configured in `config/ai.php`
- [ ] Provider-specific exceptions handled (context length, content filtered, rate limits)
- [ ] Provider driver instances cached via container (not re-instantiated per request)
- [ ] `Ai::fake()` used in tests with `preventStrayPrompts()`
- [ ] Environment-specific model selection configured (cheap in dev, capable in prod)

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Provider hardcoded | String literal in `Ai::call()` | Use env-driven provider selection |
| Timeout too short | Single global timeout | Configure per-provider timeouts |
| Unhandled provider exception | Generic catch block | Handle provider-specific exception types |
| Secret exposed in config | API key in config file | Use environment variables |
| Real API calls in tests | Missing `Ai::fake()` | Apply fake in setUp or per test |

## Decision Points
- **Provider selection:** Env-driven (flexible) vs attribute-bound (deterministic)
- **Timeout policy:** Per-provider tuned vs single global timeout
- **Model selection:** Per-environment via env vars vs hardcoded per agent

## Performance/Security Considerations
- Never hardcode API keys in config files; always use environment variables
- Provider driver instances should be cached (container singletons)
- Use read-only database connections in agent tools
- Set `#[MaxSteps]` on tool-using agents to prevent runaway loops
- Log provider errors at appropriate severity; never log raw API keys

## Related Rules
- multi-provider-text-generation/05-rules.md (all rules)

## Related Skills
- Configure Provider Failover & Circuit Breaker
- Build Agents with the Laravel AI SDK
- Configure Provider Timeouts and Retries

## Success Criteria
- Text generation works with any configured provider by changing `AI_PROVIDER`
- Errors are handled with provider-specific exceptions
- Tests run without real API calls using `Ai::fake()`
- Provider drivers are cached and not re-instantiated per request
