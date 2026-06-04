# Skills

## Skill 1: Set up local LLM infrastructure matching model size to available hardware

### Purpose
Select and configure a local LLM inference runtime (Ollama, llama.cpp, vLLM) by matching model size and quantization to available VRAM/RAM with 20% headroom, benchmarking task-specific quality before committing, and setting up the appropriate inference engine.

### When To Use
- Use when deploying local LLMs for development or production use
- Use when selecting models for specific hardware (GPU VRAM or RAM constraints)
- Use when choosing quantization levels to maximize performance within hardware limits
- Use when evaluating whether local LLMs are viable for a given task
- Use when setting up the inference runtime infrastructure

### When NOT To Use
- Do NOT use when cloud LLMs are sufficient and local deployment is not required
- Do NOT use without task-specific benchmarking — public benchmarks don't predict task performance
- Do NOT use a model that exceeds available VRAM/RAM — CPU spill causes 10-50x slowdown
- Do NOT use when hardware cannot meet minimum latency requirements for the use case

### Prerequisites
- Local machine or server with GPU (recommended) or CPU
- Knowledge of available VRAM/RAM budget (after OS and other workloads)
- Local inference runtime installed (Ollama, LM Studio, vLLM, or llama.cpp)
- Model download capability (Hugging Face, Ollama library, or local registry)
- Task-specific evaluation dataset (50+ representative prompts)

### Inputs
- Hardware specs: VRAM size, RAM size, GPU model, CPU cores
- Task requirements: maximum acceptable latency, minimum quality threshold
- Model candidate list (size, quantization options, quality benchmarks)
- Task-specific evaluation prompts

### Workflow
1. Assess available hardware:
   - GPU VRAM: `nvidia-smi` (NVIDIA), `system_profiler` (Apple), or GPU-Z (Windows)
   - System RAM available for LLM: total RAM - OS/reserved - other workloads
   - Reserve 20% headroom for concurrent requests and system operations
2. Select model size based on hardware:
   - 8GB VRAM: 7B models (Q4_K_M ≈ 5GB)
   - 12GB VRAM: 7B-13B models (Q4_K_M)
   - 24GB VRAM: 13B-34B models (Q4_K_M or Q8_0)
   - 48GB+ VRAM: 70B models (Q4_K_M)
3. Install the inference runtime: Ollama (simplest), vLLM (production), or llama.cpp (flexible)
4. Download and load the model with appropriate quantization
5. Create a task-specific evaluation dataset of 50-200 examples
6. Benchmark the model on the evaluation dataset: output quality, latency, format compliance
7. If quality or latency is insufficient, try different quantization or model size
8. Document the selected model and configuration for the team

### Validation Checklist
- [ ] Model fits in VRAM with 20% headroom (no CPU spill)
- [ ] If GPU not available, model + 4GB overhead fits in system RAM
- [ ] Inference runtime is installed and running
- [ ] Model is downloaded and loaded correctly
- [ ] Task-specific evaluation dataset is created (50+ examples)
- [ ] Benchmark results show acceptable quality for the task
- [ ] Latency meets requirements (real-time: <3s, batch: acceptable per task)
- [ ] Model survives restart (persistent download)
- [ ] Quantization level is appropriate for hardware and quality needs

### Common Failures
- **VRAM overflow**: Model exceeds VRAM — spills to system RAM, 10-50x slower
- **CPU-only assumption**: GPU available but not configured — inference uses CPU
- **Wrong quantization**: Too high (wastes RAM) or too low (degrades quality)
- **Public benchmark reliance**: Choosing by MMLU score — poor task-specific performance
- **Insufficient headroom**: No room for concurrent requests — OOM on second request
- **Missing GPU drivers**: CUDA/Metal not installed — falls back to CPU

### Decision Points
- **GPU vs. CPU**: GPU is 10-50x faster — always use if available
- **Quantization level**: Q4_K_M (best quality/size balance) vs. Q8_0 (higher quality) vs. Q2_K (lowest RAM)
- **Inference runtime**: Ollama (easiest), vLLM (best for production), llama.cpp (most flexible)
- **Model family**: Llama 3.2 (general), Mistral (efficiency), Qwen 2.5 (code), DeepSeek (reasoning)

### Performance Considerations
- GPU inference is 10-50x faster than CPU for the same model
- Quantization reduces memory by 50-75% with minimal quality loss (1-5%)
- Model loading time: 5-60 seconds depending on size — keep model loaded for reuse
- First request after model load is slower (warm-up) — use keep-alive or pre-warming
- Concurrent requests on single GPU require batching support (vLLM, not Ollama default)

### Security Considerations
- Local models process data entirely on-premise — no data leaves the network
- Model files should be verified with checksums (supply chain security)
- Inference runtime should not be exposed to the internet without authentication
- GPU memory can contain model weights — sensitive models should use encrypted storage
- Log inference requests for audit, but exclude sensitive prompt content

### Related Rules
- R1: Choose a model size that fits your available VRAM/RAM with headroom for concurrent requests
- R2: Always benchmark local model quality against your specific task before committing

### Related Skills
- Select and quantize local models for hardware constraints
- Set up Docker Sail AI infrastructure with Ollama and pgvector
- Integrate Ollama for local LLM inference in Laravel
- Implement offline and air-gapped LLM deployment

### Success Criteria
- Selected model fits in VRAM with 20% headroom
- Benchmark on task-specific dataset shows acceptable quality (target: >90% of cloud model quality)
- Latency meets use case requirements (real-time: <3s for chat)
- Inference runtime runs reliably without crashes or OOM
- Quantization tradeoff is data-driven (benchmarked against task, not assumed)
- Team can reproduce the setup from documentation
