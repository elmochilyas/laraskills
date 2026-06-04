# Skills

## Skill 1: Select and quantize local models balancing quality, latency, and hardware constraints

### Purpose
Select the optimal local LLM and quantization level by evaluating candidate models against a task-specific dataset using a weighted score that balances output quality, inference latency, and hardware constraints, then applying appropriate quantization to fit within available VRAM.

### When To Use
- Use when selecting a local model for a specific production use case
- Use when evaluating quantization tradeoffs (quality vs. memory)
- Use when hardware constraints limit model size and quantization options
- Use when choosing between multiple candidate models for the same task
- Use when setting up local model infrastructure for team-wide use

### When NOT To Use
- Do NOT use without a task-specific evaluation dataset (50-200 examples)
- Do NOT use when only one model fits the hardware — skip comparison, just benchmark
- Do NOT use when quality degradation from quantization is unacceptable (medical/legal)
- Do NOT use when selecting cloud models (quantization is local-model-specific)

### Prerequisites
- Task-specific evaluation dataset (50-200 examples with expected outputs)
- 2+ candidate models to compare (e.g., Llama 3.2 7B, Mistral 7B, Qwen 2.5 7B)
- Multiple quantization options per model (FP16, Q8_0, Q5_K_M, Q4_K_M, Q2_K)
- Inference runtime supporting quantization (Ollama, llama.cpp, vLLM)
- Hardware specs: VRAM/RAM, GPU model, CPU

### Inputs
- Candidate models (sizes, families, base quality benchmarks)
- Quantization options and their memory requirements
- Task-specific evaluation prompts (50-200)
- Weight schedules: quality weight, latency weight, cost weight
- Hardware specs and constraints

### Workflow
1. Create a task-specific evaluation dataset with 50-200 labeled examples
2. Formulate the weighted score formula:
   ```
   score = quality × w1 + (1 - normalized_latency) × w2 + (1 - normalized_cost) × w3
   ```
   Where w1 + w2 + w3 = 1.0, adjusted for use case (e.g., chat: w1=0.4, w2=0.4, w3=0.2)
3. Load each candidate model at each quantization level on available hardware
4. Run evaluation: for each model+quantization, generate responses for all test prompts
5. Score each combination on:
   - Quality: LLM-as-judge or task-specific metric (0-1)
   - Latency: tokens/second, p95 response time
   - Cost: hardware cost (depreciation) + power, normalized
6. Ensure the model+quantization fits in VRAM with 20% headroom
7. Select the combination with the highest weighted score
8. If no candidate meets all requirements, relax constraints or change hardware

### Validation Checklist
- [ ] Task-specific evaluation dataset has 50-200 examples
- [ ] Weighted score formula is defined with use-case-appropriate weights
- [ ] Multiple quantization levels are benchmarked per model
- [ ] Quality, latency, and cost are all measured (not just quality)
- [ ] Model+quantization fits in VRAM with 20% headroom
- [ ] Evaluation results are documented with scores
- [ ] Selected model is deployed and tested in the application
- [ ] Quantization quality degradation is measured against FP16 baseline
- [ ] Selection is reproducible (evaluation dataset and script are saved)

### Common Failures
- **Quality-only selection**: Best quality model is 10x slower — unusable for real-time
- **No task-specific eval**: General benchmarks don't predict task performance
- **VRAM overflow**: Model+quantization doesn't fit — CPU spill causes 10-50x slowdown
- **Wrong weight distribution**: Chat app weights quality=0.9, latency=0.1 — users wait 30s per response
- **Quantization assumption**: Assuming Q4_K_M preserves quality without measuring — degradation varies by task

### Decision Points
- **Weight distribution**: Real-time chat: latency=0.4, quality=0.4, cost=0.2. Batch processing: quality=0.6, latency=0.1, cost=0.3
- **Quantization level**: Q4_K_M (best balance), Q8_0 (higher quality, more RAM), Q2_K (smallest, quality loss)
- **Evaluation granularity**: Per-prompt scoring vs. overall aggregate — aggregate is simpler, per-prompt reveals patterns
- **Hardware upgrade decision**: If no model meets requirements, is hardware upgrade justified?

### Performance Considerations
- Larger models produce better quality but are slower and use more memory
- Lower quantization = less memory, faster inference, lower quality
- Q4_K_M typically preserves 95-97% of FP16 quality with 50% less memory
- Inference speed depends more on memory bandwidth than compute for small models
- Batch inference (vLLM) improves throughput but not single-request latency

### Security Considerations
- Model files should be verified with checksums (supply chain security)
- Quantization may introduce subtle quality regressions in safety-critical outputs
- Task-specific evaluation should include adversarial and safety test cases
- If using custom/fine-tuned models, ensure training data provenance
- Hardware used for model inference should be isolated from production data if possible

### Related Rules
- R1: Never run a model at the highest available quantization without benchmarking quality degradation
- R2: Match quantization precision to the available VRAM, not the model's native precision

### Related Skills
- Set up local LLM infrastructure matching model size to hardware
- Build a development workflow with local models and fixture testing
- Implement offline and air-gapped LLM deployment
- Set up Docker Sail AI infrastructure with Ollama and pgvector

### Success Criteria
- Selected model+quantization achieves weighted score >80% of ideal (hypothetical unlimited hardware)
- Model fits in VRAM with 20% headroom, no CPU spill
- Quality degradation from quantization is measured and acceptable (<5% for critical tasks)
- Latency meets use case requirements (real-time: <3s for chat)
- Evaluation is reproducible with documented dataset and scoring
- Selection methodology can be repeated when new models become available
