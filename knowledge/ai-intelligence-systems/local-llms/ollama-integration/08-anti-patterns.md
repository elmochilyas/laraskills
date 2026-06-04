# Anti-Patterns: Ollama Integration

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | KU-050 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Local LLM Development |
| **Type** | Implementation |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Using Different Local and Production Models](#1-using-different-local-and-production-models)
2. [Not Testing Tool Calling Locally](#2-not-testing-tool-calling-locally)
3. [Expecting Identical Local and Cloud Output](#3-expecting-identical-local-and-cloud-output)
4. [Running Large Models Without GPU](#4-running-large-models-without-gpu)
5. [Embedding Dimension Mismatch](#5-embedding-dimension-mismatch)

---

## 1. Using Different Local and Production Models

### Category
Quality Parity Failure

### Description
Using one model family locally (e.g., Llama 3.2, Qwen 2.5, Mistral) and a completely different model family in production (e.g., GPT-4o, Claude Sonnet). While the Laravel AI SDK makes switching providers trivial via an environment variable, the fundamental behavior differences between model families cause prompts that work locally to fail or produce different results in production. The model difference is treated as a configuration detail when it's actually a quality-critical decision.

### Why It Happens
- Env-based switching is so easy that teams switch without considering model differences
- Local models chosen for speed/size, production models for quality
- No systematic testing of prompts against both model families
- "The provider abstraction makes them interchangeable" misconception
- Team sees model selection as infrastructure, not product

### Warning Signs
- `AI_PROVIDER=ollama` in dev, `AI_PROVIDER=anthropic` in production with different model families
- Prompts are written and optimized only on the local model
- No test suite runs prompts against the production model
- Production incidents with "prompts work locally but fail in production"
- Output format or quality differences are discovered by users, not tests

### Why Harmful
- Production output quality differs unpredictably from development
- Prompt optimization effort spent on local model is wasted (doesn't transfer)
- Features that work in testing fail when deployed
- Team cannot reproduce production issues locally
- User experience depends on which model family is in production

### Real-World Consequences
- Prompt optimized on Llama 3.2 produces different output format on Claude Sonnet
- Tool calling schema works on Mistral but fails on GPT-4o
- Local model handles long context well; production model truncates (or vice versa)
- Users see different quality levels between development and production

### Preferred Alternative
Use the same model family across environments if possible. If different families are necessary, test every prompt against both the local and production models. Document known behavior differences. Use a staging environment with the production model family.

### Refactoring Strategy
1. Choose a local model from the same family as the production model (same architecture)
2. Create a prompt test suite that validates against both models
3. Document model-specific behavior differences
4. Set up a staging environment with the production model
5. Validate prompt changes against both models in CI

### Detection Checklist
- [ ] Local model is from same family as production (or behavior is validated)
- [ ] Prompt test suite covers both local and production models
- [ ] Model behavior differences are documented
- [ ] Staging environment uses production model

### Related Rules/Skills/Trees
- Skill: Implement Ollama Integration
- KU-052: Dev-to-Prod Switching Strategy

---

## 2. Not Testing Tool Calling Locally

### Category
Feature Compatibility Failure

### Description
Developing agentic features with tool calling against a production model (which supports tools) without testing tool calling against the local Ollama model. When switching to the local model for testing or offline development, tool calling fails because the local model doesn't support tools or handles them differently. Features are developed with a false assumption of universal tool support.

### Why It Happens
- Tool calling is developed and tested exclusively against the production model
- Assumption that "all models support tools" (they don't)
- No local testing of agentic features before production deployment
- Development workflow: code → test on cloud → deploy (skipping local verification)
- Ollama models have inconsistent tool support (model-dependent)

### Warning Signs
- Agentic features are never tested with the local Ollama model
- Tool calling works in production but fails when `AI_PROVIDER=ollama`
- No documentation of which local models support tools
- Team develops agents against GPT-4o, never against Ollama
- "It works in production" is the only testing done

### Why Harmful
- Cannot develop or test agentic features offline
- Local development environment is incomplete: core features don't work
- Production model changes (tool schema updates) break local model compatibility
- Team becomes dependent on cloud API for all agent testing (costs, latency)
- Agentic features are flight risks: untested outside production

### Real-World Consequences
- Developer cannot test agent locally; must call production API for every iteration
- Ci test suite for agents fails locally (model doesn't support tools)
- Production model update changes tool format; broken locally for weeks before detection
- Team spends $200/month on cloud API calls for agent testing

### Preferred Alternative
Choose a local Ollama model that supports tool calling. Test all agentic features against both local and production models. Document tool compatibility per model. Implement graceful degradation for models that don't support tools.

### Refactoring Strategy
1. Check which Ollama models support tool calling (Llama 3.1+, Mistral, Qwen 2.5)
2. Choose a local model with tool support matching production requirements
3. Add local tool calling tests to the CI pipeline
4. Document tool compatibility in the model selection guide
5. Verify tool schema format works across both models

### Detection Checklist
- [ ] Local model supports tool calling
- [ ] Agentic features are tested against local model
- [ ] Tool compatibility is documented per model
- [ ] Tool schema works across local and production models

### Related Rules/Skills/Trees
- Skill: Implement Ollama Integration
- Decision Tree: Implementation Approach

---

## 3. Expecting Identical Local and Cloud Output

### Category
Quality Expectation Mismatch

### Description
Expecting Ollama's local model output to be identical to the cloud production model's output, leading to confusion and false bug reports when differences emerge. Models have fundamentally different training data, architectures, and behaviors. The same prompt produces different responses, formatting, and quality.

### Why It Happens
- Provider abstraction creates a false sense of interchangeability
- No education about model behavior differences during onboarding
- Team measures "correctness" by exact output match (not semantic equivalence)
- Prompt optimization creates dependency on one model's quirks
- QA tests expect deterministic output across providers

### Warning Signs
- Bug reports: "different output than yesterday" (actually different model)
- Tests assert exact output strings (will always fail across models)
- Team tries to "fix" local model to match production model output
- Prompt includes model-specific format instructions
- No understanding that models are fundamentally different systems

### Why Harmful
- False bug reports from expected model differences
- Wasted time trying to make models produce identical output
- Tests that assert exact output are unreliable across providers
- Team frustration: "it works on one model but not the other"
- Missing real bugs because team is chasing model-specific differences

### Real-World Consequences
- QA files bug: "local model returns different text than production"
- Developer spends 2 days tuning prompt to match outputs across models
- Test suite fails on every provider switch
- Team gives up on local testing because "it's never the same"

### Preferred Alternative
Test for semantic equivalence, not exact output matches. Define quality criteria: correct information, proper format, appropriate tone. Accept that models produce different text while delivering the same value. Use model-specific test expectations when necessary.

### Refactoring Strategy
1. Change test assertions from exact string matches to semantic checks
2. Define quality criteria for each feature (not exact output)
3. Accept output differences between models as normal
4. Use model-specific test fixtures when format differences matter
5. Document expected model behavior differences

### Detection Checklist
- [ ] Tests use semantic assertions, not exact string matches
- [ ] Quality criteria are defined per feature
- [ ] Output differences are accepted as normal
- [ ] Model-specific test expectations exist where needed

### Related Rules/Skills/Trees
- Skill: Implement Ollama Integration

---

## 4. Running Large Models Without GPU

### Category
Performance Failure

### Description
Running large Ollama models (13B, 30B, 70B parameters) on CPU-only systems, producing unusably slow inference (2-5 tokens/second). A single response can take minutes, making interactive features impossible and even batch processing impractical. The developer assumes the model is "too slow" rather than recognizing the hardware mismatch.

### Why It Happens
- No GPU available on the development machine
- "Bigger model = better quality" bias without considering hardware constraints
- Ollama defaults to CPU if no GPU detected (no error, just slow)
- No benchmarking before model selection
- Team member with GPU recommends a model unsuitable for CPU-only systems

### Warning Signs
- >30 second response times for 200-token output
- CPU at 100% during inference
- Ollama process uses 100% of available CPU cores
- Developer avoids testing AI features due to slowness
- Team attribute slowness to "Ollama" rather than "model on CPU"
- Running Mixtral 8x7B, Llama 3.2 70B, or similar large models

### Why Harmful
- Interactive AI features are unusable during development
- Developers skip local testing, ship untested prompts
- Slow iteration velocity: each prompt change takes minutes to evaluate
- Team loses confidence in local AI development
- Alternatives (cloud testing) add cost and latency to the development loop

### Real-World Consequences
- 45-second response for a simple chat completion
- Developer makes 2 prompt changes per hour (limited by inference speed)
- Agentic workflows (multi-turn) take 5+ minutes per test
- Team stops using local model after first week

### Preferred Alternative
Match model size to available hardware. For CPU-only systems, use models ≤3B parameters with maximum quantization. For GPU systems, size models to fit VRAM. Benchmark before committing to a model.

### Refactoring Strategy
1. Benchmark available hardware (CPU, RAM, GPU)
2. Select a model appropriate for the hardware: CPU → 1-3B, GPU → based on VRAM
3. Use maximum quantization for CPU (Q4_K_M or IQ4_XS)
4. Verify response times meet acceptable thresholds (<5 seconds for interactive)
5. Document hardware requirements for each model

### Detection Checklist
- [ ] Model size is appropriate for available hardware
- [ ] GPU is used when available (not falling back to CPU silently)
- [ ] Response times meet acceptable latency thresholds
- [ ] Hardware requirements are documented for chosen model

### Related Rules/Skills/Trees
- Skill: Implement Ollama Integration
- Decision Tree: Performance & Optimization

---

## 5. Embedding Dimension Mismatch

### Category
Data Integrity Failure

### Description
Using different embedding models between development (Ollama: nomic-embed-text, mxbai-embed-large) and production (OpenAI: text-embedding-3-small, text-embedding-3-large) that produce different vector dimensions. The RAG system works in development but fails in production because vector indexes expect different dimensions, or vice versa. Embeddings from different models are incompatible for similarity search.

### Why It Happens
- Development uses local embedding model (speed, cost), production uses cloud embedding model (quality)
- No documentation of required embedding dimension
- Embedding provider not included in environment-based switch configuration
- Team treats embeddings as "just vectors" without dimension awareness
- Vector database schema doesn't specify expected dimension

### Warning Signs
- Vector DB errors about dimension mismatch between environments
- RAG search returns zero results or garbage after provider switch
- Different `AI_EMBEDDING_PROVIDER` in dev vs. prod
- Embedding dimension is not documented or validated
- Vector index must be rebuilt when switching environments
- Cross-environment vector data cannot be migrated

### Why Harmful
- RAG system is broken in one environment
- Cannot test RAG features locally (different embedding space)
- Vector indexes must be rebuilt per environment
- Production RAG quality is unpredictable (different embedding quality)
- Wasted storage and compute from incompatible vectors

### Real-World Consequences
- RAG search works in development, returns nonsense in production
- Can't migrate development vector data to production
- Team discovers dimension mismatch during production launch
- Emergency index rebuild required, delays launch by 2 days

### Preferred Alternative
Standardize on one embedding model across all environments. If different providers are necessary, ensure they produce the same vector dimension. Validate embedding dimension in CI.

### Refactoring Strategy
1. Choose one embedding model for all environments
2. If local embedding is required, find a local model with the same dimension as the production model
3. Validate embedding dimension in application startup or CI
4. Document the required embedding dimension
5. Configure vector indexes with explicit dimension

### Detection Checklist
- [ ] Same embedding model (or same dimension) used across environments
- [ ] Embedding dimension is documented and validated
- [ ] Vector indexes specify expected dimension
- [ ] CI validates embedding dimension consistency
