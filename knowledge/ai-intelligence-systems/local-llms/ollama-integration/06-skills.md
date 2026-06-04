# Skills

## Skill 1: Integrate Ollama for local LLM inference in Laravel AI development

### Purpose
Set up Ollama as a local LLM provider for zero-cost development with the Laravel AI SDK, using the Ollama PHP client for API calls, configuring appropriate timeouts for local inference, and doing provider-agnostic coding for easy switching between local and cloud models.

### When To Use
- Use during development to avoid provider API costs and rate limits
- Use when you need offline AI capability for development or testing
- Use when developing privacy-sensitive features that shouldn't send data to external providers during development
- Use as a local testing ground before deploying to production cloud models

### When NOT To Use
- Do NOT use in production for user-facing features (unless privacy requirements mandate local-only)
- Do NOT use without a dedicated Ollama PHP client — raw curl or shell_exec is brittle
- Do NOT use without setting appropriate timeouts for non-streaming requests (≥60s)
- Do NOT use when the application depends on model-specific features not available in local models (vision, structured output)

### Prerequisites
- Ollama installed and running locally (`ollama serve`)
- At least one model pulled (`ollama pull llama3.2` or similar)
- Laravel AI SDK configured with Ollama provider
- Ollama PHP client installed via Composer
- AI_PROVIDER environment variable set to `ollama`

### Inputs
- Ollama connection configuration (host, port)
- Model name to use (e.g., `llama3.2`, `qwen2.5-coder`)
- Application prompts and agent configurations
- Provider-agnostic AI interface code

### Workflow
1. Install Ollama on the development machine: download from ollama.ai or use Docker
2. Pull a model suitable for the task: `ollama pull llama3.2` (general) or `ollama pull qwen2.5-coder` (code)
3. Install the Ollama PHP client: `composer require ollama/ollama` (or community equivalent)
4. Configure the Laravel AI SDK to use Ollama:
   ```env
   AI_PROVIDER=ollama
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```
5. Code against the provider-agnostic interface:
   ```php
   // Both dev (Ollama) and prod (OpenAI/Anthropic) work through same interface
   $response = $this->provider->chat($messages);
   ```
6. For non-streaming calls, set HTTP timeout ≥60s:
   ```php
   Http::withOptions(['timeout' => 120])->post('http://ollama:11434/api/generate', ...)
   ```
7. Use the PHP client, not raw curl or shell_exec: `Ollama::client()->generate(model: $model, prompt: $text)`
8. Test prompts with both local and target production model before switching providers

### Validation Checklist
- [ ] Ollama is installed and the API responds on port 11434
- [ ] At least one model is pulled and ready (ollama list shows it)
- [ ] Ollama PHP client is installed (not raw curl or shell_exec)
- [ ] AI_PROVIDER is set to ollama in .env
- [ ] Provider-agnostic interface works with Ollama
- [ ] Timeouts are configured for non-streaming requests (≥60s)
- [ ] Streaming responses work if needed
- [ ] Agent tools work with the local model (if supported)
- [ ] Switching AI_PROVIDER to production provider works without code changes

### Common Failures
- **Raw curl/shell_exec**: `ollama run llama3.1 '{prompt}'` — blocks PHP process for seconds, brittle to API changes
- **Default timeout**: 30s default HTTP timeout is too short for local model generation (10-60s)
- **Model not pulled**: `ollama run` with model name not pulled — auto-pulls but takes minutes
- **Streaming not working**: Ollama response not properly consumed — use PHP client's streaming support
- **Tool calling failures**: Local models may not support tools — test before relying on tool features

### Decision Points
- **Model selection**: Llama 3.2 (general purpose) vs. Qwen 2.5 Coder (code) vs. Mistral (efficiency)
- **Quantization level**: Q4_K_M (balanced) vs. Q8_0 (higher quality, more RAM) vs. Q2_K (smallest)
- **Streaming vs. non-streaming**: Streaming for chat UX, non-streaming for batch processing
- **Ollama vs. Docker Ollama**: Native install for performance, Docker for consistency with production stack

### Performance Considerations
- Local model inference is 10-100x slower than cloud API calls
- GPU acceleration (Metal, CUDA) significantly improves inference speed
- Model size vs. quality tradeoff: larger models are slower but produce better outputs
- Streaming reduces perceived latency (first token appears faster than full response)
- Concurrent requests should be limited (Ollama default handles 1 concurrent request per model)

### Security Considerations
- Ollama API has no authentication by default — bind to localhost only (do not expose to network)
- Local models process data entirely on the machine — no data leaves the network (privacy benefit)
- Never use shell_exec to run Ollama — use the PHP client
- Keep Ollama updated for security patches
- Model files are large (1-8GB) — ensure adequate disk space

### Related Rules
- R1: Always use the Ollama PHP client library for API calls, not raw curl or shell_exec
- R2: Never disable streaming in API calls without setting a reasonable timeout (≥60s)

### Related Skills
- Set up Docker Sail AI infrastructure with Ollama and pgvector
- Implement dev-to-prod provider switching strategy
- Configure LM Studio and LocalAI as alternative local providers
- Select and quantize local models for hardware constraints

### Success Criteria
- Ollama runs locally and the Laravel AI SDK connects via the PHP client
- Non-streaming requests complete without timeout errors (timeout ≥60s configured)
- Development AI features work identically to production after switching AI_PROVIDER
- Agent tools work with the selected local model
- Model inference completes within acceptable time for development workflow (>5 tok/s)
- Prompts tested locally produce output comparable to production model behavior
