# Anti-Patterns: Local LLM Setup & Configuration

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | ku-01 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Local LLMs |
| **Type** | Implementation |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [Model Hopping Without Evaluation](#1-model-hopping-without-evaluation)
2. [CPU-Only Production Inference](#2-cpu-only-production-inference)
3. [Over-Quantization Degrading Quality](#3-over-quantization-degrading-quality)
4. [No Monitoring for Local LLMs](#4-no-monitoring-for-local-llms)
5. [Manual Model Management](#5-manual-model-management)

---

## 1. Model Hopping Without Evaluation

### Category
Quality Management Failure

### Description
Switching between different local models frequently without systematically evaluating their quality on the specific application task. New models are adopted based on general benchmarks, hype, or parameter count, but no application-specific evaluation is performed to determine whether the change improves or degrades output quality.

### Why It Happens
- Rapid release cycle of open-source models creates FOMO
- General benchmarks (MMLU, HumanEval) create false confidence
- No application-specific quality evaluation process exists
- Team wants "the best" without defining what "best" means for their use case
- Easy model switching via Ollama makes it tempting to try everything

### Warning Signs
- Local model is changed weekly without documented rationale
- No benchmark suite evaluates models on the specific application task
- Model selection based solely on parameter count or general leaderboards
- Different team members use different models
- No quality regression testing after model changes

### Why Harmful
- Output quality fluctuates unpredictably with model changes
- Prompts optimized for one model don't work on the new model
- Team cannot reproduce issues because model keeps changing
- Development velocity slows as prompts need re-optimization per model
- No learning: which models work best for the application is unknown

### Real-World Consequences
- Monday: working on Llama 3.2, Tuesday: switched to Mistral, prompts break
- Production incident caused by model change that wasn't quality-tested
- Cannot reproduce a bug because the model used when it occurred is unknown

### Preferred Alternative
Establish a model evaluation cadence. Pick a model and stick with it for a defined period (monthly at minimum). Evaluate new models on the application's specific task before adopting. Document model versions and their quality baselines.

### Refactoring Strategy
1. Create an application-specific model evaluation dataset
2. Benchmark the current model to establish a quality baseline
3. Define evaluation criteria: accuracy, format compliance, latency, memory
4. Schedule quarterly model reviews against the evaluation dataset
5. Version-pin the local model in configuration

### Detection Checklist
- [ ] Local model is version-pinned (not floating)
- [ ] Application-specific evaluation dataset exists
- [ ] Model changes are validated against the evaluation dataset
- [ ] Model version is documented in the codebase

### Related Rules/Skills/Trees
- Skill: Implement Local LLM Setup

---

## 2. CPU-Only Production Inference

### Category
Performance Failure

### Description
Running local LLMs on CPU for production user-facing workloads where response latency matters. CPU inference produces 2-10 tokens/second for anything larger than 3B parameters, resulting in 30-60 second response times for typical outputs. This makes interactive AI features unusable.

### Why It Happens
- No GPU available in the deployment environment
- Cost constraints: GPU instances are more expensive
- Lack of awareness about CPU vs. GPU performance differences
- Focus on model quality over latency (choosing large models)
- Testing with small models on CPU in dev, assuming similar performance in prod

### Warning Signs
- Production inference server has no GPU
- Response times exceed 10 seconds for typical outputs
- Users complain about slow AI responses
- Large models (13B+) deployed on CPU
- No GPU metrics tracked (CUDA availability, VRAM usage)

### Why Harmful
- Unacceptable user experience from slow responses
- Timeouts from frontend or API gateway waiting for LLM response
- Streaming is ineffective if tokens arrive seconds apart
- Connection pools exhaust as requests queue up during slow inference
- Cannot meet latency SLAs

### Real-World Consequences
- Chat responses take 45 seconds for 200-token output
- API gateway times out after 30 seconds, returning errors
- Users abandon chat mid-response
- Support tickets about "broken AI" resulting from timeouts

### Preferred Alternative
Use GPU for production local LLM inference. If GPU is not available, use a much smaller model (1-3B parameters) quantized for speed, or use a cloud provider instead of local inference for user-facing workloads.

### Refactoring Strategy
1. Add GPU to production inference servers
2. If GPU is infeasible, switch to cloud provider for production
3. If local CPU is the only option, select the smallest model that meets quality needs
4. Implement aggressive caching and prompt optimization
5. Set realistic timeout expectations and communicate them to users

### Detection Checklist
- [ ] Production inference uses GPU (not CPU-only)
- [ ] Response times meet latency SLA
- [ ] Model size is appropriate for available hardware
- [ ] CPU-only fallback uses smaller, faster model

### Related Rules/Skills/Trees
- Skill: Implement Local LLM Setup
- Decision Tree: Performance & Optimization

---

## 3. Over-Quantization Degrading Quality

### Category
Quality Tradeoff Mismanagement

### Description
Using extremely aggressive quantization (2-bit, 3-bit) to fit a larger model into available memory, resulting in significant quality degradation that defeats the purpose of using a larger model. The quantized model performs worse than a smaller model at higher precision, but the team believes "more parameters = better" regardless of quantization level.

### Why It Happens
- "Bigger is better" bias: wanting the largest model that barely fits
- No quality comparison between a large quantized model and a smaller unquantized one
- Memory constraints force extreme quantization choices
- No awareness of the quality cliff at very low bitrates
- Parameter count fetishism

### Warning Signs
- 70B models at 2-bit or 3-bit quantization used in production
- No quality comparison between large-quantized vs. smaller-unquantized models
- Perplexity or quality metrics from quantized models are not tracked
- Team assumes "70B at 2-bit is better than 7B at 16-bit"
- Output quality complaints from users that don't match "70B" expectations

### Why Harmful
- Output quality is worse than a properly sized smaller model
- Memory is still high (just barely fitting), risking OOM
- Inference speed is slow due to dequantization overhead
- Users get poor quality with high latency—worst of both worlds
- Wasted resources: same compute could run a quality-equivalent 7B at 8-bit

### Real-World Consequences
- 70B at 2-bit produces incoherent output that a 7B at 8-bit would handle well
- Users complain about "dumb" AI despite the "70B" label
- Model crashes on long contexts due to memory pressure from dequantization

### Preferred Alternative
Benchmark quantization levels against the application task. Compare large-quantized and smaller-unquantized options. Choose the combination that delivers the best quality per unit of memory. For most tasks, 4-bit (Q4_K_M) is the sweet spot for consumer hardware.

### Refactoring Strategy
1. Benchmark current quantization level against the application task
2. Compare with a smaller model at higher precision
3. Select the best quality-per-memory combination
4. Document the quantization decision with benchmark results
5. Set minimum quantization bitrate policy (no lower than 4-bit for production)

### Detection Checklist
- [ ] Quantization level is chosen based on task-specific benchmarks
- [ ] Large-quantized vs. smaller-unquantized comparison exists
- [ ] Quantization below 4-bit is justified with quality data
- [ ] Minimum quantization bitrate policy is documented

### Related Rules/Skills/Trees
- Skill: Implement Local LLM Setup
- KU-03: Model Selection & Quantization

---

## 4. No Monitoring for Local LLMs

### Category
Operational Blindness

### Description
Running local LLMs without monitoring memory usage, latency, throughput, or error rates. Unlike cloud providers that report these metrics, local inference servers provide no built-in monitoring. Memory leaks, OOM conditions, latency degradation, and model crashes go undetected until users report problems.

### Why It Happens
- Assumption that "local" means "simple" and doesn't need monitoring
- No monitoring infrastructure for the inference server
- Focus on application monitoring, not infrastructure monitoring
- Lack of experience with self-hosted AI operations
- Model server seems like a "black box" that's hard to instrument

### Warning Signs
- No metrics collected from the inference server
- Memory usage of the inference process is unknown
- Response latency is not tracked
- Model crashes are discovered only when users complain
- No alerting for inference server health
- GPU utilization and VRAM usage are not monitored

### Why Harmful
- Memory leaks in the inference engine cause crashes after hours/days
- Performance degradation due to memory fragmentation goes undetected
- Cannot plan capacity upgrades without historical usage data
- OOM conditions kill the inference server without recovery
- No data to optimize model selection or quantization

### Real-World Consequences
- Ollama server crashes after 6 hours due to memory leak
- Users get "connection refused" for hours before team notices
- Cannot explain why response times doubled over the past week
- Capacity planning is guesswork

### Preferred Alternative
Monitor the inference server: memory (RAM/VRAM), response latency (P50/P95/P99), throughput (requests/second), error rate, and uptime. Use Prometheus + Grafana for on-premise monitoring or cloud monitoring agents for VPS deployments.

### Refactoring Strategy
1. Set up monitoring for the inference server process
2. Track: memory usage, response latency, error rate, uptime
3. Configure alerts for: OOM risk, latency degradation, crash detection
4. Set up auto-restart for crashed inference servers
5. Create a monitoring dashboard for the AI inference stack

### Detection Checklist
- [ ] Inference server memory usage is monitored
- [ ] Response latency is tracked (P50/P95/P99)
- [ ] Error rate and uptime are monitored
- [ ] Alerts exist for OOM, crash, and latency degradation

### Related Rules/Skills/Trees
- Skill: Implement Local LLM Setup
- Decision Tree: Reliability & Error Handling

---

## 5. Manual Model Management

### Category
Operations Reliability Failure

### Description
Downloading, updating, and managing model files manually by hand—using curl to download from Hugging Face, manually placing files in directories, and tracking versions through file names or memory. This creates reproducibility problems, version drift across developers, and no audit trail for model changes.

### Why It Happens
- Initial setup is manual and becomes a habit
- No tooling knowledge (Ollama registry, Hugging Face CLI)
- "It's just a file, I can download it myself"
- Small team, informal processes
- Model files seem too simple to need management

### Warning Signs
- Model files are downloaded manually via browser or curl
- Different developers have different model versions
- No model version tracking in configuration
- "Which model are we using?" requires asking the team
- Model file locations vary across developer machines

### Why Harmful
- Reproducibility: different developers get different results from different model versions
- Onboarding: new developers must manually figure out which models to download
- Updates: no systematic process for updating models
- Auditing: cannot trace which model version was used for a given result
- Configuration drift: production model differs from development model

### Real-World Consequences
- Two developers debugging different behavior because they have different model versions
- Onboarding takes an extra day for model setup
- Cannot reproduce a bug because the model version is unknown
- Production model is 3 months older than dev models

### Preferred Alternative
Use a model registry (Ollama library, Hugging Face) with explicit version pinning in configuration. Automate model downloads in setup scripts or Dockerfile. Version-track model configuration alongside application code.

### Refactoring Strategy
1. Switch to a model registry with version pinning (ollama pull model:tag)
2. Create a setup script that downloads all required models
3. Pin model versions in configuration (config/ai.php or .env)
4. Standardize model file locations across development machines
5. Include model setup in the onboarding documentation

### Detection Checklist
- [ ] Models are managed through a registry (not manual downloads)
- [ ] Model versions are pinned in configuration
- [ ] Setup script automates model downloads
- [ ] Onboarding includes automated model setup
