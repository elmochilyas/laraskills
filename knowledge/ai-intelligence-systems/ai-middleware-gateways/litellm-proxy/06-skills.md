# Skills

## Skill 1: Deploy and configure LiteLLM Proxy for centralized AI gateway management

### Purpose
Deploy LiteLLM Proxy as a unified AI gateway between Laravel applications and 100+ LLM providers, providing centralized key management, rate limiting, cost tracking, model routing, and load balancing with enterprise governance.

### When To Use
- Use when your organization needs a single endpoint for multiple AI providers
- Use when you need centralized API key management with virtual keys
- Use when implementing per-team rate limits and spend limits
- Use when you need provider-agnostic access for multiple applications
- Use when you want cost tracking and budget alerts across the organization

### When NOT To Use
- Do NOT use for single-provider, single-application setups — simpler direct integration suffices
- Do NOT use without pinning the proxy version in production
- Do NOT use when you don't have operations capacity to maintain the proxy infrastructure
- Do NOT use when team-level limits are not needed (no multi-tenant cost management)

### Prerequisites
- Docker or Kubernetes for LiteLLM proxy deployment
- LiteLLM configuration file (config.yaml) with provider credentials
- Understanding of proxy virtual keys and team configuration
- Laravel application configured to use proxy endpoint instead of direct provider API
- Database (PostgreSQL) for persistent usage tracking (optional but recommended)

### Inputs
- Provider API keys for each LLM provider
- LiteLLM config.yaml with provider routes, teams, and limits
- Team definitions with budget and rate limits
- Model-to-provider routing rules

### Workflow
1. Deploy LiteLLM Proxy with pinned version (`litellm/litellm:6.2.0`) in Docker Compose
2. Configure `config.yaml` with provider API keys and model-to-provider mappings
3. Set up virtual keys for each application/team
4. Configure per-team `team_config` with `max_budget` (daily) and `rpm_limit`
5. Set up model access groups to restrict expensive models to specific applications
6. Configure cost tracking per request with dollar-cost storage
7. Implement rate limiting per-key, per-model, per-user at the proxy level
8. Configure provider routing with automatic failover and A/B model testing
9. Update Laravel application to point to proxy endpoint (`http://litellm:4000/chat/completions`)
10. Set up Grafana dashboards for LiteLLM metrics (cost, latency, error rates)
11. Implement proxy health monitoring and alerting

### Validation Checklist
- [ ] LiteLLM Proxy version is pinned in production
- [ ] All provider API keys are configured securely (not in code)
- [ ] Virtual keys work for each application/team
- [ ] Per-team budgets and rate limits are enforced
- [ ] Cost tracking records per-request token and dollar costs
- [ ] Model access groups restrict access to approved models
- [ ] Provider routing works with failover
- [ ] Laravel application routes through proxy successfully
- [ ] Dashboard shows real-time usage and cost metrics
- [ ] Proxy upgrades tested in staging before production

### Common Failures
- **Unpinned version**: `latest` tag auto-upgrades to breaking release — always pin exact version
- **Missing team limits**: Global limit only — single team exhausts entire organization budget
- **Virtual key proliferation**: Too many keys without management — implement key rotation policy
- **Proxy as SPOF**: Single proxy instance fails — deploy multiple instances with load balancer
- **Stale pricing**: Provider pricing changes not reflected in cost tracking — maintain pricing table

### Decision Points
- **Proxy version**: Pin exact version in production, test upgrades in staging
- **Team budget model**: Pre-paid (team credits) vs. post-paid (usage billed monthly)
- **Deployment topology**: Single proxy vs. multi-region with load balancer — multi-region for global applications
- **Database requirement**: PostgreSQL for persistent tracking vs. SQLite for simple setups

### Performance Considerations
- Proxy adds ~5-10ms latency per request (network hop)
- Rate limiting at proxy level is faster than per-application enforcement
- Cost tracking database writes should be asynchronous to avoid request-path latency
- Proxy should be deployed in same region as Laravel application to minimize latency
- Horizontal scaling: multiple proxy instances behind load balancer for high throughput

### Security Considerations
- Provider API keys stored in proxy config — restrict file permissions
- Virtual keys can be rotated without changing application code
- Proxy logs contain prompt data — implement log redaction for sensitive fields
- Enable authentication on proxy endpoint (virtual key required)
- Use HTTPS between Laravel and proxy for all communication
- Implement proxy audit logging for compliance

### Related Rules
- R1: Always pin LiteLLM proxy version in production and test upgrades in staging first
- R2: Implement per-team rate limits and spend limits in proxy config before onboarding any team

### Related Skills
- Configure multi-provider failover with circuit breakers
- Implement cost tracking with agent middleware
- Set up semantic caching for LLM responses
- Deploy and configure API7 AI Gateway

### Success Criteria
- LiteLLM Proxy handles all AI traffic with <10ms added latency
- Per-team budgets prevent any single team from exhausting organization spend
- Virtual keys provide clean access management with rotation capability
- Cost tracking shows accurate per-request dollar costs
- Provider failover works automatically within configured timeouts
- Proxy upgrades are tested in staging before production promotion
