---
id: ku-03
title: "Model Selection & Quantization"
subdomain: "local-llm-development"
ku-type: "decision"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/local-llm-development/ku-03/04-standardized-knowledge.md"
---

# Model Selection & Quantization

## Overview

Model selection and quantization are the two most critical decisions in local LLM deployment. The model determines output quality, latency, and memory footprint. Quantization compresses the model to fit available hardware at the cost of some quality degradation. The selection process involves matching model capabilities to task requirements, hardware constraints (RAM/VRAM), latency SLAs, and quality thresholds. In the Laravel AI ecosystem, model selection is codified in configuration and the provider abstraction layer, while quantization is handled by the inference engine.

## Core Concepts

- **Model Size (Parameters):** Number of parameters in billions (e.g., 7B, 13B, 70B). Larger models generally produce higher quality outputs but require more memory.
- **Quantization:** Representing model weights with fewer bits — 4-bit (QLoRA), 8-bit (FP8), 16-bit (FP16/BF16). Lower bit = smaller, faster, less accurate.
- **Perplexity:** A quality metric measuring how well the model predicts text. Lower perplexity is better. Used to compare quantization quality.
- **Quantization-Aware Training (QAT):** Training the model with quantization in mind. Better quality than post-training quantization (PTQ).
- **K-quant vs. IQ-quant:** Different quantization methods (llama.cpp). K-quant (K_4, K_5, K_6) balances quality and size; IQ (I-Quant) offers better quality at very low bitrates.
- **Memory Footprint:** The amount of RAM/VRAM required to load and run the model. Rough formula: parameters × bytes_per_param (FP16 = 2 bytes, 4-bit = 0.5 bytes).
- **Context Window Memory:** Additional memory proportional to context size × model dimensions. Long contexts can double memory usage.
- **Model Architecture:** Transformer variants (LLaMA, Mistral, Phi, Qwen, DeepSeek) — each has different performance characteristics.

## When To Use

- Any local LLM deployment — model selection and quantization are always required.
- Evaluating new models — comparing quality, speed, and memory tradeoffs.
- Optimizing existing deployments — upgrading quantization or model architecture.

## When NOT To Use

- Cloud-only deployments (selection is about choosing the right cloud model).
- When using an API that abstracts model selection (e.g., model router that picks automatically).

## Best Practices

- **Benchmark on your specific task.** General benchmarks (MMLU, HumanEval) don't predict performance on your use case.
- **Match quantization to hardware.** 4-bit is the sweet spot for consumer GPUs (RTX 3090/4090). 8-bit for datacenter GPUs (A100, H100).
- **Test multiple quantization levels** on your task. The quality gap between 4-bit and 8-bit is small for most tasks but significant for reasoning.
- **Consider the context window budget.** A model with 32K context at FP16 may only fit 8K at 4-bit after memory accounting.
- **Monitor for quality regressions** after changing quantization. Automate quality evaluation with test suites.
- **Prefer models with the same architecture** as your production model for better dev/prod parity.

## Architecture Guidelines

- Store model selection and quantization configuration in **environment-specific config files**, not hardcoded.
- Implement a **model benchmark pipeline** that runs periodically (weekly) to evaluate new model releases.
- Use a **model registry** to manage available models with metadata (size, quantization, benchmark scores, memory usage).
- For production local deployment, use **multi-model serving** (vLLM) to serve different models for different tasks.
- Automate model download and validation — the deployment pipeline should verify model checksums and benchmark against baseline.

## Performance Considerations

- Memory-optimal: 4-bit quantization fits a 70B model in ~40GB (one A100). FP16 would need ~140GB.
- Speed optimal: 8-bit quantization is faster than 4-bit on most hardware (less decompression overhead).
- CPU vs. GPU: 4-bit models on CPU with llama.cpp achieve 5-15 t/s for 7B models; GPU achieves 30-60 t/s.
- Quantization overhead: 4-bit requires dequantization during inference, adding 5-15% overhead vs. FP16 native.
- Batch processing: quantized models benefit less from batching (dequantization dominates per-token cost).

## Security Considerations

