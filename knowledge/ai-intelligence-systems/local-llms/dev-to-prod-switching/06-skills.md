# Skills

## Skill 1: Implement dev-to-prod AI provider switching with environment configuration

### Purpose
Configure environment-variable-based switching between local Ollama (development) and cloud providers (production) in Laravel AI SDK, using provider-agnostic interfaces, dual-prompt testing for capability gaps, and graceful degradation fallback for production provider outages.

### When To Use
- Use for any Laravel AI application that needs local development and cloud production
- Use when you want zero-cost development with local models and production-grade quality from cloud
- Use when developing privacy-sensitive features locally before sending data to cloud providers
- Use when you want to avoid provider API costs during development and testing

### When NOT To Use
- Do NOT use when local models lack features needed for testing (vision, structured output, tool calling)
- Do NOT use without dual-prompt testing — local models differ significantly from cloud models
- Do NOT use when different code paths exist for dev and prod — always use the same interface
- Do NOT use when the production provider's capabilities (context window, speed) are essential for testing

### Prerequisites
- Laravel AI SDK with multi-provider support
- Ollama or other local LLM configured for development
- Cloud provider (OpenAI, Anthropic) configured for production
- Provider-agnostic interface (`AiProvider::chat()`) used in all code
- Environment variable configuration (AI_PROVIDER)

### Inputs
- Environment configuration: `AI_PROVIDER=ollama` (dev), `AI_PROVIDER=openai` (prod)
- Provider credentials (production only)
- Local model configuration (Ollama host, model name)
- List of features needed and which providers support them

### Workflow
1. Code all AI calls against a provider-agnostic interface — never use provider-specific methods:
   ```php
   // Correct: uses provider resolved from config
   $response = $this->provider->chat($messages);
   
   // Wrong: hardcoded provider methods
   $response = Ollama::chat($messages);  // won't work in production
   ```
2. Configure environment switching:
   ```env
   # .env (development)
   AI_PROVIDER=ollama
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   
   # .env.production
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
   ANTHROPIC_MODEL=claude-sonnet-4-20250514
   ```
3. Create a provider resolver service that loads the configured driver:
   ```php
   // AppServiceProvider
   $this->app->bind(AiProvider::class, function ($app) {
       return match (config('ai.provider')) {
           'ollama' => new OllamaProvider(...),
           'openai' => new OpenAIProvider(...),
           'anthropic' => new AnthropicProvider(...),
       };
   });
   ```
4. Test prompts on both local and target production models during CI
5. Implement graceful degradation: if production provider is down, fall back to local model
6. Document capability differences between local and production models
7. Run integration tests with both providers before deploying

### Validation Checklist
- [ ] All AI calls use provider-agnostic interface (no provider-specific code in business logic)
- [ ] Environment variable switches between Ollama (dev) and cloud (prod) without code changes
- [ ] Dual-prompt testing runs in CI for both providers
- [ ] Capability gaps between local and production models are documented
- [ ] Graceful degradation falls back to local model if production provider is down
- [ ] Integration tests pass with both providers
- [ ] Provider credentials are only configured in production environment
- [ ] Dev environment works fully offline (no cloud API calls)
- [ ] Tool calling and structured output work with both providers (or graceful failure)

### Common Failures
- **Provider-specific code**: `Ollama::chat()` in development, `OpenAI::chat()` in production — code paths diverge, bugs surface only after deploy
- **Capability assumptions**: Assuming local model supports tools/structured output when it doesn't
- **No dual testing**: Prompts tested only on local model — production model produces different output formats
- **Credential leaks**: Production API keys in .env committed to version control
- **Graceful degradation missing**: Production provider down, no fallback — AI features completely unavailable

### Decision Points
- **Provider abstraction level**: Interface per operation (chat, embed, etc.) vs. unified provider interface — unified is simpler
- **Fallback strategy**: Failover to local model vs. failover to different cloud provider
- **Testing approach**: Full integration test with both providers vs. mock-based testing with occasional dual runs
- **Feature parity check**: Required (block deploy) vs. informational (document gaps)

### Performance Considerations
- Local models are 10-100x slower than cloud — acceptable for development
- Dual testing doubles CI time — run in parallel if possible
- Graceful degradation fallback to local model may be very slow in production
- Provider resolution adds <1ms overhead per request (once resolved)
- Cache provider instance in the container for the request lifecycle

### Security Considerations
- Production API keys must never be in .env (use .env.production or secrets manager)
- Local development never sends data to external providers — privacy benefit
- Graceful degradation to local model means data stays on-premise during outages
- Provider switching should not affect authentication or authorization
- Audit log which provider handled each request

### Related Rules
- R1: Always use the same provider abstraction interface in development and production
- R2: Never assume local models have the same capabilities as production cloud models

### Related Skills
- Integrate Ollama for local LLM inference in Laravel
- Set up Docker Sail AI infrastructure with Ollama and pgvector
- Configure LM Studio and LocalAI as alternative local providers
- Select and quantize local models for hardware constraints

### Success Criteria
- Switching AI_PROVIDER between local and cloud requires zero code changes
- Development and production use identical code paths for AI operations
- CI runs integration tests with both providers
- Capability gaps are documented and handled gracefully
- Production provider outage automatically falls back to local model
- No production API keys are present in development environment
- Development AI features work completely offline
