# Knowledge Unit: Dev-to-Prod Switching Strategy

## Metadata

- **ID:** KU-052
- **Subdomain:** Local LLM Development
- **Slug:** dev-to-prod-switching
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

The standard Laravel AI SDK pattern: use Ollama/local LLMs in development, switch to cloud providers (Anthropic, OpenAI) in production via environment variables. This enables zero-cost development, offline capability, and privacy-safe testing, while leveraging frontier models for production quality.

## Core Concepts

- **Env-based provider switching**: `AI_PROVIDER=ollama` (dev) → `AI_PROVIDER=anthropic` (prod)
- **Model quality difference**: Local models (Llama 3.2) vs. frontier (Claude Sonnet 4, GPT-4o) — prompts need testing on both
- **Feature parity check**: Not all local models support tools, structured output, or streaming — test before switching
- **Dual-prompt testing**: Verify prompts work on both local and production models during CI
- **Graceful degradation**: If production provider is down, fall back to local model (if available)

## Mental Models

- **Dev/Prod parity for AI**: Like using SQLite in dev and PostgreSQL in prod — same code, different backends. However, unlike databases, AI models produce different quality outputs.
- **Staging environment for AI**: Your local Ollama is the "staging" model. Production gets the "production" model (GPT-4, Claude). Both run the same agent code but with different underlying intelligence.

## Internal Mechanics

Switching is purely configuration:
```env
# .env.local (dev)
AI_PROVIDER=ollama
AI_MODEL=llama3.2

# .env (production)
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-20250514
```

The Laravel AI SDK reads `config('ai.default_provider')` which picks up `AI_PROVIDER`. Agent classes can override via `#[Provider]` attribute. For agents pinned to a specific provider, attribute takes precedence over env — override only the agents that should differ.

## Patterns

- **Provider-agnostic agent code**: Write agents without provider-specific logic — let config determine the backend
- **Local-first testing**: Default to local provider in tests, override for specific integration tests
- **Provider per environment**: .env per environment (dev, staging, prod) with different provider configs
- **Feature-flag switching**: Use Laravel feature flags to roll out provider changes gradually
- **A/B provider comparison**: Route 50% traffic to local, 50% to cloud for quality comparison

## Architectural Decisions

- **Decision**: Single provider switch vs. per-agent override → Global env switch for 90% of agents. Per-agent `#[Provider]` for specific agents that need a particular provider.
- **Decision**: Local model for all features vs. selective → Use local for text generation only. Image/audio features always route to cloud provider.

## Tradeoffs

| Aspect | Use Local Dev | Use Cloud Dev |
|--------|--------------|---------------|
| Cost | Zero | API costs during dev |
| Speed | Hardware-dependent | Fast |
| Quality | Lower (open models) | Higher (frontier models) |
| Offline capability | Yes | No |
| Prompt testing | Approximate | Exact |
| Data privacy | Complete | Provider processes data |

## Performance Considerations

- Local models: 5-30 tok/s depending on hardware and model size
- Cloud models: 50-200 tok/s with fast inference APIs
- Test suite: run against local model in CI (no API costs), selected integration tests against cloud
- Cold start: local model first load = 2-30s; cloud API = 200-500ms

## Production Considerations

- Test every prompt against both local and production models — behavior differences can break features
- Implement feature parity matrix — document which features work on local vs. cloud
- Use `#[BackupProvider]` or manual fallback — if production provider fails, fall back to local model (if available and acceptable quality)
- CI should run tests with local provider (not cloud) — avoid API costs and flakiness in CI
- Monitor quality regression — local model quality changes with model updates
- Consider "staging" environment with cheap cloud provider (GPT-4o-mini) between local and production (Claude Opus)

## Common Mistakes

- Assuming local model behavior matches production — prompts that work on GPT-4 may fail on Llama 3.2
- No fallback for production provider outage — lose AI features entirely
- Testing only with local models — deploy to production, discovery that tools/structured output don't work
- Mixed embedding dimensions — local embedding model has different dimensions than production
- Forgetting to update AI_MODEL when switching providers — e.g., `AI_MODEL=llama3.2` with `AI_PROVIDER=anthropic` fails

## Failure Modes

- **Quality cliff**: Prompt works on Claude in dev but Llama 3.2 in local dev — quality difference missed until production
- **Feature gap**: Local model doesn't support tools — agent breaks when switching to local for testing
- **Env mismatch**: Developer has `AI_PROVIDER=anthropic` in .env.local — accidentally accruing API costs
- **Provider override conflict**: Agent has `#[Provider('openai')]` — env switch to ollama has no effect
- **Model not available**: Production model deprecated, local model still available — opposite direction of failure

## Ecosystem Usage

- Laravel AI SDK: env-driven provider switching with attribute overrides
- Laravel Sail: Docker Compose includes Ollama service for local development
- CI/CD: test with local provider, deploy with cloud provider env vars
- Laravel Cloud: env config in dashboard switches AI_PROVIDER

## Related Knowledge Units

- KU-050: Ollama Integration
- KU-051: LM Studio & LocalAI
- KU-053: Docker Sail AI Infrastructure

## Research Notes

- Env-based provider switching is the officially documented pattern in Laravel AI SDK docs
- Per-agent `#[Provider]` override allows gradual migration from one provider to another
- Quality difference between open-source (Llama) and frontier (GPT-4) models narrows but doesn't disappear
- Development with local models saved teams $500-2000/month in API costs during development
- CI testing with local models prevents API key leakage and eliminates flaky network-dependent tests
