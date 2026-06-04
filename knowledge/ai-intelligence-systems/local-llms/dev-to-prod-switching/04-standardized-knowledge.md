---
id: KU-052
title: "Dev-to-Prod Switching Strategy"
subdomain: "local-llms"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/13-local-llms/dev-to-prod-switching/04-standardized-knowledge.md"
---

# Dev-to-Prod Switching Strategy

## Overview

The standard Laravel AI SDK pattern: use Ollama/local LLMs in development, switch to cloud providers (Anthropic, OpenAI) in production via environment variables. This enables zero-cost development, offline capability, and privacy-safe testing, while leveraging frontier models for production quality.

## Core Concepts

- **Env-based provider switching**: `AI_PROVIDER=ollama` (dev) â†’ `AI_PROVIDER=anthropic` (prod)
- **Model quality difference**: Local models (Llama 3.2) vs. frontier (Claude Sonnet 4, GPT-4o) â€” prompts need testing on both
- **Feature parity check**: Not all local models support tools, structured output, or streaming â€” test before switching
- **Dual-prompt testing**: Verify prompts work on both local and production models during CI
- **Graceful degradation**: If production provider is down, fall back to local model (if available)

## When To Use

- Production applications requiring Dev-to-Prod Switching Strategy functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Provider-agnostic agent code**: Write agents without provider-specific logic â€” let config determine the backend
- **Local-first testing**: Default to local provider in tests, override for specific integration tests
- **Provider per environment**: .env per environment (dev, staging, prod) with different provider configs
- **Feature-flag switching**: Use Laravel feature flags to roll out provider changes gradually
- **A/B provider comparison**: Route 50% traffic to local, 50% to cloud for quality comparison

- **Dev/Prod parity for AI**: Like using SQLite in dev and PostgreSQL in prod â€” same code, different backends. However, unlike databases, AI models produce different quality outputs.
- **Staging environment for AI**: Your local Ollama is the "staging" model. Production gets the "production" model (GPT-4, Claude). Both run the same agent code but with different underlying intelligence.

## Architecture Guidelines

- **Decision**: Single provider switch vs. per-agent override â†’ Global env switch for 90% of agents. Per-agent `#[Provider]` for specific agents that need a particular provider.
- **Decision**: Local model for all features vs. selective â†’ Use local for text generation only. Image/audio features always route to cloud provider.

## Performance Considerations

- Local models: 5-30 tok/s depending on hardware and model size
- Cloud models: 50-200 tok/s with fast inference APIs
- Test suite: run against local model in CI (no API costs), selected integration tests against cloud
- Cold start: local model first load = 2-30s; cloud API = 200-500ms

| Aspect | Use Local Dev | Use Cloud Dev |
|--------|--------------|---------------|
| Cost | Zero | API costs during dev |
| Speed | Hardware-dependent | Fast |
| Quality | Lower (open models) | Higher (frontier models) |
| Offline capability | Yes | No |
| Prompt testing | Approximate | Exact |
| Data privacy | Complete | Provider processes data |

## Security Considerations

- Test every prompt against both local and production models â€” behavior differences can break features
- Implement feature parity matrix â€” document which features work on local vs. cloud
- Use `#[BackupProvider]` or manual fallback â€” if production provider fails, fall back to local model (if available and acceptable quality)
- CI should run tests with local provider (not cloud) â€” avoid API costs and flakiness in CI
- Monitor quality regression â€” local model quality changes with model updates
- Consider "staging" environment with cheap cloud provider (GPT-4o-mini) between local and production (Claude Opus)

## Common Mistakes

- Assuming local model behavior matches production â€” prompts that work on GPT-4 may fail on Llama 3.2
- No fallback for production provider outage â€” lose AI features entirely
- Testing only with local models â€” deploy to production, discovery that tools/structured output don't work
- Mixed embedding dimensions â€” local embedding model has different dimensions than production
- Forgetting to update AI_MODEL when switching providers â€” e.g., `AI_MODEL=llama3.2` with `AI_PROVIDER=anthropic` fails

## Anti-Patterns

- **Quality cliff**: Prompt works on Claude in dev but Llama 3.2 in local dev â€” quality difference missed until production
- **Feature gap**: Local model doesn't support tools â€” agent breaks when switching to local for testing
- **Env mismatch**: Developer has `AI_PROVIDER=anthropic` in .env.local â€” accidentally accruing API costs
- **Provider override conflict**: Agent has `#[Provider('openai')]` â€” env switch to ollama has no effect
- **Model not available**: Production model deprecated, local model still available â€” opposite direction of failure

## Examples

The following ecosystem packages provide reference implementations:

- Laravel AI SDK: env-driven provider switching with attribute overrides
- Laravel Sail: Docker Compose includes Ollama service for local development
- CI/CD: test with local provider, deploy with cloud provider env vars
- Laravel Cloud: env config in dashboard switches AI_PROVIDER

## Related Topics

- KU-050: Ollama Integration
- KU-051: LM Studio & LocalAI
- KU-053: Docker Sail AI Infrastructure

## AI Agent Notes

- When asked about Dev-to-Prod Switching Strategy, first determine the specific use case and requirements.
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

