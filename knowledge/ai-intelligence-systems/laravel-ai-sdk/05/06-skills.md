# Skill: Manage Provider Configuration and Environment

## Purpose
Define, distribute, and maintain LLM provider credentials, model selections, endpoint URLs, and timeouts across development, staging, and production environments.

## When To Use
- Multi-environment deployments (always — config management is required)
- Multi-provider systems with complex routing rules
- Applications where models or providers change frequently
- Teams practicing GitOps or infrastructure-as-code

## When NOT To Use
- Single-environment, single-provider hobby projects (env vars in .env suffice)
- Applications where configuration changes always require code deployment

## Prerequisites
- Provider configuration file (`config/ai.php`)
- Environment variable management (.env files, CI secrets)
- Understanding of configuration hierarchy and overrides

## Inputs
- Provider API keys and credentials
- Model IDs and aliases per environment
- Timeout and retry settings per provider

## Workflow
1. Store API keys in environment variables, non-sensitive settings in config files with env overrides
2. Validate all provider configuration at application startup (fail fast on missing keys)
3. Reference models through aliases in config, not raw model IDs in code
4. Define different model and timeout configurations per environment
5. Implement a clear configuration hierarchy: env vars override config files override defaults
6. Use model registry for central alias-to-model-ID mapping
7. Enable configuration validation at startup to catch issues before user requests
8. Document per-environment configuration expectations in README

## Validation Checklist
- [ ] API keys in environment variables, not committed config files
- [ ] Configuration validated at startup (not on first use)
- [ ] Models referenced through aliases (`config('ai.models.default')`), not raw IDs
- [ ] Per-environment configuration (cheap models in dev, capable in prod)
- [ ] Clear configuration hierarchy with documented precedence
- [ ] Feature flags and runtime overrides use database-backed config if needed
- [ ] Development uses generous timeouts, production uses tighter timeouts

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Secret committed to repo | API key in config file | Use env vars for secrets |
| User-facing 500 error on missing key | No startup validation | Validate config at boot |
| Model change requires code deploy | Raw model IDs in code | Use model aliases in config |
| Slow dev iteration | Production model in dev | Per-environment model selection |
| Ambiguous config override | No hierarchy | Document and enforce config precedence |
| Dev timeout causes prod failures | Same timeout settings | Per-environment timeouts |

## Decision Points
- **Config source:** env vars vs config files vs database (feature flags)
- **Model aliasing:** Single default alias vs multiple (default, fast, cheap, capable)
- **Validation timing:** Startup (fail fast) vs on first use (lazy)
- **Hot-reload:** File-based config changes vs database-backed with cache refresh

## Performance/Security Considerations
- API keys must never be logged, exposed in error messages, or committed to version control
- Validate config at startup to catch missing keys before user-facing requests
- Use different models per environment (cheap in dev, capable in prod)
- Production should use tighter timeouts than development
- Config validation should not make API calls (validate structure, not credentials)

## Related Rules
- ku-05/05-rules.md (all rules)

## Related Skills
- Design the Provider Abstraction Layer
- Implement Provider Adapters
- Configure Provider Timeouts and Retry Strategies

## Success Criteria
- All secrets stored in environment variables, not config files
- Configuration validated at startup; missing keys caught before deployment
- Models referenced through aliases; changes need config update, not code redeploy
- Each environment has appropriate model and timeout settings
- Configuration hierarchy is clear and unambiguous