- **Model provenance:** Download models from trusted sources (Hugging Face official repos, Ollama library). Verify checksums.
- **Quantization integrity:** Ensure quantization doesn't introduce bias or safety degradations. Test with safety evaluation suite.
- **Model poisoning:** Fine-tuned or quantized models from untrusted sources may contain backdoors. Use only trusted model sources.
- **Side-channel attacks:** Quantized models may leak information through timing or power differences (theoretical — not a practical concern for most deployments).
- **License compliance:** Different models have different licenses (MIT, Apache 2.0, LLaMA 2 Community, CC-BY-NC). Ensure compliance with your use case.

## Common Mistakes

- Using FP16 when 4-bit is sufficient — wastes 4x memory for marginal quality gain.
- Using a model that's too large for the available VRAM — causes swapping to system RAM, 10-100x slowdown.
- Not benchmarking on the specific task — a model that scores high on MMLU may perform poorly on your use case.
- Ignoring context window memory — the model fits but the context window doesn't.
- Selecting a model solely on parameter count — architecture matters (a well-trained 7B can outperform a poorly-trained 13B).

## Anti-Patterns

- **Bigger-is-Better:** Always choosing the largest model that barely fits. A smaller, faster model with higher quantization often provides better user experience.
- **Quantization Obsession:** Spending days optimizing quantization for a 1% quality improvement that users won't notice.
- **No Benchmark Baseline:** Making model changes without a quality baseline. Every change should be measured against a fixed test set.
- **Vendor Lock-In to One Model Family:** Only considering LLaMA models when Mistral, Phi, Qwen, or DeepSeek may be better for the task.
- **Stale Model Selection:** Choosing a model once and never revisiting. The open-source model landscape evolves monthly.

## Examples

### Model Benchmark Results
```php
$benchmarks = [
    'llama3.2-8b-q4' => [
        'params' => '8B',
        'quant' => 'Q4_K_M',
        'memory_gb' => 5.2,
        'tokens_per_second' => 45.3,  // RTX 4090
        'perplexity' => 6.82,
        'context_limit' => 8192,
    ],
    'mistral-7b-q4' => [
        'params' => '7B',
        'quant' => 'Q4_K_M',
        'memory_gb' => 4.5,
        'tokens_per_second' => 52.1,
        'perplexity' => 6.95,
        'context_limit' => 8192,
    ],
    'phi-3-mini-q4' => [
        'params' => '3.8B',
        'quant' => 'Q4_K_M',
        'memory_gb' => 2.8,
        'tokens_per_second' => 78.4,
        'perplexity' => 7.42,
        'context_limit' => 4096,
    ],
];
```

### Quantization Selection
```php
class QuantizationSelector {
    public function recommend(int $vramGB, string $preference = 'quality'): string {
        return match(true) {
            $vramGB >= 48 => match($preference) {
                'quality' => 'Q8_0',  // 8-bit, best quality
                'speed' => 'Q4_K_M',  // 4-bit, fastest
            },
            $vramGB >= 16 => 'Q4_K_M',
            $vramGB >= 8 => 'Q4_K_S', // Smaller 4-bit variant
            default => 'IQ4_XS',       // Extremely compressed
        };
    }
}
```

## Related Topics

- ku-01 (Local LLM Setup): Hardware requirements informed by model selection.
- ku-02 (Development Workflow): Using selected models in development.
- ku-04 (Offline & Air-Gapped Deployment): Model selection for disconnected environments.
- llm-provider-abstraction/ku-01: Provider abstraction for local models.
- prompt-engineering-systems/ku-01: Prompt patterns adapted to model capabilities.

## AI Agent Notes

- When asked to select a model, first determine: task type, available hardware, latency requirements, and quality threshold.
- For model quality issues, first try a higher quantization level before switching to a larger model.
- Prefer reading the benchmark data before making model selection recommendations.
- When generating model selection code, include: hardware detection, benchmark data, and fallback recommendations.

## Verification

- [ ] Model selection is based on task-specific benchmarking, not just parameter count.
- [ ] Quantization level matches available hardware (RAM/VRAM).
- [ ] Context window memory is accounted for in memory calculations.
- [ ] Model provenance is verified (checksums, trusted sources).
- [ ] Benchmark data exists for selected models (tokens/second, memory, perplexity).
- [ ] Quality regression tests run when model or quantization changes.
- [ ] Model licenses are compatible with the deployment use case.
