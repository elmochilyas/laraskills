# Skill: Use OpenRouter as a Multi-Model Gateway

## Purpose
Access 300+ models across 20+ providers through a single API endpoint with automatic failover, price-based load balancing, and centralized billing.

## When To Use
- Multi-model exploration and comparison across providers
- Price-based routing to the cheapest available provider
- Centralized billing and API key management
- Automatic provider failover without custom circuit breaker logic

## When NOT To Use
- Latency-sensitive paths where 50-200ms proxy overhead is unacceptable
- PII or sensitive data that should not pass through a third-party proxy
- Applications with strict data residency requirements

## Prerequisites
- OpenRouter account and API key
- `laravel/ai` package with OpenRouter driver configured
- Direct provider fallback configured (optional but recommended)

## Inputs
- OpenRouter API key in environment variables
- Model strings with provider prefix (e.g., `openai/gpt-4o`)
- Provider ordering for failover routing

## Workflow
1. Configure OpenRouter as a provider driver in `config/ai.php`
2. Prefix model strings with provider: `openai/gpt-4o`, `anthropic/claude-sonnet-4`
3. Configure a direct provider fallback for critical paths
4. Route non-sensitive, experimental traffic through OpenRouter
5. Route latency-sensitive or private data through direct provider connections
6. Use `provider.order` parameter to control failover preference
7. Test with staging traffic before routing production through OpenRouter
8. Monitor latency and availability; alert on OpenRouter degradation

## Validation Checklist
- [ ] OpenRouter configured as a provider driver in config
- [ ] Model strings prefixed with provider (e.g., `openai/gpt-4o`)
- [ ] Direct fallback provider configured for critical paths
- [ ] Sensitive data routed through direct provider, not OpenRouter
- [ ] Latency-critical paths use direct provider connections
- [ ] Staging tests validate OpenRouter integration

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Single point of failure | OpenRouter-only config | Add direct provider fallback |
| Data privacy exposure | PII sent through OpenRouter | Route sensitive data through direct provider |
| Unpredictable model quality | Bare model name | Prefix with provider (`openai/gpt-4o`) |
| Higher latency | All traffic through proxy | Route critical paths through direct provider |
| No failover tested | Not verified in staging | Simulate OpenRouter outage in staging |

## Decision Points
- **Model naming:** Provider-prefixed (deterministic) vs bare model (price-based routing)
- **Traffic split:** All through OpenRouter vs sensitive data direct
- **Fallback strategy:** Direct provider vs secondary OpenRouter model

## Performance/Security Considerations
- OpenRouter adds 50-200ms proxy latency — route latency-critical paths directly
- PII, credentials, and sensitive data must bypass OpenRouter
- Monitor OpenRouter availability; alert on degradation
- API tokens must be stored in CI secrets, not committed to version control

## Related Rules
- openrouter-multi-model-gateway/05-rules.md (all rules)

## Related Skills
- Generate Text with Multiple AI Providers
- Configure Provider Failover & Circuit Breaker
- Manage Provider Configuration and Environment

## Success Criteria
- OpenRouter works with provider-prefixed model strings
- Critical paths have direct provider fallback
- Sensitive data never passes through OpenRouter
- Latency-sensitive paths use direct provider connections
